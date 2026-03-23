import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

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

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.stats = [
        { labelKey: 'PANEL.admin_dashboard.stats_total_requests', value: 45, icon: 'bi-file-earmark-text', color: 'primary' },
        { labelKey: 'PANEL.admin_dashboard.stats_in_process', value: 12, icon: 'bi-clock-history', color: 'info' },
        { labelKey: 'PANEL.admin_dashboard.stats_pending', value: 8, icon: 'bi-hourglass-split', color: 'warning' },
        { labelKey: 'PANEL.admin_dashboard.stats_completed', value: 25, icon: 'bi-check-circle', color: 'success' },
        { labelKey: 'PANEL.admin_dashboard.stats_total_clients', value: 38, icon: 'bi-people', color: 'primary' },
        { labelKey: 'PANEL.admin_dashboard.stats_total_partners', value: 7, icon: 'bi-handshake', color: 'info' },
      ];

      this.requestsByType = [
        { typeKey: 'apertura-llc', count: 20, percentage: 44 },
        { typeKey: 'renovacion-llc', count: 15, percentage: 33 },
        { typeKey: 'cuenta-bancaria', count: 10, percentage: 23 },
      ];

      this.recentRequests = [
        {
          id: 1,
          type: 'apertura-llc',
          clientName: 'Juan Pérez',
          status: 'en-proceso',
          createdAt: new Date(),
        },
        {
          id: 2,
          type: 'renovacion-llc',
          clientName: 'María García',
          status: 'pendiente',
          createdAt: new Date(),
        },
        {
          id: 3,
          type: 'cuenta-bancaria',
          clientName: 'Carlos López',
          status: 'completada',
          createdAt: new Date(),
        },
      ];

      this.isLoading = false;
    }, 1000);
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pendiente: 'badge bg-warning',
      'en-proceso': 'badge bg-info',
      completada: 'badge bg-success',
      rechazada: 'badge bg-danger',
    };
    return classes[status] || 'badge bg-secondary';
  }

  statusTranslocoKey(status: string): string {
    const map: Record<string, string> = {
      pendiente: 'pendiente',
      'en-proceso': 'en_proceso',
      completada: 'completada',
      rechazada: 'rechazada',
    };
    const k = map[status] || status;
    return `PANEL.dashboard.status.${k}`;
  }
}
