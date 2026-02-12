import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { BaseRequestFlowComponent } from '../../../../shared/components/base-request-flow/base-request-flow.component';
import { RequestFlowContext, ServiceType } from '../../../../shared/models/request-flow-context';

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
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // serviceType puede ser null si viene desde selección de tipo
  }
  
  onFlowCompleted(data: any): void {
    console.log('[PanelPartnerRequestFlowComponent] Flujo completado:', data);
    this.flowCompleted.emit(data);
    this.router.navigate(['/panel/my-requests']);
  }
  
  onFlowCancelled(): void {
    console.log('[PanelPartnerRequestFlowComponent] Flujo cancelado');
    this.flowCancelled.emit();
    this.router.navigate(['/panel/my-requests']);
  }
}
