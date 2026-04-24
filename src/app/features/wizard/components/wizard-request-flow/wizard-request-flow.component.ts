import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { BaseRequestFlowComponent } from '../../../../shared/components/base-request-flow/base-request-flow.component';
import { RequestFlowContext, ServiceType } from '../../../../shared/models/request-flow-context';
import { WizardFlowFinalizeService } from '../../services/wizard-flow-finalize.service';
import { environment } from '../../../../../environments/environment';

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
      [flowSource]="flowSource"
      [hideStepsIndicator]="hideStepsIndicator"
      (flowCompleted)="onFlowCompleted($event)"
      (flowCancelled)="onFlowCancelled()"
      (stepIndexChange)="stepIndexChange.emit($event)">
    </app-base-request-flow>
  `
})
export class WizardRequestFlowComponent implements OnInit {
  @Input() serviceType!: ServiceType;
  @Input() flowSource: 'wizard' | 'crm-lead' | 'panel' = 'wizard';
  /** Oculta el indicador de pasos superior (cuando la página usa layout con sidebar) */
  @Input() hideStepsIndicator = false;
  @Output() flowCompleted = new EventEmitter<any>();
  @Output() flowCancelled = new EventEmitter<void>();
  @Output() stepIndexChange = new EventEmitter<number>();
  
  RequestFlowContext = RequestFlowContext;
  private isFinalizing = false;
  /** Evita segunda finalize tras clearWizardSession si flowCompleted se emite dos veces con submit. */
  private finalizeSucceeded = false;
  @ViewChild(BaseRequestFlowComponent) baseFlow?: BaseRequestFlowComponent;
  
  constructor(private finalizeService: WizardFlowFinalizeService) {}
  
  ngOnInit(): void {
    if (!this.serviceType) {
      console.error('[WizardRequestFlowComponent] serviceType es requerido');
    }
  }
  
  async onFlowCompleted(data: any): Promise<void> {
    if (data?.submit && this.finalizeSucceeded) {
      return;
    }
    console.log('[WizardRequestFlowComponent] Flujo completado:', data);
    this.flowCompleted.emit(data);

    // Si viene del submit del paso final, finalizar (status + firma)
    if (data?.submit && !this.isFinalizing) {
      this.isFinalizing = true;
      try {
        const signature = data?.submit?.signature || null;
        const signatureUrl = data?.submit?.signatureUrl || null;
        await this.finalizeService.finalize(this.serviceType, signature, signatureUrl);
        this.finalizeSucceeded = true;
        // Mostrar pantalla de éxito en el paso de confirmación y no redirigir automáticamente.
        this.baseFlow?.markCurrentStepAsSubmitted();
        this.finalizeService.clearWizardSession();
        return;
      } catch (e) {
        console.error('[WizardRequestFlowComponent] Error al finalizar wizard:', e);
        return;
      } finally {
        this.isFinalizing = false;
      }
    }
  }
  
  onFlowCancelled(): void {
    console.log('[WizardRequestFlowComponent] Flujo cancelado');
    this.flowCancelled.emit();
    this.finalizeService.clearWizardSession();
    window.location.assign(`${environment.baseUrl}/`);
  }
}
