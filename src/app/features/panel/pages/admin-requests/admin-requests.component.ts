import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestsService, Request } from '../../services/requests.service';

interface RequestDisplay {
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
  requests: RequestDisplay[] = [];
  filteredRequests: RequestDisplay[] = [];
  errorMessage: string | null = null;
  
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

  constructor(private requestsService: RequestsService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    
    try {
      // Preparar filtros para la API
      const filters: any = {};
      if (this.selectedStatus !== 'all') {
        filters.status = this.selectedStatus;
      }
      if (this.selectedType !== 'all') {
        filters.type = this.selectedType;
      }

      // Obtener requests desde la API
      const apiRequests = await this.requestsService.getAllRequests(filters);
      
      // Transformar los datos de la API al formato de display
      this.requests = apiRequests.map(request => this.mapRequestToDisplay(request));
      
      this.applyFilters();
    } catch (error: any) {
      console.error('Error al cargar solicitudes:', error);
      this.errorMessage = error?.error?.message || 'Error al cargar las solicitudes. Por favor, intenta nuevamente.';
      this.requests = [];
      this.filteredRequests = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Mapea un Request de la API a RequestDisplay para el template
   */
  private mapRequestToDisplay(request: Request): RequestDisplay {
    const clientName = request.client 
      ? `${request.client.first_name || ''} ${request.client.last_name || ''}`.trim() || request.client.username || request.client.email
      : 'N/A';
    
    const clientEmail = request.client?.email || 'N/A';
    
    const partnerName = request.partner
      ? `${request.partner.first_name || ''} ${request.partner.last_name || ''}`.trim() || request.partner.username || request.partner.email
      : undefined;

    // Determinar el paso actual basado en el tipo de request
    let currentStep = 'Inicial';
    if (request.aperturaLlcRequest) {
      currentStep = `Paso ${request.aperturaLlcRequest.currentStepNumber || 1}`;
    } else if (request.renovacionLlcRequest) {
      currentStep = `Paso ${request.renovacionLlcRequest.currentStepNumber || 1}`;
    } else if (request.cuentaBancariaRequest) {
      currentStep = `Paso ${request.cuentaBancariaRequest.currentStepNumber || 1}`;
    }

    return {
      id: request.id,
      type: request.type,
      status: request.status,
      clientName,
      clientEmail,
      partnerName,
      createdAt: new Date(request.createdAt),
      updatedAt: new Date(request.updatedAt),
      currentStep
    };
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
    this.loadRequests(); // Recargar desde la API con el nuevo filtro
  }

  onTypeChange(): void {
    this.loadRequests(); // Recargar desde la API con el nuevo filtro
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







