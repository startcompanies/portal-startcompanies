import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Request {
  id: number;
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  status: 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  currentStep: string;
  createdAt: Date;
  clientName?: string; // Para partners
}

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-requests.component.html',
  styleUrl: './my-requests.component.css'
})
export class MyRequestsComponent implements OnInit {
  requests: Request[] = [];
  isLoading = true;
  currentUser: any = null;
  isPartner = false;

  constructor(private authService: AuthService) {
    // Inicializar en constructor después de la inyección
    this.currentUser = this.authService.getCurrentUser();
    this.isPartner = this.authService.isPartner();
  }

  ngOnInit(): void {
    // TODO: Cargar solicitudes desde el backend
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    // TODO: Cargar solicitudes desde el backend
    setTimeout(() => {
      this.requests = [
        {
          id: 1,
          type: 'apertura-llc',
          status: 'en-proceso',
          currentStep: 'Procesamiento',
          createdAt: new Date('2024-01-15'),
          clientName: this.isPartner ? 'Juan Pérez' : undefined
        },
        {
          id: 2,
          type: 'renovacion-llc',
          status: 'pendiente',
          currentStep: 'Revisión de Documentos',
          createdAt: new Date('2024-01-18'),
          clientName: this.isPartner ? 'María García' : undefined
        },
        {
          id: 3,
          type: 'apertura-llc',
          status: 'completada',
          currentStep: 'Completada',
          createdAt: new Date('2023-12-10'),
          clientName: this.isPartner ? 'Carlos Rodríguez' : undefined
        }
      ];
      this.isLoading = false;
    }, 1000);
  }

  getRequestTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'apertura-llc': 'Apertura LLC',
      'renovacion-llc': 'Renovación LLC',
      'cuenta-bancaria': 'Cuenta Bancaria'
    };
    return types[type] || type;
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

