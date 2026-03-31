import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RequestsService, Request } from '../../services/requests.service';
import { parseCreatedAtIso } from '../../../../shared/utils/date.util';
import { SafeDatePipe } from '../../../../shared/pipes/safe-date.pipe';

interface RequestDisplay {
  id: number;
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  status: 'solicitud-recibida' | 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  clientName: string;
  clientEmail: string;
  partnerName?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  currentStep: string;
}

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SafeDatePipe],
  templateUrl: './admin-requests.component.html',
  styleUrl: './admin-requests.component.css'
})
export class AdminRequestsComponent implements OnInit, OnDestroy {
  isLoading = true;
  requests: RequestDisplay[] = [];
  filteredRequests: RequestDisplay[] = [];
  errorMessage: string | null = null;
  /** Filtro desde URL ?clientId= (id tabla clients) */
  filterClientId?: number;
  private querySub?: Subscription;
  
  // Filtros
  selectedStatus: string = 'all';
  selectedType: string = 'all';
  searchTerm: string = '';
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  statusOptions = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'solicitud-recibida', label: 'Solicitud Recibida' },
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

  constructor(
    private requestsService: RequestsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.querySub = this.route.queryParamMap.subscribe(() => {
      const c = this.route.snapshot.queryParamMap.get('clientId');
      if (c !== null && c !== '') {
        const n = parseInt(c, 10);
        this.filterClientId = Number.isFinite(n) ? n : undefined;
      } else {
        this.filterClientId = undefined;
      }
      this.currentPage = 1;
      void this.loadRequests();
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  clearClientFilter(): void {
    void this.router.navigate(['/panel/requests'], { queryParams: {} });
  }

  async loadRequests(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    
    try {
      // Preparar filtros para la API
      const filters: any = {
        page: this.currentPage,
        limit: this.itemsPerPage,
      };
      if (this.selectedStatus !== 'all') {
        filters.status = this.selectedStatus;
      }
      if (this.selectedType !== 'all') {
        filters.type = this.selectedType;
      }
      if (this.searchTerm && this.searchTerm.trim().length > 0) {
        filters.search = this.searchTerm.trim();
      }
      if (this.filterClientId != null) {
        filters.clientId = this.filterClientId;
      }

      // Obtener requests desde la API con paginación y filtros
      const response = await this.requestsService.getAllRequests(filters);
      
      // Actualizar información de paginación
      this.totalItems = response.total;
      this.totalPages = response.totalPages;
      this.currentPage = response.page;
      
      // Transformar los datos de la API al formato de display
      this.requests = response.data.map(request => this.mapRequestToDisplay(request));
      
      // Los datos ya vienen filtrados del backend, así que filteredRequests = requests
      this.filteredRequests = this.requests;
    } catch (error: any) {
      console.error('Error al cargar solicitudes:', error);
      this.errorMessage = error?.error?.message || 'Error al cargar las solicitudes. Por favor, intenta nuevamente.';
      this.requests = [];
      this.filteredRequests = [];
      this.totalItems = 0;
      this.totalPages = 0;
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

    // Determinar la etapa actual: usar request.stage si está disponible, sino usar currentStepNumber como fallback
    let currentStep = 'Inicial';
    
    // Prioridad 1: Usar request.stage si está disponible
    if (request.stage && request.stage.trim()) {
      currentStep = request.stage;
    } else {
      // Prioridad 2: Usar currentStepNumber de los sub-requests como fallback
      if (request.aperturaLlcRequest) {
        currentStep = `Paso ${request.aperturaLlcRequest.currentStepNumber || 1}`;
      } else if (request.renovacionLlcRequest) {
        currentStep = `Paso ${request.renovacionLlcRequest.currentStepNumber || 1}`;
      } else if (request.cuentaBancariaRequest) {
        currentStep = `Paso ${request.cuentaBancariaRequest.currentStepNumber || 1}`;
      }
    }

    const createdIso = parseCreatedAtIso(request.createdAt);
    const updatedIso = parseCreatedAtIso(request.updatedAt);

    return {
      id: request.id,
      type: request.type,
      status: request.status,
      clientName,
      clientEmail,
      partnerName,
      createdAt: createdIso ? new Date(createdIso) : null,
      updatedAt: updatedIso ? new Date(updatedIso) : null,
      currentStep
    };
  }

  applyFilters(): void {
    // Los filtros ahora se aplican en el backend, pero mantenemos este método
    // por si necesitamos filtrado local adicional en el futuro
    this.filteredRequests = this.requests;
  }

  onStatusChange(): void {
    this.currentPage = 1; // Resetear a la primera página
    this.loadRequests(); // Recargar desde la API con el nuevo filtro
  }

  onTypeChange(): void {
    this.currentPage = 1; // Resetear a la primera página
    this.loadRequests(); // Recargar desde la API con el nuevo filtro
  }

  onSearchChange(): void {
    // Resetear a la primera página cuando se cambia la búsqueda
    this.currentPage = 1;
    // Usar debounce para evitar demasiadas llamadas mientras el usuario escribe
    this.loadRequests();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRequests();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
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
      'solicitud-recibida': 'Solicitud Recibida',
      'pendiente': 'Pendiente',
      'en-proceso': 'En Proceso',
      'completada': 'Completada',
      'rechazada': 'Rechazada'
    };
    return statuses[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'solicitud-recibida': 'badge bg-warning',
      'pendiente': 'badge bg-warning',
      'en-proceso': 'badge bg-info',
      'completada': 'badge bg-success',
      'rechazada': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  getRequestTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'apertura-llc': 'request-type-apertura',
      'renovacion-llc': 'request-type-renovacion',
      'cuenta-bancaria': 'request-type-cuenta'
    };
    return classes[type] || 'request-type-default';
  }

  // Helper para usar Math en el template
  Math = Math;
}










