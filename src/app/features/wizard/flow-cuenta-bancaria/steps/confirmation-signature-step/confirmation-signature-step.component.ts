import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WizardStateService } from '../../../services/wizard-state.service';

@Component({
  selector: 'app-confirmation-signature-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  templateUrl: './confirmation-signature-step.component.html',
  styleUrl: './confirmation-signature-step.component.css'
})
export class ConfirmationSignatureStepComponent implements OnInit, OnDestroy {

  @Input() stepNumber: number = 7;

  form!: FormGroup;
  private formSubscription?: Subscription;

  constructor(private wizardStateService: WizardStateService) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);

    this.form = new FormGroup({
      documentCertification: new FormControl(
        savedData?.documentCertification || '',
        [Validators.required, Validators.maxLength(2000)]
      ),
      acceptsTermsAndConditions: new FormControl(
        savedData?.acceptsTermsAndConditions || false,
        Validators.requiredTrue
      ),
      bankAccountValidator: new FormGroup({
        firstName: new FormControl(
          savedData?.bankAccountValidator?.firstName || '',
          [Validators.required, Validators.maxLength(255)]
        ),
        lastName: new FormControl(
          savedData?.bankAccountValidator?.lastName || '',
          [Validators.required, Validators.maxLength(255)]
        ),
        dateOfBirth: new FormControl(
          savedData?.bankAccountValidator?.dateOfBirth || '',
          Validators.required
        ),
        nationality: new FormControl(
          savedData?.bankAccountValidator?.nationality || '',
          Validators.required
        ),
        citizenship: new FormControl(
          savedData?.bankAccountValidator?.citizenship || '',
          Validators.required
        ),
        passportNumber: new FormControl(
          savedData?.bankAccountValidator?.passportNumber || '',
          [Validators.required, Validators.maxLength(100)]
        ),
        scannedPassport: new FormControl(
          savedData?.bankAccountValidator?.scannedPassport || null,
          Validators.required
        ),
        workEmail: new FormControl(
          savedData?.bankAccountValidator?.workEmail || '',
          [Validators.required, Validators.email]
        ),
        useEmailForRelayLogin: new FormControl(
          savedData?.bankAccountValidator?.useEmailForRelayLogin || false
        ),
        phone: new FormControl(
          savedData?.bankAccountValidator?.phone || '',
          [Validators.required, Validators.maxLength(50)]
        ),
        canReceiveSMS: new FormControl(
          savedData?.bankAccountValidator?.canReceiveSMS || false
        ),
        isUSResident: new FormControl(
          savedData?.bankAccountValidator?.isUSResident || false,
          Validators.required
        )
      })
    });
  }

  ngOnInit(): void {
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  onPassportFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (file.size <= 10 * 1024 * 1024 && allowedTypes.includes(file.type)) {
      this.form
        .get('bankAccountValidator.scannedPassport')
        ?.setValue(file);
    }
  }

  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }
}
