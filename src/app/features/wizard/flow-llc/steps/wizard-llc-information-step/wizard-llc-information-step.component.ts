import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WizardStateService } from '../../../services/wizard-state.service';
import { WizardApiService } from '../../../services/wizard-api.service';
import { WizardAperturaLlcFormComponent } from '../wizard-apertura-llc-form/wizard-apertura-llc-form.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

/**
 * Componente wrapper para usar apertura-llc-form en el wizard
 * Este componente inicializa el formulario y maneja la integración con el wizard
 */
@Component({
  selector: 'app-wizard-llc-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, WizardAperturaLlcFormComponent, TranslocoPipe],
  templateUrl: './wizard-llc-information-step.component.html',
  styleUrls: ['./wizard-llc-information-step.component.css']
})
export class WizardLlcInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 4;
  @Input() previousStepNumber: number = 3;
  @Output() sectionChanged = new EventEmitter<number>();

  serviceDataForm!: FormGroup;
  currentSection = 1;
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  
  // Lista de estados de USA (igual que en new-request)
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
    { value: 'Wyoming', label: 'Wyoming', abbreviation: 'WY' },
    { value: 'District of Columbia', label: 'District of Columbia', abbreviation: 'DC' },
  ];

  private formSubscription?: Subscription;
  
  isSaving = false;
  saveError: string | null = null;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    // Inicializar formulario con estructura de apertura-llc-form
    this.serviceDataForm = this.fb.group({
      llcType: [''],
      llcName: [''],
      llcNameOption2: [''],
      llcNameOption3: [''],
      businessDescription: [''],
      llcPhoneNumber: [''],
      website: [''],
      llcEmail: [''],
      linkedin: [''],
      incorporationState: [''], // Se establecerá desde el paso anterior
      incorporationDate: [''],
      hasEin: [false],
      einNumber: [''],
      einDocumentUrl: [''],
      noEinReason: [''],
      certificateOfFormationUrl: [''],
      accountType: [''],
      estadoConstitucion: [''],
      annualRevenue: [null],
      actividadFinancieraEsperada: [''],
      registeredAgentAddress: this.fb.group({
        street: [''],
        building: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['']
      }),
      registeredAgentName: [''],
      registeredAgentEmail: [''],
      registeredAgentPhone: [''],
      registeredAgentType: [''],
      needsBankVerificationHelp: [false],
      bankAccountType: [''],
      bankName: [''],
      bankAccountNumber: [''],
      bankRoutingNumber: [''],
      bankStatementUrl: [''],
      serviceBillUrl: [''],
      periodicIncome10k: [''],
      bankAccountLinkedEmail: [''],
      bankAccountLinkedPhone: [''],
      projectOrCompanyUrl: [''],
      veracityConfirmation: [''],
      ownerNationality: [''],
      ownerCountryOfResidence: [''],
      ownerPersonalAddress: this.fb.group({
        street: [''],
        building: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['']
      }),
      ownerPhoneNumber: [''],
      ownerEmail: [''],
      almacenaProductosDepositoUSA: [false],
      declaroImpuestosAntes: [false],
      llcConStartCompanies: [false],
      ingresosMayor250k: [false],
      activosEnUSA: [false],
      ingresosPeriodicos10k: [false],
      contrataServiciosUSA: [false],
      propiedadEnUSA: [false],
      tieneCuentasBancarias: [false],
      members: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.serviceDataForm);
    
    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.serviceDataForm.patchValue(savedData);
    }

    // Obtener el estado seleccionado del paso anterior (estado y plan)
    const statePlanData = this.wizardStateService.getStepData(this.previousStepNumber);
    if (statePlanData && statePlanData.state) {
      // Establecer el estado en incorporationState (el estado viene del paso 2)
      const stateValue = statePlanData.state;
      this.serviceDataForm.get('incorporationState')?.setValue(stateValue);
      console.log('[WizardLlcInformationStep] Estado establecido desde paso anterior:', stateValue);
    }
    
    // También verificar si hay un estado guardado en los datos del paso actual
    if (savedData && savedData.incorporationState) {
      this.serviceDataForm.get('incorporationState')?.setValue(savedData.incorporationState);
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
   * Maneja la selección de archivos y los sube al S3
   */
  async onFileSelected(event: { event: Event; formControlPath: string; fileKey: string }): Promise<void> {
    const input = event.event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    await this.uploadFile(file, event.formControlPath, event.fileKey);
  }

  /**
   * Maneja la selección de archivos de miembros y los sube al S3
   */
  async onMemberFileSelected(event: { event: Event; memberIndex: number; formControlPath: string; fileKey: string }): Promise<void> {
    const input = event.event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const fileKey = `member${event.memberIndex}_${event.fileKey}`;
    const fullPath = `members.${event.memberIndex}.${event.formControlPath}`;
    
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
      const serviceType = 'apertura-llc';
      const requestId = this.wizardStateService.getRequestId();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('servicio', serviceType);

      // Si ya hay un request creado, incluir el UUID
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
        // Buscar el control y establecer la URL
        const control = this.findFormControl(formControlPath);
        if (control) {
          control.setValue(response.url, { emitEvent: true });
          control.markAsTouched();
          control.markAsDirty();
          console.log(`[WizardUpload] Archivo subido exitosamente: ${response.url}`);
        }
        
        // Limpiar el archivo del estado (ya fue subido)
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
    // Si el path contiene puntos, navegar por la estructura
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
    
    // Path simple
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
   * Limpia un archivo de miembro
   */
  onMemberFileCleared(event: { memberIndex: number; formControlPath: string; fileKey: string; inputId: string }): void {
    const fileKey = `member${event.memberIndex}_${event.fileKey}`;
    delete this.fileUploadStates[fileKey];
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    const memberGroup = membersArray.at(event.memberIndex) as FormGroup;
    if (memberGroup) {
      const control = memberGroup.get(event.formControlPath);
      if (control) {
        control.setValue('');
      }
    }
  }

  /**
   * Agrega un miembro
   */
  addMember(): void {
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    const memberGroup = this.fb.group({
      firstName: [''],
      lastName: [''],
      passportNumber: [''],
      scannedPassportUrl: [''],
      nationality: [''],
      dateOfBirth: [''],
      email: [''],
      phoneNumber: [''],
      percentageOfParticipation: [0],
      memberAddress: this.fb.group({
        street: [''],
        unit: [''],
        city: [''],
        stateRegion: [''],
        postalCode: [''],
        country: ['']
      }),
      ssnItin: [''],
      cuit: ['']
    });
    membersArray.push(memberGroup);
  }

  /**
   * Elimina un miembro
   */
  removeMember(index: number): void {
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    if (membersArray.length > 1) {
      membersArray.removeAt(index);
    }
  }

  /**
   * Maneja el cambio de tipo de LLC
   */
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
    if (this.currentSection < 3) {
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
      console.log('[WizardLlcInformationStep] No hay requestId, saltando guardado en API');
      return;
    }
    
    this.isSaving = true;
    this.saveError = null;
    
    try {
      const formData = this.serviceDataForm.value;
      
      const updateData = {
        type: 'apertura-llc',
        currentStepNumber: this.currentSection,
        aperturaLlcData: {
          ...formData,
          members: formData.members || []
        }
      };
      
      console.log('[WizardLlcInformationStep] Guardando datos en API:', updateData);
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
      console.log('[WizardLlcInformationStep] Datos guardados exitosamente');
      
    } catch (error: any) {
      console.error('[WizardLlcInformationStep] Error al guardar:', error);
      this.saveError = error?.error?.message || 'Error al guardar los datos';
    } finally {
      this.isSaving = false;
    }
  }

  onLlcTypeChanged(llcType: string): void {
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    
    if (llcType === 'single') {
      // Si cambia a single, mantener solo un miembro
      while (membersArray.length > 1) {
        membersArray.removeAt(membersArray.length - 1);
      }
      if (membersArray.length === 0) {
        this.addMember();
      }
    } else if (llcType === 'multi') {
      // Si cambia a multi, asegurar que hay al menos un miembro
      if (membersArray.length === 0) {
        this.addMember();
      }
    }
  }
}

