import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../services/auth.service';
import { PanelSnackBarService } from '../../services/panel-snackbar.service';
import { RequestsService, Request } from '../../services/requests.service';
import { SafeDatePipe } from '../../../../shared/pipes/safe-date.pipe';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoPipe, SafeDatePipe],
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
  /** ID de solicitud en proceso de borrado (deshabilita botones y muestra spinner). */
  deletingRequestId: number | null = null;
  showDeleteModal = false;
  requestToDelete: Request | null = null;

  constructor(
    private authService: AuthService,
    private requestsService: RequestsService,
    private router: Router,
    private panelSnackBar: PanelSnackBarService,
    private transloco: TranslocoService,
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

    // Releer rol tras auth (no confiar solo en el constructor: puede ir desfasado)
    this.currentUser = this.authService.getCurrentUser();
    this.isPartner = this.authService.isPartner();

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
        this.error = this.transloco.translate('PANEL.my_requests_page.error_load');
        this.requests = [];
        this.isLoading = false;
      });
  }

  requestTypeTranslocoKey(type: string): string {
    return `PANEL.dashboard.process_type.${type}`;
  }

  statusTranslocoKey(status: string): string {
    const map: Record<string, string> = {
      pendiente: 'pendiente',
      'solicitud-recibida': 'solicitud_recibida',
      'en-proceso': 'en_proceso',
      completada: 'completada',
      rechazada: 'rechazada',
    };
    const k = map[status] ?? status.replace(/-/g, '_');
    return `PANEL.dashboard.status.${k}`;
  }

  isClientUnavailableLabel(request: Request): boolean {
    return this.getClientName(request) === this.transloco.translate('PANEL.my_requests_page.client_unavailable');
  }

  deleteConfirmMessage(): string {
    const r = this.requestToDelete;
    if (!r) {
      return '';
    }
    const typeLabel = this.transloco.translate(this.requestTypeTranslocoKey(r.type));
    return this.transloco.translate('PANEL.my_requests_page.delete_confirm', { type: typeLabel });
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
   * Maneja el clic en el botón "Continuar Solicitud"
   */
  continueRequest(request: Request): void {
    console.log('Continuar solicitud - Request:', request);
    console.log('UUID:', request.uuid);
    console.log('ID:', request.id);
    
    const url = this.getContinueRequestUrl(request);
    console.log('Navegando a:', url);
    
    if (!request.uuid && !request.id) {
      console.error('La solicitud no tiene UUID ni ID');
      this.panelSnackBar.error(
        'Error: La solicitud no tiene identificador válido'
      );
      return;
    }
    
    this.router.navigateByUrl(url).then(
      (success) => {
        console.log('Navegación exitosa:', success);
      },
      (error) => {
        console.error('Error en la navegación:', error);
        this.panelSnackBar.error(
          'Error al navegar. Por favor, intente nuevamente.'
        );
      }
    );
  }

  /**
   * Abre el modal de confirmación para eliminar un borrador pendiente.
   */
  openDeleteModal(request: Request): void {
    if (!this.isPendingRequest(request) || !request.id) {
      this.panelSnackBar.error('No se puede eliminar esta solicitud.');
      return;
    }
    this.requestToDelete = request;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    if (this.deletingRequestId !== null) {
      return;
    }
    this.showDeleteModal = false;
    this.requestToDelete = null;
  }

  /**
   * Ejecuta el borrado tras confirmar en el modal (sin `window.confirm`).
   */
  confirmDelete(): void {
    const request = this.requestToDelete;
    if (!request?.id) {
      return;
    }

    this.deletingRequestId = request.id;
    this.requestsService
      .deleteRequest(request.id)
      .then(() => {
        this.panelSnackBar.success('Solicitud eliminada.');
        this.showDeleteModal = false;
        this.requestToDelete = null;
        this.loadRequests();
      })
      .catch((err: unknown) => {
        const httpErr = err as { error?: { message?: string }; message?: string };
        const msg =
          (typeof httpErr?.error?.message === 'string' && httpErr.error.message) ||
          (typeof httpErr?.message === 'string' && httpErr.message) ||
          'No se pudo eliminar la solicitud.';
        this.panelSnackBar.error(msg);
      })
      .finally(() => {
        this.deletingRequestId = null;
      });
  }

  /**
   * Obtiene el nombre del cliente de una solicitud
   */
  getClientName(request: Request): string {
    if (!request) {
      return this.transloco.translate('PANEL.my_requests_page.client_unavailable');
    }

    if (request.client) {
      const firstName = request.client.first_name || '';
      const lastName = request.client.last_name || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return request.client.username || request.client.email || this.transloco.translate('PANEL.my_requests_page.client');
    }

    const clientData = (request as any).clientData;
    if (clientData) {
      const firstName = clientData.firstName || clientData.first_name || '';
      const lastName = clientData.lastName || clientData.last_name || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return clientData.email || this.transloco.translate('PANEL.my_requests_page.client');
    }

    return this.transloco.translate('PANEL.my_requests_page.client_unavailable');
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










