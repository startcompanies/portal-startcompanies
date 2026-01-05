import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';
import { Subscription } from 'rxjs';

/**
 * Componente reutilizable para el paso de registro básico
 * Usado en todos los flujos
 */
@Component({
  selector: 'app-wizard-basic-register-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './basic-register-step.component.html',
  styleUrls: ['./basic-register-step.component.css']
})
export class WizardBasicRegisterStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 1;

  form!: FormGroup;
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService
  ) {
    // Cargar datos guardados si existen
    const savedData = this.wizardStateService.getStepData(this.stepNumber);

    this.form = new FormGroup({
      fullName: new FormControl(savedData.fullName || '', [Validators.required]),
      phone: new FormControl(savedData.phone || '', [Validators.required]),
      email: new FormControl(savedData.email || '', [Validators.required, Validators.email]),
      password: new FormControl(savedData.password || '', Validators.required),
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
}
