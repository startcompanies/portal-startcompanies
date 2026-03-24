import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { PanelDashboardService } from '../../services/panel-dashboard.service';

interface Stat {
  labelKey: string;
  value: string | number;
  icon: string;
  color: string;
}

interface RecentRequest {
  id: number;
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  clientName: string;
  status: string;
  createdAt: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  loadError: string | null = null;

  stats: Stat[] = [
    { labelKey: 'PANEL.admin_dashboard.stats_total_requests', value: 0, icon: 'bi-file-earmark-text', color: 'primary' },
    { labelKey: 'PANEL.admin_dashboard.stats_in_process', value: 0, icon: 'bi-clock-history', color: 'info' },
    { labelKey: 'PANEL.admin_dashboard.stats_pending', value: 0, icon: 'bi-hourglass-split', color: 'warning' },
    { labelKey: 'PANEL.admin_dashboard.stats_completed', value: 0, icon: 'bi-check-circle', color: 'success' },
    { labelKey: 'PANEL.admin_dashboard.stats_total_clients', value: 0, icon: 'bi-people', color: 'primary' },
    { labelKey: 'PANEL.admin_dashboard.stats_total_partners', value: 0, icon: 'bi-handshake', color: 'info' },
  ];

  requestsByType: { typeKey: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria'; count: number; percentage: number }[] = [
    { typeKey: 'apertura-llc', count: 0, percentage: 0 },
    { typeKey: 'renovacion-llc', count: 0, percentage: 0 },
    { typeKey: 'cuenta-bancaria', count: 0, percentage: 0 },
  ];

  recentRequests: RecentRequest[] = [];

  constructor(private panelDashboardService: PanelDashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;

    try {
      const s = await this.panelDashboardService.getSummary();

      this.stats = [
        { labelKey: 'PANEL.admin_dashboard.stats_total_requests', value: s.totalRequests, icon: 'bi-file-earmark-text', color: 'primary' },
        { labelKey: 'PANEL.admin_dashboard.stats_in_process', value: s.enProceso, icon: 'bi-clock-history', color: 'info' },
        { labelKey: 'PANEL.admin_dashboard.stats_pending', value: s.pendientes, icon: 'bi-hourglass-split', color: 'warning' },
        { labelKey: 'PANEL.admin_dashboard.stats_completed', value: s.completadas, icon: 'bi-check-circle', color: 'success' },
        { labelKey: 'PANEL.admin_dashboard.stats_total_clients', value: s.totalClients, icon: 'bi-people', color: 'primary' },
        { labelKey: 'PANEL.admin_dashboard.stats_total_partners', value: s.totalPartners, icon: 'bi-handshake', color: 'info' },
      ];

      const total = s.totalRequests > 0 ? s.totalRequests : 1;
      this.requestsByType = s.byType.map((row) => ({
        typeKey: row.type,
        count: row.count,
        percentage: Math.round((row.count / total) * 100),
      }));

      this.recentRequests = s.recentRequests.map((r) => ({
        id: r.id,
        type: r.type,
        clientName: r.clientName,
        status: r.status,
        createdAt: new Date(r.createdAt),
      }));
    } catch {
      this.loadError = 'PANEL.admin_dashboard.error_load';
      this.recentRequests = [];
    } finally {
      this.isLoading = false;
    }
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pendiente: 'badge bg-warning',
      'solicitud-recibida': 'badge bg-secondary',
      'en-proceso': 'badge bg-info',
      completada: 'badge bg-success',
      rechazada: 'badge bg-danger',
    };
    return classes[status] || 'badge bg-secondary';
  }

  statusTranslocoKey(status: string): string {
    const map: Record<string, string> = {
      pendiente: 'pendiente',
      'solicitud-recibida': 'solicitud_recibida',
      'en-proceso': 'en_proceso',
      completada: 'completada',
      rechazada: 'rechazada',
    };
    const k = map[status] || status.replace(/-/g, '_');
    return `PANEL.dashboard.status.${k}`;
  }
}
