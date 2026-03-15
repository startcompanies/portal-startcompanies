import { Injectable } from '@angular/core';

export interface WizardPlan {
  value: 'Entrepreneur' | 'Elite' | 'Premium' | string;
  label: string;
  price: number;
  /**
   * Estados permitidos. Usar ['all'] para permitir cualquier estado.
   */
  states: string[];
  recommended: boolean;
  description: string;
  subtitle: string;
  features: string[];
  renewalFeatures?: string[];
}

export type RenewalLlcType = 'single' | 'multi';

export interface RenewalPricingResult {
  amount: number | null;
  supported: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WizardPlansService {
  /**
   * Reglas por plan (Apertura LLC):
   * - Emprendedor: estado siempre New Mexico; estructura siempre Single Member.
   * - Elite: estado según selección del usuario; estructura societaria seleccionable (single/multi).
   * - Premium: estado solo NM o Wyoming; estructura siempre Single Member.
   */
  private readonly plans: WizardPlan[] = [
    {
      value: 'Entrepreneur',
      label: 'Pack Emprendedor',
      price: 499,
      states: ['New Mexico'],
      recommended: true,
      description: 'Ideal para freelancers y startups sin presencia en EE.UU.',
      subtitle: 'LLC en Nuevo México (Single Member)',
      features: [
        'Documentación completa: Artículos de organización, Operating Agreement, EIN.',
        'Consulta gratuita de planificación fiscal.',
        'Apertura de cuenta bancaria en EE.UU. garantizada en 7 días.',
        'Dirección fiscal y social en para apertura bancaria.',
        'Registered Agent - R.A.',
        'Asistencia con la implementación de sistemas de ventas como Stripe.',
        'Asesoría general sobre obligaciones legales de la LLC.',
        'E-book con información sobre LLCs.'
      ]
    },
    {
      value: 'Elite',
      label: 'Pack Elite',
      price: 600,
      states: ['all'],
      recommended: false,
      description: 'Ideal para quienes tienen presencia física en EE.UU.',
      subtitle: 'LLC en cualquier estado (Single Member o Partnership)',
      features: [
        'Documentación completa: Artículos de organización, Operating Agreement, EIN.',
        'Consulta gratuita de planificación fiscal.',
        'Apertura de cuenta bancaria en EE.UU. garantizada en 7 días.',
        'Dirección fiscal y social en para apertura bancaria.',
        'Registered Agent - R.A.',
        'Asistencia con la implementación de sistemas de ventas como Stripe.',
        'Asesoría general sobre obligaciones legales de la LLC.',
        'E-book con información sobre LLCs.'
      ]
    },
    {
      value: 'Premium',
      label: 'Pack Premium',
      price: 999,
      states: ['New Mexico', 'Wyoming'],
      recommended: false,
      description: 'Solución integral con soporte fiscal y renovación automática.',
      subtitle: 'Solo NM o Wyoming (Single Member)',
      features: [
        'Documentación completa: Artículos de organización, Operating Agreement, EIN.',
        'Consulta gratuita de planificación fiscal.',
        'Apertura de cuenta bancaria en EE.UU. garantizada en 7 días.',
        'Dirección fiscal y social en para apertura bancaria.',
        'Registered Agent - R.A.',
        'Asistencia con la implementación de sistemas de ventas como Stripe.',
        'Asesoría general sobre obligaciones legales de la LLC.',
        'E-book con información sobre LLCs.'
      ],
      renewalFeatures: [
        'Pago de fee al Estado (cumplimiento federal)',
        'Renovación de Registered Agent',
        'Presentación de Form 1120+5472 o 1065'
      ]
    }
  ];

  /**
   * Renovación LLC: tabla de precios por estado + tipo de LLC
   */
  private readonly renewalPriceTable: Record<string, { single: number; multi: number }> = {
    'New Mexico': { single: 500, multi: 600 },
    'Florida': { single: 600, multi: 700 },
    'Wyoming': { single: 600, multi: 700 },
    'Delaware': { single: 950, multi: 950 },
    'Texas': { single: 750, multi: 750 },
    'Nevada': { single: 600, multi: 650 },
  };

  /**
   * Cuenta bancaria: precio fijo cuando aplica pago
   */
  private readonly bankAccountFixedAmountUsd = 99;

  getPlans(): WizardPlan[] {
    return this.plans;
  }

  getPlan(planValue: string | null | undefined): WizardPlan | undefined {
    if (!planValue) return undefined;
    return this.plans.find(p => p.value === planValue);
  }

  /**
   * Calcula el monto según el plan (consistente con /planes).
   */
  calculateAmount(planValue: string | null | undefined): number {
    const plan = this.getPlan(planValue);
    return plan?.price ?? 0;
  }

  /**
   * Obtiene un label amigable para mostrar en UI en base al "value" del plan.
   * Si no encuentra el plan, retorna el mismo value.
   */
  getPlanDisplayLabel(planValue: string | null | undefined): string {
    if (!planValue) return '';
    return this.getPlan(planValue)?.label ?? planValue;
  }

  /**
   * Retorna estados específicos del plan. Si el plan permite todos (['all']), retorna [].
   */
  getSelectedPlanStates(planValue: string | null | undefined): string[] {
    const plan = this.getPlan(planValue);
    if (!plan) return [];
    if (plan.states.includes('all')) return [];
    return plan.states;
  }

  /**
   * Indica si un estado está disponible según el plan seleccionado.
   */
  isStateAvailable(planValue: string | null | undefined, stateValue: string): boolean {
    const plan = this.getPlan(planValue);
    if (!plan) return true;
    if (plan.states.includes('all')) return true;
    return plan.states.includes(stateValue);
  }

  /**
   * Filtra una lista de estados (objetos) según el plan.
   * Si el plan permite todos los estados, retorna la lista completa.
   */
  filterAvailableStates<T extends { value: string }>(planValue: string | null | undefined, usStates: T[]): T[] {
    const plan = this.getPlan(planValue);
    if (!plan) return usStates;
    if (plan.states.includes('all')) return usStates;
    return usStates.filter(s => plan.states.includes(s.value));
  }

  /**
   * Renovación LLC: estados soportados para cotización directa.
   */
  getRenewalStates(): string[] {
    return Object.keys(this.renewalPriceTable);
  }

  /**
   * Renovación LLC: calcula el monto por estado + tipo.
   */
  calculateRenewalAmount(state: string | null | undefined, llcType: RenewalLlcType | '' | null | undefined): RenewalPricingResult {
    if (!state || !llcType) return { amount: null, supported: true };
    const prices = this.renewalPriceTable[state];
    if (!prices) return { amount: null, supported: false };
    return { amount: prices[llcType], supported: true };
  }

  /**
   * Cuenta bancaria: monto fijo (USD) cuando aplica pago.
   */
  getBankAccountFixedAmountUsd(): number {
    return this.bankAccountFixedAmountUsd;
  }

  /**
   * Etiquetas por tipo de servicio (para mostrar en el resumen de pago cuando no hay "plan").
   */
  getServiceLabel(serviceType: string | null | undefined): string {
    if (serviceType === 'renovacion-llc') return 'Renovación de LLC';
    if (serviceType === 'cuenta-bancaria') return 'Cuenta Bancaria';
    if (serviceType === 'apertura-llc') return 'Apertura de LLC';
    return '';
  }
}

