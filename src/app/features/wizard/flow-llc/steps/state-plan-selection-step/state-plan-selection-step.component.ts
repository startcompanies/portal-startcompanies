import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { StripeService } from '../../../services/stripe.service';
import { WizardPlan, WizardPlansService } from '../../../services/wizard-plans.service';
import { US_STATES } from '../../../../../shared/constants/us-states.constant';

/**
 * Componente reutilizable para el paso de registro básico
 * Usado en todos los flujos
 */
@Component({
    selector: 'app-wizard-state-plan-selection-step',
    standalone: true,
    imports: [SharedModule, ReactiveFormsModule, TranslocoPipe],
    templateUrl: './state-plan-selection-step.component.html',
    styleUrls: ['./state-plan-selection-step.component.css'],
})
export class WizardStatePlanSelectionStepComponent implements OnInit, OnDestroy {
    @Input() stepNumber: number = 2;
    @Input() previousStepNumber: number = 1; // Paso anterior para mostrar resumen

    // Lista completa de estados de USA (igual que en new-request)
    usStates = US_STATES;
    
    // Planes disponibles (centralizados en WizardPlansService)
    planes: WizardPlan[] = [];
    
    
    selectedState: string | null = null;
    selectedPlan: string | null = null;
    calculatedAmount: number = 0;


    form!: FormGroup;
    private formSubscription?: Subscription;

    constructor(
        private wizardStateService: WizardStateService,
        private stripeService: StripeService,
        private wizardPlansService: WizardPlansService
    ) {
        this.planes = this.wizardPlansService.getPlans();
        // Cargar datos guardados si existen
        const savedData = this.wizardStateService.getStepData(this.stepNumber);

        /**
         * CAMPOS OPCIONALES - Se puede navegar sin completar todos los campos
         * - plan: Plan seleccionado (opcional) - Valores: 'Entrepreneur', 'Elite', 'Premium'
         * - state: Estado seleccionado (opcional) - Lista de estados de USA
         * 
         * NOTA: Los campos ya no son obligatorios para navegar entre pasos.
         */
        this.form = new FormGroup({
            plan: new FormControl(savedData.plan || ''),
            state: new FormControl(savedData.state || ''),
        });
    }

    ngOnInit(): void {
        this.wizardStateService.registerForm(this.stepNumber, this.form);
        // Cargar datos guardados
        const savedData = this.wizardStateService.getStepData(this.stepNumber);
        if (savedData && Object.keys(savedData).length > 0) {
            this.form.patchValue(savedData);
            if (savedData.state) {
                this.selectedState = savedData.state;
            }
            if (savedData.plan) {
                this.selectedPlan = savedData.plan;
                const planObj = this.wizardPlansService.getPlan(savedData.plan);
                // Pack Emprendedor: estado siempre New Mexico y deshabilitado
                if (planObj && !planObj.states.includes('all') && planObj.states.length === 1) {
                    const autoState = planObj.states[0];
                    this.selectedState = autoState;
                    this.form.get('state')?.setValue(autoState);
                    this.form.get('state')?.disable();
                }
            }
        }

        // Guardar datos cuando el formulario cambia
        this.formSubscription = this.form.valueChanges.subscribe(() => {
            this.saveStepData();
            this.calculateAmount();
        });
        
        // Calcular monto inicial
        this.calculateAmount();
    }

    ngOnDestroy(): void {
        this.wizardStateService.unregisterForm(this.stepNumber);
        this.formSubscription?.unsubscribe();
        this.saveStepData();
    }

    /**
     * Guarda los datos del paso (getRawValue incluye controles deshabilitados, p. ej. state en Pack Emprendedor)
     */
    private saveStepData(): void {
        const raw = this.form.getRawValue();
        if (raw.plan) {
            this.wizardStateService.setStepData(this.stepNumber, raw);
        }
    }

    isValid(): boolean {
        return this.form.valid;
    }

    markAsTouched(): void {
        this.form.markAllAsTouched();
    }

    /**
     * Calcula el monto según el plan y estado seleccionado
     */
    calculateAmount(): void {
        const plan = this.form.get('plan')?.value;
        const state = this.selectedState || this.form.get('state')?.value;

        if (!plan || !state) {
            this.calculatedAmount = 0;
            return;
        }

        // El monto a pagar debe ser consistente con los precios mostrados en /planes.
        // Por eso se calcula por plan (no por estado).
        this.calculatedAmount = this.wizardPlansService.calculateAmount(plan);
        
        // Guardar monto en el estado del wizard
        this.wizardStateService.setStepData(this.stepNumber, {
            ...this.form.value,
            state: state,
            amount: this.calculatedAmount
        });
    }

    selectPlan(planValue: string): void {
        this.form.get('plan')?.setValue(planValue);
        this.selectedPlan = planValue;
        this.stripeService.setPackId(planValue);
        
        const selectedPlanObj = this.wizardPlansService.getPlan(planValue);
        if (selectedPlanObj) {
            // Pack Emprendedor: estado fijo New Mexico, deshabilitar selector
            if (!selectedPlanObj.states.includes('all') && selectedPlanObj.states.length === 1) {
                const autoState = selectedPlanObj.states[0];
                this.selectedState = autoState;
                this.form.get('state')?.setValue(autoState);
                this.form.get('state')?.disable(); // No editable para Pack Emprendedor
                this.stripeService.setState(autoState);
            } else {
                this.form.get('state')?.enable();
                // Validar si el estado actual es compatible con el plan seleccionado
                const currentState = this.selectedState || this.form.get('state')?.value;
                if (currentState) {
                    // Si el plan solo permite estados específicos y el estado actual no está en la lista
                    if (!selectedPlanObj.states.includes('all') && !selectedPlanObj.states.includes(currentState)) {
                        // Limpiar el estado seleccionado porque no es compatible
                        this.selectedState = null;
                        this.form.get('state')?.setValue('');
                        this.stripeService.setState('');
                    }
                }
            }
        }
        
        this.calculateAmount();
    }

    selectState(state: string) {
        // Validar que el estado sea compatible con el plan seleccionado
        const plan = this.form.get('plan')?.value;
        if (plan) {
            if (!this.wizardPlansService.isStateAvailable(plan, state)) {
                console.warn(`El estado ${state} no está disponible para el plan ${plan}`);
                return; // No permitir seleccionar este estado
            }
        }

        //Quitar el requerido del campo state al seleccionar un estado predefinido
        this.form.get('state')?.clearValidators();
        this.form.get('state')?.updateValueAndValidity();

        this.selectedState = state;
        this.form.get('state')?.setValue(state);

        this.stripeService.setState(state);
        this.calculateAmount();
    }

    changeState() {
        const stateValue = this.form.get('state')?.value;
        if (stateValue) {
            // Validar que el estado sea compatible con el plan seleccionado
            const plan = this.form.get('plan')?.value;
            if (plan) {
                if (!this.wizardPlansService.isStateAvailable(plan, stateValue)) {
                    console.warn(`El estado ${stateValue} no está disponible para el plan ${plan}`);
                    this.form.get('state')?.setValue(''); // Limpiar el valor
                    return;
                }
            }
            
            this.selectedState = stateValue;
            this.stripeService.setState(stateValue);
            this.calculateAmount();
        }
    }

    changePlan() {
        const planValue = this.form.get('plan')?.value;
        this.selectedPlan = planValue;
        this.stripeService.setPackId(planValue);
        this.calculateAmount();
    }

    getStateLabel(state: any): string {
        if (typeof state === 'string') {
            // Si es string, buscar en usStates
            const stateObj = this.usStates.find(s => s.value.toLowerCase() === state.toLowerCase());
            return stateObj ? `${stateObj.label} (${stateObj.abbreviation})` : state;
        }
        // Si ya es objeto
        return `${state.label} (${state.abbreviation})`;
    }

    /**
     * Obtiene los estados del plan seleccionado
     * Retorna los nombres de los estados disponibles (no 'all')
     */
    getSelectedPlanStates(): string[] {
        const plan = this.form.get('plan')?.value;
        return this.wizardPlansService.getSelectedPlanStates(plan);
    }

    /**
     * Verifica si un estado está disponible según el plan seleccionado
     */
    isStateAvailable(stateValue: string): boolean {
        const plan = this.form.get('plan')?.value;
        return this.wizardPlansService.isStateAvailable(plan, stateValue);
    }

    /**
     * Obtiene los estados disponibles según el plan seleccionado
     */
    getAvailableStates(): any[] {
        const plan = this.form.get('plan')?.value;
        return this.wizardPlansService.filterAvailableStates(plan, this.usStates);
    }

    /**
     * Texto para el tooltip del icono de información del plan
     */
    getPlanTooltip(plan: WizardPlan): string {
        const parts = [plan.description];
        if (plan.subtitle) parts.push(plan.subtitle);
        return parts.join(' · ');
    }
}
