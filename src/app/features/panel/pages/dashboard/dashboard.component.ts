import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Stat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

interface RecentRequest {
  id: number;
  type: string;
  clientName: string;
  status: string;
  createdAt: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  
  stats: Stat[] = [
    { label: 'Total Solicitudes', value: 0, icon: 'bi-file-earmark-text', color: 'primary' },
    { label: 'En Proceso', value: 0, icon: 'bi-clock-history', color: 'info' },
    { label: 'Pendientes', value: 0, icon: 'bi-hourglass-split', color: 'warning' },
    { label: 'Completadas', value: 0, icon: 'bi-check-circle', color: 'success' },
    { label: 'Total Clientes', value: 0, icon: 'bi-people', color: 'primary' },
    { label: 'Total Partners', value: 0, icon: 'bi-handshake', color: 'info' }
  ];

  requestsByType = [
    { type: 'Apertura LLC', count: 0, percentage: 0 },
    { type: 'Renovación LLC', count: 0, percentage: 0 },
    { type: 'Cuenta Bancaria', count: 0, percentage: 0 }
  ];

  recentRequests: RecentRequest[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    // TODO: Cargar datos desde el backend
    setTimeout(() => {
      // Datos mockup para maquetación
      this.stats = [
        { label: 'Total Solicitudes', value: 45, icon: 'bi-file-earmark-text', color: 'primary' },
        { label: 'En Proceso', value: 12, icon: 'bi-clock-history', color: 'info' },
        { label: 'Pendientes', value: 8, icon: 'bi-hourglass-split', color: 'warning' },
        { label: 'Completadas', value: 25, icon: 'bi-check-circle', color: 'success' },
        { label: 'Total Clientes', value: 38, icon: 'bi-people', color: 'primary' },
        { label: 'Total Partners', value: 7, icon: 'bi-handshake', color: 'info' }
      ];

      this.requestsByType = [
        { type: 'Apertura LLC', count: 20, percentage: 44 },
        { type: 'Renovación LLC', count: 15, percentage: 33 },
        { type: 'Cuenta Bancaria', count: 10, percentage: 23 }
      ];

      this.recentRequests = [
        { id: 1, type: 'Apertura LLC', clientName: 'Juan Pérez', status: 'en-proceso', createdAt: new Date() },
        { id: 2, type: 'Renovación LLC', clientName: 'María García', status: 'pendiente', createdAt: new Date() },
        { id: 3, type: 'Cuenta Bancaria', clientName: 'Carlos López', status: 'completada', createdAt: new Date() }
      ];

      this.isLoading = false;
    }, 1000);
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pendiente': 'badge bg-warning',
      'en-proceso': 'badge bg-info',
      'completada': 'badge bg-success',
      'rechazada': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en-proceso': 'En Proceso',
      'completada': 'Completada',
      'rechazada': 'Rechazada'
    };
    return labels[status] || status;
  }
}
