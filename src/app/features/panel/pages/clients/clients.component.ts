import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive';
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  createdAt: Date;
  lastActivity?: Date;
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
  newClient = {
    name: '',
    email: '',
    phone: '',
    company: ''
  };
  isCreating = false;
  createError: string | null = null;

  statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
  ];

  partners = [
    { id: 1, name: 'Partner ABC' },
    { id: 2, name: 'Partner XYZ' },
    { id: 3, name: 'Partner DEF' }
  ];

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    // TODO: Cargar clientes desde el backend
    setTimeout(() => {
      this.clients = [
        {
          id: 1,
          name: 'Juan Pérez',
          email: 'juan@example.com',
          phone: '+1 555-0101',
          status: 'active',
          totalRequests: 3,
          activeRequests: 1,
          completedRequests: 2,
          createdAt: new Date('2024-01-05'),
          lastActivity: new Date('2024-01-18'),
          partnerId: 1,
          partnerName: 'Partner ABC'
        },
        {
          id: 2,
          name: 'María García',
          email: 'maria@example.com',
          phone: '+1 555-0102',
          company: 'García Corp',
          status: 'active',
          totalRequests: 5,
          activeRequests: 2,
          completedRequests: 3,
          createdAt: new Date('2024-01-10'),
          lastActivity: new Date('2024-01-19'),
          partnerId: 1,
          partnerName: 'Partner ABC'
        },
        {
          id: 3,
          name: 'Carlos Rodríguez',
          email: 'carlos@example.com',
          status: 'active',
          totalRequests: 2,
          activeRequests: 0,
          completedRequests: 2,
          createdAt: new Date('2023-12-15'),
          lastActivity: new Date('2024-01-10')
        },
        {
          id: 4,
          name: 'Ana Martínez',
          email: 'ana@example.com',
          phone: '+1 555-0104',
          status: 'inactive',
          totalRequests: 1,
          activeRequests: 0,
          completedRequests: 1,
          createdAt: new Date('2023-11-20'),
          lastActivity: new Date('2023-12-05'),
          partnerId: 2,
          partnerName: 'Partner XYZ'
        }
      ];
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  applyFilters(): void {
    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !this.searchTerm || 
        client.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesStatus = this.selectedStatus === 'all' || client.status === this.selectedStatus;
      
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

    // TODO: Llamar al backend para crear el cliente
    setTimeout(() => {
      const newClient: Client = {
        id: this.clients.length + 1,
        name: this.newClient.name,
        email: this.newClient.email,
        phone: this.newClient.phone || undefined,
        company: this.newClient.company || undefined,
        status: 'active',
        totalRequests: 0,
        activeRequests: 0,
        completedRequests: 0,
        createdAt: new Date()
      };

      this.clients.push(newClient);
      this.applyFilters();
      this.isCreating = false;
      this.closeNewClientModal();
    }, 1000);
  }

  toggleClientStatus(client: Client): void {
    // TODO: Implementar cambio de estado en el backend
    client.status = client.status === 'active' ? 'inactive' : 'active';
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'badge bg-success' : 'badge bg-secondary';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }
}
