import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { BaseRequestFlowComponent } from '../../../../shared/components/base-request-flow/base-request-flow.component';
import { RequestFlowContext, ServiceType } from '../../../../shared/models/request-flow-context';

/**
 * Componente específico para el flujo del panel-cliente (cliente autenticado)
 * Este componente envuelve el BaseRequestFlowComponent con la configuración específica del panel-cliente
 */
@Component({
  selector: 'app-panel-client-request-flow',
  standalone: true,
  imports: [BaseRequestFlowComponent],
  template: `
    <app-base-request-flow
      [context]="RequestFlowContext.PANEL_CLIENT"
      [serviceType]="serviceType"
      (flowCompleted)="onFlowCompleted($event)"
      (flowCancelled)="onFlowCancelled()">
    </app-base-request-flow>
  `
})
export class PanelClientRequestFlowComponent implements OnInit {
  @Input() serviceType: ServiceType | null = null; // Ahora opcional
  @Output() flowCompleted = new EventEmitter<any>();
  @Output() flowCancelled = new EventEmitter<void>();
  
  RequestFlowContext = RequestFlowContext;
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // serviceType puede ser null si viene desde selección de tipo
  }
  
  onFlowCompleted(data: any): void {
    console.log('[PanelClientRequestFlowComponent] Flujo completado:', data);
    this.flowCompleted.emit(data);
    this.router.navigate(['/panel/my-requests']);
  }
  
  onFlowCancelled(): void {
    console.log('[PanelClientRequestFlowComponent] Flujo cancelado');
    this.flowCancelled.emit();
    this.router.navigate(['/panel/my-requests']);
  }
}
