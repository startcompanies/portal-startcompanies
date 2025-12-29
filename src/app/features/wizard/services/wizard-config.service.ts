import { Injectable } from '@angular/core';
import { Type } from '@angular/core';

/**
 * Tipo de flujo del wizard
 */
export enum WizardFlowType {
  LLC_APERTURA = 'llc-apertura',
  LLC_RENOVACION = 'llc-renovacion',
  CUENTA_BANCARIA_SIN_PAGO = 'cuenta-bancaria-sin-pago',
  CUENTA_BANCARIA_CON_PAGO = 'cuenta-bancaria-con-pago'
}

/**
 * Configuración de un paso del wizard
 */
export interface WizardStepConfig {
  stepNumber: number;
  component: Type<any>;
  icon: string;
  translationKey: string;
  required: boolean;
}

/**
 * Configuración completa de un flujo de wizard
 */
export interface WizardFlowConfig {
  flowType: WizardFlowType;
  totalSteps: number;
  steps: WizardStepConfig[];
  showStateSelection: boolean;
  showPayment: boolean;
}

/**
 * Servicio para gestionar las configuraciones de los diferentes flujos del wizard
 */
@Injectable({
  providedIn: 'root'
})
export class WizardConfigService {
  
  /**
   * Obtiene la configuración de un flujo específico
   */
  getFlowConfig(flowType: WizardFlowType): WizardFlowConfig {
    switch (flowType) {
      case WizardFlowType.LLC_APERTURA:
        return this.getLLCAperturaConfig();
      case WizardFlowType.LLC_RENOVACION:
        return this.getLLCRenovacionConfig();
      case WizardFlowType.CUENTA_BANCARIA_SIN_PAGO:
        return this.getCuentaBancariaSinPagoConfig();
      case WizardFlowType.CUENTA_BANCARIA_CON_PAGO:
        return this.getCuentaBancariaConPagoConfig();
      default:
        throw new Error(`Flujo no reconocido: ${flowType}`);
    }
  }

  /**
   * Configuración para apertura de LLC
   * Flujo: datos básicos → selección estado/precio → pago → información → revisión → envío
   */
  private getLLCAperturaConfig(): WizardFlowConfig {
    return {
      flowType: WizardFlowType.LLC_APERTURA,
      totalSteps: 5,
      showStateSelection: true,
      showPayment: true,
      steps: [
        {
          stepNumber: 1,
          component: null as any, // Se importará dinámicamente
          icon: 'bi-person-plus',
          translationKey: 'WIZARD.steps.register',
          required: true
        },
        {
          stepNumber: 2,
          component: null as any,
          icon: 'bi-geo-alt',
          translationKey: 'WIZARD.steps.state',
          required: true
        },
        {
          stepNumber: 3,
          component: null as any,
          icon: 'bi-credit-card',
          translationKey: 'WIZARD.steps.payment',
          required: true
        },
        {
          stepNumber: 4,
          component: null as any,
          icon: 'bi-person-vcard',
          translationKey: 'WIZARD.steps.client',
          required: true
        },
        {
          stepNumber: 5,
          component: null as any,
          icon: 'bi-check-circle',
          translationKey: 'WIZARD.steps.review',
          required: true
        }
      ]
    };
  }

  /**
   * Configuración para renovación de LLC
   * Similar a apertura
   */
  private getLLCRenovacionConfig(): WizardFlowConfig {
    return {
      flowType: WizardFlowType.LLC_RENOVACION,
      totalSteps: 5,
      showStateSelection: true,
      showPayment: true,
      steps: [
        {
          stepNumber: 1,
          component: null as any,
          icon: 'bi-person-plus',
          translationKey: 'WIZARD.steps.register',
          required: true
        },
        {
          stepNumber: 2,
          component: null as any,
          icon: 'bi-geo-alt',
          translationKey: 'WIZARD.steps.state',
          required: true
        },
        {
          stepNumber: 3,
          component: null as any,
          icon: 'bi-credit-card',
          translationKey: 'WIZARD.steps.payment',
          required: true
        },
        {
          stepNumber: 4,
          component: null as any,
          icon: 'bi-person-vcard',
          translationKey: 'WIZARD.steps.client',
          required: true
        },
        {
          stepNumber: 5,
          component: null as any,
          icon: 'bi-check-circle',
          translationKey: 'WIZARD.steps.review',
          required: true
        }
      ]
    };
  }

  /**
   * Configuración para cuenta bancaria sin pago
   * Flujo: datos básicos → información → revisión → envío
   */
  private getCuentaBancariaSinPagoConfig(): WizardFlowConfig {
    return {
      flowType: WizardFlowType.CUENTA_BANCARIA_SIN_PAGO,
      totalSteps: 9,
      showStateSelection: false,
      showPayment: false,
      steps: [
        {
          stepNumber: 1,
          component: null as any,
          icon: 'bi-person-plus',
          translationKey: 'WIZARD.steps.register',
          required: true
        },
        {
          stepNumber: 2,
          component: null as any,
          icon: 'bi-person-vcard',
          translationKey: 'WIZARD.steps.client',
          required: true
        },
        {
          stepNumber: 3,
          component: null as any,
          icon: 'bi-person-vcard',
          translationKey: 'WIZARD.applicant.steps.step1',
          required: true
        },
        {
          stepNumber: 4,
          component: null as any,
          icon: 'bi-geo-alt',
          translationKey: 'WIZARD.applicant.steps.step2',
          required: true
        },
        {
          stepNumber: 5,
          component: null as any,
          icon: 'bi-bank',
          translationKey: 'WIZARD.applicant.steps.step3',
          required: true
        },
        {
          stepNumber: 6,
          component: null as any,
          icon: 'bi-geo-alt',
          translationKey: 'WIZARD.applicant.steps.step4',
          required: true
        },
        {
          stepNumber: 7,
          component: null as any,
          icon: 'bi-building',
          translationKey: 'WIZARD.applicant.steps.step5',
          required: true,
        },
        {
          stepNumber: 8,
          component: null as any,
          icon: 'bi-people',
          translationKey: 'WIZARD.applicant.steps.step6',
          required: true
        },
        {
          stepNumber: 9,
          component: null as any,
          icon: 'bi-check-circle',
          translationKey: 'WIZARD.applicant.steps.step7',
          required: true
        },
        {
          stepNumber: 10,
          component: null as any,
          icon: 'bi-check-circle',
          translationKey: 'WIZARD.steps.review',
          required: true
        }
      ]
    };
  }

  /**
   * Configuración para cuenta bancaria con pago
   * Flujo: datos básicos → pago → información → revisión
   */
  private getCuentaBancariaConPagoConfig(): WizardFlowConfig {
    return {
      flowType: WizardFlowType.CUENTA_BANCARIA_CON_PAGO,
      totalSteps: 4,
      showStateSelection: false,
      showPayment: true,
      steps: [
        {
          stepNumber: 1,
          component: null as any,
          icon: 'bi-person-plus',
          translationKey: 'WIZARD.steps.register',
          required: true
        },
        {
          stepNumber: 2,
          component: null as any,
          icon: 'bi-credit-card',
          translationKey: 'WIZARD.steps.payment',
          required: true
        },
        {
          stepNumber: 3,
          component: null as any,
          icon: 'bi-person-vcard',
          translationKey: 'WIZARD.steps.client',
          required: true
        },
        {
          stepNumber: 4,
          component: null as any,
          icon: 'bi-check-circle',
          translationKey: 'WIZARD.steps.review',
          required: true
        }
      ]
    };
  }
}
