import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Request {
  id: number;
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  status: 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  clientName: string;
  clientEmail: string;
  partnerName?: string;
  createdAt: Date;
  updatedAt: Date;
  currentStep: string;
}

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-requests.component.html',
  styleUrl: './admin-requests.component.css'
})
export class AdminRequestsComponent implements OnInit {
  isLoading = true;
  requests: Request[] = [];
  filteredRequests: Request[] = [];
  
  // Filtros
  selectedStatus: string = 'all';
  selectedType: string = 'all';
  searchTerm: string = '';

  statusOptions = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en-proceso', label: 'En Proceso' },
    { value: 'completada', label: 'Completada' },
    { value: 'rechazada', label: 'Rechazada' }
  ];

  typeOptions = [
    { value: 'all', label: 'Todos los Tipos' },
    { value: 'apertura-llc', label: 'Apertura LLC' },
    { value: 'renovacion-llc', label: 'Renovación LLC' },
    { value: 'cuenta-bancaria', label: 'Cuenta Bancaria' }
  ];

  ngOnInit(): void {
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
          clientName: 'Juan Pérez',
          clientEmail: 'juan@example.com',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          currentStep: 'Procesamiento'
        },
        {
          id: 2,
          type: 'renovacion-llc',
          status: 'pendiente',
          clientName: 'María García',
          clientEmail: 'maria@example.com',
          partnerName: 'Partner ABC',
          createdAt: new Date('2024-01-18'),
          updatedAt: new Date('2024-01-18'),
          currentStep: 'Revisión de Documentos'
        },
        {
          id: 3,
          type: 'cuenta-bancaria',
          status: 'completada',
          clientName: 'Carlos López',
          clientEmail: 'carlos@example.com',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-25'),
          currentStep: 'Completado'
        }
      ];
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  applyFilters(): void {
    this.filteredRequests = this.requests.filter(request => {
      const matchesStatus = this.selectedStatus === 'all' || request.status === this.selectedStatus;
      const matchesType = this.selectedType === 'all' || request.type === this.selectedType;
      const matchesSearch = !this.searchTerm || 
        request.clientName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        request.clientEmail.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (request.partnerName && request.partnerName.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      return matchesStatus && matchesType && matchesSearch;
    });
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
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
