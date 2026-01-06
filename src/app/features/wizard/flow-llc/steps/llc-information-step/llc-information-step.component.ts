import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../../services/wizard-state.service';
import { Subscription } from 'rxjs';


/**
 * Componente reutilizable para el paso de registro básico
 * Usado en todos los flujos
 */
@Component({
    selector: 'app-wizard-llc-information-step',
    standalone: true,
    imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
    templateUrl: './llc-information-step.component.html',
    styleUrls: ['./llc-information-step.component.css']
})
export class WizardLlcInformationStepComponent implements OnInit, OnDestroy {
    @Input() stepNumber: number = 4;
    @Input() previousStepNumber: number = 3; // Paso anterior para mostrar resumen

    states = ['Florida', 'Delaware', 'Texas', 'Wyoming'];
    structureTypes = ['Single Member', 'Multi Member'];
    form!: FormGroup;
    showFormInfo = true;
    members = [];
    private formSubscription?: Subscription;

    constructor(
        private wizardStateService: WizardStateService
    ) {
        // Cargar datos guardados si existen
        const savedData = this.wizardStateService.getStepData(this.stepNumber);

        /**
         * CAMPOS OPCIONALES - Se puede navegar sin completar todos los campos
         * - nameOne: Primera opción de nombre de LLC (opcional)
         * - nameTwo: Segunda opción de nombre de LLC (opcional)
         * - nameThree: Tercera opción de nombre de LLC (opcional)
         * - state: Estado corporativo (opcional) - Valores: 'Florida', 'Delaware', 'Texas', 'Wyoming'
         * - mainActivity: Actividad principal de la LLC (opcional)
         * - structureType: Tipo de estructura (opcional) - Valores: 'Single Member', 'Multi Member'
         * - linkedinProfile: Perfil de LinkedIn (opcional)
         * 
         * NOTA: Los campos ya no son obligatorios para navegar entre pasos.
         */
        this.form = new FormGroup({
            nameOne: new FormControl(savedData.nameOne || ''),
            nameTwo: new FormControl(savedData.nameTwo || ''),
            nameThree: new FormControl(savedData.nameThree || ''),
            state: new FormControl(savedData.state || ''),
            mainActivity: new FormControl(savedData.mainActivity || ''),
            structureType: new FormControl(savedData.structureType || ''),
            linkedinProfile: new FormControl(savedData.linkedinProfile || ''),
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

        this.wizardStateService.hideNextButton();
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

    goToNextStep(): void {
        this.showFormInfo = false;
        this.wizardStateService.showNextButton();
    }

    goToPreviousStep(): void {
        this.showFormInfo = true;
        this.wizardStateService.hideNextButton();
    }

    addMember(): void {
        const currentValue = this.form.get('structureType')?.value;
        if (currentValue === 'Single Member') {
            this.form.get('structureType')?.setValue('Multi Member');
        }
    }

    removeMember(): void {
        const currentValue = this.form.get('structureType')?.value;
        if (currentValue === 'Multi Member') {
            this.form.get('structureType')?.setValue('Single Member');
        }
    }


}
