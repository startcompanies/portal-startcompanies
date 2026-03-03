import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { WizardApiService } from '../services/wizard-api.service';
import { combineLatest, firstValueFrom } from 'rxjs';

// Componentes de paso
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardEmailVerificationComponent } from '../components/email-verification/email-verification.component';
import { WizardStatePlanSelectionStepComponent } from './steps/state-plan-selection-step/state-plan-selection-step.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardLlcInformationStepComponent } from './steps/wizard-llc-information-step/wizard-llc-information-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

/**
 * Componente principal para el flujo de apertura de LLC
 * 
 * FLUJO:
 * 1. Registro → verificación email
 * 2. Selección estado/plan
 * 3. Pago → SE CREA EL REQUEST EN BD
 * 4. Información LLC → SE ACTUALIZA EL REQUEST
 * 5. Revisión final → SE ACTUALIZA EL REQUEST (estado final)
 * 
 * Endpoints del wizard:
 * - POST /wizard/requests/register
 * - POST /wizard/requests/confirm-email
 * - POST /wizard/requests (crear solicitud con pago)
 * - PATCH /wizard/requests/:id (actualizar solicitud)
 */
@Component({
  selector: 'app-llc-apertura',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    WizardBasicRegisterStepComponent,
    WizardEmailVerificationComponent,
    WizardStatePlanSelectionStepComponent,
    WizardPaymentStepComponent,
    WizardLlcInformationStepComponent,
    WizardFinalReviewStepComponent
],
  templateUrl: './llc-apertura.component.html',
  styleUrls: ['./llc-apertura.component.css']
})
export class LLCAperturaComponent implements OnInit {
  @ViewChild(WizardBasicRegisterStepComponent) registerStep?: WizardBasicRegisterStepComponent;
  @ViewChild(WizardEmailVerificationComponent) emailVerificationStep?: WizardEmailVerificationComponent;
  @ViewChild(WizardPaymentStepComponent) paymentStep?: WizardPaymentStepComponent;
  @ViewChild(WizardLlcInformationStepComponent) llcInformationStep?: WizardLlcInformationStepComponent;
  
  currentStep = 1;
  totalSteps = 5; // Registro, Estado/Plan, Pago, Info LLC, Revisión
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

  stepTitles: { [key: number]: string } = {};
  
  // Para controlar la visibilidad de botones en el paso de Información LLC
  llcInfoCurrentSection = 1;
  
  // Control del pago
  paymentProcessed = false;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private transloco: TranslocoService,
    private languageService: LanguageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar si hay un estado guardado del mismo servicio
    const savedServiceType = this.wizardStateService.getServiceType();
    
    // Si el servicio guardado es diferente, limpiar el estado
    if (savedServiceType && savedServiceType !== 'apertura-llc') {
      console.log('[LLCAperturaComponent] Servicio diferente guardado, limpiando estado');
      this.wizardStateService.clear();
    }
    
    // Establecer el tipo de servicio
    this.wizardStateService.setServiceType('apertura-llc');
    
    this.initializeStepTitles();
    this.currentLang = this.languageService.currentLang;
    this.transloco.langChanges$.subscribe((l) => {
      this.currentLang = l;
      this.initializeStepTitles();
    });

    // Restaurar el paso desde localStorage si existe
    const savedStep = this.wizardStateService.getCurrentStep();
    const savedStepNumber = this.wizardStateService.getCurrentStepNumber();
    
    // Verificar si el usuario ya está autenticado en el wizard
    if (this.wizardApiService.isAuthenticated()) {
      console.log('[LLCAperturaComponent] Usuario ya autenticado');
      
      // Si ya existe un request, verificar el estado del pago
      if (this.wizardStateService.hasRequest()) {
        this.paymentProcessed = true;
        
        // Restaurar el paso guardado si es válido (después del pago)
        if (savedStep >= 3) {
          this.currentStep = savedStep;
          this.llcInfoCurrentSection = savedStepNumber || 1;
          console.log('[LLCAperturaComponent] Restaurando paso:', this.currentStep, 'sección:', this.llcInfoCurrentSection);
        } else {
          this.currentStep = 4; // Ir al paso de información si ya pagó
        }
      } else {
        // Usuario autenticado pero sin request, ir al paso 2 o restaurar
        this.currentStep = savedStep >= 2 ? savedStep : 2;
      }
    } else if (savedStep > 1) {
      // No está autenticado pero hay un paso guardado mayor a 1
      // Esto no debería pasar, resetear al paso 1
      console.log('[LLCAperturaComponent] Estado inconsistente, reseteando');
      this.wizardStateService.clear();
      this.currentStep = 1;
    }
  }

  private initializeStepTitles(): void {
    combineLatest([
      this.transloco.selectTranslate('WIZARD.steps.register'),
      this.transloco.selectTranslate('WIZARD.steps.verify_email'),
      this.transloco.selectTranslate('WIZARD.steps.state_plan'),
      this.transloco.selectTranslate('WIZARD.steps.payment'),
      this.transloco.selectTranslate('WIZARD.steps.llc_info'),
      this.transloco.selectTranslate('WIZARD.steps.review'),
    ]).subscribe(([register, verifyEmail, statePlan, payment, llcInfo, review]) => {
      this.stepTitles = {
        1: register || 'Registro',
        2: statePlan || 'Estado y Plan',
        3: payment || 'Pago',
        4: llcInfo || 'Información de la LLC',
        5: review || 'Revisión Final',
      };
    });
  }

  /**
   * Navega al siguiente paso
   * - Paso 1: Registra al usuario si no está autenticado (misma lógica que flow-cuenta-bancaria)
   * - Paso 3: Procesa el pago y crea el request
   * - Paso 4+: Actualiza el request existente
   */
  async nextStep(): Promise<void> {    
    this.errorMessage = null;
    
    // Paso 1 (registro): misma lógica que flow-cuenta-bancaria
    if (this.currentStep === 1 && !this.wizardApiService.isAuthenticated()) {
      if (this.showEmailVerification) {
        return;
      }

      if (this.registerStep) {
        const registered = await this.registerStep.registerUser();
        if (!registered) {
          const stepData = this.wizardStateService.getStepData(1);
          if (stepData?.email) {
            this.registeredEmail = stepData.email;
            this.registeredPassword = stepData.password || '';
            this.showEmailVerification = true;
          } else {
            this.errorMessage = this.registerStep.errorMessage || 'Por favor, completa todos los campos requeridos (nombre, email, contraseña).';
          }
          return;
        }
      }
    }
    
    // Si estamos en paso 3 (pago), verificar que el pago esté procesado
    if (this.currentStep === 3 && !this.paymentProcessed) {
      // No permitir avanzar si el pago no está procesado
      // El pago se procesa con el botón "Pagar" dentro del componente payment-step
      return;
    }
    
    // Si estamos en paso 4 (Información LLC) y ya hay un request, guardar los datos antes de avanzar
    if (this.currentStep === 4 && this.wizardStateService.hasRequest()) {
      // Si estamos en la sección 3 (última sección), guardar antes de avanzar al siguiente paso del wizard
      if (this.llcInfoCurrentSection === 3 && this.llcInformationStep) {
        await this.llcInformationStep.saveToApi();
      } else {
        // Si no estamos en la última sección, actualizar normalmente
        await this.updateRequestData();
      }
    }
    
    // Si estamos en paso 5+ y ya hay un request, actualizar los datos
    if (this.currentStep > 4 && this.wizardStateService.hasRequest()) {
      await this.updateRequestData();
    }
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.showEmailVerification = false;
      // Guardar el paso actual en localStorage
      this.wizardStateService.setCurrentStep(this.currentStep);
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
      const step4Data = allData.step4 || {};
      
      // IMPORTANTE:
      // En el panel, `currentStepNumber` significa "sección dentro de Datos del Servicio".
      // En wizard, `currentStep` es el paso del flujo (1..5). NO debemos sobreescribir `currentStepNumber`
      // con el orden del wizard porque rompe la precarga al continuar en el panel.
      // Si estamos en el paso 4 (Información LLC), usar la sección actual como currentStepNumber
      const currentStepNumber = this.currentStep === 4 ? this.llcInfoCurrentSection : undefined;
      
      const updateData: any = {
        type: 'apertura-llc',
        aperturaLlcData: {
          ...step4Data,
          members: step4Data.members || [],
        },
      };
      
      // Incluir currentStepNumber si estamos en el paso 4
      if (currentStepNumber !== undefined) {
        updateData.currentStepNumber = currentStepNumber;
      }
      
      console.log('[LLCAperturaComponent] Actualizando request:', requestId, updateData);
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
      console.log('[LLCAperturaComponent] Request actualizado exitosamente');
    } catch (error: any) {
      console.error('[LLCAperturaComponent] Error al actualizar request:', error);
      // No bloquear la navegación por errores de actualización
    }
  }

  /**
   * Navega al paso anterior
   */
  previousStep(): void {
    if (this.showEmailVerification) {
      this.showEmailVerification = false;
      return;
    }
    
    if (this.currentStep > 1) {
      this.currentStep--;
      // Guardar el paso actual en localStorage
      this.wizardStateService.setCurrentStep(this.currentStep);
    }
  }

  /**
   * Maneja el evento cuando el usuario se registra
   */
  onUserCreated(event: { userId: number; email: string }): void {
    console.log('[LLCAperturaComponent] Usuario registrado:', event);
    this.registeredEmail = event.email;
    const stepData = this.wizardStateService.getStepData(1);
    this.registeredPassword = stepData.password || '';
    this.showEmailVerification = true;
  }

  /**
   * Maneja la verificación exitosa del email
   */
  onEmailVerified(): void {
    console.log('[LLCAperturaComponent] Email verificado exitosamente');
    this.showEmailVerification = false;
    this.currentStep = 2; // Avanzar al paso de selección de estado/plan
    this.wizardStateService.setCurrentStep(this.currentStep);
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
      console.error('[LLCAperturaComponent] Error al reenviar código:', error);
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
    console.log('[LLCAperturaComponent] Pago procesado y request creado:', event);
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
   * Maneja el cambio de sección en el paso de información LLC
   */
  onLlcInfoSectionChanged(section: number): void {
    this.llcInfoCurrentSection = section;
    // Guardar la sección actual en localStorage
    this.wizardStateService.setCurrentStepNumber(section);
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
        type: 'apertura-llc',
        status: 'solicitud-recibida'
      };
      
      if (signatureUrl) {
        updateData.signatureUrl = signatureUrl;
      }

      console.log('[LLCAperturaComponent] Actualizando estado de solicitud:', requestId, updateData);

      // Actualizar solo el estado de la solicitud
      await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));

      console.log('[LLCAperturaComponent] Solicitud finalizada exitosamente');
      
      this.successMessage = '¡Solicitud enviada exitosamente!';
      this.isSubmitted = true;
      this.isLoading = false;

      // Limpiar estado del wizard y tokens
      this.wizardStateService.clear();
      this.wizardApiService.clearToken();

    } catch (error: any) {
      console.error('[LLCAperturaComponent] Error al finalizar solicitud:', error);
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
      formData.append('servicio', 'apertura-llc');
      formData.append('requestUuid', requestId.toString());
      
      const uploadResponse = await firstValueFrom(
        this.wizardApiService.uploadFile(formData)
      );
      
      if (uploadResponse && uploadResponse.url) {
        console.log('[LLCAperturaComponent] Firma subida exitosamente:', uploadResponse.url);
        return uploadResponse.url;
      }
      
      return null;
    } catch (error: any) {
      console.error('[LLCAperturaComponent] Error al subir firma:', error);
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
}
