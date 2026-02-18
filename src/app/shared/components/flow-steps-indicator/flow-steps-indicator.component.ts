import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowStepConfig } from '../../models/request-flow-context';
import { RequestFlowContext } from '../../models/request-flow-context';

/**
 * Componente reutilizable para mostrar el indicador de pasos del flujo
 */
@Component({
  selector: 'app-flow-steps-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-steps-indicator.component.html',
  styleUrls: ['./flow-steps-indicator.component.css']
})
export class FlowStepsIndicatorComponent {
  @Input() steps: FlowStepConfig[] = [];
  @Input() currentStep: number = 0;
  @Input() context: RequestFlowContext = RequestFlowContext.WIZARD;
  
  /**
   * Obtiene la clase CSS para un paso
   */
  getStepClass(index: number): string {
    if (index < this.currentStep) {
      return 'completed';
    } else if (index === this.currentStep) {
      return 'active';
    }
    return '';
  }
  
  /**
   * Verifica si un paso está completado
   */
  isCompleted(index: number): boolean {
    return index < this.currentStep;
  }
  
  /**
   * Verifica si un paso está activo
   */
  isActive(index: number): boolean {
    return index === this.currentStep;
  }
}
