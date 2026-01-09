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
    
    /**
     * CAMPOS OPCIONALES - Se puede navegar sin completar todos los campos
     * - applicantEmail: Email del solicitante (opcional, pero debe tener formato válido si se completa)
     * - applicantFirstName: Primer nombre (opcional, max 255 caracteres)
     * - applicantPaternalLastName: Apellido paterno (opcional, max 255 caracteres)
     * - applicantMaternalLastName: Apellido materno (opcional, max 255 caracteres)
     * - applicantPhone: Teléfono (opcional, max 255 caracteres)
     * - accountType: Tipo de cuenta (opcional)
     * - businessType: Tipo de negocio (opcional)
     * - legalBusinessIdentifier: Identificador legal del negocio (opcional, max 255 caracteres)
     * - industry: Industria (opcional, max 255 caracteres)
     * - economicActivity: Actividad económica (opcional, max 200 caracteres)
     * - ein: Número de identificación fiscal EIN (opcional, max 255 caracteres)
     * - certificateOfConstitutionOrArticles: Certificado de constitución o artículos (opcional) - Archivo PDF
     * - operatingAgreement: Acuerdo operativo (opcional) - Archivo PDF
     * 
     * VALIDACIÓN DE ARCHIVOS:
     * - Solo acepta archivos PDF (validación en onFileChange, línea 67-70)
     * - No valida tamaño máximo del archivo
     * - No valida que el archivo sea válido/corrupto
     * 
     * NOTA: Los campos ya no son obligatorios para navegar entre pasos.
     */
    this.form = new FormGroup({
      applicantEmail: new FormControl(savedData.applicantEmail || '', [Validators.email]), // Solo valida formato si se completa
      applicantFirstName: new FormControl(savedData.applicantFirstName || '', [Validators.maxLength(255)]),
      applicantPaternalLastName: new FormControl(savedData.aplicantPaternalLastName || '', [Validators.maxLength(255)]),
      applicantMaternalLastName: new FormControl(savedData.aplicantMaternalLastName || '', [Validators.maxLength(255)]),
      applicantPhone: new FormControl(savedData.aplicantPhone || '', [Validators.maxLength(255)]),
      accountType: new FormControl(savedData.accountType || ''),
      businessType: new FormControl(savedData.businessType || ''),
      legalBusinessIdentifier: new FormControl(savedData.legalBusinessIdentifier || '', [Validators.maxLength(255)]),
      industry: new FormControl(savedData.industry || '', [Validators.maxLength(255)]),
      economicActivity: new FormControl(savedData.economicActivity || '', [Validators.maxLength(200)]),
      ein: new FormControl(savedData.ein || '', [Validators.maxLength(255)]),
      certificateOfConstitutionOrArticles: new FormControl(savedData.certificateOfConstitutionOrArticles || ''),
      operatingAgreement: new FormControl(savedData.operatingAgreement || ''),
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
