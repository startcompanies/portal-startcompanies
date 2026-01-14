import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../../../shared/services/wizard-state.service';
import { Subscription } from 'rxjs';

/**
 * Formulario específico para el flujo de renovación de LLC
 */
@Component({
  selector: 'app-client-form-renovacion',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './client-form-renovacion.component.html',
  styleUrls: ['./client-form-renovacion.component.css']
})
export class ClientFormRenovacionComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 4;
  
  form!: FormGroup;
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService
  ) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    
    this.form = new FormGroup({
      fullName: new FormControl(savedData.fullName || '', Validators.required),
      phone: new FormControl(savedData.phone || '', Validators.required),
      address: new FormControl(savedData.address || '', Validators.required),
      // Campos específicos de renovación
      existingLLCNumber: new FormControl(savedData.existingLLCNumber || '', Validators.required),
      renewalDate: new FormControl(savedData.renewalDate || '', Validators.required),
    });
  }

  ngOnInit(): void {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
    }

    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }
}
