import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WizardStateService } from '../../../services/wizard-state.service';
import { WizardApiService } from '../../../services/wizard-api.service';
import { WizardRenovacionLlcFormComponent } from '../wizard-renovacion-llc-form/wizard-renovacion-llc-form.component';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

/**
 * Componente wrapper para usar wizard-renovacion-llc-form en el wizard
 * Este componente inicializa el formulario y maneja la integración con el wizard
 */
@Component({
  selector: 'app-wizard-renovacion-llc-information-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, WizardRenovacionLlcFormComponent],
  templateUrl: './wizard-renovacion-llc-information-step.component.html',
  styleUrls: ['./wizard-renovacion-llc-information-step.component.css']
})
export class WizardRenovacionLlcInformationStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 4;
  @Input() previousStepNumber: number = 3;
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

  // Tipos de LLC
  llcTypes = [
    { value: 'single', label: 'Single Member LLC', description: 'LLC con un solo miembro' },
    { value: 'multi', label: 'Multi Member LLC', description: 'LLC con múltiples miembros' }
  ];

  totalSections = 5; // Total de secciones para Renovación LLC

  private formSubscription?: Subscription;
  
  isSaving = false;
  saveError: string | null = null;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    // Inicializar formulario con estructura de renovacion-llc-form
    this.serviceDataForm = this.fb.group({});
    this.initializeRenovacionLlcForm(this.serviceDataForm);
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.serviceDataForm);
    
    // Obtener el estado y estructura societaria del paso 2 (Estado de contratación) PRIMERO
    const statePlanData = this.wizardStateService.getStepData(2); // Paso 2 es donde se selecciona estado y llcType
    if (statePlanData) {
      // Pre-llenar estado si existe
      if (statePlanData.state) {
        this.serviceDataForm.get('state')?.setValue(statePlanData.state, { emitEvent: false });
      }
      // Pre-llenar estructura societaria (llcType) si existe
      if (statePlanData.llcType) {
        this.serviceDataForm.get('llcType')?.setValue(statePlanData.llcType, { emitEvent: false });
      }
    }
    
    // Cargar datos guardados (después de pre-llenar desde paso 2)
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      // Separar los propietarios para restaurarlos manualmente
      const { owners, ...restOfData } = savedData;
      this.serviceDataForm.patchValue(restOfData);
      
      // Restaurar propietarios manualmente
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      ownersArray.clear(); // Limpiar antes de añadir
      if (owners && Array.isArray(owners)) {
        owners.forEach((ownerData: any) => {
          const ownerGroup = this.createOwnerFormGroup();
          ownerGroup.patchValue(ownerData);
          ownersArray.push(ownerGroup);
        });
      }
      
      // Si hay datos del paso 2, tienen prioridad sobre savedData
      if (statePlanData) {
        if (statePlanData.state) {
          this.serviceDataForm.get('state')?.setValue(statePlanData.state, { emitEvent: false });
        }
        if (statePlanData.llcType) {
          this.serviceDataForm.get('llcType')?.setValue(statePlanData.llcType, { emitEvent: false });
        }
      }
    }

    // Inicializar propietarios si llcType viene del paso 2 y no hay propietarios
    // Usar setTimeout para asegurar que el formulario esté completamente inicializado
    setTimeout(() => {
      const llcType = this.serviceDataForm.get('llcType')?.value;
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      if (llcType && ownersArray && ownersArray.length === 0) {
        // Si hay llcType pero no hay propietarios, crear uno automáticamente
        this.onAddOwnerRequested();
        console.log('[WizardRenovacionLlcInformationStep] Inicializado propietario automáticamente para llcType:', llcType);
      }
    }, 100);

    // Suscribirse a cambios de llcType para inicializar propietarios si es necesario
    this.serviceDataForm.get('llcType')?.valueChanges.subscribe((newLlcType: string) => {
      if (newLlcType) {
        const currentOwnersArray = this.serviceDataForm.get('owners') as FormArray;
        if (currentOwnersArray && currentOwnersArray.length === 0) {
          // Si cambia a un tipo y no hay propietarios, crear uno
          this.onAddOwnerRequested();
        } else if (newLlcType === 'single' && currentOwnersArray && currentOwnersArray.length > 1) {
          // Si cambia a single y hay más de uno, dejar solo el primero
          while (currentOwnersArray.length > 1) {
            currentOwnersArray.removeAt(currentOwnersArray.length - 1);
          }
          // Asegurar que el porcentaje sea 100%
          const firstOwner = currentOwnersArray.at(0) as FormGroup;
          firstOwner.get('participationPercentage')?.setValue(100, { emitEvent: false });
        } else if (newLlcType === 'single' && currentOwnersArray && currentOwnersArray.length === 1) {
          // Si es single y hay un propietario, asegurar que el porcentaje sea 100%
          const firstOwner = currentOwnersArray.at(0) as FormGroup;
          firstOwner.get('participationPercentage')?.setValue(100, { emitEvent: false });
        }
      }
    });

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
   * Inicializa el formulario de renovación LLC con validaciones
   */
  private initializeRenovacionLlcForm(group: FormGroup): void {
    // Sección 1: Información de la LLC (campos requeridos)
    group.addControl('llcName', this.fb.control('', Validators.required));
    group.addControl('state', this.fb.control(''));
    group.addControl('llcType', this.fb.control('', Validators.required));
    group.addControl('mainActivity', this.fb.control(''));
    group.addControl('hasPropertyInUSA', this.fb.control(''));
    group.addControl('almacenaProductosDepositoUSA', this.fb.control(''));
    group.addControl('contrataServiciosUSA', this.fb.control(''));
    group.addControl('tieneCuentasBancarias', this.fb.control(''));
    group.addControl('einNumber', this.fb.control(''));
    group.addControl('countriesWhereLLCDoesBusiness', this.fb.control([]));
    group.addControl('llcCreationDate', this.fb.control(''));
    group.addControl('declaracionInicial', this.fb.control(false));
    group.addControl('declaracionAnoCorriente', this.fb.control(false));
    group.addControl('cambioDireccionRA', this.fb.control(false));
    group.addControl('cambioNombre', this.fb.control(false));
    group.addControl('declaracionAnosAnteriores', this.fb.control(false));
    group.addControl('agregarCambiarSocio', this.fb.control(false));
    group.addControl('declaracionCierre', this.fb.control(false));
    group.addControl('owners', this.fb.array([]));
    group.addControl('llcOpeningCost', this.fb.control(''));
    group.addControl('paidToFamilyMembers', this.fb.control(''));
    group.addControl('paidToLocalCompanies', this.fb.control(''));
    group.addControl('paidForLLCFormation', this.fb.control(''));
    group.addControl('paidForLLCDissolution', this.fb.control(''));
    group.addControl('bankAccountBalanceEndOfYear', this.fb.control(''));
    group.addControl('totalRevenue2025', this.fb.control(''));
    group.addControl('hasFinancialInvestmentsInUSA', this.fb.control(''));
    group.addControl('hasFiledTaxesBefore', this.fb.control(''));
    group.addControl('wasConstitutedWithStartCompanies', this.fb.control(''));
    group.addControl('partnersPassportsFileUrl', this.fb.control(''));
    group.addControl('operatingAgreementAdditionalFileUrl', this.fb.control(''));
    group.addControl('form147Or575FileUrl', this.fb.control(''));
    group.addControl('articlesOfOrganizationAdditionalFileUrl', this.fb.control(''));
    group.addControl('boiReportFileUrl', this.fb.control(''));
    group.addControl('bankStatementsFileUrl', this.fb.control(''));
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
      const serviceType = 'renovacion-llc';
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
   * Crea un FormGroup para un propietario
   */
  private createOwnerFormGroup(): FormGroup {
    const llcType = this.serviceDataForm.get('llcType')?.value;
    const defaultParticipation = llcType === 'single' ? 100 : 0;
    return this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      fullAddress: ['', Validators.required],
      unit: [''],
      city: ['', Validators.required],
      stateRegion: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      nationality: ['', Validators.required],
      passportNumber: ['', Validators.required],
      ssnItin: [''],
      cuit: [''],
      capitalContributions2025: [0],
      loansToLLC2025: [0],
      loansRepaid2025: [0],
      capitalWithdrawals2025: [0],
      hasInvestmentsInUSA: [''],
      isUSCitizen: [''],
      taxCountry: [''],
      wasInUSA31Days2025: [''],
      participationPercentage: [defaultParticipation, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  /**
   * Agrega un propietario
   */
  onAddOwnerRequested(): void {
    let ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (!ownersArray) {
      ownersArray = this.fb.array([]);
      this.serviceDataForm.addControl('owners', ownersArray);
    }
    
    const ownerGroup = this.createOwnerFormGroup();
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
      // Sección 1: Información de la LLC
      const llcName = this.serviceDataForm.get('llcName');
      const llcType = this.serviceDataForm.get('llcType');
      
      return !!(llcName?.valid && llcType?.valid);
    }
    
    if (this.currentSection === 2) {
      // Sección 2: Miembros/Owners
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      const llcType = this.serviceDataForm.get('llcType')?.value;
      
      // Para single member, debe haber al menos 1 owner
      // Para multi member, debe haber al menos 2 owners
      const minOwners = llcType === 'multi' ? 2 : 1;
      
      if (!ownersArray || ownersArray.length < minOwners) {
        return false;
      }
      
      // Validar que todos los owners tengan los campos requeridos
      return ownersArray.controls.every(owner => owner.valid);
    }
    
    // Sección 3 y siguientes no tienen campos obligatorios estrictos
    return true;
  }

  /**
   * Marca los campos de la sección actual como touched para mostrar errores
   */
  markSectionAsTouched(): void {
    if (this.currentSection === 1) {
      this.serviceDataForm.get('llcName')?.markAsTouched();
      this.serviceDataForm.get('llcType')?.markAsTouched();
    }
    
    if (this.currentSection === 2) {
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
      
      // Si se navega a la sección 2 (propietarios) y no hay propietarios, crear uno automáticamente
      if (this.currentSection === 2) {
        const llcType = this.serviceDataForm.get('llcType')?.value;
        const ownersArray = this.serviceDataForm.get('owners') as FormArray;
        if (llcType && ownersArray && ownersArray.length === 0) {
          this.onAddOwnerRequested();
          console.log('[WizardRenovacionLlcInformationStep] Inicializado propietario al navegar a sección 2');
        }
      }
      
      this.sectionChanged.emit(this.currentSection);
    }
  }
  
  /**
   * Guarda los datos en la API
   */
  async saveToApi(): Promise<void> {
    const requestId = this.wizardStateService.getRequestId();
    if (!requestId) {
      console.log('[WizardRenovacionLlcInformationStep] No hay requestId, saltando guardado en API');
      return;
    }
    
    this.isSaving = true;
    this.saveError = null;
    
    try {
      const formData = this.serviceDataForm.value;
      
      // Mapear owners a members con todos los campos necesarios
      const ownersArray = this.serviceDataForm.get('owners') as FormArray;
      const members = ownersArray ? ownersArray.controls.map((ownerControl: any) => {
        const ownerValue = ownerControl.value;
        return {
          // Campos básicos
          firstName: ownerValue.name || '',
          name: ownerValue.name || '', // Mantener ambos para compatibilidad
          lastName: ownerValue.lastName || '',
          dateOfBirth: ownerValue.dateOfBirth || '',
          email: ownerValue.email || '',
          phone: ownerValue.phone || '',
          phoneNumber: ownerValue.phone || '', // Alias para compatibilidad
          
          // Dirección
          fullAddress: ownerValue.fullAddress || '',
          unit: ownerValue.unit || '',
          city: ownerValue.city || '',
          stateRegion: ownerValue.stateRegion || '',
          postalCode: ownerValue.postalCode || '',
          country: ownerValue.country || '',
          
          // Documentos e identificación
          passportNumber: ownerValue.passportNumber || '',
          nationality: ownerValue.nationality || '',
          ssnItin: ownerValue.ssnItin || '',
          cuit: ownerValue.cuit || '',
          
          // Información financiera
          capitalContributions2025: ownerValue.capitalContributions2025 || 0,
          loansToLLC2025: ownerValue.loansToLLC2025 || 0,
          loansRepaid2025: ownerValue.loansRepaid2025 || 0,
          capitalWithdrawals2025: ownerValue.capitalWithdrawals2025 || 0,
          
          // Información fiscal
          hasInvestmentsInUSA: ownerValue.hasInvestmentsInUSA || '',
          isUSCitizen: ownerValue.isUSCitizen || '',
          taxCountry: ownerValue.taxCountry || '',
          wasInUSA31Days2025: ownerValue.wasInUSA31Days2025 || '',
          
          // Participación
          participationPercentage: ownerValue.participationPercentage || 0,
          percentageOfParticipation: ownerValue.participationPercentage || 0, // Alias para compatibilidad
        };
      }) : [];
      
      // Separar owners del resto de los datos para evitar duplicación
      const { owners, ...restOfFormData } = formData;
      
      const updateData = {
        type: 'renovacion-llc',
        currentStepNumber: this.currentSection,
        renovacionLlcData: {
          ...restOfFormData,
          members: members
        }
      };
      
      console.log('[WizardRenovacionLlcInformationStep] Guardando datos en API:', updateData);
      console.log('[WizardRenovacionLlcInformationStep] Members a enviar:', members);
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
      console.log('[WizardRenovacionLlcInformationStep] Datos guardados exitosamente');
      
    } catch (error: any) {
      console.error('[WizardRenovacionLlcInformationStep] Error al guardar:', error);
      this.saveError = error?.error?.message || 'Error al guardar los datos';
    } finally {
      this.isSaving = false;
    }
  }
}

