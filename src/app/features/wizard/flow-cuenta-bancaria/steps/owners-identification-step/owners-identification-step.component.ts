import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WizardStateService } from '../../../services/wizard-state.service';

@Component({
  selector: 'app-owners-identification-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  templateUrl: './owners-identification-step.component.html',
  styleUrl: './owners-identification-step.component.css'
})
export class OwnersIdentificationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 6;

  form!: FormGroup;
  private formSubscription?: Subscription;

  constructor(private wizardStateService: WizardStateService) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);

    this.form = new FormGroup({
      owners: new FormArray([])
    });

    if (savedData?.owners?.length) {
      savedData.owners.forEach((owner: any) => {
        this.owners.push(this.createOwnerGroup(owner));
      });
    } else {
      this.addOwner();
    }
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

  get owners(): FormArray {
    return this.form.get('owners') as FormArray;
  }

  addOwner(): void {
    this.owners.push(this.createOwnerGroup());
  }

  removeOwner(index: number): void {
    if (this.owners.length > 1) {
      this.owners.removeAt(index);
    }
  }

  private createOwnerGroup(data?: any): FormGroup {
    return new FormGroup({
      firstName: new FormControl(data?.firstName || '', [
        Validators.required,
        Validators.maxLength(255)
      ]),
      paternalLastName: new FormControl(data?.paternalLastName || '', [
        Validators.required,
        Validators.maxLength(255)
      ]),
      maternalLastName: new FormControl(data?.maternalLastName || '', [
        Validators.required,
        Validators.maxLength(255)
      ]),
      dateOfBirth: new FormControl(data?.dateOfBirth || '', Validators.required),
      nationality: new FormControl(data?.nationality || '', Validators.required),
      passportOrNationalId: new FormControl(data?.passportOrNationalId || '', [
        Validators.required,
        Validators.maxLength(100)
      ]),
      identityDocument: new FormControl(data?.identityDocument || [], Validators.required),
      facialPhotograph: new FormControl(data?.facialPhotograph || null, Validators.required)
    });
  }

  onIdentityFilesChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files)
      .filter(
        f =>
          f.size <= 10 * 1024 * 1024 &&
          ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)
      )
      .slice(0, 5);

    this.owners.at(index).get('identityDocument')?.setValue(files);
  }

  onFacialPhotoChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (
      file.size <= 5 * 1024 * 1024 &&
      ['image/jpeg', 'image/png'].includes(file.type)
    ) {
      this.owners.at(index).get('facialPhotograph')?.setValue(file);
    }
  }

  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }
}
