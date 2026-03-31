import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService, User } from '../../services/auth.service';
import { RequestsService, Request } from '../../services/requests.service';
import { getClientNameFromRequest, getRequestStageLabel } from '../../utils/request-display.utils';
import { SafeDatePipe } from '../../../../shared/pipes/safe-date.pipe';
import { parseCreatedAtIso } from '../../../../shared/utils/date.util';

interface ProcessSummary {
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  total: number;
  inProgress: number;
  completed: number;
  pending: number;
}

export interface RecentRequestVm {
  id: number;
  type: Request['type'];
  status: string;
  createdAt: string;
  currentStep: string;
  clientName?: string;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoPipe, SafeDatePipe],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css',
})
export class ClientDashboardComponent implements OnInit {
  currentUser: User | null = null;
  isPartner = false;
  isLoading = true;
  error: string | null = null;

  processSummary: ProcessSummary[] = [];
  recentRequests: RecentRequestVm[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly requestsService: RequestsService,
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.isPartner = this.authService.isPartner();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    const role: 'client' | 'partner' = this.isPartner ? 'partner' : 'client';

    this.requestsService
      .getMyRequests(role)
      .then((requests) => {
        this.processSummary = this.buildProcessSummary(requests);
        this.recentRequests = this.buildRecentRequests(requests);
        this.isLoading = false;
      })
      .catch(() => {
        this.error = 'PANEL.dashboard.load_error';
        this.processSummary = this.emptySummary();
        this.recentRequests = [];
        this.isLoading = false;
      });
  }

  private emptySummary(): ProcessSummary[] {
    const types: ProcessSummary['type'][] = ['apertura-llc', 'renovacion-llc', 'cuenta-bancaria'];
    return types.map((type) => ({
      type,
      total: 0,
      inProgress: 0,
      completed: 0,
      pending: 0,
    }));
  }

  private buildProcessSummary(requests: Request[]): ProcessSummary[] {
    const types: ProcessSummary['type'][] = ['apertura-llc', 'renovacion-llc', 'cuenta-bancaria'];
    return types.map((type) => {
      const list = requests.filter((r) => r.type === type);
      return {
        type,
        total: list.length,
        pending: list.filter((r) => r.status === 'pendiente').length,
        inProgress: list.filter(
          (r) => r.status === 'solicitud-recibida' || r.status === 'en-proceso',
        ).length,
        completed: list.filter((r) => r.status === 'completada').length,
      };
    });
  }

  private buildRecentRequests(requests: Request[]): RecentRequestVm[] {
    const ts = (r: Request) => {
      const iso = parseCreatedAtIso(r.updatedAt || r.createdAt);
      return iso ? new Date(iso).getTime() : 0;
    };
    const sorted = [...requests].sort((a, b) => ts(b) - ts(a));
    return sorted.slice(0, 5).map((r) => {
      const name = getClientNameFromRequest(r);
      return {
        id: r.id,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt,
        currentStep: getRequestStageLabel(r),
        clientName: name || undefined,
      };
    });
  }

  welcomeName(): string {
    const u = this.currentUser;
    if (!u) return '';
    const fn = u.first_name?.trim();
    const ln = u.last_name?.trim();
    if (fn && ln) return `${fn} ${ln}`;
    if (fn) return fn;
    return u.username || u.email || '';
  }

  getProcessTypeLabel(type: string): string {
    const key = `PANEL.dashboard.process_type.${type}`;
    return key;
  }

  getProcessTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'apertura-llc': 'bi-building',
      'renovacion-llc': 'bi-arrow-repeat',
      'cuenta-bancaria': 'bi-bank',
    };
    return icons[type] || 'bi-file-earmark';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pendiente: 'PANEL.dashboard.status.pendiente',
      'solicitud-recibida': 'PANEL.dashboard.status.solicitud_recibida',
      'en-proceso': 'PANEL.dashboard.status.en_proceso',
      completada: 'PANEL.dashboard.status.completada',
      rechazada: 'PANEL.dashboard.status.rechazada',
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pendiente: 'badge bg-warning',
      'solicitud-recibida': 'badge bg-primary',
      'en-proceso': 'badge bg-info',
      completada: 'badge bg-success',
      rechazada: 'badge bg-danger',
    };
    return classes[status] || 'badge bg-secondary';
  }
}
