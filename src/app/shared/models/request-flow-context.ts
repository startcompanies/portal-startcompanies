import { Type } from '@angular/core';

/**
 * Contexto del flujo de solicitud
 */
export enum RequestFlowContext {
  WIZARD = 'wizard',           // Cliente final sin autenticar
  PANEL_CLIENT = 'panel-client', // Cliente autenticado en panel
  PANEL_PARTNER = 'panel-partner' // Partner creando para cliente
}

/**
 * Pasos posibles en el flujo de solicitud
 */
export enum RequestFlowStep {
  REGISTER = 'register',
  EMAIL_VERIFICATION = 'email-verification',
  SERVICE_TYPE_SELECTION = 'service-type-selection', // Selección de tipo de servicio (panel)
  CLIENT_ASSOCIATION = 'client-association', // Para panel-cliente
  CLIENT_SELECTION = 'client-selection',     // Para panel-partner
  PLAN_STATE_SELECTION = 'plan-state-selection', // Para apertura-llc (estado + plan)
  STATE_SELECTION = 'state-selection',       // Para renovacion-llc (solo estado)
  PAYMENT = 'payment',
  SERVICE_FORM = 'service-form',
  CONFIRMATION = 'confirmation'
}

/**
 * Configuración de un paso del flujo
 */
export interface FlowStepConfig {
  step: RequestFlowStep;
  required: boolean;
  component: Type<any>;
  order: number;
  label?: string;
  icon?: string;
}

/**
 * Tipo de servicio disponible
 */
export type ServiceType = 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
