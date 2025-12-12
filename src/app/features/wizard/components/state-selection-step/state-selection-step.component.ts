import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { SafeStorageService } from '../../../../shared/services/safe-storage.service';
import { WizardStateService } from '../../../../shared/services/wizard-state.service';
import { Subscription } from 'rxjs';

/**
 * Componente reutilizable para la selección de estado
 * Usado en flujos que requieren selección de estado/precio
 */
@Component({
  selector: 'app-wizard-state-selection-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './state-selection-step.component.html',
  styleUrls: ['./state-selection-step.component.css']
})
export class WizardStateSelectionStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 2;
  
  form!: FormGroup;
  states = ['Florida', 'Delaware', 'Texas', 'Wyoming'];
  private formSubscription?: Subscription;

  constructor(
    private storage: SafeStorageService,
    private wizardStateService: WizardStateService
  ) {
    // Cargar datos guardados si existen
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    
    this.form = new FormGroup({
      state: new FormControl(savedData.state || '', Validators.required),
      service: new FormControl(savedData.service || ''),
    });
  }

  ngOnInit(): void {
    // Cargar plan seleccionado desde storage
    const selectedPlan = this.storage.getItem('selectedPlan');
    if (selectedPlan) {
      this.form.get('service')?.setValue(selectedPlan);
    }

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });

    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
    }
  }

  ngOnDestroy(): void {
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
}
