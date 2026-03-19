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
import { US_STATES } from '../../../shared/constants/us-states.constant';

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
  @ViewChild(WizardEmailVerificationComponent) emailVerificationStep?: WizardEmailVerificationComponent;
  @ViewChild(WizardPaymentStepComponent) paymentStep?: WizardPaymentStepComponent;
  @ViewChild(WizardRenovacionLlcInformationStepComponent) renovacionInformationStep?: WizardRenovacionLlcInformationStepComponent;
  
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
  
  usStates = US_STATES;

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
        this.syncPaymentProcessedFromWizardState();

        // Restaurar el paso guardado si es válido (después del pago)
        if (savedStep >= 2) {
          let idx = savedStep - 1; // índice base 0
          // Si hay solicitud pero el pago no quedó confirmado en el paso 3, no abrir información/revisión
          if (!this.paymentProcessed && idx >= 3) {
            idx = 2;
          }
          this.currentStepIndex = idx;
          this.renovacionInfoCurrentSection = savedStepNumber || 1;
          console.log('[LLCRenovacionComponent] Restaurando paso:', this.currentStepIndex, 'sección:', this.renovacionInfoCurrentSection);
        } else {
          this.currentStepIndex = this.paymentProcessed ? 3 : 2;
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
      this.transloco.selectTranslate('WIZARD.steps.llc_info'),
      this.transloco.selectTranslate('WIZARD.steps.review'),
    ]).subscribe(([register, state, payment, llcInfo, review]) => {
      this.stepTitles = {
        1: register,
        2: state,
        3: payment,
        4: llcInfo,
        5: review,
      };
    });
  }

  async onStepChanged(index: number): Promise<void> {
    // No permitir saltar del paso de pago sin pago/comprobante completado según reglas del flujo
    if (this.currentStepIndex === 2 && index > 2 && !this.paymentProcessed) {
      return;
    }

    // Si estamos saliendo del paso 4 (Información Renovación) hacia revisión, guardar antes de avanzar
    if (this.currentStepIndex === 3 && index === 4 && this.renovacionInfoCurrentSection === 5 && this.wizardStateService.hasRequest()) {
      if (this.renovacionInformationStep) {
        await this.renovacionInformationStep.saveToApi();
        if (this.renovacionInformationStep.saveError) {
          return;
        }
      }
    }

    this.currentStepIndex = index;
    // Guardar el paso actual en localStorage (convertir a base 1)
    this.wizardStateService.setCurrentStep(index + 1);
  }

  /**
   * Pago completado solo si el paso 3 guardó el resultado correcto (Stripe backend OK o transferencia + solicitud creada).
   */
  private syncPaymentProcessedFromWizardState(): void {
    if (!this.wizardStateService.hasRequest()) {
      this.paymentProcessed = false;
      return;
    }
    const step3 = this.wizardStateService.getStepData(3) || {};
    if (step3.paymentMethod === 'transferencia') {
      this.paymentProcessed = !!step3.transferenciaProcessed;
    } else {
      this.paymentProcessed = !!step3.stripePaymentProcessed;
    }
  }

  /**
   * Stripe: habilitar "Continuar" solo tras éxito en processStripePayment (paymentProcessed).
   * Transferencia: habilitar cuando ya hay comprobante subido; al pulsar Continuar se crea la solicitud si aún no existe.
   */
  canContinueFromPaymentStep(): boolean {
    if (this.paymentProcessed) {
      return true;
    }
    const step3 = this.wizardStateService.getStepData(3) || {};
    if (step3.paymentMethod === 'transferencia') {
      const url = (step3.paymentProofUrl || this.paymentStep?.form?.get('paymentProofUrl')?.value || '') as string;
      return !!String(url).trim();
    }
    return false;
  }

  /** Avanza del paso de pago (índice 2) al de información LLC (índice 3). */
  private advanceFromPaymentToInfo(): void {
    this.currentStepIndex = 3;
    this.wizardStateService.setCurrentStep(4);
  }

  async continueFromPaymentStep(): Promise<void> {
    this.errorMessage = null;
    if (this.currentStepIndex !== 2) {
      return;
    }
    if (this.paymentProcessed) {
      this.advanceFromPaymentToInfo();
      return;
    }
    const step3 = this.wizardStateService.getStepData(3) || {};
    if (step3.paymentMethod === 'transferencia') {
      this.isLoading = true;
      try {
        if (this.paymentStep) {
          await this.paymentStep.processTransferenciaPayment();
        }
        this.syncPaymentProcessedFromWizardState();
        if (this.paymentProcessed) {
          this.advanceFromPaymentToInfo();
        } else {
          this.errorMessage =
            this.errorMessage || 'Completa la transferencia: sube el comprobante y confirma la creación de la solicitud.';
        }
      } finally {
        this.isLoading = false;
      }
      return;
    }
    this.errorMessage = 'Primero procesa el pago con tarjeta correctamente.';
  }

  /** Llamado cuando el paso de información emite nextStepRequested (última sección guardada OK). */
  onRenovacionInfoNext(): void {
    if (this.currentStepIndex !== 3) {
      return;
    }
    this.currentStepIndex = 4;
    this.wizardStateService.setCurrentStep(5);
  }

  /**
   * Para el paso 2 (estado + tipo LLC): solo permitir avanzar si hay amount calculado.
   */
  canProceedFromStateStep(): boolean {
    const step2 = this.wizardStateService.getStepData(2) || {};
    return !!(step2.state && step2.llcType && typeof step2.amount === 'number' && step2.amount > 0);
  }

  /**
   * Navega al siguiente paso asegurando el flujo de registro → verificación de email.
   * Paso 1: misma lógica que flow-cuenta-bancaria.
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

    // Paso 1 (index 0): registro + verificación (misma lógica que flow-cuenta-bancaria)
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

    // Paso 2 (index 1): estado + tipo LLC + amount requerido
    if (this.currentStepIndex === 1 && !this.canProceedFromStateStep()) {
      return;
    }

    // Paso 3 (index 2): pago debe estar procesado
    if (this.currentStepIndex === 2 && !this.paymentProcessed) {
      return;
    }

    // Si estamos en paso 4 (Información Renovación) y ya hay un request, guardar los datos antes de avanzar
    if (this.currentStepIndex === 3 && this.wizardStateService.hasRequest()) {
      // Si estamos en la sección 5 (última sección), guardar antes de avanzar al siguiente paso del wizard
      if (this.renovacionInfoCurrentSection === 5 && this.renovacionInformationStep) {
        await this.renovacionInformationStep.saveToApi();
      } else {
        // Si no estamos en la última sección, actualizar normalmente
        await this.updateRequestData();
      }
    }
    
    // Si estamos en paso 5+ y ya hay un request, actualizar los datos
    if (this.currentStepIndex > 3 && this.wizardStateService.hasRequest()) {
      await this.updateRequestData();
    }

    if (this.currentStepIndex < 4) {
      this.currentStepIndex++;
      this.showEmailVerification = false;
      this.wizardStateService.setCurrentStep(this.currentStepIndex + 1);
    }
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
      console.error('[LLCRenovacionComponent] Error al reenviar código:', error);
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
   * Mapea los propietarios del formulario al formato esperado por el backend
   */
  private mapOwnersToMembers(owners: any[]): any[] {
    if (!owners || !Array.isArray(owners)) return [];
    
    return owners.map((ownerValue: any) => ({
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
    }));
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
      
      // Separar owners del resto de los datos
      const { owners, ...restOfServiceData } = serviceData;
      
      // Mapear owners a members
      const members = this.mapOwnersToMembers(owners || []);
      
      // Si estamos en el paso 4 (Información Renovación), usar la sección actual como currentStepNumber
      const currentStepNumber = this.currentStepIndex === 3 ? this.renovacionInfoCurrentSection : undefined;
      
      const updateData: any = {
        type: 'renovacion-llc',
        renovacionLlcData: {
          ...restOfServiceData,
          state: step2Data.state || serviceData.state,
          members: members
        }
      };
      
      // Incluir currentStepNumber si estamos en el paso 4
      if (currentStepNumber !== undefined) {
        updateData.currentStepNumber = currentStepNumber;
      }
      
      console.log('[LLCRenovacionComponent] Actualizando request:', requestId, updateData);
      console.log('[LLCRenovacionComponent] Members a enviar:', members);
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
      console.log('[LLCRenovacionComponent] Request actualizado exitosamente');
    } catch (error: any) {
      console.error('[LLCRenovacionComponent] Error al actualizar request:', error);
    }
  }

  /**
   * Finaliza el wizard actualizando solo el estado a "solicitud-recibida"
   * Los datos ya fueron guardados previamente en cada paso
   */
  async onFinish(event?: { signature: string | null }): Promise<void> {
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
      let signatureUrl: string | null = null;
      
      // Si hay firma, subirla como archivo
      if (event?.signature) {
        signatureUrl = await this.uploadSignature(event.signature, requestId);
      }

      // Actualizar el estado y la firma
      const updateData: any = {
        type: 'renovacion-llc',
        status: 'solicitud-recibida'
      };
      
      if (signatureUrl) {
        updateData.signatureUrl = signatureUrl;
      }

      console.log('[LLCRenovacionComponent] Actualizando estado de solicitud:', requestId, updateData);

      // Actualizar solo el estado de la solicitud
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));

      console.log('[LLCRenovacionComponent] Solicitud finalizada exitosamente');
      
      this.successMessage = '¡Solicitud enviada exitosamente!';
      this.isSubmitted = true;
      this.isLoading = false;

      // Limpiar estado del wizard y tokens
      this.wizardStateService.clear();
      this.wizardApiService.clearToken();

    } catch (error: any) {
      console.error('[LLCRenovacionComponent] Error al finalizar solicitud:', error);
      this.errorMessage = error?.error?.message || 'Error al enviar la solicitud. Por favor, intenta nuevamente.';
      this.isLoading = false;
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
      formData.append('servicio', 'renovacion-llc');
      formData.append('requestUuid', requestId.toString());
      
      const uploadResponse = await firstValueFrom(
        this.wizardApiService.uploadFile(formData)
      );
      
      if (uploadResponse && uploadResponse.url) {
        console.log('[LLCRenovacionComponent] Firma subida exitosamente:', uploadResponse.url);
        return uploadResponse.url;
      }
      
      return null;
    } catch (error: any) {
      console.error('[LLCRenovacionComponent] Error al subir firma:', error);
      return null;
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
