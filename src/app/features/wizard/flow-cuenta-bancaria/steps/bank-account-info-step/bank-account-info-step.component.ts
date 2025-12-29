import { Component, Input } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { Subscription } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WizardStateService } from '../../../services/wizard-state.service';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-bank-account-info-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  templateUrl: './bank-account-info-step.component.html',
  styleUrl: './bank-account-info-step.component.css'
})
export class BankAccountInfoStepComponent {
  @Input() stepNumber: number = 3;

  form!: FormGroup;
  private formSubscription?: Subscription;

  constructor(private wizardStateService: WizardStateService) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber) || {};

    this.form = new FormGroup({
      bankName: new FormControl(savedData.bankName || '', Validators.required),

      swiftBicAba: new FormControl(
        savedData.swiftBicAba || '',
        [Validators.required, Validators.maxLength(50)]
      ),

      accountNumber: new FormControl(
        savedData.accountNumber || '',
        [Validators.required, Validators.maxLength(100)]
      ),

      bankAccountType: new FormControl(
        savedData.bankAccountType || '',
        Validators.required
      ),

      firstRegistrationDate: new FormControl(
        savedData.firstRegistrationDate || '',
        Validators.required
      ),

      hasLitigatedCurrentFiscalYear: new FormControl(
        savedData.hasLitigatedCurrentFiscalYear ?? false,
        Validators.required
      ),

      litigationDetails: new FormControl(
        savedData.litigationDetails || ''
      )
    });
  }

  ngOnInit(): void {
    this.toggleLitigationValidators(
      this.form.get('hasLitigatedCurrentFiscalYear')?.value
    );

    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.toggleLitigationValidators(
        this.form.get('hasLitigatedCurrentFiscalYear')?.value
      );
      this.saveStepData();
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  private toggleLitigationValidators(hasLitigated: boolean): void {
    const control = this.form.get('litigationDetails');

    if (!control) return;

    if (hasLitigated) {
      control.setValidators([Validators.required, Validators.maxLength(1000)]);
    } else {
      control.clearValidators();
      control.setValue('');
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }

}
