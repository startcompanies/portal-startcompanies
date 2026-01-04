import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PartnerClientsService, PartnerClient, CreatePartnerClientDto, ClientStats } from '../../services/partner-clients.service';

interface Client extends PartnerClient {
  totalRequests?: number;
  activeRequests?: number;
  completedRequests?: number;
  lastActivity?: string;
  lastRequestDate?: string;
}

@Component({
  selector: 'app-my-clients',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-clients.component.html',
  styleUrl: './my-clients.component.css'
})
export class MyClientsComponent implements OnInit {
  isLoading = true;
  clients: Client[] = [];
  filteredClients: Client[] = [];
  
  // Filtros
  searchTerm: string = '';
  selectedStatus: string = 'all';
  
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

  constructor(
    private authService: AuthService,
    private partnerClientsService: PartnerClientsService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    this.partnerClientsService.getMyClients().subscribe({
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
      company: this.newClient.company || undefined
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

  get totalClients(): number {
    return this.filteredClients.length;
  }

  get activeClients(): number {
    return this.filteredClients.filter(c => {
      if (typeof c.status === 'boolean') {
        return c.status === true;
      }
      return c.status === 'active';
    }).length;
  }

  get totalRequests(): number {
    return this.filteredClients.reduce((sum, c) => sum + (c.totalRequests || 0), 0);
  }
}








