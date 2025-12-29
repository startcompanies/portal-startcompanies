import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WizardStateService } from '../../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-owner-personal-address-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  templateUrl: './owner-personal-address-step.component.html',
  styleUrl: './owner-personal-address-step.component.css'
})
export class OwnerPersonalAddressStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 5;

  form!: FormGroup;
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService
  ) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber) || {};

    this.form = new FormGroup({
      isSameAddressAsBusiness: new FormControl(
        savedData.isSameAddressAsBusiness ?? true,
        Validators.required
      ),

      ownerPersonalAddress: new FormGroup({
        street: new FormControl(savedData.ownerPersonalAddress?.street || ''),
        unit: new FormControl(
          savedData.ownerPersonalAddress?.unit || '',
          Validators.maxLength(255)
        ),
        city: new FormControl(savedData.ownerPersonalAddress?.city || ''),
        state: new FormControl(savedData.ownerPersonalAddress?.state || ''),
        postalCode: new FormControl(savedData.ownerPersonalAddress?.postalCode || ''),
        country: new FormControl(savedData.ownerPersonalAddress?.country || '')
      }),

      proofOfAddress: new FormControl(
        savedData.proofOfAddress || [],
        Validators.required
      )
    });
  }

  ngOnInit(): void {
    this.applyAddressValidators(
      this.form.get('isSameAddressAsBusiness')?.value
    );

    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.applyAddressValidators(
        this.form.get('isSameAddressAsBusiness')?.value
      );
      this.saveStepData();
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  private applyAddressValidators(isSame: boolean): void {
    const addressGroup = this.form.get('ownerPersonalAddress') as FormGroup;

    const required = isSame ? [] : [Validators.required];

    ['street', 'city', 'state', 'postalCode', 'country'].forEach(field => {
      const control = addressGroup.get(field);
      control?.setValidators(required);
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    const validFiles: File[] = [];

    for (const file of files) {
      const validType =
        file.type === 'application/pdf' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/png';

      if (!validType || file.size > 10 * 1024 * 1024) {
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 5) {
      validFiles.length = 5;
    }

    this.form.get('proofOfAddress')?.setValue(validFiles);
    this.form.get('proofOfAddress')?.markAsTouched();
  }

  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }
}
