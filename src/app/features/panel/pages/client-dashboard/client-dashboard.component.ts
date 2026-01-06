import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface ProcessSummary {
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  total: number;
  inProgress: number;
  completed: number;
  pending: number;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css'
})
export class ClientDashboardComponent implements OnInit {
  currentUser: any = null;
  isPartner = false;
  isLoading = true;
  
  processSummary: ProcessSummary[] = [];
  recentRequests: any[] = [];

  constructor(private authService: AuthService) {
    // Inicializar en constructor después de la inyección
    this.currentUser = this.authService.getCurrentUser();
    this.isPartner = this.authService.isPartner();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    // TODO: Cargar datos desde el backend
    this.processSummary = [
      { type: 'apertura-llc', total: 0, inProgress: 0, completed: 0, pending: 0 },
      { type: 'renovacion-llc', total: 0, inProgress: 0, completed: 0, pending: 0 },
      { type: 'cuenta-bancaria', total: 0, inProgress: 0, completed: 0, pending: 0 }
    ];
    this.recentRequests = [];
    this.isLoading = false;
  }

  getProcessTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'apertura-llc': 'Apertura LLC',
      'renovacion-llc': 'Renovación LLC',
      'cuenta-bancaria': 'Cuenta Bancaria'
    };
    return types[type] || type;
  }

  getProcessTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'apertura-llc': 'bi-building',
      'renovacion-llc': 'bi-arrow-repeat',
      'cuenta-bancaria': 'bi-bank'
    };
    return icons[type] || 'bi-file-earmark';
  }

  getStatusLabel(status: string): string {
    const statuses: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en-proceso': 'En Proceso',
      'completada': 'Completada',
      'rechazada': 'Rechazada'
    };
    return statuses[status] || status;
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
}









