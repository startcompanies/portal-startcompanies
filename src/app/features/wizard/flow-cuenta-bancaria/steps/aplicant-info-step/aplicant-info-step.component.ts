import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WizardStateService } from '../../../services/wizard-state.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { SharedModule } from '../../../../../shared/shared/shared.module';

@Component({
  selector: 'app-aplicant-info-step',
  standalone: true,
  imports: [TranslocoPipe, SharedModule],
  templateUrl: './aplicant-info-step.component.html',
  styleUrl: './aplicant-info-step.component.css'
})
export class AplicantInfoStepComponent implements OnInit, OnDestroy{
  @Input() stepNumber: number = 3;

  form!: FormGroup;
  private formSubscription?: Subscription;
  
  constructor(
    private wizardStateService: WizardStateService
  ) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber) || {};
    
    this.form = new FormGroup({
      applicantEmail: new FormControl(savedData.applicantEmail || '', [Validators.required, Validators.email]),
      applicantFirstName: new FormControl(savedData.applicantFirstName || '', [Validators.required, Validators.maxLength(255)]),
      applicantPaternalLastName: new FormControl(savedData.aplicantPaternalLastName || '', [Validators.required, Validators.maxLength(255)]),
      applicantMaternalLastName: new FormControl(savedData.aplicantMaternalLastName || '', [Validators.required, Validators.maxLength(255)]),
      applicantPhone: new FormControl(savedData.aplicantPhone || '', [Validators.required, Validators.maxLength(255)]),
      accountType: new FormControl(savedData.accountType || '', [Validators.required]),
      businessType: new FormControl(savedData.businessType || '', [Validators.required]),
      legalBusinessIdentifier: new FormControl(savedData.legalBusinessIdentifier || '', [Validators.required, Validators.maxLength(255)]),
      industry: new FormControl(savedData.industry || '', [Validators.required, Validators.maxLength(255)]),
      economicActivity: new FormControl(savedData.economicActivity || '', [Validators.required, Validators.maxLength(200)]),
      ein: new FormControl(savedData.ein || '', [Validators.required, Validators.maxLength(255)]),
      certificateOfConstitutionOrArticles: new FormControl(savedData.certificateOfConstitutionOrArticles || '', [Validators.required]),
      operatingAgreement: new FormControl(savedData.operatingAgreement || '', [Validators.required]),
    });    
  }

  ngOnInit(): void{
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
    }
  }

  ngOnDestroy(): void{
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  /**
   * Maneja el cambio de archivo para los campos de tipo file
   * @param event 
   * @param controlName 
   * @returns void
   * **/
  onFileChange(event: Event, controlName: string): void{
    const input = event.target as HTMLInputElement;
    if(!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (file.type !== 'application/pdf') {
      input.value = '';
      return;
    }

    this.form.get(controlName)?.setValue(file);
    this.form.get(controlName)?.markAsTouched();
  }

  private saveStepData(): void{
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }


}
