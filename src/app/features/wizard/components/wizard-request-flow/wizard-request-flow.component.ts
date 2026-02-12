import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { BaseRequestFlowComponent } from '../../../../shared/components/base-request-flow/base-request-flow.component';
import { RequestFlowContext, ServiceType } from '../../../../shared/models/request-flow-context';
import { WizardFlowFinalizeService } from '../../services/wizard-flow-finalize.service';

/**
 * Componente específico para el flujo del wizard (cliente final)
 * Este componente envuelve el BaseRequestFlowComponent con la configuración específica del wizard
 */
@Component({
  selector: 'app-wizard-request-flow',
  standalone: true,
  imports: [BaseRequestFlowComponent],
  template: `
    <app-base-request-flow
      [context]="RequestFlowContext.WIZARD"
      [serviceType]="serviceType"
      (flowCompleted)="onFlowCompleted($event)"
      (flowCancelled)="onFlowCancelled()">
    </app-base-request-flow>
  `
})
export class WizardRequestFlowComponent implements OnInit {
  @Input() serviceType!: ServiceType;
  @Output() flowCompleted = new EventEmitter<any>();
  @Output() flowCancelled = new EventEmitter<void>();
  
  RequestFlowContext = RequestFlowContext;
  private isFinalizing = false;
  
  constructor(
    private router: Router,
    private finalizeService: WizardFlowFinalizeService
  ) {}
  
  ngOnInit(): void {
    if (!this.serviceType) {
      console.error('[WizardRequestFlowComponent] serviceType es requerido');
    }
  }
  
  async onFlowCompleted(data: any): Promise<void> {
    console.log('[WizardRequestFlowComponent] Flujo completado:', data);
    this.flowCompleted.emit(data);
    
    // Si viene del submit del paso final, finalizar (status + firma)
    if (data?.submit && !this.isFinalizing) {
      this.isFinalizing = true;
      try {
        const signature = data?.submit?.signature || null;
        await this.finalizeService.finalize(this.serviceType, signature);
      } catch (e) {
        console.error('[WizardRequestFlowComponent] Error al finalizar wizard:', e);
        this.isFinalizing = false;
        return; // no navegar si falla
      }
    }

    this.router.navigate(['/panel']);
  }
  
  onFlowCancelled(): void {
    console.log('[WizardRequestFlowComponent] Flujo cancelado');
    this.flowCancelled.emit();
    this.router.navigate(['/']);
  }
}
