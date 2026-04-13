import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceFormBuilderService } from '../../../../../shared/services/form-builder.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonModule } from '@angular/common';
import { WizardStateService } from '../../../services/wizard-state.service';
import { WizardApiService } from '../../../services/wizard-api.service';
import { AperturaLlcFormComponent } from '../../../../../shared/components/service-forms/apertura-llc-form/apertura-llc-form.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subscription, firstValueFrom } from 'rxjs';
import { WizardPlansService } from '../../../services/wizard-plans.service';
import { US_STATES } from '../../../../../shared/constants/us-states.constant';
import { isMultiMemberParticipationTotal100 } from '../../../../../shared/utils/member-participation-total.util';
import {
  isOptionalPublicWebUrlControlOk,
  patchOptionalPublicUrlControlsByName,
} from '../../../../../shared/validators/web-url.validator';
import {
  isPassportPhotoFile,
  isPassportPhotoRequired,
  syncMemberPassportPhotoValidators,
} from '../../../../../shared/utils/passport-photo-file.util';
import { PanelSnackBarService } from '../../../../panel/services/panel-snackbar.service';
import { TranslocoService } from '@jsverse/transloco';

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
  
  usStates = US_STATES;

  private formSubscription?: Subscription;
  
  isSaving = false;
  saveError: string | null = null;

  // Restricción por plan: Pack Premium solo permite Single Member
  forceSingleMember = false;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private fb: FormBuilder,
    private wizardPlansService: WizardPlansService,
    private serviceFormBuilder: ServiceFormBuilderService,
    private logger: LoggerService,
    private snackBar: PanelSnackBarService,
    private transloco: TranslocoService,
  ) {
    this.serviceDataForm = this.serviceFormBuilder.createAperturaLlcForm();
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.serviceDataForm);
    
    // Obtener el estado/plan seleccionado de forma robusta (independiente del número exacto de paso)
    const statePlanData = this.getStatePlanData();
    const normalizedPlanCode = this.normalizePlanCode(statePlanData?.plan);
    
    // Regla de negocio:
    // - Pack Premium: solo Single Member (New Mexico o Wyoming)
    // - Pack Emprendedor: el usuario puede elegir Single o Multi (estado fijo NM en otro bloque)
    this.forceSingleMember = this.isSingleMemberOnlyPlan(normalizedPlanCode);
    
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
        members.forEach((memberData: any, memberIndex: number) => {
          const llcForPassport = savedData.llcType ?? this.serviceDataForm.get('llcType')?.value;
          const passportReq = isPassportPhotoRequired(llcForPassport, memberIndex);
          const memberGroup = this.fb.group({
            firstName: [memberData.firstName || '', Validators.required],
            lastName: [memberData.lastName || '', Validators.required],
            passportNumber: [memberData.passportNumber || '', Validators.required],
            scannedPassportUrl: [
              memberData.scannedPassportUrl || '',
              passportReq ? Validators.required : [],
            ],
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
        syncMemberPassportPhotoValidators(
          membersArray,
          savedData.llcType ?? this.serviceDataForm.get('llcType')?.value,
        );
        this.logger.log('[WizardLlcInformationStep] Miembros restaurados:', membersArray.length);
      }
      
      // Si forceSingleMember está activo, sobrescribir el llcType guardado
      if (this.forceSingleMember && savedData.llcType !== 'single') {
        this.serviceDataForm.get('llcType')?.setValue('single', { emitEvent: false });
      }
    }

    // Estado según plan: Emprendedor = siempre New Mexico; Elite = elegido; Premium = NM o Wyoming
    if (normalizedPlanCode === 'Entrepreneur') {
      const nmState = 'New Mexico';
      this.serviceDataForm.get('incorporationState')?.setValue(nmState);
      this.serviceDataForm.get('incorporationState')?.disable(); // Fijo, no editable
      this.logger.log('[WizardLlcInformationStep] Pack Emprendedor: estado fijado a', nmState);
    } else if (statePlanData && statePlanData.state) {
      const stateValue = statePlanData.state;
      this.serviceDataForm.get('incorporationState')?.setValue(stateValue);
      this.logger.log('[WizardLlcInformationStep] Estado establecido desde paso anterior:', stateValue);
    }

    // Si forceSingleMember está activo (solo Pack Premium), forzar y bloquear estructura societaria
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
      
      this.logger.log('[WizardLlcInformationStep] Pack Premium - Single Member forzado');
    } else {
      // Si no hay forceSingleMember, verificar si hay un llcType guardado y inicializar miembros si es necesario
      const llcType = this.serviceDataForm.get('llcType')?.value;
      const membersArray = this.serviceDataForm.get('members') as FormArray;
      
      if (llcType && membersArray.length === 0) {
        // Si hay un llcType guardado pero no hay miembros (ni restaurados), inicializarlos
        this.logger.log('[WizardLlcInformationStep] Inicializando miembros para llcType:', llcType);
        this.onLlcTypeChanged(llcType);
      }
    }
    
    // También verificar si hay un estado guardado en los datos del paso actual
    if (savedData && savedData.incorporationState) {
      this.serviceDataForm.get('incorporationState')?.setValue(savedData.incorporationState);
    }

    const membersAfterInit = this.serviceDataForm.get('members') as FormArray;
    syncMemberPassportPhotoValidators(
      membersAfterInit,
      this.serviceDataForm.get('llcType')?.value,
    );

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
   * Obtiene los datos de estado/plan del wizard de forma robusta, sin depender
   * únicamente de previousStepNumber (que puede variar entre flujos o configuraciones).
   */
  private getStatePlanData(): any {
    // 1) Intentar con el paso indicado explícitamente
    const fromPrevious = this.wizardStateService.getStepData(this.previousStepNumber) || {};
    if (fromPrevious && (fromPrevious.plan || fromPrevious.state)) {
      return fromPrevious;
    }

    // 2) Usar getAllData para localizar el paso que contiene el plan/estado
    const allData: any = (this.wizardStateService as any).getAllData
      ? (this.wizardStateService as any).getAllData()
      : null;

    if (allData) {
      // Priorizar step2 (selección estado/plan clásico)
      if (allData.step2 && (allData.step2.plan || allData.step2.state)) {
        return allData.step2;
      }
      // Luego step3 (cuando el plan se haya guardado ahí)
      if (allData.step3 && (allData.step3.plan || allData.step3.state)) {
        return allData.step3;
      }
    }

    // Fallback: devolver lo que venga de previousStepNumber aunque esté incompleto
    return fromPrevious;
  }

  /**
   * Normaliza el código de plan a los valores internos del sistema
   * (Entrepreneur, Elite, Premium) independientemente de si llega el value o el label.
   */
  private normalizePlanCode(rawPlan: string | null | undefined): string | null {
    if (!rawPlan) {
      return null;
    }

    // 1) Intentar por value directo (Entrepreneur/Elite/Premium)
    const byValue = this.wizardPlansService.getPlan(rawPlan);
    if (byValue) {
      return byValue.value;
    }

    // 2) Intentar por label (ej. 'Pack Emprendedor', 'Pack Premium')
    const allPlans = this.wizardPlansService.getPlans();
    const byLabel = allPlans.find(p => p.label === rawPlan);
    if (byLabel) {
      return byLabel.value;
    }

    // 3) Fallback: devolver el plan como viene
    return rawPlan;
  }

  /**
   * Indica si el plan exige solo Single Member (actualmente solo Pack Premium).
   */
  private isSingleMemberOnlyPlan(planCode: string | null | undefined): boolean {
    if (!planCode) {
      return false;
    }
    return planCode === 'Premium';
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
    if (event.formControlPath === 'scannedPassportUrl' && !isPassportPhotoFile(file)) {
      input.value = '';
      this.snackBar.error(
        this.transloco.translate('PANEL.validation.passport_photo_only'),
      );
      return;
    }
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
        this.logger.log(`[WizardUpload] Subiendo archivo con estructura: request/${serviceType}/${requestId}/`);
      } else {
        this.logger.log(`[WizardUpload] Subiendo archivo con estructura temporal: request/${serviceType}/`);
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
          this.logger.log(`[WizardUpload] Archivo subido exitosamente: ${response.url}`);
        }
        
        // Limpiar el archivo del estado (ya fue subido)
        this.fileUploadStates[fileKey].file = null;
      }
    } catch (error: any) {
      this.logger.error(`[WizardUpload] Error al subir archivo ${fileKey}:`, error);
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
    const nextIndex = membersArray.length;
    const passportPhotoValidators = isPassportPhotoRequired(llcType, nextIndex)
      ? [Validators.required]
      : [];
    const defaultParticipation = llcType === 'single' ? 100 : 0;
    const memberGroup = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      passportNumber: ['', Validators.required],
      scannedPassportUrl: ['', passportPhotoValidators],
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
      syncMemberPassportPhotoValidators(
        membersArray,
        this.serviceDataForm.get('llcType')?.value,
      );
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
      const incorporationState = this.serviceDataForm.get('incorporationState');

      // En algunos planes ciertos campos se marcan como readonly deshabilitando el control.
      // Angular pone status="DISABLED" y típicamente `control.valid` => false aunque el valor sea correcto.
      // Por eso aquí tratamos los deshabilitados como válidos si tienen valor.
      const isFilled = (c: any) => c?.value !== null && c?.value !== undefined && `${c?.value}`.trim() !== '';
      const isValidOrDisabled = (c: any) => (c?.disabled ? isFilled(c) : c?.valid);

      return !!(
        isValidOrDisabled(llcType) &&
        isValidOrDisabled(llcName) &&
        isValidOrDisabled(businessDescription) &&
        isValidOrDisabled(incorporationState) &&
        isOptionalPublicWebUrlControlOk(this.serviceDataForm.get('linkedin'))
      );
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

      if (llcType === 'multi') {
        if (!isMultiMemberParticipationTotal100(membersArray, 'percentageOfParticipation')) {
          return false;
        }
      }
      
      // Validar que todos los miembros tengan los campos requeridos
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
        this.serviceDataForm.get('actividadFinancieraEsperada')?.valid &&
        isOptionalPublicWebUrlControlOk(
          this.serviceDataForm.get('projectOrCompanyUrl'),
        )
      );
    }

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
      this.serviceDataForm.get('incorporationState')?.markAsTouched();
      this.serviceDataForm.get('linkedin')?.markAsTouched();
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
      this.serviceDataForm.get('projectOrCompanyUrl')?.markAsTouched();
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
    if (this.currentSection === 1) {
      patchOptionalPublicUrlControlsByName(this.serviceDataForm, ['linkedin']);
    } else if (this.currentSection === 3) {
      patchOptionalPublicUrlControlsByName(this.serviceDataForm, [
        'projectOrCompanyUrl',
      ]);
    }
    // Validar sección actual antes de avanzar
    if (!this.isSectionValid()) {
      this.markSectionAsTouched();
      return;
    }
    
    if (this.currentSection < 3) {
      // Guardar datos en la API antes de avanzar
      const ok = await this.saveToApi();
      if (!ok) {
        return;
      }

      this.currentSection++;
      this.sectionChanged.emit(this.currentSection);
    }
  }
  
  /**
   * Guarda los datos en la API.
   * Requiere requestId existente (el request se crea en el paso de pago).
   */
  async saveToApi(): Promise<boolean> {
    this.saveError = null;

    let requestId = this.wizardStateService.getRequestId();

    if (!requestId) {
      // En los flujos donde "Información de la LLC" ocurre antes del pago
      // (o creación diferida al finalizar), no existe request todavía.
      // No debemos bloquear la navegación entre secciones.
      this.logger.log('[WizardLlcInformationStep] No hay requestId, omitiendo guardado en API por ahora');
      this.saveError = null;
      return true;
    }

    this.isSaving = true;

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

      this.logger.log('[WizardLlcInformationStep] Guardando datos en API:', updateData);
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
      this.logger.log('[WizardLlcInformationStep] Datos guardados exitosamente');
      return true;
    } catch (error: any) {
      this.logger.error('[WizardLlcInformationStep] Error al guardar:', error);
      this.saveError = error?.error?.message || 'Error al guardar los datos';
      return false;
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
    patchOptionalPublicUrlControlsByName(this.serviceDataForm, [
      'linkedin',
      'projectOrCompanyUrl',
    ]);
    if (!this.isSectionValid()) {
      this.markSectionAsTouched();
      return;
    }
    this.saveStepData();
    const ok = await this.saveToApi();
    if (!ok) {
      return;
    }
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

    syncMemberPassportPhotoValidators(
      membersArray,
      this.serviceDataForm.get('llcType')?.value,
    );
  }
}

