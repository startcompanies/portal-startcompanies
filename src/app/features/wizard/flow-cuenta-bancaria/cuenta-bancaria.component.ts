import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { WizardApiService } from '../services/wizard-api.service';
import { WizardConfigService, WizardFlowType } from '../services/wizard-config.service';
import { combineLatest, firstValueFrom } from 'rxjs';
import { WizardPlansService } from '../services/wizard-plans.service';

// Componentes reutilizables
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardEmailVerificationComponent } from '../components/email-verification/email-verification.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

// Componente wrapper para información de cuenta bancaria
import { WizardCuentaBancariaInformationStepComponent } from './steps/wizard-cuenta-bancaria-information-step/wizard-cuenta-bancaria-information-step.component';
import { US_STATES } from '../../../shared/constants/us-states.constant';

/**
 * Componente principal para el flujo de cuenta bancaria
 * Soporta dos variantes: con pago y sin pago
 * 
 * FLUJO CON PAGO:
 * 1. Registro → verificación email
 * 2. Pago → SE CREA EL REQUEST EN BD
 * 3. Información cuenta bancaria → SE ACTUALIZA EL REQUEST
 * 4. Revisión final
 * 
 * FLUJO SIN PAGO:
 * 1. Registro → verificación email
 * 2. Información cuenta bancaria → SE CREA EL REQUEST EN BD
 * 3. Revisión final
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
  @ViewChild(WizardEmailVerificationComponent) emailVerificationStep?: WizardEmailVerificationComponent;
  @ViewChild(WizardPaymentStepComponent) paymentStep?: WizardPaymentStepComponent;
  @ViewChild(WizardCuentaBancariaInformationStepComponent) cuentaBancariaInfoStep?: WizardCuentaBancariaInformationStepComponent;
  
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
  
  // Control de envío exitoso
  isSubmitted = false;
  submitFailed = false;

  // Para controlar la visibilidad de botones en el paso de información de cuenta bancaria
  cuentaBancariaInfoCurrentSection = 1;
  
  // Control del tipo de LLC (Multi-Member)
  isMultiMember: boolean = false;
  
  // Control del pago
  paymentProcessed = false;

  bankAccountFixedAmountUsd: number = 99;

  // Formulario de datos del servicio
  serviceDataForm!: FormGroup;
  
  usStates = US_STATES;

  // Estado de carga de archivos
  fileUploadStates: { [key: string]: { file: File | null; uploading: boolean; progress: number } } = {};

  constructor(
    private wizardConfigService: WizardConfigService,
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private wizardPlansService: WizardPlansService,
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
    this.bankAccountFixedAmountUsd = this.wizardPlansService.getBankAccountFixedAmountUsd();
  }

  ngOnInit(): void {
    // Verificar si hay un estado guardado del mismo servicio
    const savedServiceType = this.wizardStateService.getServiceType();
    
    // Si el servicio guardado es diferente, limpiar el estado
    if (savedServiceType && savedServiceType !== 'cuenta-bancaria') {
      console.log('[CuentaBancariaComponent] Servicio diferente guardado, limpiando estado');
      this.wizardStateService.clear();
    }
    
    // Establecer el tipo de servicio
    this.wizardStateService.setServiceType('cuenta-bancaria');
    
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
    
    // Restaurar el paso desde localStorage si existe
    const savedStep = this.wizardStateService.getCurrentStep();
    const savedStepNumber = this.wizardStateService.getCurrentStepNumber();
    
    // Verificar si el usuario ya está autenticado y si hay un request existente
    if (this.wizardApiService.isAuthenticated()) {
      console.log('[CuentaBancariaComponent] Usuario ya autenticado');
      if (this.wizardStateService.hasRequest()) {
        this.paymentProcessed = true;
        
        // Restaurar el paso guardado si es válido
        if (savedStep >= 1) {
          this.currentStepIndex = savedStep - 1; // Convertir a índice base 0
          this.cuentaBancariaInfoCurrentSection = savedStepNumber || 1;
          console.log('[CuentaBancariaComponent] Restaurando paso:', this.currentStepIndex, 'sección:', this.cuentaBancariaInfoCurrentSection);
        } else {
          // Ir al paso de información
          this.currentStepIndex = this.withPayment ? 2 : 1;
        }
      } else {
        // Usuario autenticado pero sin request
        this.currentStepIndex = savedStep >= 1 ? savedStep - 1 : 1;
      }
    } else if (savedStep > 1) {
      // No está autenticado pero hay un paso guardado mayor a 1
      console.log('[CuentaBancariaComponent] Estado inconsistente, reseteando');
      this.wizardStateService.clear();
      this.currentStepIndex = 0;
    }
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

  /** Etiqueta del paso para el indicador móvil (solo presentación). */
  getStepLabelForIndex(index: number): string {
    if (this.withPayment) {
      const labels = ['Registro Básico', 'Pago', 'Datos de Cuenta Bancaria', 'Revisión Final'];
      return labels[index] ?? 'Paso';
    }
    const labels = ['Registro Básico', 'Datos de Cuenta Bancaria', 'Revisión Final'];
    return labels[index] ?? 'Paso';
  }

  async onStepChanged(index: number): Promise<void> {
    // Antes de cambiar de paso, asegurar que los datos estén guardados
    // Si estamos saliendo del paso de información de cuenta bancaria, guardar los datos
    const isLeavingInfoStep = this.currentStepIndex === (this.withPayment ? 2 : 1);
    const isGoingToReview = index === (this.withPayment ? 3 : 2);
    
    if (isLeavingInfoStep && isGoingToReview && this.cuentaBancariaInfoStep) {
      // Asegurar que currentSection esté actualizado antes de guardar
      // Si isMultiMember = "no" y estamos en la sección 5, asegurar que currentSection sea 5
      if (this.cuentaBancariaInfoCurrentSection === 5 && !this.isMultiMember) {
        // Asegurar que el currentSection del componente hijo sea 5 antes de guardar
        if (this.cuentaBancariaInfoStep.currentSection !== 5) {
          this.cuentaBancariaInfoStep.currentSection = 5;
        }
      }
      // Guardar los datos en la API antes de navegar
      const saved = await this.cuentaBancariaInfoStep.saveToApi();
      if (!saved) {
        return;
      }
      console.log('[CuentaBancariaComponent] Datos guardados en API antes de navegar a revisión, currentSection:', this.cuentaBancariaInfoStep.currentSection);
    }
    
    this.currentStepIndex = index;
    // Guardar el paso actual en localStorage (convertir a base 1)
    this.wizardStateService.setCurrentStep(index + 1);
  }

  /**
   * Navega al siguiente paso asegurando el flujo de registro → verificación de email.
   */
  async nextStep(): Promise<void> {
    this.errorMessage = null;

    // Paso 1 (registro): impedir avanzar si el formulario del registro no está válido
    // (aplique incluso si ya hay sesión del wizard).
    if (this.currentStepIndex === 0 && !this.showEmailVerification && this.registerStep) {
      if (!this.registerStep.canProceed()) {
        this.registerStep.form.markAllAsTouched();
        this.errorMessage =
          this.registerStep.errorMessage || 'Por favor completa todos los campos requeridos para continuar.';
        return;
      }
    }

    // Paso 1 (index 0): registro + verificación
    if (this.currentStepIndex === 0 && !this.wizardApiService.isAuthenticated()) {
      if (this.showEmailVerification) {
        return;
      }

      if (this.registerStep) {
        // Validar antes de registrar: evita mostrar verificación si faltan campos obligatorios
        if (!this.registerStep.canProceed()) {
          this.registerStep.form.markAllAsTouched();
          this.errorMessage = this.registerStep.errorMessage || 'Por favor completa todos los campos requeridos para continuar.';
          return;
        }

        await this.registerStep.registerUser();

        if (this.registerStep.waitingEmailVerification && this.registerStep.registeredEmail) {
          this.registeredEmail = this.registerStep.registeredEmail;
          const stepData = this.wizardStateService.getStepData(1);
          this.registeredPassword = stepData?.password || '';
          this.showEmailVerification = true;
        } else {
          this.errorMessage =
            this.registerStep.errorMessage || 'No se pudo completar el registro. Revisa los campos e intenta nuevamente.';
        }
        return;
      }

      // Guard-rail: en paso 1 sin autenticación, no se debe avanzar
      this.errorMessage = this.errorMessage || 'Completa el registro antes de continuar.';
      return;
    }

    // Si estamos avanzando al paso de información de cuenta bancaria (sin pago)
    // y no hay request, crearlo
    if (this.currentStepIndex === 0 && !this.withPayment && this.wizardApiService.isAuthenticated()) {
      if (!this.wizardStateService.hasRequest()) {
        console.log('[CuentaBancariaComponent] Creando request sin pago al avanzar al paso de información');
        const created = await this.createRequestWithoutPayment();
        if (!created) {
          this.errorMessage = 'Error al crear la solicitud. Por favor, intenta nuevamente.';
          return;
        }
      }
    }

    // Si el siguiente paso es pago, el propio PaymentStep controla la autenticación.
    // Acá solo avanzamos de forma lineal.
    this.currentStepIndex++;
    this.showEmailVerification = false;
    this.wizardStateService.setCurrentStep(this.currentStepIndex + 1);
  }

  /**
   * Navega al paso anterior y permite volver desde la pantalla de verificación.
   */
  previousStep(): void {
    if (this.showEmailVerification) {
      this.showEmailVerification = false;
      return;
    }

    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.wizardStateService.setCurrentStep(this.currentStepIndex + 1);
    }
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
  async onEmailVerified(): Promise<void> {
    console.log('[CuentaBancariaComponent] Email verificado exitosamente');
    this.showEmailVerification = false;
    
    // Si es flujo sin pago, crear el request antes de avanzar al paso de información
    if (!this.withPayment && !this.wizardStateService.hasRequest()) {
      console.log('[CuentaBancariaComponent] Creando request sin pago al verificar email');
      const created = await this.createRequestWithoutPayment();
      if (!created) {
        this.errorMessage = 'Error al crear la solicitud. Por favor, intenta nuevamente.';
        return;
      }
    }
    
    this.currentStepIndex = 1; // Avanzar al siguiente paso (información de cuenta bancaria)
    this.wizardStateService.setCurrentStep(this.currentStepIndex + 1);
  }

  /**
   * Maneja el reenvío del código de verificación
   * Usa los datos guardados en el estado del wizard en lugar del ViewChild
   */
  async onResendCode(): Promise<void> {
    // Obtener datos del registro desde el estado guardado
    const stepData = this.wizardStateService.getStepData(1);
    const email = this.registeredEmail || stepData.email;
    const password = this.registeredPassword || stepData.password;
    const fullName = stepData.fullName || `${stepData.firstName || ''} ${stepData.lastName || ''}`.trim();
    const phone = stepData.phone;

    if (!email || !password) {
      this.emailVerificationStep?.notifyResendResult(
        false, 
        'No se encontró el email o contraseña. Por favor, vuelve al paso de registro.'
      );
      return;
    }

    try {
      // Separar nombre completo en firstName y lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Llamar directamente al servicio de API para reenviar el código
      await firstValueFrom(this.wizardApiService.register({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        password
      }));

      // Notificar éxito al componente de verificación
      this.emailVerificationStep?.notifyResendResult(
        true, 
        'Código de verificación reenviado. Por favor, revisa tu bandeja de entrada.'
      );
    } catch (error: any) {
      console.error('[CuentaBancariaComponent] Error al reenviar código:', error);
      // Si el error indica que el email ya está verificado, es bueno
      if (error?.error?.message?.includes('confirmado')) {
        this.emailVerificationStep?.notifyResendResult(
          true, 
          'Tu email ya está confirmado. Puedes continuar.'
        );
        // Si ya está verificado, permitir avanzar
        this.showEmailVerification = false;
        this.onEmailVerified();
      } else {
        // Notificar error al componente de verificación
        const errorMessage = error?.error?.message || 'Error al reenviar el código. Por favor, intenta nuevamente.';
        this.emailVerificationStep?.notifyResendResult(false, errorMessage);
      }
    }
  }
  
  /**
   * Maneja el evento cuando el pago y la creación del request son exitosos
   */
  onPaymentAndRequestCreated(event: { requestId: number; paymentInfo: any }): void {
    console.log('[CuentaBancariaComponent] Pago procesado y request creado:', event);
    this.paymentProcessed = true;
    this.successMessage = '¡Pago procesado exitosamente!';
  }
  
  /**
   * Maneja errores del pago
   */
  onPaymentError(error: string | null): void {
    this.errorMessage = error;
  }

  /**
   * Maneja el cambio de sección en el paso de información de cuenta bancaria
   */
  onCuentaBancariaInfoSectionChanged(section: number): void {
    // Si section es 0, significa que se debe avanzar al siguiente paso del wizard (no es multimember)
    if (section === 0) {
      // Avanzar al siguiente paso del wizard (revisión final)
      this.onStepChanged(this.withPayment ? 3 : 2);
      return;
    }
    
    this.cuentaBancariaInfoCurrentSection = section;
    // Guardar la sección actual en localStorage
    this.wizardStateService.setCurrentStepNumber(section);
    
    // Actualizar el valor de isMultiMember cuando cambia la sección
    this.updateIsMultiMember();
  }

  /**
   * Maneja el cambio de isMultiMember desde el componente hijo
   */
  onIsMultiMemberChanged(isMultiMember: boolean): void {
    this.isMultiMember = isMultiMember;
  }

  /**
   * Actualiza el valor de isMultiMember desde el formulario del componente hijo
   */
  private updateIsMultiMember(): void {
    const form = this.cuentaBancariaInfoStep?.serviceDataForm;
    if (!form) {
      this.isMultiMember = false;
      return;
    }
    const isMultiMemberValue = form.get('isMultiMember')?.value;
    this.isMultiMember = isMultiMemberValue === 'yes';
  }
  
  /**
   * Procesa el pago y avanza al siguiente paso (para flujo con pago)
   */
  async processPaymentAndContinue(): Promise<void> {
    if (!this.withPayment) {
      this.currentStepIndex = 2;
      return;
    }
    
    if (this.paymentProcessed) {
      this.currentStepIndex = 2;
      return;
    }
    
    if (this.paymentStep) {
      this.isLoading = true;
      const success = await this.paymentStep.processStripePayment();
      this.isLoading = false;
      
      if (success) {
        this.paymentProcessed = true;
        this.currentStepIndex = 2;
      }
    }
  }
  
  /**
   * Crea el request para flujo sin pago
   */
  async createRequestWithoutPayment(): Promise<boolean> {
    if (!this.wizardApiService.isAuthenticated()) {
      this.errorMessage = 'Por favor, verifica tu email primero.';
      return false;
    }
    
    if (this.wizardStateService.hasRequest()) {
      return true; // Ya existe un request
    }
    
    try {
      const allData = this.wizardStateService.getAllData();
      const step1Data = allData.step1 || {};
      const user = this.wizardApiService.getUser();
      
      if (!user) {
        this.errorMessage = 'Error de autenticación.';
        return false;
      }
      
      const requestData = {
        type: 'cuenta-bancaria' as const,
        currentStepNumber: 1,
        currentStep: this.currentStepIndex + 1,
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
      
      console.log('[CuentaBancariaComponent] Creando request sin pago:', requestData);
      const response = await firstValueFrom(this.wizardApiService.createRequest(requestData));
      
      if (response && response.id) {
        this.wizardStateService.setRequestId(response.id);
        console.log('[CuentaBancariaComponent] Request creado:', response.id);
      }
      
      return true;
    } catch (error: any) {
      console.error('[CuentaBancariaComponent] Error al crear request:', error);
      this.errorMessage = error?.error?.message || 'Error al crear la solicitud.';
      return false;
    }
  }
  
  /**
   * Actualiza los datos del request en el backend
   */
  private async updateRequestData(): Promise<void> {
    const requestId = this.wizardStateService.getRequestId();
    if (!requestId) return;
    
    try {
      const serviceData = this.serviceDataForm.value;
      
      const updateData = {
        type: 'cuenta-bancaria',
        cuentaBancariaData: {
          ...serviceData,
          owners: serviceData.owners || []
        }
      };
      
      console.log('[CuentaBancariaComponent] Actualizando request:', requestId, updateData);
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
      console.log('[CuentaBancariaComponent] Request actualizado exitosamente');
    } catch (error: any) {
      console.error('[CuentaBancariaComponent] Error al actualizar request:', error);
    }
  }

  /**
   * Finaliza el wizard actualizando solo el estado a "solicitud-recibida"
   * Los datos ya fueron guardados previamente en cada sección
   */
  async onFinish(event?: { signature: string | null }): Promise<void> {
    if (this.isLoading) return;

    const requestId = this.wizardStateService.getRequestId();
    
    // Si no hay request y es sin pago, crear uno primero
    if (!requestId && !this.withPayment) {
      const created = await this.createRequestWithoutPayment();
      if (!created) return;
    }
    
    // Verificar que existe un request
    const finalRequestId = this.wizardStateService.getRequestId();
    if (!finalRequestId) {
      this.errorMessage = 'Error: No se encontró la solicitud. Por favor, completa el proceso nuevamente.';
      return;
    }

    this.isLoading = true;
    this.submitFailed = false;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      let signatureUrl: string | null = null;

      if (event?.signature) {
        signatureUrl = await this.uploadSignature(event.signature, finalRequestId);
        if (!signatureUrl) {
          this.errorMessage =
            'No se pudo subir la firma. Comprueba tu conexión e inténtalo de nuevo. Si el problema continúa, tu sesión puede haber expirado (vuelve a verificar tu email).';
          this.isLoading = false;
          this.submitFailed = true;
          return;
        }
      }

      // Actualizar el estado y la firma
      const updateData: any = {
        type: 'cuenta-bancaria',
        status: 'solicitud-recibida'
      };
      
      if (signatureUrl) {
        updateData.signatureUrl = signatureUrl;
      }

      console.log('[CuentaBancariaComponent] Actualizando estado de solicitud:', finalRequestId, updateData);

      // Actualizar solo el estado de la solicitud
      await firstValueFrom(this.wizardApiService.updateRequest(finalRequestId, updateData));

      console.log('[CuentaBancariaComponent] Solicitud finalizada exitosamente');
      
      this.successMessage = '¡Solicitud enviada exitosamente!';
      this.isSubmitted = true;
      this.isLoading = false;
    } catch (error: any) {
      console.error('[CuentaBancariaComponent] Error al finalizar solicitud:', error);
      const status = error?.status ?? error?.error?.statusCode;
      if (status === 401) {
        this.errorMessage =
          'Tu sesión del asistente expiró o no es válida. Vuelve a iniciar el flujo y verifica tu correo para obtener un nuevo acceso.';
      } else {
        this.errorMessage = error?.error?.message || 'Error al enviar la solicitud. Por favor, intenta nuevamente.';
      }
      this.isLoading = false;
      this.submitFailed = true;
    }
  }

  /**
   * Convierte una firma base64 a File y la sube al servidor
   */
  private async uploadSignature(signatureDataUrl: string, requestId: number): Promise<string | null> {
    try {
      // Convertir base64 a Blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();
      
      // Crear File desde Blob
      const file = new File([blob], `signature-${requestId}-${Date.now()}.png`, { type: 'image/png' });
      
      // Subir archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('servicio', 'cuenta-bancaria');
      formData.append('requestUuid', requestId.toString());
      
      const uploadResponse = await firstValueFrom(this.wizardApiService.uploadFile(formData));
      
      if (uploadResponse && uploadResponse.url) {
        console.log('[CuentaBancariaComponent] Firma subida exitosamente:', uploadResponse.url);
        return uploadResponse.url;
      }
      
      return null;
    } catch (error: any) {
      console.error('[CuentaBancariaComponent] Error al subir firma:', error);
      return null;
    }
  }

  /**
   * Navega al panel del usuario
   */
  onGoToPanel(): void {
    this.clearWizardSessionAfterExit();
    this.router.navigate(['/panel']);
  }

  /**
   * Navega al home
   */
  onGoToHome(): void {
    this.clearWizardSessionAfterExit();
    this.currentLang === 'es'
      ? this.router.navigate(['/'])
      : this.router.navigate(['/en']);
  }

  onCancel(): void {
    this.clearWizardSessionAfterExit();
    this.currentLang === 'es'
      ? this.router.navigate(['/'])
      : this.router.navigate(['/en']);
  }

  private clearWizardSessionAfterExit(): void {
    this.wizardStateService.clear();
    this.wizardApiService.clearToken();
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
