import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RequestsService, Request } from '../../services/requests.service';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-requests.component.html',
  styleUrl: './my-requests.component.css'
})
export class MyRequestsComponent implements OnInit {
  requests: Request[] = [];
  pendingRequests: Request[] = []; // Solicitudes pendientes (borradores)
  completedRequests: Request[] = []; // Solicitudes completadas/enviadas
  isLoading = true;
  currentUser: any = null;
  isPartner = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private requestsService: RequestsService
  ) {
    // Inicializar en constructor después de la inyección
    this.currentUser = this.authService.getCurrentUser();
    this.isPartner = this.authService.isPartner();
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.error = null;
    
    // Determinar el role: si es partner, usar 'partner', sino 'client'
    const role: 'client' | 'partner' = this.isPartner ? 'partner' : 'client';
    
    this.requestsService.getMyRequests(role)
      .then((requests) => {
        console.log('Solicitudes cargadas:', requests);
        console.log('Primera solicitud completa:', requests[0]);
        this.requests = requests;
        // Separar requests pendientes de las completadas
        this.pendingRequests = requests.filter(r => r.status === 'pendiente');
        this.completedRequests = requests.filter(r => r.status !== 'pendiente');
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error al cargar solicitudes:', error);
        this.error = 'Error al cargar las solicitudes. Por favor, intente nuevamente.';
        this.requests = [];
        this.isLoading = false;
      });
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
      'solicitud-recibida': 'Solicitud Recibida',
      'en-proceso': 'En Proceso',
      'completada': 'Completada',
      'rechazada': 'Rechazada'
    };
    return statuses[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pendiente': 'badge bg-warning',
      'solicitud-recibida': 'badge bg-primary',
      'en-proceso': 'badge bg-info',
      'completada': 'badge bg-success',
      'rechazada': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  /**
   * Verifica si una solicitud es pendiente (borrador)
   */
  isPendingRequest(request: Request): boolean {
    return request.status === 'pendiente';
  }

  /**
   * Obtiene la URL para continuar una solicitud pendiente
   */
  getContinueRequestUrl(request: Request): string {
    if (request.uuid) {
      return `/panel/new-request/${request.uuid}`;
    }
    // Fallback a ID si no hay UUID (no debería pasar)
    return `/panel/new-request/${request.id}`;
  }

  /**
   * Obtiene el nombre del cliente de una solicitud
   */
  getClientName(request: Request): string {
    if (!request) return 'Cliente no disponible';
    
    if (request.client) {
      const firstName = request.client.first_name || '';
      const lastName = request.client.last_name || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return request.client.username || request.client.email || 'Cliente';
    }
    
    // Intentar acceder directamente si los datos están en el objeto principal
    const clientData = (request as any).clientData;
    if (clientData) {
      const firstName = clientData.firstName || clientData.first_name || '';
      const lastName = clientData.lastName || clientData.last_name || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return clientData.email || 'Cliente';
    }
    
    return 'Cliente no disponible';
  }

  /**
   * Obtiene el nombre de la LLC de una solicitud de apertura
   */
  getLlcName(request: Request): string | null {
    if (!request) return null;
    
    // Para apertura-llc
    if (request.type === 'apertura-llc') {
      if (request.aperturaLlcRequest) {
        return request.aperturaLlcRequest.llcName || 
               request.aperturaLlcRequest.llcNameOption1 || 
               null;
      }
      // Intentar acceder directamente si los datos están en el objeto principal
      const aperturaData = (request as any).aperturaLlcData || (request as any).aperturaData;
      if (aperturaData) {
        return aperturaData.llcName || aperturaData.llcNameOption1 || null;
      }
    }
    
    // Para renovacion-llc
    if (request.type === 'renovacion-llc') {
      if (request.renovacionLlcRequest) {
        return request.renovacionLlcRequest.llcName || null;
      }
      const renovacionData = (request as any).renovacionLlcData || (request as any).renovacionData;
      if (renovacionData) {
        return renovacionData.llcName || null;
      }
    }
    
    // Para cuenta-bancaria
    if (request.type === 'cuenta-bancaria') {
      if (request.cuentaBancariaRequest) {
        return request.cuentaBancariaRequest.legalBusinessName || 
               request.cuentaBancariaRequest.legalBusinessIdentifier || 
               null;
      }
      const cuentaData = (request as any).cuentaBancariaData || (request as any).cuentaData;
      if (cuentaData) {
        return cuentaData.legalBusinessName || cuentaData.legalBusinessIdentifier || null;
      }
    }
    
    return null;
  }
}










