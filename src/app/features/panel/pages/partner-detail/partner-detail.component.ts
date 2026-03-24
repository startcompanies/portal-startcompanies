import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UsersService, User } from '../../services/users.service';
import { PartnerClientsService } from '../../services/partner-clients.service';
import { RequestsService, Request } from '../../services/requests.service';

interface PartnerClient {
  id: number;
  name: string;
  email: string;
  totalRequests: number;
  activeRequests: number;
  createdAt: Date;
  lastRequestDate?: Date;
}

interface PartnerRequest {
  id: number;
  type: string;
  clientName: string;
  status: string;
  createdAt: Date;
  currentStep: string;
}

interface Partner {
  id: number;
  name: string;
  email: string;
  company?: string;
  status: 'active' | 'inactive';
  totalClients: number;
  totalRequests: number;
  createdAt: Date;
  lastActivity?: Date;
  clients: PartnerClient[];
  recentRequests: PartnerRequest[];
}

@Component({
  selector: 'app-partner-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './partner-detail.component.html',
  styleUrl: './partner-detail.component.css',
})
export class PartnerDetailComponent implements OnInit {
  partnerId: string | null = null;
  partner: Partner | null = null;
  isLoading = true;
  loadError: string | null = null;
  activeTab: 'clients' | 'requests' | 'stats' = 'clients';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private partnerClientsService: PartnerClientsService,
    private requestsService: RequestsService,
  ) {}

  ngOnInit(): void {
    this.partnerId = this.route.snapshot.paramMap.get('id');
    if (this.partnerId) {
      this.loadPartner();
    } else {
      void this.router.navigate(['/panel/partners']);
    }
  }

  private requestTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'apertura-llc': 'Apertura LLC',
      'renovacion-llc': 'Renovación LLC',
      'cuenta-bancaria': 'Cuenta bancaria',
    };
    return map[type] || type;
  }

  private clientDisplayName(r: Request): string {
    const c = r.client;
    if (!c) return '—';
    if (c.full_name?.trim()) return c.full_name.trim();
    const fn = c.first_name || '';
    const ln = c.last_name || '';
    const n = `${fn} ${ln}`.trim();
    return n || c.email || '—';
  }

  async loadPartner(): Promise<void> {
    const id = parseInt(this.partnerId || '0', 10);
    if (!Number.isFinite(id) || id < 1) {
      void this.router.navigate(['/panel/partners']);
      return;
    }

    this.isLoading = true;
    this.loadError = null;
    this.partner = null;

    try {
      const [user, stats, clientRows, requestsPage] = await Promise.all([
        firstValueFrom(this.usersService.getPartnerById(id)),
        firstValueFrom(this.usersService.getPartnerStats(id)),
        firstValueFrom(this.partnerClientsService.getClientsForPartner(id)),
        this.requestsService.getAllRequests({ partnerId: id, page: 1, limit: 20 }),
      ]);

      this.partner = this.mapPartner(user, stats, clientRows, requestsPage.data);
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 404) {
        this.partner = null;
      } else {
        this.loadError =
          'No se pudo cargar el partner. Inténtalo de nuevo más tarde.';
        this.partner = null;
      }
    } finally {
      this.isLoading = false;
    }
  }

  private mapPartner(
    user: User,
    stats: { totalClients: number; totalRequests: number },
    clientRows: Array<{
      id: number;
      full_name: string;
      email: string;
      totalRequests: number;
      activeRequests: number;
      completedRequests: number;
      createdAt: string;
      lastRequestDate: string | null;
    }>,
    requests: Request[],
  ): Partner {
    const name =
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      user.username ||
      user.email;

    const clients: PartnerClient[] = clientRows.map((c) => ({
      id: c.id,
      name: c.full_name,
      email: c.email,
      totalRequests: c.totalRequests,
      activeRequests: c.activeRequests,
      createdAt: new Date(c.createdAt),
      lastRequestDate: c.lastRequestDate
        ? new Date(c.lastRequestDate)
        : undefined,
    }));

    const recentRequests: PartnerRequest[] = requests.map((r) => ({
      id: r.id,
      type: this.requestTypeLabel(r.type),
      clientName: this.clientDisplayName(r),
      status: r.status,
      createdAt: new Date(r.createdAt),
      currentStep: r.stage?.trim() || `Paso ${r.currentStep ?? '—'}`,
    }));

    return {
      id: user.id,
      name,
      email: user.email,
      company: user.company || undefined,
      status: user.status ? 'active' : 'inactive',
      totalClients: stats.totalClients,
      totalRequests: stats.totalRequests,
      createdAt: new Date(user.createdAt || Date.now()),
      lastActivity: user.updatedAt ? new Date(user.updatedAt) : undefined,
      clients,
      recentRequests,
    };
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'badge bg-success' : 'badge bg-secondary';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }

  getRequestStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pendiente: 'badge bg-warning',
      'solicitud-recibida': 'badge bg-secondary',
      'en-proceso': 'badge bg-info',
      completada: 'badge bg-success',
      rechazada: 'badge bg-danger',
    };
    return classes[status] || 'badge bg-secondary';
  }

  getRequestStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pendiente: 'Pendiente',
      'solicitud-recibida': 'Solicitud recibida',
      'en-proceso': 'En proceso',
      completada: 'Completada',
      rechazada: 'Rechazada',
    };
    return labels[status] || status;
  }

  setActiveTab(tab: 'clients' | 'requests' | 'stats'): void {
    this.activeTab = tab;
  }
}
