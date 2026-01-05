import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { WizardStateService } from '../../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { StripeService } from '../../../services/stripe.service';

/**
 * Componente reutilizable para el paso de registro básico
 * Usado en todos los flujos
 */
@Component({
    selector: 'app-wizard-state-plan-selection-step',
    standalone: true,
    imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
    templateUrl: './state-plan-selection-step.component.html',
    styleUrls: ['./state-plan-selection-step.component.css'],
})
export class WizardStatePlanSelectionStepComponent implements OnInit, OnDestroy {
    @Input() stepNumber: number = 2;
    @Input() previousStepNumber: number = 1; // Paso anterior para mostrar resumen

    states = ['Florida', 'Delaware', 'Texas', 'Wyoming'];
    planes = ['Entrepreneur', 'Elite', 'Premium'];
    selectedState: string | null = null;


    form!: FormGroup;
    private formSubscription?: Subscription;

    constructor(
        private wizardStateService: WizardStateService,
        private stripeService: StripeService,
        private transloco: TranslocoService
    ) {
        // Cargar datos guardados si existen
        const savedData = this.wizardStateService.getStepData(this.stepNumber);

        this.form = new FormGroup({
            plan: new FormControl(savedData.plan || '', [Validators.required]),
            state: new FormControl(savedData.state || '', [])
        });
    }

    ngOnInit(): void {

        this.wizardStateService.registerForm(this.stepNumber, this.form);
        // Cargar datos guardados
        const savedData = this.wizardStateService.getStepData(this.stepNumber);
        if (savedData && Object.keys(savedData).length > 0) {
            this.form.patchValue(savedData);
        }

        // Guardar datos cuando el formulario cambia
        this.formSubscription = this.form.valueChanges.subscribe(() => {
            this.saveStepData();
        });
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

    selectState(state: string) {
        this.selectedState = state;
        this.form.get('state')?.setValue(null);

        if (state === 'new_mexico') {
            this.stripeService.setState(this.transloco.translate('WIZARD.state_plan_step.options.new_mexico'));
        } else if (state === 'texas') {
            this.stripeService.setState(this.transloco.translate('WIZARD.state_plan_step.options.texas'));
        }
    }

    changeState() {
        this.selectedState = null;
        this.stripeService.setState(this.form.get('state')?.value);
    }

    changePlan() {
        this.stripeService.setPackId(this.form.get('plan')?.value);
    }
}
