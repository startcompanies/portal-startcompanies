import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { WizardStateService } from '../../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { StripeService } from '../../../services/stripe.service';
import { WizardPlan, WizardPlansService } from '../../../services/wizard-plans.service';

/**
 * Componente reutilizable para el paso de registro básico
 * Usado en todos los flujos
 */
@Component({
    selector: 'app-wizard-state-plan-selection-step',
    standalone: true,
    imports: [SharedModule, ReactiveFormsModule],
    templateUrl: './state-plan-selection-step.component.html',
    styleUrls: ['./state-plan-selection-step.component.css'],
})
export class WizardStatePlanSelectionStepComponent implements OnInit, OnDestroy {
    @Input() stepNumber: number = 2;
    @Input() previousStepNumber: number = 1; // Paso anterior para mostrar resumen

    // Lista completa de estados de USA (igual que en new-request)
    usStates = [
        { value: 'Alabama', label: 'Alabama', abbreviation: 'AL' },
        { value: 'Alaska', label: 'Alaska', abbreviation: 'AK' },
        { value: 'Arizona', label: 'Arizona', abbreviation: 'AZ' },
        { value: 'Arkansas', label: 'Arkansas', abbreviation: 'AR' },
        { value: 'California', label: 'California', abbreviation: 'CA' },
        { value: 'Colorado', label: 'Colorado', abbreviation: 'CO' },
        { value: 'Connecticut', label: 'Connecticut', abbreviation: 'CT' },
        { value: 'Delaware', label: 'Delaware', abbreviation: 'DE' },
        { value: 'Florida', label: 'Florida', abbreviation: 'FL' },
        { value: 'Georgia', label: 'Georgia', abbreviation: 'GA' },
        { value: 'Hawaii', label: 'Hawaii', abbreviation: 'HI' },
        { value: 'Idaho', label: 'Idaho', abbreviation: 'ID' },
        { value: 'Illinois', label: 'Illinois', abbreviation: 'IL' },
        { value: 'Indiana', label: 'Indiana', abbreviation: 'IN' },
        { value: 'Iowa', label: 'Iowa', abbreviation: 'IA' },
        { value: 'Kansas', label: 'Kansas', abbreviation: 'KS' },
        { value: 'Kentucky', label: 'Kentucky', abbreviation: 'KY' },
        { value: 'Louisiana', label: 'Louisiana', abbreviation: 'LA' },
        { value: 'Maine', label: 'Maine', abbreviation: 'ME' },
        { value: 'Maryland', label: 'Maryland', abbreviation: 'MD' },
        { value: 'Massachusetts', label: 'Massachusetts', abbreviation: 'MA' },
        { value: 'Michigan', label: 'Michigan', abbreviation: 'MI' },
        { value: 'Minnesota', label: 'Minnesota', abbreviation: 'MN' },
        { value: 'Mississippi', label: 'Mississippi', abbreviation: 'MS' },
        { value: 'Missouri', label: 'Missouri', abbreviation: 'MO' },
        { value: 'Montana', label: 'Montana', abbreviation: 'MT' },
        { value: 'Nebraska', label: 'Nebraska', abbreviation: 'NE' },
        { value: 'Nevada', label: 'Nevada', abbreviation: 'NV' },
        { value: 'New Hampshire', label: 'New Hampshire', abbreviation: 'NH' },
        { value: 'New Jersey', label: 'New Jersey', abbreviation: 'NJ' },
        { value: 'New Mexico', label: 'New Mexico', abbreviation: 'NM' },
        { value: 'New York', label: 'New York', abbreviation: 'NY' },
        { value: 'North Carolina', label: 'North Carolina', abbreviation: 'NC' },
        { value: 'North Dakota', label: 'North Dakota', abbreviation: 'ND' },
        { value: 'Ohio', label: 'Ohio', abbreviation: 'OH' },
        { value: 'Oklahoma', label: 'Oklahoma', abbreviation: 'OK' },
        { value: 'Oregon', label: 'Oregon', abbreviation: 'OR' },
        { value: 'Pennsylvania', label: 'Pennsylvania', abbreviation: 'PA' },
        { value: 'Rhode Island', label: 'Rhode Island', abbreviation: 'RI' },
        { value: 'South Carolina', label: 'South Carolina', abbreviation: 'SC' },
        { value: 'South Dakota', label: 'South Dakota', abbreviation: 'SD' },
        { value: 'Tennessee', label: 'Tennessee', abbreviation: 'TN' },
        { value: 'Texas', label: 'Texas', abbreviation: 'TX' },
        { value: 'Utah', label: 'Utah', abbreviation: 'UT' },
        { value: 'Vermont', label: 'Vermont', abbreviation: 'VT' },
        { value: 'Virginia', label: 'Virginia', abbreviation: 'VA' },
        { value: 'Washington', label: 'Washington', abbreviation: 'WA' },
        { value: 'West Virginia', label: 'West Virginia', abbreviation: 'WV' },
        { value: 'Wisconsin', label: 'Wisconsin', abbreviation: 'WI' },
        { value: 'Wyoming', label: 'Wyoming', abbreviation: 'WY' },
        { value: 'District of Columbia', label: 'District of Columbia', abbreviation: 'DC' },
    ];
    
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
                // Emprendedor: estado siempre New Mexico (por si se restauró sin estado)
                const planObj = this.wizardPlansService.getPlan(savedData.plan);
                if (planObj && !planObj.states.includes('all') && planObj.states.length === 1 && !savedData.state) {
                    const autoState = planObj.states[0];
                    this.selectedState = autoState;
                    this.form.get('state')?.setValue(autoState);
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
     * Guarda los datos del paso
     */
    private saveStepData(): void {
        if (this.form.valid) {
            this.wizardStateService.setStepData(this.stepNumber, this.form.value);
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
            // Emprendedor: siempre New Mexico. Premium: solo NM o Wyoming. Elite: cualquier estado.
            if (!selectedPlanObj.states.includes('all') && selectedPlanObj.states.length === 1) {
                const autoState = selectedPlanObj.states[0];
                this.selectedState = autoState;
                this.form.get('state')?.setValue(autoState);
                this.stripeService.setState(autoState);
            } else {
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
