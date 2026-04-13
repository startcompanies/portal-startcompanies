import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RequestsService } from '../../services/requests.service';
import { PartnerClientsService } from '../../services/partner-clients.service';
import { PanelPartnerRequestFlowComponent } from '../../components/panel-partner-request-flow/panel-partner-request-flow.component';
import { PanelClientRequestFlowComponent } from '../../components/panel-client-request-flow/panel-client-request-flow.component';
import { ServiceType } from '../../../../shared/models/request-flow-context';
import { WizardStateService } from '../../../wizard/services/wizard-state.service';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

/**
 * Componente router/orchestrator para el flujo de nuevas solicitudes
 * Delega a los componentes de flujo unificado según el contexto (partner/client)
 */
@Component({
  selector: 'app-new-request',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoPipe,
    PanelPartnerRequestFlowComponent,
    PanelClientRequestFlowComponent
  ],
  template: `
    <div class="new-request-container">
      <!-- Área del flujo (panel) - aislada para que los estilos no choquen con el resto del sitio -->
      <div class="panel-request-flow-area">
        <!-- Partner Flow -->
        <app-panel-partner-request-flow
          *ngIf="isPartner && partnerFlowConfig"
          [serviceType]="partnerFlowConfig.serviceType"
          [draftRequestUuid]="partnerFlowConfig.draftRequestUuid"
          [initialClientId]="partnerFlowConfig.initialClientId"
          (flowCompleted)="onFlowCompleted()"
          (flowCancelled)="onFlowCancelled()">
        </app-panel-partner-request-flow>

        <!-- Client Flow -->
        <app-panel-client-request-flow
          *ngIf="!isPartner && clientFlowConfig"
          [serviceType]="clientFlowConfig.serviceType"
          [draftRequestUuid]="clientFlowConfig.draftRequestUuid"
          [omitPaymentStep]="clientFlowConfig.omitPaymentStep"
          (flowCompleted)="onFlowCompleted()"
          (flowCancelled)="onFlowCancelled()">
        </app-panel-client-request-flow>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'PANEL.common.loading' | transloco }}</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="alert alert-danger mt-3">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .new-request-container {
      min-height: 60vh;
    }
    /* Contenedor del flujo en panel: estilos solo para esta área */
    .panel-request-flow-area {
      isolation: isolate;
    }
  `]
})
export class NewRequestComponent implements OnInit {
  isLoading = false;
  errorMessage: string | null = null;
  isPartner = false;
  /**
   * Solo staff (admin / user operativo) con `?omitPaymentStep=1` en la URL:
   * carga borradores en solicitud-recibida y oculta el paso de pago en renovación.
   */
  private staffOmitPaymentDraftMode = false;

  // Configuraciones de flujo
  partnerFlowConfig: {
    serviceType: ServiceType | null;
    draftRequestUuid: string | null;
    initialClientId: number | null;
  } | null = null;

  clientFlowConfig: {
    serviceType: ServiceType | null;
    draftRequestUuid: string | null;
    omitPaymentStep: boolean;
  } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private requestsService: RequestsService,
    private partnerClientsService: PartnerClientsService,
    private wizardStateService: WizardStateService,
    private transloco: TranslocoService
  ) {
    this.isPartner = this.authService.isPartner();
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const requestUuid = this.route.snapshot.params['uuid'];
      const queryParams = this.route.snapshot.queryParams;
      const omitPayRaw = queryParams['omitPaymentStep'];
      const omitPaymentQuery =
        omitPayRaw === '1' ||
        omitPayRaw === 'true' ||
        String(omitPayRaw).toLowerCase() === 'yes';
      this.staffOmitPaymentDraftMode =
        omitPaymentQuery &&
        (this.authService.isAdmin() || this.authService.isStaffUser());

      const serviceTypeParam = queryParams['serviceType'] as ServiceType | undefined;
      const clientUuid = queryParams['client'];
      const clientIdParam = queryParams['clientId'];

      // Caso 1: Continuar borrador (con UUID)
      if (requestUuid) {
        await this.handleDraftRequest(requestUuid, serviceTypeParam);
        return;
      }

      // Caso 2: Nueva solicitud con cliente pre-seleccionado (desde my-clients)
      if (clientUuid || clientIdParam) {
        await this.handleNewRequestWithClient(clientUuid, clientIdParam, serviceTypeParam);
        return;
      }

      // Caso 3: Nueva solicitud sin parámetros → redirigir a selección
      if (!serviceTypeParam) {
        this.router.navigate(['/panel/request-flow/select-service'], { replaceUrl: true });
        return;
      }

      // Caso 4: Nueva solicitud con serviceType (sin borrador)
      this.initializeFlow(serviceTypeParam, null, null);

    } catch (error: any) {
      console.error('[NewRequestComponent] Error:', error);
      this.errorMessage = error?.message || this.transloco.translate('PANEL.new_request.err_init');
      this.isLoading = false;
    }
  }

  /**
   * Maneja la carga de un borrador existente
   */
  private async handleDraftRequest(
    requestUuid: string,
    serviceTypeParam?: ServiceType
  ): Promise<void> {
    try {
      const request = await this.requestsService.getRequestByUuid(requestUuid);

      // Validar que el usuario tenga acceso
      if (!this.hasAccessToRequest(request)) {
        this.errorMessage = this.transloco.translate('PANEL.new_request.err_no_access');
        this.isLoading = false;
        return;
      }

      const serviceType = serviceTypeParam || request.type as ServiceType;
      if (!this.isValidServiceType(serviceType)) {
        this.errorMessage = this.transloco.translate('PANEL.new_request.err_invalid_service');
        this.isLoading = false;
        return;
      }

      // Determinar cliente inicial
      let initialClientId: number | null = null;
      if (this.isPartner && request.clientId) {
        initialClientId = request.clientId;
      }

      this.initializeFlow(serviceType, requestUuid, initialClientId);

    } catch (error: any) {
      console.error('[NewRequestComponent] Error al cargar borrador:', error);
      this.errorMessage = this.transloco.translate('PANEL.new_request.err_draft');
      this.isLoading = false;
    }
  }

  /**
   * Maneja nueva solicitud con cliente pre-seleccionado
   */
  private async handleNewRequestWithClient(
    clientUuid?: string,
    clientIdParam?: string,
    serviceTypeParam?: ServiceType
  ): Promise<void> {
    if (!this.isPartner) {
      this.errorMessage = this.transloco.translate('PANEL.new_request.err_partner_only');
      this.isLoading = false;
      return;
    }

    try {
      let clientId: number | null = null;

      if (clientIdParam) {
        clientId = parseInt(clientIdParam, 10);
      } else if (clientUuid) {
        const client = await firstValueFrom(
          this.partnerClientsService.getClientByUuid(clientUuid)
        );
        clientId = client.id;
      }

      if (!clientId) {
        this.errorMessage = this.transloco.translate('PANEL.new_request.err_client_not_found');
        this.isLoading = false;
        return;
      }

      // Si no hay serviceType, redirigir a selección con cliente
      if (!serviceTypeParam) {
        this.router.navigate(['/panel/request-flow/select-service'], {
          queryParams: { client: clientUuid || clientId },
          replaceUrl: true
        });
        return;
      }

      this.initializeFlow(serviceTypeParam, null, clientId);

    } catch (error: any) {
      console.error('[NewRequestComponent] Error al cargar cliente:', error);
      this.errorMessage = this.transloco.translate('PANEL.new_request.err_client');
      this.isLoading = false;
    }
  }

  /**
   * Inicializa el flujo con la configuración correcta
   */
  private initializeFlow(
    serviceType: ServiceType,
    draftRequestUuid: string | null,
    initialClientId: number | null
  ): void {
    if (this.isPartner) {
      this.partnerFlowConfig = {
        serviceType,
        draftRequestUuid,
        initialClientId
      };
    } else {
      this.clientFlowConfig = {
        serviceType,
        draftRequestUuid,
        omitPaymentStep: this.staffOmitPaymentDraftMode,
      };
    }
    if (!draftRequestUuid) {
      this.wizardStateService.clear();
    }
    this.isLoading = false;
  }

  /**
   * Valida que el usuario tenga acceso a la solicitud
   * - Partner: acceso a solicitudes de sus clientes (por ahora permitido; TODO: validar relación).
   * - Cliente: solo si la solicitud está asignada a su usuario (request.client.userId === currentUser.id).
   *   request.clientId es el id del registro Client; el usuario se identifica por client.userId.
   */
  private hasAccessToRequest(request: any): boolean {
    if (this.isPartner) {
      return true; // TODO: Validar relación partner-cliente
    }
    if (
      this.staffOmitPaymentDraftMode &&
      (this.authService.isAdmin() || this.authService.isStaffUser())
    ) {
      return true;
    }
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) return false;
    // La solicitud pertenece al cliente cuyo userId es el usuario actual
    return request.client?.userId === currentUser.id;
  }

  /**
   * Valida que el tipo de servicio sea válido
   */
  private isValidServiceType(type: any): type is ServiceType {
    return type === 'apertura-llc' || type === 'renovacion-llc' || type === 'cuenta-bancaria';
  }

  /**
   * Maneja la finalización del flujo
   */
  onFlowCompleted(): void {
    this.router.navigate(['/panel/my-requests']);
  }

  /**
   * Maneja la cancelación del flujo
   */
  onFlowCancelled(): void {
    this.router.navigate(['/panel/my-requests']);
  }
}
