import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PartnerClientsService, PartnerClient, CreatePartnerClientDto, ClientStats } from '../../services/partner-clients.service';

interface Client extends PartnerClient {
  totalRequests?: number;
  activeRequests?: number;
  completedRequests?: number;
  lastActivity?: string;
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

  constructor(
    private partnerClientsService: PartnerClientsService
  ) {}

  ngOnInit(): void {
    // Admin solo ve sus propios clientes, no necesita cargar partners
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    // Admin solo ve sus propios clientes (sin partner)
    this.partnerClientsService.getAdminClients().subscribe({
      next: (clients) => {
        // Cargar estadísticas para cada cliente
        const clientsWithStats = clients.map(client => ({
          ...client,
          totalRequests: 0,
          activeRequests: 0,
          completedRequests: 0,
          createdAt: client.createdAt || new Date().toISOString(),
          lastActivity: client.updatedAt || undefined
        }));

        // Cargar estadísticas en paralelo
        const statsPromises = clientsWithStats.map(client => 
          this.partnerClientsService.getClientStats(client.id).toPromise()
        );

        Promise.all(statsPromises).then(statsArray => {
          statsArray.forEach((stats, index) => {
            if (stats) {
              clientsWithStats[index].totalRequests = stats.totalRequests;
              clientsWithStats[index].activeRequests = stats.activeRequests;
              clientsWithStats[index].completedRequests = stats.completedRequests;
            }
          });

          this.clients = clientsWithStats;
          this.applyFilters();
          this.isLoading = false;
        }).catch(() => {
          // Si falla cargar stats, usar datos sin stats
          this.clients = clientsWithStats;
          this.applyFilters();
          this.isLoading = false;
        });
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
      const matchesSearch = !this.searchTerm || 
        client.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const clientStatus = client.status ? 'active' : 'inactive';
      const matchesStatus = this.selectedStatus === 'all' || clientStatus === this.selectedStatus;
      
      // Admin solo ve clientes sin partner, no necesita filtro de partner
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
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

    const createClientDto: CreatePartnerClientDto = {
      full_name: this.newClient.name,
      email: this.newClient.email,
      phone: this.newClient.phone || undefined,
      company: this.newClient.company || undefined,
      // Admin crea clientes sin partner asignado
      partnerId: undefined
    };

    this.partnerClientsService.createClient(createClientDto).subscribe({
      next: (client) => {
        const newClient: Client = {
          ...client,
          totalRequests: 0,
          activeRequests: 0,
          completedRequests: 0,
          createdAt: client.createdAt || new Date().toISOString()
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
    this.partnerClientsService.toggleClientStatus(client.id).subscribe({
      next: (updatedClient) => {
        const index = this.clients.findIndex(c => c.id === client.id);
        if (index !== -1) {
          this.clients[index] = { ...this.clients[index], status: updatedClient.status };
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

  openEditClientModal(client: Client): void {
    this.editingClient = client;
    this.editClient = {
      name: client.full_name,
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

    const updateData = {
      full_name: this.editClient.name,
      phone: this.editClient.phone || undefined,
      company: this.editClient.company || undefined
    };

    this.partnerClientsService.updateClient(this.editingClient.id, updateData).subscribe({
      next: (updatedClient) => {
        const index = this.clients.findIndex(c => c.id === this.editingClient!.id);
        if (index !== -1) {
          this.clients[index] = { ...this.clients[index], ...updatedClient };
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

