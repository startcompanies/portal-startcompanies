import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { WizardApiService } from '../services/wizard-api.service';
import { combineLatest } from 'rxjs';

// Componentes de paso
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardEmailVerificationComponent } from '../components/email-verification/email-verification.component';
import { WizardStatePlanSelectionStepComponent } from './steps/state-plan-selection-step/state-plan-selection-step.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardLlcInformationStepComponent } from './steps/wizard-llc-information-step/wizard-llc-information-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

/**
 * Componente principal para el flujo de apertura de LLC
 * Flujo: registro → verificación email → selección estado/precio → pago → información → revisión → envío
 * Usa los endpoints del wizard:
 * - POST /wizard/requests/register
 * - POST /wizard/requests/confirm-email
 * - POST /wizard/requests (crear solicitud con pago)
 */
@Component({
  selector: 'app-llc-apertura',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoPipe,
    WizardBasicRegisterStepComponent,
    WizardEmailVerificationComponent,
    WizardStatePlanSelectionStepComponent,
    WizardPaymentStepComponent,
    WizardLlcInformationStepComponent,
    WizardFinalReviewStepComponent,
  ],
  templateUrl: './llc-apertura.component.html',
  styleUrls: ['./llc-apertura.component.css']
})
export class LLCAperturaComponent implements OnInit {
  @ViewChild(WizardBasicRegisterStepComponent) registerStep?: WizardBasicRegisterStepComponent;
  
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

  stepTitles: { [key: number]: string } = {};
  
  // Para controlar la visibilidad de botones en el paso de Información LLC
  llcInfoCurrentSection = 1;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private transloco: TranslocoService,
    private languageService: LanguageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeStepTitles();
    this.currentLang = this.languageService.currentLang;
    this.transloco.langChanges$.subscribe((l) => {
      this.currentLang = l;
      this.initializeStepTitles();
    });

    // Verificar si el usuario ya está autenticado en el wizard
    if (this.wizardApiService.isAuthenticated()) {
      console.log('[LLCAperturaComponent] Usuario ya autenticado, saltando a paso 2');
      // Si ya está autenticado, saltar el paso de registro y verificación
      this.currentStep = 2;
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
   * En el paso 1, primero registra al usuario
   */
  async nextStep(): Promise<void> {
    // Si estamos en el paso 1 (registro), intentar registrar primero
    if (this.currentStep === 1 && !this.wizardApiService.isAuthenticated()) {
      if (this.showEmailVerification) {
        // Si ya está mostrando verificación, no hacer nada
        return;
      }
      
      if (this.registerStep) {
        const registered = await this.registerStep.registerUser();
        if (!registered) {
          // Si retorna false, significa que necesita verificación de email
          const stepData = this.wizardStateService.getStepData(1);
          if (stepData.email) {
            this.registeredEmail = stepData.email;
            this.registeredPassword = stepData.password || '';
            this.showEmailVerification = true;
          }
          return;
        }
      }
    }
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.showEmailVerification = false;
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
   * POST /wizard/requests
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
      console.log('[LLCAperturaComponent] Datos finales del wizard:', allData);

      // Obtener datos de cada paso
      const step1Data = allData.step1 || {}; // Registro básico
      const step2Data = allData.step2 || {}; // Estado y plan
      const step3Data = allData.step3 || {}; // Pago
      const step4Data = allData.step4 || {}; // Información LLC

      // Verificar que el pago fue procesado
      if (!step3Data.stripePaymentProcessed || !step3Data.stripePaymentToken) {
        this.errorMessage = 'Por favor, completa el pago antes de enviar la solicitud.';
        this.isLoading = false;
        return;
      }

      // Obtener datos del usuario autenticado
      const user = this.wizardApiService.getUser();
      if (!user) {
        this.errorMessage = 'Error de autenticación. Por favor, vuelve a verificar tu email.';
        this.isLoading = false;
        return;
      }

      // Preparar datos para el endpoint del wizard
      const requestData = {
        type: 'apertura-llc' as const,
        currentStepNumber: 6, // Último paso
        currentStep: 5,
        status: 'pendiente' as const,
        notes: '',
        stripeToken: step3Data.stripePaymentToken,
        paymentAmount: step3Data.amount || step2Data.amount || 0,
        paymentMethod: 'stripe' as const,
        clientData: {
          firstName: step1Data.firstName || user.firstName || '',
          lastName: step1Data.lastName || user.lastName || '',
          email: step1Data.email || user.email,
          phone: step1Data.phone || user.phone || '',
          password: step1Data.password || '' // El backend ya tiene el usuario, pero lo requiere el DTO
        },
        aperturaLlcData: {
          ...step4Data,
          incorporationState: step2Data.state || step4Data.incorporationState,
          members: step4Data.members || []
        }
      };

      console.log('[LLCAperturaComponent] Enviando solicitud al wizard:', requestData);

      // Crear la solicitud usando el endpoint del wizard
      const response = await this.wizardApiService.createRequest(requestData).toPromise();

      console.log('[LLCAperturaComponent] Solicitud creada exitosamente:', response);
      
      this.successMessage = '¡Solicitud creada exitosamente! Tu pago ha sido procesado.';
      this.isLoading = false;

      // Limpiar estado del wizard
      this.wizardStateService.clear();

      // Redirigir al panel después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/panel/my-requests']);
      }, 2000);

    } catch (error: any) {
      console.error('[LLCAperturaComponent] Error al crear solicitud:', error);
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
}
