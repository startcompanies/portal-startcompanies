import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { WizardStateService } from '../../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-company-address-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './company-address-step.component.html',
  styleUrl: './company-address-step.component.css'
})
export class CompanyAddressStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 4;
  form!: FormGroup;
  private formSubscription?: Subscription;
  private registeredAgentSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService
  ) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber) || {};
    const isRegisteredAgent = savedData.isRegisteredAgentInUSA === 'true' || savedData.isRegisteredAgentInUSA === true;

    this.form = new FormGroup({
      street: new FormControl(savedData.street || '', Validators.required),
      unit: new FormControl(savedData.unit || '', Validators.required),
      city: new FormControl(savedData.city || '', Validators.required),
      state: new FormControl(savedData.state || '', Validators.required),
      postalCode: new FormControl(savedData.postalCode || '', Validators.required),
      country: new FormControl(savedData.country || '', Validators.required),
      isRegisteredAgentInUSA: new FormControl(savedData.isRegisteredAgentInUSA || 'false', Validators.required),
      registeredAgentName: new FormControl(savedData.registeredAgentName || '', isRegisteredAgent ? Validators.required : null),
      registeredAgentAddress: new FormControl(savedData.registeredAgentAddress || '', isRegisteredAgent ? Validators.required : null),
    });
  }

  ngOnInit(): void {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
    }

    // Aplicar validadores iniciales
    const initialValue = this.form.get('isRegisteredAgentInUSA')?.value;
    this.toggleRegisteredAgentValidators(
      initialValue === 'true' || initialValue === true
    );

    // Suscribirse solo a cambios en isRegisteredAgentInUSA para evitar bucles
    this.registeredAgentSubscription = this.form.get('isRegisteredAgentInUSA')?.valueChanges.subscribe((value) => {
      const isRegisteredAgent = value === 'true' || value === true;
      this.toggleRegisteredAgentValidators(isRegisteredAgent);
    });

    // Suscripción separada para guardar datos
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });
  }

  private toggleRegisteredAgentValidators(isRegisteredAgent: boolean): void {
    const nameControl = this.form.get('registeredAgentName');
    const addressControl = this.form.get('registeredAgentAddress');

    if (!nameControl || !addressControl) return;

    if (isRegisteredAgent) {
      nameControl.setValidators([Validators.required, Validators.maxLength(255)]);
      addressControl.setValidators([Validators.required, Validators.maxLength(1000)]);
    } else {
      nameControl.clearValidators();
      addressControl.clearValidators();
      // Limpiar valores sin emitir eventos para evitar bucles
      nameControl.setValue('', { emitEvent: false });
      addressControl.setValue('', { emitEvent: false });
    }

    nameControl.updateValueAndValidity({ emitEvent: false });
    addressControl.updateValueAndValidity({ emitEvent: false });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.registeredAgentSubscription?.unsubscribe();
    this.saveStepData();
  }

  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }
}
