import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../../../shared/services/wizard-state.service';
import { Subscription } from 'rxjs';

/**
 * Componente reutilizable para el paso de revisión final
 * Usado en todos los flujos
 */
@Component({
  selector: 'app-wizard-final-review-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './final-review-step.component.html',
  styleUrls: ['./final-review-step.component.css']
})
export class WizardFinalReviewStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 5;
  @Input() previousSteps: number[] = [1, 2, 3, 4]; // Números de pasos anteriores a mostrar
  
  form!: FormGroup;
  previousStepsData: any[] = [];
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService
  ) {
    // Cargar datos guardados si existen
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    
    this.form = new FormGroup({
      confirm: new FormControl(savedData.confirm || false, [Validators.requiredTrue]),
    });
  }

  ngOnInit(): void {
    // Cargar datos de pasos anteriores
    this.loadPreviousStepsData();

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
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  /**
   * Carga los datos de los pasos anteriores
   */
  private loadPreviousStepsData(): void {
    this.previousStepsData = this.previousSteps
      .map(stepNum => this.wizardStateService.getStepData(stepNum))
      .filter(data => data && Object.keys(data).length > 0);
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
