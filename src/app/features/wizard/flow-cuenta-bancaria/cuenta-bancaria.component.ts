import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { WizardApiService } from '../services/wizard-api.service';
import { WizardConfigService, WizardFlowType } from '../services/wizard-config.service';
import { combineLatest } from 'rxjs';

// Componentes reutilizables
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardEmailVerificationComponent } from '../components/email-verification/email-verification.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

// Componente wrapper para información de cuenta bancaria
import { WizardCuentaBancariaInformationStepComponent } from './steps/wizard-cuenta-bancaria-information-step/wizard-cuenta-bancaria-information-step.component';

/**
 * Componente principal para el flujo de cuenta bancaria
 * Soporta dos variantes: con pago y sin pago
 * Usa los endpoints del wizard para registro y creación de solicitud
 */
@Component({
  selector: 'app-cuenta-bancaria',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoPipe,
    WizardBasicRegisterStepComponent,
    WizardEmailVerificationComponent,
    WizardPaymentStepComponent,
    WizardFinalReviewStepComponent,
    WizardCuentaBancariaInformationStepComponent
  ],
  templateUrl: './cuenta-bancaria.component.html',
  styleUrls: ['./cuenta-bancaria.component.css']
})
export class CuentaBancariaComponent implements OnInit {
  @ViewChild(WizardBasicRegisterStepComponent) registerStep?: WizardBasicRegisterStepComponent;
  
  withPayment: boolean = false;

  flowConfig!: any;
  currentStepIndex = 0;
  stepTitles: { [key: number]: string } = {};
  stepIcons: { [key: number]: string } = {};
  currentLang = 'es';
  
  // Estado del registro
  registeredEmail: string = '';
  registeredPassword: string = '';
  showEmailVerification = false;
  
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Para controlar la visibilidad de botones en el paso de información de cuenta bancaria
  cuentaBancariaInfoCurrentSection = 1;

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
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    // Inicializar el formulario de datos del servicio
    this.serviceDataForm = this.fb.group({});
    this.initializeCuentaBancariaForm(this.serviceDataForm);
  }

  ngOnInit(): void {
    // Determinar el tipo de flujo basado en la ruta o parámetro
    this.route.data.subscribe(data => {
      this.withPayment = data['withPayment'] || false;
      
      // Determinar el tipo de flujo basado en el parámetro withPayment
      const flowType = this.withPayment 
        ? WizardFlowType.CUENTA_BANCARIA_CON_PAGO 
        : WizardFlowType.CUENTA_BANCARIA_SIN_PAGO;
      
      this.flowConfig = this.wizardConfigService.getFlowConfig(flowType);
      console.log('Total steps', this.flowConfig.totalSteps);
      this.initializeStepIcons();
      this.initializeStepTitles();
    });
    
    this.currentLang = this.languageService.currentLang;
    this.translocoService.langChanges$.subscribe((l) => {
      this.currentLang = l;
      this.initializeStepTitles();
    });
  }

  private initializeStepIcons(): void {
    this.stepIcons = {};
    this.flowConfig.steps.forEach((step: any) => {
      this.stepIcons[step.stepNumber] = step.icon;
    });
  }

  private initializeStepTitles(): void {
    const translationKeys = this.flowConfig.steps.map((step: any) => 
      this.transloco.selectTranslate(step.translationKey)
    );

    combineLatest(translationKeys).subscribe((translations: any) => {
      this.flowConfig.steps.forEach((step: any, index: number) => {
        this.stepTitles[step.stepNumber] = translations[index];
      });
    });
  }

  onStepChanged(index: number): void {
    this.currentStepIndex = index;
  }

  /**
   * Maneja el evento cuando el usuario se registra
   */
  onUserCreated(event: { userId: number; email: string }): void {
    console.log('[CuentaBancariaComponent] Usuario registrado:', event);
    this.registeredEmail = event.email;
    const stepData = this.wizardStateService.getStepData(1);
    this.registeredPassword = stepData.password || '';
    this.showEmailVerification = true;
  }

  /**
   * Maneja la verificación exitosa del email
   */
  onEmailVerified(): void {
    console.log('[CuentaBancariaComponent] Email verificado exitosamente');
    this.showEmailVerification = false;
    this.currentStepIndex = 1; // Avanzar al siguiente paso
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
   * Envía la solicitud al backend usando el endpoint del wizard
   */
  async onFinish(): Promise<void> {
    if (this.isLoading) return;

    // Verificar que el usuario esté autenticado en el wizard
    if (!this.wizardApiService.isAuthenticated()) {
      this.errorMessage = 'Por favor, verifica tu email antes de enviar la solicitud.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const allData = this.wizardStateService.getAllData();
      console.log('[CuentaBancariaComponent] Datos finales del wizard:', allData);

      const step1Data = allData.step1 || {};
      const step2Data = allData.step2 || {};
      const step3Data = allData.step3 || {};
      const serviceData = this.serviceDataForm.value;

      // Verificar pago si es con pago
      if (this.withPayment && (!step3Data.stripePaymentProcessed || !step3Data.stripePaymentToken)) {
        this.errorMessage = 'Por favor, completa el pago antes de enviar la solicitud.';
        this.isLoading = false;
        return;
      }

      const user = this.wizardApiService.getUser();
      if (!user) {
        this.errorMessage = 'Error de autenticación. Por favor, vuelve a verificar tu email.';
        this.isLoading = false;
        return;
      }

      const requestData = {
        type: 'cuenta-bancaria' as const,
        currentStepNumber: 7,
        currentStep: this.flowConfig.totalSteps,
        status: 'pendiente' as const,
        notes: '',
        stripeToken: step3Data.stripePaymentToken || 'no-payment',
        paymentAmount: step3Data.amount || step2Data.amount || 0,
        paymentMethod: this.withPayment ? 'stripe' as const : 'transferencia' as const,
        clientData: {
          firstName: step1Data.firstName || user.firstName || '',
          lastName: step1Data.lastName || user.lastName || '',
          email: step1Data.email || user.email,
          phone: step1Data.phone || user.phone || '',
          password: step1Data.password || ''
        },
        cuentaBancariaData: {
          ...serviceData,
          owners: serviceData.owners || []
        }
      };

      console.log('[CuentaBancariaComponent] Enviando solicitud al wizard:', requestData);

      const response = await this.wizardApiService.createRequest(requestData).toPromise();

      console.log('[CuentaBancariaComponent] Solicitud creada exitosamente:', response);
      
      this.successMessage = '¡Solicitud creada exitosamente!';
      this.isLoading = false;

      this.wizardStateService.clear();

      setTimeout(() => {
        this.router.navigate(['/panel/my-requests']);
      }, 2000);

    } catch (error: any) {
      console.error('[CuentaBancariaComponent] Error al crear solicitud:', error);
      this.errorMessage = error?.error?.message || 'Error al crear la solicitud. Por favor, intenta nuevamente.';
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.wizardStateService.clear();
    this.currentLang === 'es'
      ? this.router.navigate(['/'])
      : this.router.navigate(['/en']);
  }

  /**
   * Inicializa el formulario de cuenta bancaria
   */
  private initializeCuentaBancariaForm(group: FormGroup): void {
    // Paso 1: Información de la LLC
    group.addControl('businessType', this.fb.control(''));
    group.addControl('legalBusinessName', this.fb.control(''));
    group.addControl('industry', this.fb.control(''));
    group.addControl('numberOfEmployees', this.fb.control(''));
    group.addControl('briefDescription', this.fb.control(''));
    group.addControl('websiteOrSocialMedia', this.fb.control(''));
    group.addControl('einLetterUrl', this.fb.control(''));
    group.addControl('einNumber', this.fb.control(''));
    group.addControl('articlesOrCertificateUrl', this.fb.control(''));
    
    // Paso 2: Dirección del Registered Agent
    group.addControl('registeredAgentStreet', this.fb.control(''));
    group.addControl('registeredAgentUnit', this.fb.control(''));
    group.addControl('registeredAgentCity', this.fb.control(''));
    group.addControl('registeredAgentState', this.fb.control(''));
    group.addControl('registeredAgentZipCode', this.fb.control(''));
    group.addControl('registeredAgentCountry', this.fb.control('United States'));
    group.addControl('incorporationState', this.fb.control(''));
    group.addControl('incorporationMonthYear', this.fb.control(''));
    group.addControl('countriesWhereBusiness', this.fb.control([]));
    
    // Paso 3: Información de la persona que verificará la cuenta bancaria
    group.addControl('validatorMemberId', this.fb.control(''));
    group.addControl('validatorTitle', this.fb.control(''));
    group.addControl('validatorIncomeSource', this.fb.control(''));
    group.addControl('validatorAnnualIncome', this.fb.control(''));
    group.addControl('validatorFirstName', this.fb.control(''));
    group.addControl('validatorLastName', this.fb.control(''));
    group.addControl('validatorDateOfBirth', this.fb.control(''));
    group.addControl('validatorNationality', this.fb.control(''));
    group.addControl('validatorCitizenship', this.fb.control(''));
    group.addControl('validatorPassportNumber', this.fb.control(''));
    group.addControl('validatorPassportUrl', this.fb.control(''));
    group.addControl('validatorWorkEmail', this.fb.control(''));
    group.addControl('validatorPhone', this.fb.control(''));
    group.addControl('canReceiveSMS', this.fb.control(false));
    group.addControl('isUSResident', this.fb.control(''));
    
    // Paso 4: Dirección personal del propietario
    group.addControl('ownerPersonalStreet', this.fb.control(''));
    group.addControl('ownerPersonalUnit', this.fb.control(''));
    group.addControl('ownerPersonalCity', this.fb.control(''));
    group.addControl('ownerPersonalState', this.fb.control(''));
    group.addControl('ownerPersonalCountry', this.fb.control(''));
    group.addControl('ownerPersonalPostalCode', this.fb.control(''));
    group.addControl('serviceBillUrl', this.fb.control(''));
    
    // Paso 5: Tipo de LLC
    group.addControl('isMultiMember', this.fb.control(''));
    group.addControl('llcType', this.fb.control(''));
    
    // Paso 6: Propietarios (FormArray)
    group.addControl('owners', this.fb.array([]));
  }

  /**
   * Maneja la selección de archivos
   */
  onFileSelected(event: { event: Event; formControlPath: string; fileKey: string }): void {
    // Implementar lógica de carga de archivos si es necesario
    console.log('File selected:', event);
  }

  /**
   * Maneja la limpieza de archivos
   */
  onFileCleared(event: { fileKey: string; formControlPath: string; inputId: string }): void {
    // Implementar lógica de limpieza de archivos si es necesario
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
      firstName: [''],
      lastName: [''],
      dateOfBirth: [''],
      nationality: [''],
      passportNumber: [''],
      ssnItin: [''],
      cuit: [''],
      participationPercentage: [''],
      passportFileUrl: ['']
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
