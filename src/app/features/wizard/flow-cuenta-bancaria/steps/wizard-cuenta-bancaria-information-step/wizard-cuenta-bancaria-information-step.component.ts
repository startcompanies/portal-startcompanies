import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WizardStateService } from '../../../services/wizard-state.service';
import { WizardApiService } from '../../../services/wizard-api.service';
import { WizardCuentaBancariaFormComponent } from '../wizard-cuenta-bancaria-form/wizard-cuenta-bancaria-form.component';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

/**
 * Componente wrapper para usar wizard-cuenta-bancaria-form en el wizard
 * Este componente inicializa el formulario y maneja la integración con el wizard
 */
@Component({
  selector: 'app-wizard-cuenta-bancaria-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, WizardCuentaBancariaFormComponent],
  templateUrl: './wizard-cuenta-bancaria-information-step.component.html',
  styleUrls: ['./wizard-cuenta-bancaria-information-step.component.css']
})
export class WizardCuentaBancariaInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 2;
  @Input() previousStepNumber: number = 1;
  @Output() sectionChanged = new EventEmitter<number>();

  serviceDataForm!: FormGroup;
  currentSection = 1;
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  
  // Lista de estados de USA
  usStates = [
    { value: 'Alabama', label: 'Alabama', abbreviation: 'AL' },
    { value: 'Alaska', label: 'Alaska', abbreviation: 'AK' },
    { value: 'Arizona', label: 'Arizona', abbreviation: 'AZ' },
    { value: 'Arkansas', label: 'Arkansas', abbreviation: 'AR' },
    { value: 'California', label: 'California', abbreviation: 'CA' },
    { value: 'Colorado', label: 'Colorado', abbreviation: 'CO' },
    { value: 'Connecticut', label: 'Connecticut', abbreviation: 'CT' },
    { value: 'Delaware', label: 'Delaware', abbreviation: 'DE' },
    { value: 'Florida', label: 'Florida', abbreviation: 'FL' },
    { value: 'Georgia', label: 'Georgia', abbreviation: 'GA' },
    { value: 'Hawaii', label: 'Hawaii', abbreviation: 'HI' },
    { value: 'Idaho', label: 'Idaho', abbreviation: 'ID' },
    { value: 'Illinois', label: 'Illinois', abbreviation: 'IL' },
    { value: 'Indiana', label: 'Indiana', abbreviation: 'IN' },
    { value: 'Iowa', label: 'Iowa', abbreviation: 'IA' },
    { value: 'Kansas', label: 'Kansas', abbreviation: 'KS' },
    { value: 'Kentucky', label: 'Kentucky', abbreviation: 'KY' },
    { value: 'Louisiana', label: 'Louisiana', abbreviation: 'LA' },
    { value: 'Maine', label: 'Maine', abbreviation: 'ME' },
    { value: 'Maryland', label: 'Maryland', abbreviation: 'MD' },
    { value: 'Massachusetts', label: 'Massachusetts', abbreviation: 'MA' },
    { value: 'Michigan', label: 'Michigan', abbreviation: 'MI' },
    { value: 'Minnesota', label: 'Minnesota', abbreviation: 'MN' },
    { value: 'Mississippi', label: 'Mississippi', abbreviation: 'MS' },
    { value: 'Missouri', label: 'Missouri', abbreviation: 'MO' },
    { value: 'Montana', label: 'Montana', abbreviation: 'MT' },
    { value: 'Nebraska', label: 'Nebraska', abbreviation: 'NE' },
    { value: 'Nevada', label: 'Nevada', abbreviation: 'NV' },
    { value: 'New Hampshire', label: 'New Hampshire', abbreviation: 'NH' },
    { value: 'New Jersey', label: 'New Jersey', abbreviation: 'NJ' },
    { value: 'New Mexico', label: 'New Mexico', abbreviation: 'NM' },
    { value: 'New York', label: 'New York', abbreviation: 'NY' },
    { value: 'North Carolina', label: 'North Carolina', abbreviation: 'NC' },
    { value: 'North Dakota', label: 'North Dakota', abbreviation: 'ND' },
    { value: 'Ohio', label: 'Ohio', abbreviation: 'OH' },
    { value: 'Oklahoma', label: 'Oklahoma', abbreviation: 'OK' },
    { value: 'Oregon', label: 'Oregon', abbreviation: 'OR' },
    { value: 'Pennsylvania', label: 'Pennsylvania', abbreviation: 'PA' },
    { value: 'Rhode Island', label: 'Rhode Island', abbreviation: 'RI' },
    { value: 'South Carolina', label: 'South Carolina', abbreviation: 'SC' },
    { value: 'South Dakota', label: 'South Dakota', abbreviation: 'SD' },
    { value: 'Tennessee', label: 'Tennessee', abbreviation: 'TN' },
    { value: 'Texas', label: 'Texas', abbreviation: 'TX' },
    { value: 'Utah', label: 'Utah', abbreviation: 'UT' },
    { value: 'Vermont', label: 'Vermont', abbreviation: 'VT' },
    { value: 'Virginia', label: 'Virginia', abbreviation: 'VA' },
    { value: 'Washington', label: 'Washington', abbreviation: 'WA' },
    { value: 'West Virginia', label: 'West Virginia', abbreviation: 'WV' },
    { value: 'Wisconsin', label: 'Wisconsin', abbreviation: 'WI' },
    { value: 'Wyoming', label: 'Wyoming', abbreviation: 'WY' }
  ];

  totalSections = 6; // Total de secciones para Cuenta Bancaria

  private formSubscription?: Subscription;
  
  isSaving = false;
  saveError: string | null = null;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    // Inicializar formulario con estructura de cuenta-bancaria-form
    this.serviceDataForm = this.fb.group({});
    this.initializeCuentaBancariaForm(this.serviceDataForm);
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.serviceDataForm);
    
    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.serviceDataForm.patchValue(savedData);
    }

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.serviceDataForm.valueChanges.subscribe(() => {
      this.saveStepData();
    });

    // Emitir la sección inicial
    this.sectionChanged.emit(this.currentSection);
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
    this.wizardStateService.setStepData(this.stepNumber, this.serviceDataForm.value);
  }

  /**
   * Inicializa el formulario de cuenta bancaria
   */
  private initializeCuentaBancariaForm(group: FormGroup): void {
    // Paso 1: Información de la LLC
    group.addControl('businessType', this.fb.control(''));
    // Sección 1: Información del negocio (campos requeridos)
    group.addControl('legalBusinessName', this.fb.control('', Validators.required));
    group.addControl('industry', this.fb.control('', Validators.required));
    group.addControl('numberOfEmployees', this.fb.control('', Validators.required));
    group.addControl('briefDescription', this.fb.control('', Validators.required));
    group.addControl('websiteOrSocialMedia', this.fb.control(''));
    group.addControl('einLetterUrl', this.fb.control(''));
    group.addControl('einNumber', this.fb.control(''));
    group.addControl('articlesOrCertificateUrl', this.fb.control(''));
    
    // Sección 2: Dirección del Registered Agent
    group.addControl('registeredAgentStreet', this.fb.control('', Validators.required));
    group.addControl('registeredAgentUnit', this.fb.control(''));
    group.addControl('registeredAgentCity', this.fb.control('', Validators.required));
    group.addControl('registeredAgentState', this.fb.control('', Validators.required));
    group.addControl('registeredAgentZipCode', this.fb.control('', Validators.required));
    group.addControl('registeredAgentCountry', this.fb.control('United States'));
    group.addControl('incorporationState', this.fb.control(''));
    group.addControl('incorporationMonthYear', this.fb.control(''));
    group.addControl('countriesWhereBusiness', this.fb.control([]));
    
    // Sección 3: Información de la persona que verificará la cuenta bancaria
    group.addControl('validatorMemberId', this.fb.control(''));
    group.addControl('validatorTitle', this.fb.control('', Validators.required));
    group.addControl('validatorIncomeSource', this.fb.control(''));
    group.addControl('validatorAnnualIncome', this.fb.control(''));
    group.addControl('validatorFirstName', this.fb.control('', Validators.required));
    group.addControl('validatorLastName', this.fb.control('', Validators.required));
    group.addControl('validatorDateOfBirth', this.fb.control('', Validators.required));
    group.addControl('validatorNationality', this.fb.control('', Validators.required));
    group.addControl('validatorCitizenship', this.fb.control(''));
    group.addControl('validatorPassportNumber', this.fb.control('', Validators.required));
    group.addControl('validatorPassportUrl', this.fb.control(''));
    group.addControl('validatorWorkEmail', this.fb.control('', [Validators.required, Validators.email]));
    group.addControl('validatorPhone', this.fb.control('', Validators.required));
    group.addControl('canReceiveSMS', this.fb.control(false));
    group.addControl('isUSResident', this.fb.control(''));
    
    // Sección 4: Dirección personal del propietario
    group.addControl('ownerPersonalStreet', this.fb.control('', Validators.required));
    group.addControl('ownerPersonalUnit', this.fb.control(''));
    group.addControl('ownerPersonalCity', this.fb.control('', Validators.required));
    group.addControl('ownerPersonalState', this.fb.control('', Validators.required));
    group.addControl('ownerPersonalCountry', this.fb.control('', Validators.required));
    group.addControl('ownerPersonalPostalCode', this.fb.control('', Validators.required));
    group.addControl('serviceBillUrl', this.fb.control(''));
    
    // Sección 5: Tipo de LLC
    group.addControl('isMultiMember', this.fb.control('', Validators.required));
    group.addControl('llcType', this.fb.control(''));
    
    // Sección 6: Propietarios (FormArray)
    group.addControl('owners', this.fb.array([]));
  }

  /**
   * Maneja la selección de archivos y los sube al S3
   */
  async onFileSelected(event: { event: Event; formControlPath: string; fileKey: string }): Promise<void> {
    const input = event.event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    await this.uploadFile(file, event.formControlPath, event.fileKey);
  }

  /**
   * Maneja la selección de archivos de propietarios y los sube al S3
   */
  async onOwnerFileSelected(event: { event: Event; ownerIndex: number; formControlPath: string; fileKey: string }): Promise<void> {
    const input = event.event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const fileKey = `owner${event.ownerIndex}_${event.fileKey}`;
    const fullPath = `owners.${event.ownerIndex}.${event.formControlPath}`;
    
    await this.uploadFile(file, fullPath, fileKey);
  }

  /**
   * Sube un archivo al S3 y actualiza el control del formulario con la URL
   */
  async uploadFile(file: File, formControlPath: string, fileKey: string): Promise<void> {
    if (!file) return;

    // Inicializar estado de subida
    this.fileUploadStates[fileKey] = {
      file: file,
      uploading: true,
      progress: 0
    };

    try {
      const serviceType = 'cuenta-bancaria';
      const requestId = this.wizardStateService.getRequestId();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('servicio', serviceType);

      if (requestId) {
        formData.append('requestUuid', requestId.toString());
        console.log(`[WizardUpload] Subiendo archivo con estructura: request/${serviceType}/${requestId}/`);
      } else {
        console.log(`[WizardUpload] Subiendo archivo con estructura temporal: request/${serviceType}/`);
      }

      const response = await firstValueFrom(
        this.http.post<{ url: string; key: string; message: string }>(
          `${environment.apiUrl}/upload-file`,
          formData
        )
      );

      if (response && response.url) {
        const control = this.findFormControl(formControlPath);
        if (control) {
          control.setValue(response.url, { emitEvent: true });
          control.markAsTouched();
          control.markAsDirty();
          console.log(`[WizardUpload] Archivo subido exitosamente: ${response.url}`);
        }
        this.fileUploadStates[fileKey].file = null;
      }
    } catch (error: any) {
      console.error(`[WizardUpload] Error al subir archivo ${fileKey}:`, error);
      this.fileUploadStates[fileKey].file = null;
    } finally {
      this.fileUploadStates[fileKey].uploading = false;
      this.fileUploadStates[fileKey].progress = 0;
    }
  }

  /**
   * Busca un control en el formulario por su ruta
   */
  findFormControl(path: string): any {
    if (path.includes('.')) {
      const parts = path.split('.');
      let current: any = this.serviceDataForm;
      
      for (const part of parts) {
        if (current instanceof FormArray) {
          const index = parseInt(part, 10);
          current = current.at(index);
        } else if (current instanceof FormGroup) {
          current = current.get(part);
        } else {
          return null;
        }
        if (!current) return null;
      }
      return current;
    }
    return this.serviceDataForm.get(path);
  }

  /**
   * Limpia un archivo
   */
  onFileCleared(event: { fileKey: string; formControlPath: string; inputId: string }): void {
    delete this.fileUploadStates[event.fileKey];
    const control = this.serviceDataForm.get(event.formControlPath);
    if (control) {
      control.setValue('');
    }
  }

  /**
   * Limpia un archivo de propietario
   */
  onOwnerFileCleared(event: { ownerIndex: number; formControlPath: string; fileKey: string; inputId: string }): void {
    const fileKey = `owner${event.ownerIndex}_${event.fileKey}`;
    delete this.fileUploadStates[fileKey];
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    const ownerGroup = ownersArray.at(event.ownerIndex) as FormGroup;
    if (ownerGroup) {
      const control = ownerGroup.get(event.formControlPath);
      if (control) {
        control.setValue('');
      }
    }
  }

  /**
   * Agrega un propietario
   */
  onAddOwnerRequested(): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (!ownersArray) {
      this.serviceDataForm.addControl('owners', this.fb.array([]));
    }
    
    const ownerGroup = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      nationality: ['', Validators.required],
      passportNumber: ['', Validators.required],
      ssnItin: [''],
      cuit: [''],
      participationPercentage: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      passportFileUrl: ['']
    });
    
    ownersArray.push(ownerGroup);
  }

  /**
   * Elimina un propietario
   */
  onRemoveOwnerRequested(index: number): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (ownersArray && ownersArray.length > index) {
      ownersArray.removeAt(index);
    }
  }

  /**
   * Valida si la sección actual está completa
   */
  isSectionValid(): boolean {
    if (this.currentSection === 1) {
      // Sección 1: Información del negocio
      const legalBusinessName = this.serviceDataForm.get('legalBusinessName');
      const industry = this.serviceDataForm.get('industry');
      const numberOfEmployees = this.serviceDataForm.get('numberOfEmployees');
      const briefDescription = this.serviceDataForm.get('briefDescription');
      
      return !!(legalBusinessName?.valid && industry?.valid && numberOfEmployees?.valid && briefDescription?.valid);
    }
    
    if (this.currentSection === 2) {
      // Sección 2: Dirección del Registered Agent
      const registeredAgentStreet = this.serviceDataForm.get('registeredAgentStreet');
      const registeredAgentCity = this.serviceDataForm.get('registeredAgentCity');
      const registeredAgentState = this.serviceDataForm.get('registeredAgentState');
      const registeredAgentZipCode = this.serviceDataForm.get('registeredAgentZipCode');
      
      return !!(registeredAgentStreet?.valid && registeredAgentCity?.valid && registeredAgentState?.valid && registeredAgentZipCode?.valid);
    }
    
    if (this.currentSection === 3) {
      // Sección 3: Información del validador
      const validatorTitle = this.serviceDataForm.get('validatorTitle');
      const validatorFirstName = this.serviceDataForm.get('validatorFirstName');
      const validatorLastName = this.serviceDataForm.get('validatorLastName');
      const validatorDateOfBirth = this.serviceDataForm.get('validatorDateOfBirth');
      const validatorNationality = this.serviceDataForm.get('validatorNationality');
      const validatorPassportNumber = this.serviceDataForm.get('validatorPassportNumber');
      const validatorWorkEmail = this.serviceDataForm.get('validatorWorkEmail');
      const validatorPhone = this.serviceDataForm.get('validatorPhone');
      
      return !!(validatorTitle?.valid && validatorFirstName?.valid && validatorLastName?.valid && 
                validatorDateOfBirth?.valid && validatorNationality?.valid && validatorPassportNumber?.valid && 
                validatorWorkEmail?.valid && validatorPhone?.valid);
    }
    
    if (this.currentSection === 4) {
      // Sección 4: Dirección personal del propietario
      const ownerPersonalStreet = this.serviceDataForm.get('ownerPersonalStreet');
      const ownerPersonalCity = this.serviceDataForm.get('ownerPersonalCity');
      const ownerPersonalState = this.serviceDataForm.get('ownerPersonalState');
      const ownerPersonalCountry = this.serviceDataForm.get('ownerPersonalCountry');
      const ownerPersonalPostalCode = this.serviceDataForm.get('ownerPersonalPostalCode');
      
      return !!(ownerPersonalStreet?.valid && ownerPersonalCity?.valid && ownerPersonalState?.valid && 
                ownerPersonalCountry?.valid && ownerPersonalPostalCode?.valid);
    }
    
    if (this.currentSection === 5) {
      // Sección 5: Tipo de LLC
      const isMultiMember = this.serviceDataForm.get('isMultiMember');
      return !!isMultiMember?.valid;
    }
    
    if (this.currentSection === 6) {
      // Sección 6: Propietarios
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      const isMultiMember = this.serviceDataForm.get('isMultiMember')?.value;
      
      // Para multi member, debe haber al menos 2 owners
      // Para single member, debe haber al menos 1 owner
      const minOwners = isMultiMember === 'yes' || isMultiMember === true ? 2 : 1;
      
      if (!ownersArray || ownersArray.length < minOwners) {
        return false;
      }
      
      // Validar que todos los owners tengan los campos requeridos
      return ownersArray.controls.every(owner => owner.valid);
    }
    
    return true;
  }

  /**
   * Marca los campos de la sección actual como touched para mostrar errores
   */
  markSectionAsTouched(): void {
    if (this.currentSection === 1) {
      this.serviceDataForm.get('legalBusinessName')?.markAsTouched();
      this.serviceDataForm.get('industry')?.markAsTouched();
      this.serviceDataForm.get('numberOfEmployees')?.markAsTouched();
      this.serviceDataForm.get('briefDescription')?.markAsTouched();
    }
    
    if (this.currentSection === 2) {
      this.serviceDataForm.get('registeredAgentStreet')?.markAsTouched();
      this.serviceDataForm.get('registeredAgentCity')?.markAsTouched();
      this.serviceDataForm.get('registeredAgentState')?.markAsTouched();
      this.serviceDataForm.get('registeredAgentZipCode')?.markAsTouched();
    }
    
    if (this.currentSection === 3) {
      this.serviceDataForm.get('validatorTitle')?.markAsTouched();
      this.serviceDataForm.get('validatorFirstName')?.markAsTouched();
      this.serviceDataForm.get('validatorLastName')?.markAsTouched();
      this.serviceDataForm.get('validatorDateOfBirth')?.markAsTouched();
      this.serviceDataForm.get('validatorNationality')?.markAsTouched();
      this.serviceDataForm.get('validatorPassportNumber')?.markAsTouched();
      this.serviceDataForm.get('validatorWorkEmail')?.markAsTouched();
      this.serviceDataForm.get('validatorPhone')?.markAsTouched();
    }
    
    if (this.currentSection === 4) {
      this.serviceDataForm.get('ownerPersonalStreet')?.markAsTouched();
      this.serviceDataForm.get('ownerPersonalCity')?.markAsTouched();
      this.serviceDataForm.get('ownerPersonalState')?.markAsTouched();
      this.serviceDataForm.get('ownerPersonalCountry')?.markAsTouched();
      this.serviceDataForm.get('ownerPersonalPostalCode')?.markAsTouched();
    }
    
    if (this.currentSection === 5) {
      this.serviceDataForm.get('isMultiMember')?.markAsTouched();
    }
    
    if (this.currentSection === 6) {
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      ownersArray?.controls.forEach(owner => {
        (owner as FormGroup).markAllAsTouched();
      });
    }
  }

  /**
   * Navega a la sección anterior
   */
  goToPreviousSection(): void {
    if (this.currentSection > 1) {
      this.currentSection--;
      this.sectionChanged.emit(this.currentSection);
    }
  }

  /**
   * Navega a la siguiente sección y guarda los datos en la API
   */
  async goToNextSection(): Promise<void> {
    // Validar sección actual antes de avanzar
    if (!this.isSectionValid()) {
      this.markSectionAsTouched();
      return;
    }
    
    if (this.currentSection < this.totalSections) {
      // Guardar datos en la API antes de avanzar
      await this.saveToApi();
      
      this.currentSection++;
      this.sectionChanged.emit(this.currentSection);
    }
  }
  
  /**
   * Guarda los datos en la API
   */
  async saveToApi(): Promise<void> {
    const requestId = this.wizardStateService.getRequestId();
    if (!requestId) {
      console.log('[WizardCuentaBancariaInformationStep] No hay requestId, saltando guardado en API');
      return;
    }
    
    this.isSaving = true;
    this.saveError = null;
    
    try {
      const formData = this.serviceDataForm.value;
      
      const updateData = {
        type: 'cuenta-bancaria',
        currentStepNumber: this.currentSection,
        cuentaBancariaData: {
          ...formData,
          owners: formData.owners || []
        }
      };
      
      console.log('[WizardCuentaBancariaInformationStep] Guardando datos en API:', updateData);
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
      console.log('[WizardCuentaBancariaInformationStep] Datos guardados exitosamente');
      
    } catch (error: any) {
      console.error('[WizardCuentaBancariaInformationStep] Error al guardar:', error);
      this.saveError = error?.error?.message || 'Error al guardar los datos';
    } finally {
      this.isSaving = false;
    }
  }
}

