import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService, User, CreateUserDto } from '../../services/users.service';

interface Client extends User {
  totalRequests?: number;
  activeRequests?: number;
  completedRequests?: number;
  lastActivity?: string;
  partnerId?: number;
  partnerName?: string;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent implements OnInit {
  isLoading = true;
  clients: Client[] = [];
  filteredClients: Client[] = [];
  
  // Filtros
  searchTerm: string = '';
  selectedStatus: string = 'all';
  selectedPartner: string = 'all';
  
  // Modal de nuevo cliente
  showNewClientModal = false;
  showEditClientModal = false;
  editingClient: Client | null = null;
  newClient = {
    name: '',
    email: '',
    phone: '',
    company: ''
  };
  editClient = {
    name: '',
    email: '',
    phone: '',
    company: ''
  };
  isCreating = false;
  isUpdating = false;
  createError: string | null = null;
  updateError: string | null = null;

  statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
  ];

  partners: User[] = [];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadPartners();
    this.loadClients();
  }

  loadPartners(): void {
    this.usersService.getPartners().subscribe({
      next: (partners) => {
        this.partners = partners;
      },
      error: (error) => {
        console.error('Error al cargar partners:', error);
      }
    });
  }

  loadClients(): void {
    this.isLoading = true;
    this.usersService.getClients().subscribe({
      next: (users) => {
        this.clients = users.map(user => ({
          ...user,
          totalRequests: 0, // TODO: Calcular desde requests
          activeRequests: 0, // TODO: Calcular desde requests
          completedRequests: 0, // TODO: Calcular desde requests
          createdAt: user.createdAt || new Date().toISOString(),
          lastActivity: user.updatedAt || undefined
        } as Client));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.createError = 'Error al cargar los clientes. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredClients = this.clients.filter(client => {
      const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.username;
      const matchesSearch = !this.searchTerm || 
        fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const clientStatus = client.status ? 'active' : 'inactive';
      const matchesStatus = this.selectedStatus === 'all' || clientStatus === this.selectedStatus;
      
      const matchesPartner = this.selectedPartner === 'all' || 
        (this.selectedPartner === 'none' && !client.partnerId) ||
        client.partnerId?.toString() === this.selectedPartner;
      
      return matchesSearch && matchesStatus && matchesPartner;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onPartnerChange(): void {
    this.applyFilters();
  }

  openNewClientModal(): void {
    this.showNewClientModal = true;
    this.newClient = { name: '', email: '', phone: '', company: '' };
    this.createError = null;
  }

  closeNewClientModal(): void {
    this.showNewClientModal = false;
    this.newClient = { name: '', email: '', phone: '', company: '' };
    this.createError = null;
  }

  createClient(): void {
    if (!this.newClient.name || !this.newClient.email) {
      this.createError = 'Por favor completa los campos requeridos';
      return;
    }

    this.isCreating = true;
    this.createError = null;

    const nameParts = this.newClient.name.split(' ');
    // No enviar password - se generará automáticamente y se enviará por email
    const createUserDto: CreateUserDto = {
      username: this.newClient.email.split('@')[0],
      email: this.newClient.email,
      password: '', // Se generará automáticamente en el backend
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      type: 'client',
      phone: this.newClient.phone || undefined,
      company: this.newClient.company || undefined
    };

    this.usersService.createUser(createUserDto).subscribe({
      next: (user) => {
        const newClient: Client = {
          ...user,
          totalRequests: 0,
          activeRequests: 0,
          completedRequests: 0,
          createdAt: user.createdAt || new Date().toISOString()
        };
        this.clients.push(newClient);
        this.applyFilters();
        this.isCreating = false;
        this.closeNewClientModal();
      },
      error: (error) => {
        console.error('Error al crear cliente:', error);
        this.createError = error.error?.message || 'Error al crear el cliente. Intenta nuevamente.';
        this.isCreating = false;
      }
    });
  }

  toggleClientStatus(client: Client): void {
    this.usersService.toggleUserStatus(client.id).subscribe({
      next: (updatedUser) => {
        const index = this.clients.findIndex(c => c.id === client.id);
        if (index !== -1) {
          this.clients[index] = { ...this.clients[index], status: updatedUser.status };
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error al cambiar estado del cliente:', error);
        this.createError = error.error?.message || 'Error al cambiar el estado. Intenta nuevamente.';
      }
    });
  }

  getStatusClass(status: boolean | string): string {
    const isActive = typeof status === 'boolean' ? status : status === 'active';
    return isActive ? 'badge bg-success' : 'badge bg-secondary';
  }

  getStatusLabel(status: boolean | string): string {
    const isActive = typeof status === 'boolean' ? status : status === 'active';
    return isActive ? 'Activo' : 'Inactivo';
  }

  getClientName(client: Client): string {
    if (client.first_name || client.last_name) {
      return `${client.first_name || ''} ${client.last_name || ''}`.trim();
    }
    return client.username;
  }

  openEditClientModal(client: Client): void {
    this.editingClient = client;
    this.editClient = {
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.username,
      email: client.email,
      phone: client.phone || '',
      company: client.company || ''
    };
    this.showEditClientModal = true;
    this.updateError = null;
  }

  closeEditClientModal(): void {
    this.showEditClientModal = false;
    this.editingClient = null;
    this.editClient = { name: '', email: '', phone: '', company: '' };
    this.updateError = null;
  }

  updateClient(): void {
    if (!this.editingClient || !this.editClient.name || !this.editClient.email) {
      this.updateError = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.isUpdating = true;
    this.updateError = null;

    const nameParts = this.editClient.name.split(' ');
    const updateData = {
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      phone: this.editClient.phone || undefined,
      company: this.editClient.company || undefined
    };

    this.usersService.updateUser(this.editingClient.id, updateData).subscribe({
      next: (updatedUser) => {
        const index = this.clients.findIndex(c => c.id === this.editingClient!.id);
        if (index !== -1) {
          this.clients[index] = { ...this.clients[index], ...updatedUser };
          this.applyFilters();
        }
        this.isUpdating = false;
        this.closeEditClientModal();
      },
      error: (error) => {
        console.error('Error al actualizar cliente:', error);
        this.updateError = error.error?.message || 'Error al actualizar el cliente. Intenta nuevamente.';
        this.isUpdating = false;
      }
    });
  }
}

