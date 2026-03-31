import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PartnerClientsService,
  PartnerClient,
  CreatePartnerClientDto,
} from '../../services/partner-clients.service';
import { IntlTelInputComponent } from '../../../../shared/components/intl-tel-input/intl-tel-input.component';
import { firstValueFrom } from 'rxjs';
import { parseCreatedAtIso } from '../../../../shared/utils/date.util';
import { SafeDatePipe } from '../../../../shared/pipes/safe-date.pipe';

/** Mismo criterio E.164 relajado que partners / IntlTelInputComponent */
const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

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
  imports: [CommonModule, RouterLink, FormsModule, IntlTelInputComponent, SafeDatePipe],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent implements OnInit {
  isLoading = true;
  clients: Client[] = [];
  loadError: string | null = null;
  totalClients = 0;
  currentPage = 1;
  readonly pageSize = 12;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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

  showConvertPartnerModal = false;
  convertPartnerClient: Client | null = null;
  convertPartnerPhone = '';
  convertPartnerError: string | null = null;
  isConverting = false;

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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalClients / this.pageSize));
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    const window = 2;
    const start = Math.max(1, cur - window);
    const end = Math.min(total, cur + window);
    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }

  async loadClients(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;

    try {
      const res = await firstValueFrom(
        this.partnerClientsService.getAdminClients({
          page: this.currentPage,
          limit: this.pageSize,
          q: this.searchTerm.trim() || undefined,
          status: this.selectedStatus as 'all' | 'active' | 'inactive',
        }),
      );

      this.totalClients = res.total;
      const limit = res.limit || this.pageSize;
      const maxPage = Math.max(1, Math.ceil(this.totalClients / limit) || 1);
      if (this.currentPage > maxPage && this.totalClients > 0) {
        this.currentPage = maxPage;
        await this.loadClients();
        return;
      }

      const pageClients = res.data || [];
      if (pageClients.length === 0) {
        this.clients = [];
        this.isLoading = false;
        return;
      }

      const clientsWithStats = pageClients.map((client) => ({
        ...client,
        totalRequests: 0,
        activeRequests: 0,
        completedRequests: 0,
        createdAt: parseCreatedAtIso(client.createdAt) ?? new Date().toISOString(),
        lastActivity: client.updatedAt || undefined,
      }));

      try {
        const statsPromises = clientsWithStats.map((client) =>
          firstValueFrom(this.partnerClientsService.getClientStats(client.id)).catch(() => null),
        );
        const statsArray = await Promise.all(statsPromises);
        statsArray.forEach((stats, index) => {
          if (stats) {
            clientsWithStats[index].totalRequests = stats.totalRequests;
            clientsWithStats[index].activeRequests = stats.activeRequests;
            clientsWithStats[index].completedRequests = stats.completedRequests;
          }
        });
      } catch (statsError) {
        console.warn('Error al cargar estadísticas, continuando sin stats:', statsError);
      }

      this.clients = clientsWithStats;
    } catch (error: any) {
      console.error('Error al cargar clientes:', error);
      this.loadError = error?.error?.message || 'Error al cargar los clientes. Intenta nuevamente.';
      this.clients = [];
      this.totalClients = 0;
    } finally {
      this.isLoading = false;
    }
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.searchDebounceTimer = null;
      this.currentPage = 1;
      void this.loadClients();
    }, 350);
  }

  onStatusChange(): void {
    this.currentPage = 1;
    void this.loadClients();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    void this.loadClients();
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

    const phone = (this.newClient.phone || '').trim();
    if (phone && !E164_PHONE_REGEX.test(phone)) {
      this.createError =
        'Introduce un teléfono válido con código de país (formato internacional).';
      return;
    }

    this.isCreating = true;
    this.createError = null;

    const createClientDto: CreatePartnerClientDto = {
      full_name: this.newClient.name,
      email: this.newClient.email,
      phone: phone || undefined,
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
          createdAt: parseCreatedAtIso(client.createdAt) ?? new Date().toISOString()
        };
        this.currentPage = 1;
        void this.loadClients();
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
        void this.loadClients();
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

    const phone = (this.editClient.phone || '').trim();
    if (phone && !E164_PHONE_REGEX.test(phone)) {
      this.updateError =
        'Introduce un teléfono válido con código de país (formato internacional).';
      return;
    }

    this.isUpdating = true;
    this.updateError = null;

    const updateData = {
      full_name: this.editClient.name,
      phone: phone || undefined,
      company: this.editClient.company || undefined
    };

    this.partnerClientsService.updateClient(this.editingClient.id, updateData).subscribe({
      next: (updatedClient) => {
        void this.loadClients();
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

  openConvertPartnerModal(client: Client): void {
    this.convertPartnerClient = client;
    this.convertPartnerPhone = (client.phone || '').trim();
    this.convertPartnerError = null;
    this.showConvertPartnerModal = true;
  }

  closeConvertPartnerModal(): void {
    this.showConvertPartnerModal = false;
    this.convertPartnerClient = null;
    this.convertPartnerPhone = '';
    this.convertPartnerError = null;
    this.isConverting = false;
  }

  submitConvertPartner(): void {
    const c = this.convertPartnerClient;
    if (!c) {
      return;
    }
    const phone = this.convertPartnerPhone.trim();
    if (!E164_PHONE_REGEX.test(phone)) {
      this.convertPartnerError =
        'Introduce un teléfono válido con código de país (formato internacional E.164, ej. +34600111222).';
      return;
    }
    this.isConverting = true;
    this.convertPartnerError = null;
    this.partnerClientsService
      .convertClientToPartner(c.id, {
        phone,
        listItemUserOnly: c.requestClientId == null,
      })
      .subscribe({
        next: () => {
          this.isConverting = false;
          this.closeConvertPartnerModal();
          void this.loadClients();
        },
        error: (error) => {
          console.error('Error al convertir a partner:', error);
          this.convertPartnerError =
            error.error?.message || 'No se pudo convertir el usuario a partner.';
          this.isConverting = false;
        },
      });
  }
}

