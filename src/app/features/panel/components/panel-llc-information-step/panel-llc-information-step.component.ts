import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RequestFlowStateService } from '../../../../shared/services/request-flow-state.service';
import { RequestFlowStep } from '../../../../shared/models/request-flow-context';
import { AperturaLlcFormComponent } from '../../../../shared/components/service-forms/apertura-llc-form/apertura-llc-form.component';
import { RequestsService } from '../../services/requests.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/**
 * Componente wrapper para usar apertura-llc-form en el panel
 * Este componente inicializa el formulario y maneja la integración con el panel
 */
@Component({
  selector: 'app-panel-llc-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AperturaLlcFormComponent],
  templateUrl: './panel-llc-information-step.component.html',
  styleUrls: ['./panel-llc-information-step.component.css']
})
export class PanelLlcInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 1;
  @Input() context: string = 'panel';
  @Input() serviceType: string = 'apertura-llc';
  @Input() previousStepNumber: number = 0;
  @Input() requestId?: number; // ID del request si ya fue creado (después del pago)
  @Input() initialData?: any; // Datos iniciales para hidratar el formulario
  
  @Output() sectionChanged = new EventEmitter<number>();
  @Output() stepValid = new EventEmitter<boolean>();

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
    { value: 'Wyoming', label: 'Wyoming', abbreviation: 'WY' },
    { value: 'District of Columbia', label: 'District of Columbia', abbreviation: 'DC' },
  ];

  private formSubscription?: Subscription;
  
  isSaving = false;
  saveError: string | null = null;

  // Restricción por plan: Pack Premium solo permite Single Member
  forceSingleMember = false;

  constructor(
    private flowStateService: RequestFlowStateService,
    private requestsService: RequestsService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    // Inicializar formulario con estructura de apertura-llc-form
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
    // Cargar datos guardados desde RequestFlowStateService
    const savedData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
    
    // Si hay datos iniciales (de hidratación), usarlos
    const dataToLoad = this.initialData || savedData;
    
    if (dataToLoad && Object.keys(dataToLoad).length > 0) {
      // Separar los miembros del resto de los datos
      const { members, currentSection, ...otherData } = dataToLoad;
      
      // Aplicar patchValue sin los miembros
      this.serviceDataForm.patchValue(otherData);
      
      // Restaurar sección actual si existe
      if (currentSection) {
        this.currentSection = currentSection;
      }
      
      // Restaurar miembros manualmente si existen
      if (members && Array.isArray(members) && members.length > 0) {
        const membersArray = this.serviceDataForm.get('members') as FormArray;
        while (membersArray.length > 0) {
          membersArray.removeAt(0);
        }
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
      }
    }

    // Obtener el estado seleccionado del paso anterior (estado y plan)
    const statePlanData = this.flowStateService.getStepData(RequestFlowStep.PLAN_STATE_SELECTION);
    if (statePlanData && statePlanData.state) {
      this.serviceDataForm.get('incorporationState')?.setValue(statePlanData.state);
    }

    // Verificar restricción de plan
    if (statePlanData?.plan === 'Premium' || statePlanData?.plan === 'Entrepreneur') {
      this.forceSingleMember = true;
      const llcTypeControl = this.serviceDataForm.get('llcType');
      if (llcTypeControl && llcTypeControl.value !== 'single') {
        llcTypeControl.setValue('single', { emitEvent: false });
      }
    }

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.serviceDataForm.valueChanges.subscribe(() => {
      this.saveStepData();
      this.updateStepValidity();
    });

    // Emitir la sección inicial
    this.sectionChanged.emit(this.currentSection);
    
    // Inicializar miembros si hay llcType
    const llcType = this.serviceDataForm.get('llcType')?.value;
    if (llcType) {
      this.onLlcTypeChanged(llcType);
    }
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  /**
   * Guarda los datos del paso en RequestFlowStateService
   */
  private saveStepData(): void {
    const formData = {
      ...this.serviceDataForm.value,
      currentSection: this.currentSection
    };
    this.flowStateService.setStepData(RequestFlowStep.SERVICE_FORM, formData);
  }

  /**
   * Actualiza la validez del paso
   */
  private updateStepValidity(): void {
    const isValid = this.isSectionValid();
    this.stepValid.emit(isValid);
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

      const formData = new FormData();
      formData.append('file', file);
      formData.append('servicio', serviceType);

      // Si ya hay un request creado, incluir el UUID
      if (this.requestId) {
        formData.append('requestUuid', this.requestId.toString());
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
        }
        
        // Limpiar el archivo del estado
        this.fileUploadStates[fileKey].file = null;
      }
    } catch (error: any) {
      console.error(`[PanelLlcInformationStep] Error al subir archivo ${fileKey}:`, error);
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
    this.updateStepValidity();
  }

  /**
   * Elimina un miembro
   */
  removeMember(index: number): void {
    const membersArray = this.serviceDataForm.get('members') as FormArray;
    if (membersArray.length > 1) {
      membersArray.removeAt(index);
      this.updateStepValidity();
    }
  }

  /**
   * Valida si la sección actual está completa
   */
  isSectionValid(): boolean {
    if (this.currentSection === 1) {
      const llcType = this.serviceDataForm.get('llcType');
      const llcName = this.serviceDataForm.get('llcName');
      const businessDescription = this.serviceDataForm.get('businessDescription');
      
      return !!(llcType?.valid && llcName?.valid && businessDescription?.valid);
    }
    
    if (this.currentSection === 2) {
      const membersArray = this.serviceDataForm.get('members') as FormArray;
      const llcType = this.serviceDataForm.get('llcType')?.value;
      
      const minMembers = llcType === 'multi' ? 2 : 1;
      
      if (!membersArray || membersArray.length < minMembers) {
        return false;
      }
      
      return membersArray.controls.every(member => member.valid);
    }
    
    return true;
  }

  /**
   * Navega a la sección anterior
   */
  goToPreviousSection(): void {
    if (this.currentSection > 1) {
      this.currentSection--;
      this.sectionChanged.emit(this.currentSection);
      this.updateStepValidity();
    }
  }

  /**
   * Navega a la siguiente sección
   */
  goToNextSection(): void {
    if (!this.isSectionValid()) {
      this.markSectionAsTouched();
      return;
    }
    
    if (this.currentSection < 3) {
      this.currentSection++;
      this.sectionChanged.emit(this.currentSection);
      this.updateStepValidity();
    }
  }

  /**
   * Marca los campos de la sección actual como touched
   */
  private markSectionAsTouched(): void {
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
   * Maneja el cambio de tipo de LLC
   */
  onLlcTypeChanged(llcType: string): void {
    if (this.forceSingleMember && llcType === 'multi') {
      const llcTypeControl = this.serviceDataForm.get('llcType');
      if (llcTypeControl) {
        llcTypeControl.setValue('single', { emitEvent: false });
      }
      return;
    }

    const membersArray = this.serviceDataForm.get('members') as FormArray;
    
    if (llcType === 'single') {
      while (membersArray.length > 1) {
        membersArray.removeAt(membersArray.length - 1);
      }
      if (membersArray.length === 0) {
        this.addMember();
      }
      const member0 = membersArray.at(0) as FormGroup | undefined;
      const pctControl = member0?.get('percentageOfParticipation');
      if (pctControl) {
        pctControl.setValue(100, { emitEvent: true });
      }
    } else if (llcType === 'multi') {
      if (membersArray.length === 0) {
        this.addMember();
      }
    }
    
    this.updateStepValidity();
  }

  /**
   * Valida el paso actual
   */
  validate(): boolean {
    this.markSectionAsTouched();
    return this.isSectionValid();
  }

  /**
   * Obtiene los datos del formulario
   */
  getFormData(): any {
    return {
      ...this.serviceDataForm.value,
      currentSection: this.currentSection
    };
  }
}
