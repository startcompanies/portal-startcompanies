import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { WizardApiService } from '../services/wizard-api.service';
import { WizardConfigService, WizardFlowType } from '../services/wizard-config.service';
import { combineLatest, firstValueFrom } from 'rxjs';

// Componentes reutilizables
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardEmailVerificationComponent } from '../components/email-verification/email-verification.component';
import { WizardStateSelectionStepComponent } from '../components/state-selection-step/state-selection-step.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

// Componente wrapper para información de renovación LLC
import { WizardRenovacionLlcInformationStepComponent } from './steps/wizard-renovacion-llc-information-step/wizard-renovacion-llc-information-step.component';

/**
 * Componente principal para el flujo de renovación de LLC
 * 
 * FLUJO:
 * 1. Registro → verificación email
 * 2. Selección de estado
 * 3. Pago → SE CREA EL REQUEST EN BD
 * 4. Información de renovación → SE ACTUALIZA EL REQUEST
 * 5. Revisión final
 */
@Component({
  selector: 'app-llc-renovacion',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoPipe,
    WizardBasicRegisterStepComponent,
    WizardEmailVerificationComponent,
    WizardStateSelectionStepComponent,
    WizardPaymentStepComponent,
    WizardRenovacionLlcInformationStepComponent,
    WizardFinalReviewStepComponent,
  ],
  templateUrl: './llc-renovacion.component.html',
  styleUrls: ['./llc-renovacion.component.css']
})
export class LLCRenovacionComponent implements OnInit {
  @ViewChild(WizardBasicRegisterStepComponent) registerStep?: WizardBasicRegisterStepComponent;
  @ViewChild(WizardPaymentStepComponent) paymentStep?: WizardPaymentStepComponent;
  
  flowConfig!: any;
  currentStepIndex = 0;
  stepTitles: { [key: number]: string } = {};
  currentLang = 'es';
  
  // Estado del registro
  registeredEmail: string = '';
  registeredPassword: string = '';
  showEmailVerification = false;
  
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  
  // Control de envío exitoso
  isSubmitted = false;
  
  // Control del pago
  paymentProcessed = false;
  
  stepIcons: { [key: number]: string } = {
    1: 'bi-person-plus',
    2: 'bi-geo-alt',
    3: 'bi-credit-card',
    4: 'bi-person-vcard',
    5: 'bi-check-circle',
  };

  // Para controlar la visibilidad de botones en el paso 4 (Información LLC)
  renovacionInfoCurrentSection = 1;

  // Formulario de datos del servicio
  serviceDataForm!: FormGroup;
  
  // Estados de USA
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

  // Estado de carga de archivos
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};

  constructor(
    private wizardConfigService: WizardConfigService,
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private transloco: TranslocoService,
    private languageService: LanguageService,
    public translocoService: TranslocoService,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Inicializar el formulario de datos del servicio
    this.serviceDataForm = this.fb.group({});
    this.initializeRenovacionLlcForm(this.serviceDataForm);
  }

  ngOnInit(): void {
    // Verificar si hay un estado guardado del mismo servicio
    const savedServiceType = this.wizardStateService.getServiceType();
    
    // Si el servicio guardado es diferente, limpiar el estado
    if (savedServiceType && savedServiceType !== 'renovacion-llc') {
      console.log('[LLCRenovacionComponent] Servicio diferente guardado, limpiando estado');
      this.wizardStateService.clear();
    }
    
    // Establecer el tipo de servicio
    this.wizardStateService.setServiceType('renovacion-llc');
    
    this.flowConfig = this.wizardConfigService.getFlowConfig(WizardFlowType.LLC_RENOVACION);
    this.initializeStepTitles();
    this.currentLang = this.languageService.currentLang;
    this.translocoService.langChanges$.subscribe((l) => {
      this.currentLang = l;
      this.initializeStepTitles();
    });
    
    // Restaurar el paso desde localStorage si existe
    const savedStep = this.wizardStateService.getCurrentStep();
    const savedStepNumber = this.wizardStateService.getCurrentStepNumber();
    
    // Verificar si el usuario ya está autenticado y si hay un request existente
    if (this.wizardApiService.isAuthenticated()) {
      console.log('[LLCRenovacionComponent] Usuario ya autenticado');
      if (this.wizardStateService.hasRequest()) {
        this.paymentProcessed = true;
        
        // Restaurar el paso guardado si es válido (después del pago)
        if (savedStep >= 2) {
          this.currentStepIndex = savedStep - 1; // Convertir a índice base 0
          this.renovacionInfoCurrentSection = savedStepNumber || 1;
          console.log('[LLCRenovacionComponent] Restaurando paso:', this.currentStepIndex, 'sección:', this.renovacionInfoCurrentSection);
        } else {
          this.currentStepIndex = 3; // Ir al paso de información si ya pagó
        }
      } else {
        // Usuario autenticado pero sin request
        this.currentStepIndex = savedStep >= 1 ? savedStep - 1 : 1;
      }
    } else if (savedStep > 1) {
      // No está autenticado pero hay un paso guardado mayor a 1
      console.log('[LLCRenovacionComponent] Estado inconsistente, reseteando');
      this.wizardStateService.clear();
      this.currentStepIndex = 0;
    }
  }

  private initializeStepTitles(): void {
    combineLatest([
      this.transloco.selectTranslate('WIZARD.steps.register'),
      this.transloco.selectTranslate('WIZARD.steps.state'),
      this.transloco.selectTranslate('WIZARD.steps.payment'),
      this.transloco.selectTranslate('WIZARD.steps.client'),
      this.transloco.selectTranslate('WIZARD.steps.review'),
    ]).subscribe(([register, state, payment, client, review]) => {
      this.stepTitles = {
        1: register,
        2: state,
        3: payment,
        4: client,
        5: review,
      };
    });
  }

  onStepChanged(index: number): void {
    this.currentStepIndex = index;
    // Guardar el paso actual en localStorage (convertir a base 1)
    this.wizardStateService.setCurrentStep(index + 1);
  }

  /**
   * Maneja el evento cuando el usuario se registra
   */
  onUserCreated(event: { userId: number; email: string }): void {
    console.log('[LLCRenovacionComponent] Usuario registrado:', event);
    this.registeredEmail = event.email;
    const stepData = this.wizardStateService.getStepData(1);
    this.registeredPassword = stepData.password || '';
    this.showEmailVerification = true;
  }

  /**
   * Maneja la verificación exitosa del email
   */
  onEmailVerified(): void {
    console.log('[LLCRenovacionComponent] Email verificado exitosamente');
    this.showEmailVerification = false;
    this.currentStepIndex = 1; // Avanzar al siguiente paso
    this.wizardStateService.setCurrentStep(this.currentStepIndex + 1);
  }

  /**
   * Maneja el reenvío del código de verificación
   */
  async onResendCode(): Promise<void> {
    if (this.registerStep) {
      await this.registerStep.resendVerificationEmail();
    }
  }
  
  /**
   * Maneja el evento cuando el pago y la creación del request son exitosos
   */
  onPaymentAndRequestCreated(event: { requestId: number; paymentInfo: any }): void {
    console.log('[LLCRenovacionComponent] Pago procesado y request creado:', event);
    this.paymentProcessed = true;
    this.successMessage = '¡Pago procesado exitosamente!';
  }
  
  /**
   * Maneja el cambio de sección en el paso de información de renovación
   */
  onRenovacionInfoSectionChanged(section: number): void {
    this.renovacionInfoCurrentSection = section;
    // Guardar la sección actual en localStorage
    this.wizardStateService.setCurrentStepNumber(section);
  }
  
  /**
   * Maneja errores del pago
   */
  onPaymentError(error: string | null): void {
    this.errorMessage = error;
  }
  
  /**
   * Procesa el pago y avanza al siguiente paso
   */
  async processPaymentAndContinue(): Promise<void> {
    if (this.paymentProcessed) {
      this.currentStepIndex = 3;
      return;
    }
    
    if (this.paymentStep) {
      this.isLoading = true;
      const success = await this.paymentStep.processStripePayment();
      this.isLoading = false;
      
      if (success) {
        this.paymentProcessed = true;
        this.currentStepIndex = 3;
      }
    }
  }
  
  /**
   * Actualiza los datos del request en el backend
   */
  private async updateRequestData(): Promise<void> {
    const requestId = this.wizardStateService.getRequestId();
    if (!requestId) return;
    
    try {
      const allData = this.wizardStateService.getAllData();
      const step2Data = allData.step2 || {};
      const serviceData = this.serviceDataForm.value;
      
      const updateData = {
        type: 'renovacion-llc',
        currentStepNumber: this.currentStepIndex + 1,
        renovacionLlcData: {
          ...serviceData,
          state: step2Data.state || serviceData.state,
          members: serviceData.owners || []
        }
      };
      
      console.log('[LLCRenovacionComponent] Actualizando request:', requestId, updateData);
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
      console.log('[LLCRenovacionComponent] Request actualizado exitosamente');
    } catch (error: any) {
      console.error('[LLCRenovacionComponent] Error al actualizar request:', error);
    }
  }

  /**
   * Finaliza el wizard actualizando el request con los datos finales
   */
  async onFinish(): Promise<void> {
    if (this.isLoading) return;

    const requestId = this.wizardStateService.getRequestId();
    
    // Verificar que existe un request
    if (!requestId) {
      this.errorMessage = 'Error: No se encontró la solicitud. Por favor, completa el pago primero.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const allData = this.wizardStateService.getAllData();
      const step2Data = allData.step2 || {};
      const serviceData = this.serviceDataForm.value;
      
      console.log('[LLCRenovacionComponent] Datos finales del wizard:', serviceData);

      // Preparar datos para actualizar el request
      const updateData = {
        type: 'renovacion-llc',
        currentStepNumber: 6, // Paso final
        status: 'solicitud-recibida',
        renovacionLlcData: {
          ...serviceData,
          state: step2Data.state || serviceData.state,
          members: serviceData.owners || []
        }
      };

      console.log('[LLCRenovacionComponent] Actualizando solicitud:', requestId, updateData);

      // Actualizar la solicitud existente
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));

      console.log('[LLCRenovacionComponent] Solicitud actualizada exitosamente');
      
      this.successMessage = '¡Solicitud enviada exitosamente!';
      this.isSubmitted = true;
      this.isLoading = false;

      // Limpiar estado del wizard y tokens
      this.wizardStateService.clear();
      this.wizardApiService.clearToken();

    } catch (error: any) {
      console.error('[LLCRenovacionComponent] Error al actualizar solicitud:', error);
      this.errorMessage = error?.error?.message || 'Error al enviar la solicitud. Por favor, intenta nuevamente.';
      this.isLoading = false;
    }
  }

  /**
   * Navega al panel del usuario
   */
  onGoToPanel(): void {
    this.router.navigate(['/panel']);
  }

  /**
   * Navega al home
   */
  onGoToHome(): void {
    this.currentLang === 'es'
      ? this.router.navigate(['/'])
      : this.router.navigate(['/en']);
  }

  onCancel(): void {
    this.wizardStateService.clear();
    this.currentLang === 'es'
      ? this.router.navigate(['/'])
      : this.router.navigate(['/en']);
  }

  /**
   * Inicializa el formulario de renovación LLC
   */
  private initializeRenovacionLlcForm(group: FormGroup): void {
    // Información básica de la LLC
    group.addControl('llcName', this.fb.control(''));
    group.addControl('state', this.fb.control(''));
    group.addControl('llcType', this.fb.control(''));
    group.addControl('mainActivity', this.fb.control(''));
    
    // Preguntas sobre la empresa
    group.addControl('hasPropertyInUSA', this.fb.control(''));
    group.addControl('almacenaProductosDepositoUSA', this.fb.control(''));
    group.addControl('contrataServiciosUSA', this.fb.control(''));
    group.addControl('tieneCuentasBancarias', this.fb.control(''));
    
    // EIN y otros datos
    group.addControl('einNumber', this.fb.control(''));
    group.addControl('countriesWhereLLCDoesBusiness', this.fb.control([]));
    group.addControl('llcCreationDate', this.fb.control(''));
    
    // Tipo de declaración (checkboxes)
    group.addControl('declaracionInicial', this.fb.control(false));
    group.addControl('declaracionAnoCorriente', this.fb.control(false));
    group.addControl('cambioDireccionRA', this.fb.control(false));
    group.addControl('cambioNombre', this.fb.control(false));
    group.addControl('declaracionAnosAnteriores', this.fb.control(false));
    group.addControl('agregarCambiarSocio', this.fb.control(false));
    group.addControl('declaracionCierre', this.fb.control(false));
    
    // Paso 2: Información de Propietarios (single o multimember)
    const ownersArray = this.fb.array([]);
    group.addControl('owners', ownersArray);
    
    // Paso 3: Información Contable de la LLC
    group.addControl('llcOpeningCost', this.fb.control(''));
    group.addControl('paidToFamilyMembers', this.fb.control(''));
    group.addControl('paidToLocalCompanies', this.fb.control(''));
    group.addControl('paidForLLCFormation', this.fb.control(''));
    group.addControl('paidForLLCDissolution', this.fb.control(''));
    group.addControl('bankAccountBalanceEndOfYear', this.fb.control(''));
    
    // Paso 4: Movimientos Financieros de la LLC en 2025
    group.addControl('totalRevenue2025', this.fb.control(''));
    
    // Paso 5: Información Adicional de la LLC
    group.addControl('hasFinancialInvestmentsInUSA', this.fb.control(''));
    group.addControl('hasFiledTaxesBefore', this.fb.control(''));
    group.addControl('wasConstitutedWithStartCompanies', this.fb.control(''));
    
    // Documentos adicionales
    group.addControl('partnersPassportsFileUrl', this.fb.control(''));
    group.addControl('operatingAgreementAdditionalFileUrl', this.fb.control(''));
    group.addControl('form147Or575FileUrl', this.fb.control(''));
    group.addControl('articlesOfOrganizationAdditionalFileUrl', this.fb.control(''));
    group.addControl('boiReportFileUrl', this.fb.control(''));
    group.addControl('bankStatementsFileUrl', this.fb.control(''));
  }

  /**
   * Maneja la selección de archivos
   */
  onFileSelected(event: { event: Event; formControlPath: string; fileKey: string }): void {
    console.log('File selected:', event);
  }

  /**
   * Maneja la limpieza de archivos
   */
  onFileCleared(event: { fileKey: string; formControlPath: string; inputId: string }): void {
    console.log('File cleared:', event);
  }

  /**
   * Maneja la adición de propietarios
   */
  onAddOwnerRequested(): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (!ownersArray) {
      this.serviceDataForm.addControl('owners', this.fb.array([]));
    }
    
    const ownerGroup = this.fb.group({
      name: [''],
      lastName: [''],
      dateOfBirth: [''],
      email: [''],
      phone: [''],
      fullAddress: [''],
      unit: [''],
      city: [''],
      stateRegion: [''],
      postalCode: [''],
      country: [''],
      nationality: [''],
      passportNumber: [''],
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
      participationPercentage: [0]
    });
    
    ownersArray.push(ownerGroup);
  }

  /**
   * Maneja la eliminación de propietarios
   */
  onRemoveOwnerRequested(index: number): void {
    const ownersArray = this.serviceDataForm.get('owners') as FormArray;
    if (ownersArray && ownersArray.length > index) {
      ownersArray.removeAt(index);
    }
  }
}
