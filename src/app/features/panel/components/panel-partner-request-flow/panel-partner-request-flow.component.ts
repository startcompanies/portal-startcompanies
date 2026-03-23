import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { BaseRequestFlowComponent } from '../../../../shared/components/base-request-flow/base-request-flow.component';
import { RequestFlowContext, ServiceType } from '../../../../shared/models/request-flow-context';
import { RequestsService } from '../../services/requests.service';
import { RequestFlowStateService } from '../../../../shared/services/request-flow-state.service';

/**
 * Componente específico para el flujo del panel-partner (partner creando para cliente)
 * Este componente envuelve el BaseRequestFlowComponent con la configuración específica del panel-partner
 */
@Component({
  selector: 'app-panel-partner-request-flow',
  standalone: true,
  imports: [BaseRequestFlowComponent],
  template: `
    <app-base-request-flow
      [context]="RequestFlowContext.PANEL_PARTNER"
      [serviceType]="serviceType"
      [draftRequestUuid]="draftRequestUuid"
      [initialClientId]="initialClientId"
      (flowCompleted)="onFlowCompleted($event)"
      (flowCancelled)="onFlowCancelled()">
    </app-base-request-flow>
  `
})
export class PanelPartnerRequestFlowComponent implements OnInit {
  @Input() serviceType: ServiceType | null = null; // Ahora opcional
  @Input() draftRequestUuid: string | null = null;
  @Input() initialClientId: number | null = null;
  @Output() flowCompleted = new EventEmitter<any>();
  @Output() flowCancelled = new EventEmitter<void>();
  
  RequestFlowContext = RequestFlowContext;
  private isFinalizing = false;
  
  constructor(
    private router: Router,
    private requestsService: RequestsService,
    private requestFlowState: RequestFlowStateService
  ) {}
  
  ngOnInit(): void {
    // serviceType puede ser null si viene desde selección de tipo
  }
  
  async onFlowCompleted(data: any): Promise<void> {
    console.log('[PanelPartnerRequestFlowComponent] Flujo completado:', data);

    if (data?.submit && !this.isFinalizing) {
      this.isFinalizing = true;
      try {
        const requestId = data?.payment?.requestId ?? data?.draftRequestId;
        const serviceType = (data?.serviceType || this.serviceType) as ServiceType;
        if (!requestId || !serviceType) {
          console.error('[PanelPartnerRequestFlowComponent] Falta requestId o serviceType para finalizar', {
            requestId,
            serviceType,
            hasPayment: !!data?.payment,
            draftRequestId: data?.draftRequestId,
          });
          this.isFinalizing = false;
          this.clearFlowState();
          this.flowCompleted.emit(data);
          this.router.navigate(['/panel/my-requests']);
          return;
        }
        await this.requestsService.finalizeRequest(
          requestId,
          serviceType,
          data.submit?.signature ?? null
        );
        this.clearFlowState();
        this.flowCompleted.emit(data);
        this.router.navigate(['/panel/my-requests']);
      } catch (e) {
        console.error('[PanelPartnerRequestFlowComponent] Error al guardar firma y actualizar estado:', e);
      } finally {
        this.isFinalizing = false;
      }
      return;
    }

    this.clearFlowState();
    this.flowCompleted.emit(data);
    this.router.navigate(['/panel/my-requests']);
  }
  
  onFlowCancelled(): void {
    console.log('[PanelPartnerRequestFlowComponent] Flujo cancelado');
    this.clearFlowState();
    this.flowCancelled.emit();
    this.router.navigate(['/panel/my-requests']);
  }

  private clearFlowState(): void {
    this.requestFlowState.clear();
  }
}
