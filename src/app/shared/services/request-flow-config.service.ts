import { Injectable, Type } from '@angular/core';
import { RequestFlowContext, RequestFlowStep, FlowStepConfig, ServiceType } from '../models/request-flow-context';

// Importaciones de componentes del wizard
import { WizardBasicRegisterStepComponent } from '../../features/wizard/components/basic-register-step/basic-register-step.component';
import { WizardEmailVerificationComponent } from '../../features/wizard/components/email-verification/email-verification.component';
import { WizardStatePlanSelectionStepComponent } from '../../features/wizard/flow-llc/steps/state-plan-selection-step/state-plan-selection-step.component';
import { WizardStateSelectionStepComponent } from '../../features/wizard/components/state-selection-step/state-selection-step.component';
import { WizardPaymentStepComponent } from '../../features/wizard/components/payment-step/payment-step.component';
import { WizardLlcInformationStepComponent } from '../../features/wizard/flow-llc/steps/wizard-llc-information-step/wizard-llc-information-step.component';
import { WizardRenovacionLlcInformationStepComponent } from '../../features/wizard/flow-renovacion/steps/wizard-renovacion-llc-information-step/wizard-renovacion-llc-information-step.component';
import { WizardCuentaBancariaInformationStepComponent } from '../../features/wizard/flow-cuenta-bancaria/steps/wizard-cuenta-bancaria-information-step/wizard-cuenta-bancaria-information-step.component';

// Importaciones de wrappers panel
import { PanelLlcInformationStepComponent } from '../../features/panel/components/panel-llc-information-step/panel-llc-information-step.component';
import { PanelRenovacionLlcInformationStepComponent } from '../../features/panel/components/panel-renovacion-llc-information-step/panel-renovacion-llc-information-step.component';
import { PanelCuentaBancariaInformationStepComponent } from '../../features/panel/components/panel-cuenta-bancaria-information-step/panel-cuenta-bancaria-information-step.component';
import { PanelPaymentStepComponent } from '../../features/panel/components/panel-payment-step/panel-payment-step.component';
import { WizardFinalReviewStepComponent } from '../../features/wizard/components/final-review-step/final-review-step.component';

// Importaciones de componentes del panel
import { ClientAssociationStepComponent } from '../../features/panel/components/client-association-step/client-association-step.component';
import { PartnerClientSelectionStepComponent } from '../../features/panel/components/partner-client-selection-step/partner-client-selection-step.component';
import { ServiceTypeSelectionStepComponent } from '../../shared/components/service-type-selection-step/service-type-selection-step.component';

/**
 * Servicio para configurar los pasos del flujo según el contexto
 */
@Injectable({ providedIn: 'root' })
export class RequestFlowConfigService {
  
  /**
   * Obtiene la configuración de pasos según el contexto y tipo de servicio
   * @param includeServiceTypeSelection Si es true, incluye el paso de selección de tipo de servicio al inicio
   */
  getFlowConfig(context: RequestFlowContext, serviceType: ServiceType, includeServiceTypeSelection: boolean = false): FlowStepConfig[] {
    const configs: FlowStepConfig[] = [];
    
    // Si se requiere selección de tipo de servicio, agregarlo primero
    if (includeServiceTypeSelection && (context === RequestFlowContext.PANEL_CLIENT || context === RequestFlowContext.PANEL_PARTNER)) {
      configs.push({
        step: RequestFlowStep.SERVICE_TYPE_SELECTION,
        required: true,
        component: ServiceTypeSelectionStepComponent,
        order: 1,
        label: 'Tipo de Servicio',
        icon: 'bi-list-check'
      });
    }
    
    switch (context) {
      case RequestFlowContext.WIZARD:
        configs.push(
          { 
            step: RequestFlowStep.REGISTER, 
            required: true, 
            component: WizardBasicRegisterStepComponent, 
            order: 1,
            label: 'Registro',
            icon: 'bi-person-plus'
          },
          { 
            step: RequestFlowStep.EMAIL_VERIFICATION, 
            required: true, 
            component: WizardEmailVerificationComponent, 
            order: 2,
            label: 'Verificación de Email',
            icon: 'bi-envelope-check'
          }
        );
        
        // Agregar selección de estado/plan solo para LLC types
        if (serviceType === 'apertura-llc' || serviceType === 'renovacion-llc') {
          configs.push({
            step: this.getStateSelectionStep(serviceType),
            required: true,
            component: this.getPlanStateComponent(serviceType),
            order: 3,
            label: serviceType === 'renovacion-llc' ? 'Selección de Estado' : 'Selección de Estado/Plan',
            icon: 'bi-geo-alt'
          });
        }
        
        configs.push(
          { 
            step: RequestFlowStep.PAYMENT, 
            required: true, 
            component: WizardPaymentStepComponent, 
            order: (serviceType === 'apertura-llc' || serviceType === 'renovacion-llc') ? 4 : 3,
            label: 'Pago',
            icon: 'bi-credit-card'
          },
              {
                step: RequestFlowStep.SERVICE_FORM,
                required: true,
                component: this.getServiceFormComponent(serviceType, RequestFlowContext.WIZARD),
            order: (serviceType === 'apertura-llc' || serviceType === 'renovacion-llc') ? 5 : 4,
            label: 'Información del Servicio',
            icon: 'bi-file-text'
          },
          { 
            step: RequestFlowStep.CONFIRMATION, 
            required: true, 
            component: WizardFinalReviewStepComponent, 
            order: (serviceType === 'apertura-llc' || serviceType === 'renovacion-llc') ? 6 : 5,
            label: 'Confirmación',
            icon: 'bi-check-circle'
          }
        );
        break;
        
      case RequestFlowContext.PANEL_CLIENT:
        // El orden base depende de si hay selección de tipo de servicio
        const clientBaseOrder = includeServiceTypeSelection ? 2 : 1;
        
        configs.push(
          { 
            step: RequestFlowStep.CLIENT_ASSOCIATION, 
            required: true, 
            component: ClientAssociationStepComponent, 
            order: clientBaseOrder,
            label: 'Asociación de Cliente',
            icon: 'bi-person-check'
          }
        );
        
        // Agregar selección de estado/plan solo para LLC types
        if (serviceType === 'apertura-llc' || serviceType === 'renovacion-llc') {
          configs.push({
            step: this.getStateSelectionStep(serviceType),
            required: true,
            component: this.getPlanStateComponent(serviceType),
            order: clientBaseOrder + 1,
            label: serviceType === 'renovacion-llc' ? 'Selección de Estado' : 'Selección de Estado/Plan',
            icon: 'bi-geo-alt'
          });
        }
        
        configs.push(
          { 
            step: RequestFlowStep.PAYMENT, 
            required: true, 
            component: PanelPaymentStepComponent, 
            order: clientBaseOrder + (serviceType === 'cuenta-bancaria' ? 1 : 2),
            label: 'Pago',
            icon: 'bi-credit-card'
          },
              {
                step: RequestFlowStep.SERVICE_FORM,
                required: true,
                component: this.getServiceFormComponent(serviceType, RequestFlowContext.PANEL_CLIENT),
            order: clientBaseOrder + (serviceType === 'cuenta-bancaria' ? 2 : 3),
            label: (serviceType === 'apertura-llc' || serviceType === 'renovacion-llc') ? 'Información de la LLC' : 'Información del Servicio',
            icon: 'bi-file-text'
          },
          { 
            step: RequestFlowStep.CONFIRMATION, 
            required: true, 
            component: WizardFinalReviewStepComponent, 
            order: clientBaseOrder + (serviceType === 'cuenta-bancaria' ? 3 : 4),
            label: 'Confirmación',
            icon: 'bi-check-circle'
          }
        );
        break;
        
      case RequestFlowContext.PANEL_PARTNER:
        // El orden base depende de si hay selección de tipo de servicio
        const partnerBaseOrder = includeServiceTypeSelection ? 2 : 1;
        
        // Agregar selección de cliente solo si no viene cliente inicial
        // Esto se manejará dinámicamente, pero por ahora lo incluimos siempre
        // El componente puede ocultarse si ya hay cliente
        configs.push(
          { 
            step: RequestFlowStep.CLIENT_SELECTION, 
            required: true, 
            component: PartnerClientSelectionStepComponent, 
            order: partnerBaseOrder,
            label: 'Información del Cliente',
            icon: 'bi-people'
          }
        );
        
        // Agregar selección de estado/plan solo para LLC types
        if (serviceType === 'apertura-llc' || serviceType === 'renovacion-llc') {
          configs.push({
            step: this.getStateSelectionStep(serviceType),
            required: true,
            component: this.getPlanStateComponent(serviceType),
            order: partnerBaseOrder + 1,
            label: serviceType === 'renovacion-llc' ? 'Selección de Estado' : 'Selección de Estado/Plan',
            icon: 'bi-geo-alt'
          });
        }
        
        configs.push(
              {
                step: RequestFlowStep.SERVICE_FORM,
                required: true,
                component: this.getServiceFormComponent(serviceType, RequestFlowContext.PANEL_PARTNER),
            order: partnerBaseOrder + (serviceType === 'cuenta-bancaria' ? 1 : 2),
            label: (serviceType === 'apertura-llc' || serviceType === 'renovacion-llc') ? 'Información de la LLC' : 'Datos del Servicio',
            icon: 'bi-file-text'
          },
          { 
            step: RequestFlowStep.CONFIRMATION, 
            required: true, 
            component: WizardFinalReviewStepComponent, 
            order: partnerBaseOrder + (serviceType === 'cuenta-bancaria' ? 2 : 3),
            label: 'Confirmación',
            icon: 'bi-check-circle'
          }
        );
        break;
    }
    
    return configs.sort((a, b) => a.order - b.order);
  }
  
  /**
   * Obtiene el componente de formulario según el tipo de servicio y contexto
   */
  private getServiceFormComponent(serviceType: ServiceType, context: RequestFlowContext): Type<any> {
    // Si es contexto panel, usar wrappers panel
    if (context === RequestFlowContext.PANEL_CLIENT || context === RequestFlowContext.PANEL_PARTNER) {
      switch (serviceType) {
        case 'apertura-llc':
          return PanelLlcInformationStepComponent;
        case 'renovacion-llc':
          return PanelRenovacionLlcInformationStepComponent;
        case 'cuenta-bancaria':
          return PanelCuentaBancariaInformationStepComponent;
        default:
          throw new Error(`Unknown service type: ${serviceType}`);
      }
    }
    
    // Si es contexto wizard, usar wrappers wizard
    switch (serviceType) {
      case 'apertura-llc':
        return WizardLlcInformationStepComponent;
      case 'renovacion-llc':
        return WizardRenovacionLlcInformationStepComponent;
      case 'cuenta-bancaria':
        return WizardCuentaBancariaInformationStepComponent;
      default:
        throw new Error(`Unknown service type: ${serviceType}`);
    }
  }

  /**
   * Obtiene el componente de selección estado/plan según el tipo de servicio
   * - apertura-llc: estado + plan
   * - renovacion-llc: solo estado (y cotización)
   */
  private getPlanStateComponent(serviceType: ServiceType): Type<any> {
    if (serviceType === 'renovacion-llc') {
      return WizardStateSelectionStepComponent;
    }
    return WizardStatePlanSelectionStepComponent;
  }
  
  /**
   * Obtiene el enum de paso de selección de estado según el tipo de servicio
   * - apertura-llc: PLAN_STATE_SELECTION (estado + plan)
   * - renovacion-llc: STATE_SELECTION (solo estado)
   */
  private getStateSelectionStep(serviceType: ServiceType): RequestFlowStep {
    if (serviceType === 'renovacion-llc') {
      return RequestFlowStep.STATE_SELECTION;
    }
    return RequestFlowStep.PLAN_STATE_SELECTION;
  }
  
  /**
   * Obtiene el número total de pasos para un contexto
   */
  getTotalSteps(context: RequestFlowContext, serviceType: ServiceType, includeServiceTypeSelection: boolean = false): number {
    return this.getFlowConfig(context, serviceType, includeServiceTypeSelection).length;
  }
  
  /**
   * Verifica si un paso es requerido en un contexto
   */
  isStepRequired(context: RequestFlowContext, step: RequestFlowStep, serviceType: ServiceType, includeServiceTypeSelection: boolean = false): boolean {
    const config = this.getFlowConfig(context, serviceType, includeServiceTypeSelection).find(c => c.step === step);
    return config?.required ?? false;
  }
}
