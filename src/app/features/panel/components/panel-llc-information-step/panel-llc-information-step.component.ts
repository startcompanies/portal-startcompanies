import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceFormBuilderService } from '../../../../shared/services/form-builder.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RequestFlowStateService } from '../../../../shared/services/request-flow-state.service';
import { RequestFlowStep } from '../../../../shared/models/request-flow-context';
import { AperturaLlcFormComponent } from '../../../../shared/components/service-forms/apertura-llc-form/apertura-llc-form.component';
import { RequestsService } from '../../services/requests.service';
import { WizardPlansService } from '../../../wizard/services/wizard-plans.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { US_STATES } from '../../../../shared/constants/us-states.constant';

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
  /** Paso principal del flujo (1-based) para enviar currentStep en PATCH y mantener BD consistente */
  @Input() flowStepNumber?: number;
  
  @Output() sectionChanged = new EventEmitter<number>();
  @Output() stepValid = new EventEmitter<boolean>();
  @Output() nextStepRequested = new EventEmitter<void>();
  @Output() requestCreated = new EventEmitter<{ requestId: number }>();

  serviceDataForm!: FormGroup;
  currentSection = 1;
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  
  usStates = US_STATES;

  private formSubscription?: Subscription;
  /** ID del request creado en este paso cuando paymentEnabled es false (panel no tiene paso de pago). */
  private _createdRequestId?: number;
  
  isSaving = false;
  saveError: string | null = null;

  // Restricción por plan: Pack Premium solo permite Single Member
  forceSingleMember = false;

  constructor(
    private flowStateService: RequestFlowStateService,
    private requestsService: RequestsService,
    private wizardPlansService: WizardPlansService,
    private fb: FormBuilder,
    private http: HttpClient,
    private serviceFormBuilder: ServiceFormBuilderService,
    private logger: LoggerService
  ) {
    this.serviceDataForm = this.serviceFormBuilder.createAperturaLlcForm();
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

    // Obtener el estado seleccionado del paso anterior (estado y plan), o del request hidratado (request.plan)
    const statePlanData = this.flowStateService.getStepData(RequestFlowStep.PLAN_STATE_SELECTION);
    const planFromService = (dataToLoad as any)?.plan; // Al recargar, el plan viene en request.plan y se hidrata en SERVICE_FORM
    const effectivePlan = statePlanData?.plan ?? planFromService;
    if (statePlanData && statePlanData.state) {
      this.serviceDataForm.get('incorporationState')?.setValue(statePlanData.state);
    }

    // Verificar restricción de plan (usar effectivePlan para que funcione al recargar con request.plan)
    if (effectivePlan === 'Premium' || effectivePlan === 'Entrepreneur') {
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

      const effectiveRequestId = this._createdRequestId ?? this.requestId;
      if (effectiveRequestId) {
        formData.append('requestUuid', effectiveRequestId.toString());
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
      this.logger.error(`[PanelLlcInformationStep] Error al subir archivo ${fileKey}:`, error);
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

    if (this.currentSection === 3) {
      // Sección 3: Información bancaria/financiera (campos con * rojo)
      return !!(
        this.serviceDataForm.get('serviceBillUrl')?.valid &&
        this.serviceDataForm.get('bankStatementUrl')?.valid &&
        this.serviceDataForm.get('periodicIncome10k')?.valid &&
        this.serviceDataForm.get('bankAccountLinkedEmail')?.valid &&
        this.serviceDataForm.get('bankAccountLinkedPhone')?.valid &&
        this.serviceDataForm.get('actividadFinancieraEsperada')?.valid
      );
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
      this.saveStepData(); // Actualizar estado del flujo para visibilidad de botones del base
      this.updateStepValidity();
    }
  }

  /**
   * Navega a la siguiente sección (guarda en API antes de avanzar).
   */
  async goToNextSection(): Promise<void> {
    if (!this.isSectionValid()) {
      this.markSectionAsTouched();
      return;
    }
    
    if (this.currentSection < 3) {
      await this.saveToApi();
      this.currentSection++;
      this.sectionChanged.emit(this.currentSection);
      this.saveStepData(); // Actualizar estado del flujo para que el base muestre Siguiente en última sección
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

    if (this.currentSection === 3) {
      this.serviceDataForm.get('serviceBillUrl')?.markAsTouched();
      this.serviceDataForm.get('bankStatementUrl')?.markAsTouched();
      this.serviceDataForm.get('periodicIncome10k')?.markAsTouched();
      this.serviceDataForm.get('bankAccountLinkedEmail')?.markAsTouched();
      this.serviceDataForm.get('bankAccountLinkedPhone')?.markAsTouched();
      this.serviceDataForm.get('actividadFinancieraEsperada')?.markAsTouched();
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

  /**
   * Al pulsar "Siguiente" en la última sección: guardar en API, actualizar estado y emitir nextStepRequested.
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

  /**
   * Guarda los datos en la API. Si paymentEnabled es false y no hay requestId, crea el request en el primer guardado.
   */
  async saveToApi(): Promise<void> {
    const effectiveId = this._createdRequestId ?? this.requestId;

    if (!effectiveId && !this.requestId && !environment.paymentEnabled) {
      // Crear request en el primer guardado del paso de Información (panel sin paso de pago).
      try {
        const clientSelection = this.flowStateService.getStepData(RequestFlowStep.CLIENT_SELECTION) || {};
        const clientAssociation = this.flowStateService.getStepData(RequestFlowStep.CLIENT_ASSOCIATION) || {};
        const statePlanData = this.flowStateService.getStepData(RequestFlowStep.PLAN_STATE_SELECTION) ||
          this.flowStateService.getStepData(RequestFlowStep.STATE_SELECTION) || {};
        const formData = this.serviceDataForm.getRawValue();

        const plan = statePlanData.plan || formData.plan || '';
        const amount = Number(statePlanData?.amount) || (plan ? this.wizardPlansService.calculateAmount(plan) : 0);
        const requestData: any = {
          type: 'apertura-llc',
          status: 'pendiente',
          paymentMethod: null,
          paymentAmount: amount,
        };
        if (clientSelection.clientId) {
          requestData.clientId = clientSelection.clientId;
        } else if (clientSelection.clientFirstName || clientAssociation.clientId) {
          requestData.clientData = {
            firstName: clientSelection.clientFirstName || clientAssociation.firstName || '',
            lastName: clientSelection.clientLastName || clientAssociation.lastName || '',
            email: clientSelection.clientEmail || clientAssociation.email || '',
            phone: clientSelection.clientPhone || clientAssociation.phone || '',
          };
        }
        requestData.plan = plan;
        requestData.aperturaLlcData = {
          incorporationState: statePlanData.state || statePlanData.incorporationState || formData.incorporationState || '',
          plan,
          ...formData,
          members: formData.members || [],
        };

        this.logger.log('[PanelLlcInformationStep] Creando request sin pago (paymentEnabled=false)');
        const response = await this.requestsService.createRequest(requestData);
        if (!response?.id) {
          this.logger.error('[PanelLlcInformationStep] createRequest no devolvió id');
          return;
        }
        this._createdRequestId = response.id;
        this.requestCreated.emit({ requestId: response.id });
        // Seguir con updateRequest para persistir el payload actual del paso.
      } catch (error: any) {
        this.logger.error('[PanelLlcInformationStep] Error al crear request:', error);
        this.saveError = error?.error?.message || 'Error al crear la solicitud';
        return;
      }
    }

    const id = this._createdRequestId ?? this.requestId;
    if (!id) {
      return;
    }

    this.isSaving = true;
    this.saveError = null;
    try {
      const statePlanData = this.flowStateService.getStepData(RequestFlowStep.PLAN_STATE_SELECTION) ||
        this.flowStateService.getStepData(RequestFlowStep.STATE_SELECTION) || {};
      const formData = this.serviceDataForm.getRawValue();
      const payload: any = {
        type: 'apertura-llc',
        currentStepNumber: this.currentSection,
        aperturaLlcData: {
          incorporationState: statePlanData.state || statePlanData.incorporationState || formData.incorporationState || '',
          plan: statePlanData.plan || formData.plan || '',
          ...formData,
          members: formData.members || [],
        },
      };
      if (typeof this.flowStepNumber === 'number' && this.flowStepNumber >= 1) {
        payload.currentStep = this.flowStepNumber;
      }
      await this.requestsService.updateRequest(id, payload);
    } catch (error: any) {
      this.logger.error('[PanelLlcInformationStep] Error al guardar:', error);
      this.saveError = error?.error?.message || 'Error al guardar los datos';
    } finally {
      this.isSaving = false;
    }
  }
}
