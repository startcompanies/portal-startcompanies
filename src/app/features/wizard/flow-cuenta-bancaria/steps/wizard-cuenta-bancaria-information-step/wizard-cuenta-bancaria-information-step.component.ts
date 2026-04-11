import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WizardStateService } from '../../../services/wizard-state.service';
import { WizardApiService } from '../../../services/wizard-api.service';
import { CuentaBancariaFormComponent } from '../../../../../shared/components/service-forms/cuenta-bancaria-form/cuenta-bancaria-form.component';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { US_STATES } from '../../../../../shared/constants/us-states.constant';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { isMultiMemberParticipationTotal100 } from '../../../../../shared/utils/member-participation-total.util';
import { ServiceFormBuilderService } from '../../../../../shared/services/form-builder.service';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  isOptionalPublicWebUrlControlOk,
  patchOptionalPublicUrlControlsByName,
} from '../../../../../shared/validators/web-url.validator';

/**
 * Componente wrapper para usar wizard-cuenta-bancaria-form en el wizard
 * Este componente inicializa el formulario y maneja la integración con el wizard
 */
@Component({
  selector: 'app-wizard-cuenta-bancaria-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CuentaBancariaFormComponent, TranslocoPipe],
  templateUrl: './wizard-cuenta-bancaria-information-step.component.html',
  styleUrls: ['./wizard-cuenta-bancaria-information-step.component.css']
})
export class WizardCuentaBancariaInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 2;
  @Input() previousStepNumber: number = 1;
  @Output() sectionChanged = new EventEmitter<number>();
  @Output() isMultiMemberChanged = new EventEmitter<boolean>();
  @Output() nextStepRequested = new EventEmitter<void>();

  serviceDataForm!: FormGroup;
  currentSection = 1;
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};
  
  /**
   * Verifica si la LLC es multimember
   */
  get isMultiMember(): boolean {
    const isMultiMemberValue = this.serviceDataForm.get('isMultiMember')?.value;
    return isMultiMemberValue === 'yes';
  }
  
  /**
   * Verifica si se deben mostrar los botones de navegación entre secciones
   */
  get shouldShowSectionNavigation(): boolean {
    return this.currentSection < this.totalSections;
  }
  
  usStates = US_STATES;

  totalSections = 6; // Total de secciones para Cuenta Bancaria

  private formSubscription?: Subscription;
  
  isSaving = false;
  saveError: string | null = null;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private fb: FormBuilder,
    private http: HttpClient,
    private serviceFormBuilder: ServiceFormBuilderService,
    private logger: LoggerService
  ) {
    this.serviceDataForm = this.serviceFormBuilder.createCuentaBancariaForm();
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.serviceDataForm);
    
    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      // Separar los propietarios para restaurarlos manualmente
      const { owners, ...restOfData } = savedData;
      this.serviceDataForm.patchValue(restOfData);
      
      // Restaurar propietarios manualmente
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      ownersArray.clear();
      if (owners && Array.isArray(owners)) {
        owners.forEach((ownerData: any) => {
          const participation = ownerData.participationPercentage || 0;
          const ownerGroup = this.createOwnerFormGroup(participation);
          ownerGroup.patchValue(ownerData);
          ownersArray.push(ownerGroup);
        });
      }
    }

    // Suscribirse a cambios de isMultiMember para ajustar propietarios
    this.serviceDataForm.get('isMultiMember')?.valueChanges.subscribe((isMultiMemberValue: string) => {
      this.handleMultiMemberChange(isMultiMemberValue);
      // Notificar al componente padre del cambio
      this.isMultiMemberChanged.emit(isMultiMemberValue === 'yes');
    });

    // Inicializar propietarios si ya hay un valor en isMultiMember
    const currentIsMultiMember = this.serviceDataForm.get('isMultiMember')?.value;
    if (currentIsMultiMember) {
      setTimeout(() => {
        this.handleMultiMemberChange(currentIsMultiMember);
        // Notificar al componente padre del valor inicial
        this.isMultiMemberChanged.emit(currentIsMultiMember === 'yes');
      }, 100);
    } else {
      // Si no hay valor, notificar que no es multimember
      this.isMultiMemberChanged.emit(false);
    }

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.serviceDataForm.valueChanges.subscribe(() => {
      this.saveStepData();
    });

    // Emitir la sección inicial
    this.sectionChanged.emit(this.currentSection);
  }

  /**
   * Maneja el cambio de isMultiMember para ajustar los propietarios
   */
  private handleMultiMemberChange(isMultiMemberValue: string): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    const isMultiMember = isMultiMemberValue === 'yes';
    
    if (!ownersArray) {
      this.serviceDataForm.addControl('owners', this.fb.array([]));
      return;
    }

    if (!isMultiMember) {
      // Single Member: debe haber exactamente 1 propietario con 100%
      if (ownersArray.length === 0) {
        // Crear un propietario
        const ownerGroup = this.createOwnerFormGroup(100);
        ownersArray.push(ownerGroup);
      } else if (ownersArray.length > 1) {
        // Eliminar extras, dejar solo el primero
        while (ownersArray.length > 1) {
          ownersArray.removeAt(ownersArray.length - 1);
        }
      }
      // Asegurar que el porcentaje sea 100%
      const firstOwner = ownersArray.at(0) as FormGroup;
      firstOwner.get('participationPercentage')?.setValue(100, { emitEvent: false });
    } else {
      // Multi Member: debe haber al menos 2 propietarios
      if (ownersArray.length === 0) {
        // Crear 2 propietarios
        const owner1 = this.createOwnerFormGroup(0);
        const owner2 = this.createOwnerFormGroup(0);
        ownersArray.push(owner1);
        ownersArray.push(owner2);
      } else if (ownersArray.length === 1) {
        // Agregar un segundo propietario
        const owner2 = this.createOwnerFormGroup(0);
        ownersArray.push(owner2);
      }
    }
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
    this.wizardStateService.setStepData(this.stepNumber, this.serviceDataForm.getRawValue());
  }

  /** Para fusión al paso de confirmación (incluye controles deshabilitados, igual que apertura LLC). */
  getFormData(): Record<string, unknown> {
    return { ...this.serviceDataForm.getRawValue(), currentSection: this.currentSection };
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
        this.logger.log(`[WizardUpload] Subiendo archivo con estructura: request/${serviceType}/${requestId}/`);
      } else {
        this.logger.log(`[WizardUpload] Subiendo archivo con estructura temporal: request/${serviceType}/`);
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
          this.logger.log(`[WizardUpload] Archivo subido exitosamente: ${response.url}`);
        }
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
  /**
   * Crea un FormGroup para un propietario
   */
  private createOwnerFormGroup(participationPercentage: number = 0): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      nationality: ['', Validators.required],
      passportNumber: ['', Validators.required],
      ssnItin: [''],
      cuit: [''],
      participationPercentage: [participationPercentage, [Validators.required, Validators.min(0), Validators.max(100)]],
      passportFileUrl: ['', Validators.required]
    });
  }

  onAddOwnerRequested(): void {
    let ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (!ownersArray) {
      ownersArray = this.fb.array([]);
      this.serviceDataForm.addControl('owners', ownersArray);
    }
    
    const isMultiMember = this.serviceDataForm.get('isMultiMember')?.value === 'yes';
    const defaultParticipation = isMultiMember ? 0 : 100;
    
    const ownerGroup = this.createOwnerFormGroup(defaultParticipation);
    ownersArray.push(ownerGroup);
  }

  /**
   * Elimina un propietario
   */
  onRemoveOwnerRequested(index: number): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    const isMultiMember = this.serviceDataForm.get('isMultiMember')?.value === 'yes';
    
    if (!ownersArray || ownersArray.length <= index) {
      return;
    }
    
    // Prevenir eliminar si es single member y solo hay 1 propietario
    if (!isMultiMember && ownersArray.length === 1) {
      return;
    }
    
    // Prevenir eliminar si es multi member y solo hay 2 propietarios (mínimo requerido)
    if (isMultiMember && ownersArray.length <= 2) {
      return;
    }
    
    ownersArray.removeAt(index);
  }

  /**
   * Valida si la sección actual está completa
   */
  isSectionValid(): boolean {
    if (this.currentSection === 1) {
      // Sección 1: Información del negocio
      const businessType = this.serviceDataForm.get('businessType');
      const legalBusinessName = this.serviceDataForm.get('legalBusinessName');
      const industry = this.serviceDataForm.get('industry');
      const numberOfEmployees = this.serviceDataForm.get('numberOfEmployees');
      const briefDescription = this.serviceDataForm.get('briefDescription');
      const einLetterUrl = this.serviceDataForm.get('einLetterUrl');
      const einNumber = this.serviceDataForm.get('einNumber');
      const articlesOrCertificateUrl = this.serviceDataForm.get('articlesOrCertificateUrl');

      return !!(
        businessType?.valid &&
        legalBusinessName?.valid &&
        industry?.valid &&
        numberOfEmployees?.valid &&
        briefDescription?.valid &&
        einLetterUrl?.valid &&
        einNumber?.valid &&
        articlesOrCertificateUrl?.valid &&
        isOptionalPublicWebUrlControlOk(
          this.serviceDataForm.get('websiteOrSocialMedia'),
        )
      );
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
      const validatorCitizenship = this.serviceDataForm.get('validatorCitizenship');
      const validatorPassportNumber = this.serviceDataForm.get('validatorPassportNumber');
      const validatorPassportUrl = this.serviceDataForm.get('validatorPassportUrl');
      const validatorWorkEmail = this.serviceDataForm.get('validatorWorkEmail');
      const validatorPhone = this.serviceDataForm.get('validatorPhone');

      return !!(validatorTitle?.valid && validatorFirstName?.valid && validatorLastName?.valid &&
                validatorDateOfBirth?.valid && validatorNationality?.valid && validatorCitizenship?.valid &&
                validatorPassportNumber?.valid && validatorPassportUrl?.valid &&
                validatorWorkEmail?.valid && validatorPhone?.valid);
    }
    
    if (this.currentSection === 4) {
      // Sección 4: Dirección personal del propietario
      const ownerPersonalStreet = this.serviceDataForm.get('ownerPersonalStreet');
      const ownerPersonalCity = this.serviceDataForm.get('ownerPersonalCity');
      const ownerPersonalState = this.serviceDataForm.get('ownerPersonalState');
      const ownerPersonalCountry = this.serviceDataForm.get('ownerPersonalCountry');
      const ownerPersonalPostalCode = this.serviceDataForm.get('ownerPersonalPostalCode');
      const serviceBillUrl = this.serviceDataForm.get('serviceBillUrl');

      return !!(ownerPersonalStreet?.valid && ownerPersonalCity?.valid && ownerPersonalState?.valid &&
                ownerPersonalCountry?.valid && ownerPersonalPostalCode?.valid && serviceBillUrl?.valid);
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

      const isMulti =
        isMultiMember === 'yes' || isMultiMember === true || String(isMultiMember) === 'true';
      if (isMulti) {
        if (!isMultiMemberParticipationTotal100(ownersArray, 'participationPercentage')) {
          return false;
        }
      }
      
      // Validar que todos los owners tengan los campos requeridos
      return (
        ownersArray.controls.every((owner) => owner.valid) &&
        isOptionalPublicWebUrlControlOk(
          this.serviceDataForm.get('websiteOrSocialMedia'),
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
      this.serviceDataForm.get('businessType')?.markAsTouched();
      this.serviceDataForm.get('legalBusinessName')?.markAsTouched();
      this.serviceDataForm.get('industry')?.markAsTouched();
      this.serviceDataForm.get('numberOfEmployees')?.markAsTouched();
      this.serviceDataForm.get('briefDescription')?.markAsTouched();
      this.serviceDataForm.get('einLetterUrl')?.markAsTouched();
      this.serviceDataForm.get('einNumber')?.markAsTouched();
      this.serviceDataForm.get('articlesOrCertificateUrl')?.markAsTouched();
      this.serviceDataForm.get('websiteOrSocialMedia')?.markAsTouched();
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
      this.serviceDataForm.get('validatorCitizenship')?.markAsTouched();
      this.serviceDataForm.get('validatorPassportNumber')?.markAsTouched();
      this.serviceDataForm.get('validatorPassportUrl')?.markAsTouched();
      this.serviceDataForm.get('validatorWorkEmail')?.markAsTouched();
      this.serviceDataForm.get('validatorPhone')?.markAsTouched();
    }
    
    if (this.currentSection === 4) {
      this.serviceDataForm.get('ownerPersonalStreet')?.markAsTouched();
      this.serviceDataForm.get('ownerPersonalCity')?.markAsTouched();
      this.serviceDataForm.get('ownerPersonalState')?.markAsTouched();
      this.serviceDataForm.get('ownerPersonalCountry')?.markAsTouched();
      this.serviceDataForm.get('ownerPersonalPostalCode')?.markAsTouched();
      this.serviceDataForm.get('serviceBillUrl')?.markAsTouched();
    }
    
    if (this.currentSection === 5) {
      this.serviceDataForm.get('isMultiMember')?.markAsTouched();
    }
    
    if (this.currentSection === 6) {
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      ownersArray?.controls.forEach(owner => {
        (owner as FormGroup).markAllAsTouched();
      });
      this.serviceDataForm.get('websiteOrSocialMedia')?.markAsTouched();
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
    if (this.currentSection === 1 || this.currentSection === 6) {
      patchOptionalPublicUrlControlsByName(this.serviceDataForm, [
        'websiteOrSocialMedia',
      ]);
    }
    // Validar sección actual antes de avanzar
    if (!this.isSectionValid()) {
      this.markSectionAsTouched();
      return;
    }
    
    // Si estamos en la sección 5 (Tipo de LLC) y no es multimember, terminar el flujo
    if (this.currentSection === 5) {
      const isMultiMemberValue = this.serviceDataForm.get('isMultiMember')?.value;
      if (isMultiMemberValue === 'no') {
        // Guardar datos en la API antes de terminar
        const ok = await this.saveToApi();
        if (ok) {
          this.nextStepRequested.emit();
        }
        return;
      }
    }
    
    if (this.currentSection < this.totalSections) {
      // Guardar datos en la API antes de avanzar
      const ok = await this.saveToApi();
      if (!ok) {
        return;
      }

      this.currentSection++;
      
      // Si se navega a la sección 6 (propietarios), inicializar propietarios según el tipo
      if (this.currentSection === 6) {
        const isMultiMemberValue = this.serviceDataForm.get('isMultiMember')?.value;
        if (isMultiMemberValue) {
          setTimeout(() => {
            this.handleMultiMemberChange(isMultiMemberValue);
          }, 100);
        }
      }
      
      this.sectionChanged.emit(this.currentSection);
    }
  }
  
  /**
   * Guarda los datos en la API
   */
  async saveToApi(): Promise<boolean> {
    this.saveError = null;

    let requestId = this.wizardStateService.getRequestId();
    
    // Si no hay requestId, intentar crear el request (para flujo sin pago)
    if (!requestId) {
      this.logger.log('[WizardCuentaBancariaInformationStep] No hay requestId, intentando crear request');
      
      // Verificar si el usuario está autenticado
      if (!this.wizardApiService.isAuthenticated()) {
        this.logger.log('[WizardCuentaBancariaInformationStep] Usuario no autenticado, no se puede crear request');
        this.saveError = 'Por favor, verifica tu email primero.';
        return false;
      }
      
      // Crear el request sin pago
      try {
        const allData = this.wizardStateService.getAllData();
        const step1Data = allData.step1 || {};
        const user = this.wizardApiService.getUser();
        
        if (!user) {
          this.saveError = 'Error de autenticación.';
          return false;
        }
        
        const requestData = {
          type: 'cuenta-bancaria' as const,
          currentStepNumber: this.currentSection,
          currentStep: this.stepNumber,
          status: 'pendiente' as const,
          notes: '',
          stripeToken: 'no-payment',
          paymentAmount: 0,
          paymentMethod: 'transferencia' as const,
          clientData: {
            firstName: step1Data.firstName || user.firstName || '',
            lastName: step1Data.lastName || user.lastName || '',
            email: step1Data.email || user.email,
            phone: step1Data.phone || user.phone || '',
            password: step1Data.password || ''
          },
          cuentaBancariaData: {}
        };
        
        this.logger.log('[WizardCuentaBancariaInformationStep] Creando request sin pago:', requestData);
        const response = await firstValueFrom(this.wizardApiService.createRequest(requestData));
        
        if (response && response.id) {
          this.wizardStateService.setRequestId(response.id);
          requestId = response.id;
          this.logger.log('[WizardCuentaBancariaInformationStep] Request creado:', response.id);
        } else {
          this.saveError = 'Error al crear la solicitud.';
          return false;
        }
      } catch (error: any) {
        this.logger.error('[WizardCuentaBancariaInformationStep] Error al crear request:', error);
        this.saveError = error?.error?.message || 'Error al crear la solicitud.';
        return false;
      }
    }
    
    if (!requestId) {
      this.logger.log('[WizardCuentaBancariaInformationStep] No se pudo obtener requestId');
      if (!this.saveError) {
        this.saveError = 'No hay solicitud asociada. Completa los pasos anteriores.';
      }
      return false;
    }
    
    this.isSaving = true;

    try {
      const formData = this.serviceDataForm.getRawValue();
      
      // Convertir el verificador (sección 3) y dirección personal (sección 4) en el primer member
      const validatorAsFirstMember = {
        firstName: formData.validatorFirstName || '',
        lastName: formData.validatorLastName || '',
        dateOfBirth: formData.validatorDateOfBirth || '',
        nationality: formData.validatorNationality || '',
        passportNumber: formData.validatorPassportNumber || '',
        email: formData.validatorWorkEmail || '',
        phoneNumber: formData.validatorPhone || '',
        scannedPassportUrl: formData.validatorPassportUrl || '',
        memberAddress: {
          street: formData.ownerPersonalStreet || '',
          unit: formData.ownerPersonalUnit || '',
          city: formData.ownerPersonalCity || '',
          stateRegion: formData.ownerPersonalState || '',
          postalCode: formData.ownerPersonalPostalCode || '',
          country: formData.ownerPersonalCountry || ''
        },
        percentageOfParticipation: 100, // El verificador es el único propietario si no es multimember
        validatesBankAccount: true, // Marcar que este member valida la cuenta bancaria
        ssnOrItin: '', // No se captura en el verificador
        nationalTaxId: '', // No se captura en el verificador
        taxFilingCountry: '', // No se captura en el verificador
        ownerContributions: 0,
        ownerLoansToLLC: 0,
        loansReimbursedByLLC: 0,
        profitDistributions: 0,
        spentMoreThan31DaysInUS: '', // No se captura en el verificador
        hasUSFinancialInvestments: '', // No se captura en el verificador
        isUSCitizen: formData.isUSResident === 'yes' ? 'si' : 'no'
      };

      // Si es multimember, agregar los owners adicionales después del verificador
      const additionalOwners = formData.owners || [];
      const allMembers = [validatorAsFirstMember, ...additionalOwners];
      
      const updateData = {
        type: 'cuenta-bancaria',
        currentStepNumber: this.currentSection,
        cuentaBancariaData: {
          ...formData,
          owners: allMembers
        }
      };
      
      this.logger.log('[WizardCuentaBancariaInformationStep] Guardando datos en API:', updateData);
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
      this.logger.log('[WizardCuentaBancariaInformationStep] Datos guardados exitosamente');
      return true;
    } catch (error: any) {
      this.logger.error('[WizardCuentaBancariaInformationStep] Error al guardar:', error);
      this.saveError = error?.error?.message || 'Error al guardar los datos';
      return false;
    } finally {
      this.isSaving = false;
    }
  }
}

