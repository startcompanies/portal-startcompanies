import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WizardStateService } from '../../../services/wizard-state.service';
import { WizardApiService } from '../../../services/wizard-api.service';
import { AperturaLlcFormComponent } from '../../../../../shared/components/service-forms/apertura-llc-form/apertura-llc-form.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subscription, firstValueFrom } from 'rxjs';

/**
 * Componente wrapper para usar apertura-llc-form en el wizard
 * Este componente inicializa el formulario y maneja la integración con el wizard
 */
@Component({
  selector: 'app-wizard-llc-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AperturaLlcFormComponent, TranslocoPipe],
  templateUrl: './wizard-llc-information-step.component.html',
  styleUrls: ['./wizard-llc-information-step.component.css']
})
export class WizardLlcInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 4;
  @Input() previousStepNumber: number = 3;
  @Output() sectionChanged = new EventEmitter<number>();
  @Output() nextStepRequested = new EventEmitter<void>();

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

  // Restricción por plan: Pack Premium solo permite Single Member
  forceSingleMember = false;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private fb: FormBuilder
  ) {
    // Inicializar formulario con estructura de apertura-llc-form
    // Campos con Validators.required son obligatorios
    this.serviceDataForm = this.fb.group({
      // Sección 1: Información de la LLC
      llcType: ['', Validators.required],
      llcName: ['', Validators.required],
      llcNameOption2: [''],
      llcNameOption3: [''],
      businessDescription: ['', Validators.required],
      llcPhoneNumber: [''],
      website: [''],
      llcEmail: ['', [Validators.email]],
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
      bankAccountLinkedEmail: ['', [Validators.email]],
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
      ownerEmail: ['', [Validators.email]],
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
    
    // Obtener el estado seleccionado del paso anterior (estado y plan) PRIMERO
    const statePlanData = this.wizardStateService.getStepData(this.previousStepNumber);
    
    // Regla de negocio:
    // - Pack Premium: solo Single Member (New Mexico o Wyoming)
    // - Pack Emprendedor: solo Single Member (New Mexico)
    this.forceSingleMember = statePlanData?.plan === 'Premium' || statePlanData?.plan === 'Entrepreneur';
    
    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      // Separar los miembros del resto de los datos porque patchValue no restaura FormArrays
      const { members, ...otherData } = savedData;
      
      // Aplicar patchValue sin los miembros
      this.serviceDataForm.patchValue(otherData);
      
      // Restaurar miembros manualmente si existen
      if (members && Array.isArray(members) && members.length > 0) {
        const membersArray = this.serviceDataForm.get('members') as FormArray;
        // Limpiar el array primero
        while (membersArray.length > 0) {
          membersArray.removeAt(0);
        }
        // Restaurar cada miembro
        members.forEach((memberData: any) => {
          const memberGroup = this.fb.group({
            firstName: [memberData.firstName || '', Validators.required],
            lastName: [memberData.lastName || '', Validators.required],
            passportNumber: [memberData.passportNumber || '', Validators.required],
            scannedPassportUrl: [memberData.scannedPassportUrl || ''],
            nationality: [memberData.nationality || '', Validators.required],
            dateOfBirth: [memberData.dateOfBirth || '', Validators.required],
            email: [memberData.email || '', [Validators.required, Validators.email]],
            phoneNumber: [memberData.phoneNumber || '', Validators.required],
            percentageOfParticipation: [memberData.percentageOfParticipation || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
            memberAddress: this.fb.group({
              street: [memberData.memberAddress?.street || '', Validators.required],
              unit: [memberData.memberAddress?.unit || ''],
              city: [memberData.memberAddress?.city || '', Validators.required],
              stateRegion: [memberData.memberAddress?.stateRegion || '', Validators.required],
              postalCode: [memberData.memberAddress?.postalCode || '', Validators.required],
              country: [memberData.memberAddress?.country || '', Validators.required]
            }),
            ssnItin: [memberData.ssnItin || ''],
            cuit: [memberData.cuit || '']
          });
          membersArray.push(memberGroup);
        });
        console.log('[WizardLlcInformationStep] Miembros restaurados:', membersArray.length);
      }
      
      // Si forceSingleMember está activo, sobrescribir el llcType guardado
      if (this.forceSingleMember && savedData.llcType !== 'single') {
        this.serviceDataForm.get('llcType')?.setValue('single', { emitEvent: false });
      }
    }

    // Estado según plan: Emprendedor = siempre New Mexico; Elite = elegido; Premium = NM o Wyoming
    if (statePlanData?.plan === 'Entrepreneur') {
      const nmState = 'New Mexico';
      this.serviceDataForm.get('incorporationState')?.setValue(nmState);
      this.serviceDataForm.get('incorporationState')?.disable(); // Fijo, no editable
      console.log('[WizardLlcInformationStep] Pack Emprendedor: estado fijado a', nmState);
    } else if (statePlanData && statePlanData.state) {
      const stateValue = statePlanData.state;
      this.serviceDataForm.get('incorporationState')?.setValue(stateValue);
      console.log('[WizardLlcInformationStep] Estado establecido desde paso anterior:', stateValue);
    }

    // Si forceSingleMember está activo (Emprendedor o Premium), forzar y bloquear estructura societaria
    if (this.forceSingleMember) {
      const llcTypeControl = this.serviceDataForm.get('llcType');
      if (llcTypeControl?.value !== 'single') {
        llcTypeControl?.setValue('single', { emitEvent: false });
      }
      llcTypeControl?.disable(); // Evitar que el usuario borre o cambie (valor se incluye vía getRawValue al enviar)
      
      const membersArray = this.serviceDataForm.get('members') as FormArray;
      if (membersArray.length === 0) {
        this.onLlcTypeChanged('single');
      }
      
      console.log('[WizardLlcInformationStep] Pack Emprendedor/Premium - Single Member forzado');
    } else {
      // Si no hay forceSingleMember, verificar si hay un llcType guardado y inicializar miembros si es necesario
      const llcType = this.serviceDataForm.get('llcType')?.value;
      const membersArray = this.serviceDataForm.get('members') as FormArray;
      
      if (llcType && membersArray.length === 0) {
        // Si hay un llcType guardado pero no hay miembros (ni restaurados), inicializarlos
        console.log('[WizardLlcInformationStep] Inicializando miembros para llcType:', llcType);
        this.onLlcTypeChanged(llcType);
      }
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
   * Guarda los datos del paso (getRawValue incluye controles deshabilitados, p. ej. llcType cuando forceSingleMember)
   */
  private saveStepData(): void {
    this.wizardStateService.setStepData(this.stepNumber, this.serviceDataForm.getRawValue());
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
        this.wizardApiService.uploadFile(formData)
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
   * Agrega un miembro con validaciones
   */
  addMember(): void {
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    const llcType = this.serviceDataForm.get('llcType')?.value;
    const defaultParticipation = llcType === 'single' ? 100 : 0;
    const memberGroup = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      passportNumber: ['', Validators.required],
      scannedPassportUrl: [''],
      nationality: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      percentageOfParticipation: [defaultParticipation, [Validators.required, Validators.min(0), Validators.max(100)]],
      memberAddress: this.fb.group({
        street: ['', Validators.required],
        unit: [''],
        city: ['', Validators.required],
        stateRegion: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['', Validators.required]
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
   * Valida si la sección actual está completa
   */
  isSectionValid(): boolean {
    if (this.currentSection === 1) {
      // Sección 1: Información de la LLC
      const llcType = this.serviceDataForm.get('llcType');
      const llcName = this.serviceDataForm.get('llcName');
      const businessDescription = this.serviceDataForm.get('businessDescription');
      
      return !!(llcType?.valid && llcName?.valid && businessDescription?.valid);
    }
    
    if (this.currentSection === 2) {
      // Sección 2: Miembros
      const membersArray = this.serviceDataForm.get('members') as FormArray;
      const llcType = this.serviceDataForm.get('llcType')?.value;
      
      // Para single member, debe haber al menos 1 miembro
      // Para multi member, debe haber al menos 2 miembros
      const minMembers = llcType === 'multi' ? 2 : 1;
      
      if (!membersArray || membersArray.length < minMembers) {
        return false;
      }
      
      // Validar que todos los miembros tengan los campos requeridos
      return membersArray.controls.every(member => member.valid);
    }
    
    // Sección 3: No tiene campos obligatorios estrictos
    return true;
  }

  /**
   * Marca los campos de la sección actual como touched para mostrar errores
   */
  markSectionAsTouched(): void {
    if (this.currentSection === 1) {
      this.serviceDataForm.get('llcType')?.markAsTouched();
      this.serviceDataForm.get('llcName')?.markAsTouched();
      this.serviceDataForm.get('businessDescription')?.markAsTouched();
    }
    
    if (this.currentSection === 2) {
      const membersArray = this.serviceDataForm.get('members') as FormArray;
      membersArray?.controls.forEach(member => {
        (member as FormGroup).markAllAsTouched();
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
      const formData = this.serviceDataForm.getRawValue();
      
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

  /**
   * Devuelve los datos del formulario para que el base los persista al avanzar (getRawValue incluye controles deshabilitados).
   */
  getFormData(): Record<string, unknown> {
    return this.serviceDataForm.getRawValue() as Record<string, unknown>;
  }

  /**
   * Al pulsar "Siguiente" en la última sección: guardar estado, persistir en API y luego emitir nextStepRequested.
   */
  async onLastSectionNext(): Promise<void> {
    if (!this.isSectionValid()) {
      this.markSectionAsTouched();
      return;
    }
    this.saveStepData();
    await this.saveToApi();
    this.nextStepRequested.emit();
  }

  onLlcTypeChanged(llcType: string): void {
    // Si forceSingleMember está activo y el usuario intenta cambiar a multi, revertir a single
    if (this.forceSingleMember && llcType === 'multi') {
      const llcTypeControl = this.serviceDataForm.get('llcType');
      if (llcTypeControl) {
        llcTypeControl.setValue('single', { emitEvent: false });
      }
      return; // Salir sin procesar el cambio a multi
    }

    const membersArray = this.serviceDataForm.get('members') as FormArray;
    
    if (llcType === 'single') {
      // Si cambia a single, mantener solo un miembro
      while (membersArray.length > 1) {
        membersArray.removeAt(membersArray.length - 1);
      }
      if (membersArray.length === 0) {
        this.addMember();
      }
      // Regla: si es Single Member, el porcentaje siempre es 100%
      const member0 = membersArray.at(0) as FormGroup | undefined;
      const pctControl = member0?.get('percentageOfParticipation');
      if (pctControl) {
        pctControl.setValue(100, { emitEvent: true });
      }
    } else if (llcType === 'multi') {
      // Si cambia a multi, asegurar que hay al menos un miembro
      if (membersArray.length === 0) {
        this.addMember();
      }
    }
  }
}

