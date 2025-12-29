import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { WizardStateService } from '../../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-company-address-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  templateUrl: './company-address-step.component.html',
  styleUrl: './company-address-step.component.css'
})
export class CompanyAddressStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 4;
  form!: FormGroup;
  private formSubscription?: Subscription;
  
  constructor(
    private wizardStateService: WizardStateService
  ) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber) || {};

    this.form = new FormGroup({
      companyAddress: new FormGroup({
        street: new FormControl(
          savedData.companyAddress?.street || '',
          [Validators.required, Validators.maxLength(255)]
        ),
        unit: new FormControl(
          savedData.companyAddress?.unit || '',
          Validators.maxLength(255)
        ),
        city: new FormControl(
          savedData.companyAddress?.city || '',
          [Validators.required, Validators.maxLength(100)]
        ),
        state: new FormControl(
          savedData.companyAddress?.state || '',
          Validators.required
        ),
        postalCode: new FormControl(
          savedData.companyAddress?.postalCode || '',
          [Validators.required, Validators.maxLength(20)]
        ),
        country: new FormControl(
          savedData.companyAddress?.country || 'Estados Unidos',
          Validators.required
        )
      }),

      isRegisteredAgentInUSA: new FormControl(
        savedData.isRegisteredAgentInUSA ?? true,
        Validators.required
      ),

      registeredAgentName: new FormControl(
        savedData.registeredAgentName || '',
        [Validators.required, Validators.maxLength(255)]
      ),

      registeredAgentAddress: new FormControl(
        savedData.registeredAgentAddress || '',
        [Validators.required, Validators.maxLength(1000)]
      )
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
