import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { LanguageService } from '../../../shared/services/language.service';
import { WizardStateService } from '../services/wizard-state.service';
import { RequestsService } from '../../panel/services/requests.service';
import { AuthService } from '../../panel/services/auth.service';
import { combineLatest } from 'rxjs';

// Componentes de paso
import { WizardBasicRegisterStepComponent } from '../components/basic-register-step/basic-register-step.component';
import { WizardStatePlanSelectionStepComponent } from './steps/state-plan-selection-step/state-plan-selection-step.component';
import { WizardPaymentStepComponent } from '../components/payment-step/payment-step.component';
import { WizardLlcInformationStepComponent } from './steps/wizard-llc-information-step/wizard-llc-information-step.component';
import { WizardFinalReviewStepComponent } from '../components/final-review-step/final-review-step.component';

/**
 * Componente principal para el flujo de apertura de LLC
 * Estructura simple similar a new-request (sin mat-stepper)
 * Flujo: datos básicos → selección estado/precio → pago → información → revisión → envío
 */
@Component({
  selector: 'app-llc-apertura',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoPipe,
    WizardBasicRegisterStepComponent,
    WizardStatePlanSelectionStepComponent,
    WizardPaymentStepComponent,
    WizardLlcInformationStepComponent,
    WizardFinalReviewStepComponent,
  ],
  templateUrl: './llc-apertura.component.html',
  styleUrls: ['./llc-apertura.component.css']
})
export class LLCAperturaComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  currentLang = 'es';
  
  createdUserId: number | null = null;
  createdClientId: number | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  stepTitles: { [key: number]: string } = {};
  
  // Para controlar la visibilidad de botones en el paso 4 (Información LLC)
  llcInfoCurrentSection = 1;

  constructor(
    private wizardStateService: WizardStateService,
    private transloco: TranslocoService,
    private languageService: LanguageService,
    private router: Router,
    private requestsService: RequestsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeStepTitles();
    this.currentLang = this.languageService.currentLang;
    this.transloco.langChanges$.subscribe((l) => {
      this.currentLang = l;
      this.initializeStepTitles();
    });

    // Verificar si hay estado guardado pendiente de verificación
    this.checkPendingVerification();
  }

  private initializeStepTitles(): void {
    combineLatest([
      this.transloco.selectTranslate('WIZARD.steps.register'),
      this.transloco.selectTranslate('WIZARD.steps.state_plan'),
      this.transloco.selectTranslate('WIZARD.steps.payment'),
      this.transloco.selectTranslate('WIZARD.steps.llc_info'),
      this.transloco.selectTranslate('WIZARD.steps.review'),
    ]).subscribe(([register, statePlan, payment, llcInfo, review]) => {
      this.stepTitles = {
        1: register,
        2: statePlan,
        3: payment,
        4: llcInfo,
        5: review,
      };
    });
  }

  /**
   * Verifica si hay un estado del wizard guardado pendiente de verificación
   */
  private checkPendingVerification(): void {
    const savedState = localStorage.getItem('wizard_state_pending_verification');
    
    if (savedState && this.authService.isAuthenticated()) {
      try {
        const state = JSON.parse(savedState);
        
        if (state.wizardData) {
          Object.keys(state.wizardData).forEach(stepNumber => {
            this.wizardStateService.setStepData(parseInt(stepNumber), state.wizardData[stepNumber]);
          });
        }

        if (state.userId && state.clientId) {
          this.createdUserId = state.userId;
          this.createdClientId = state.clientId;
        }

        localStorage.removeItem('wizard_state_pending_verification');
        console.log('[LLCAperturaComponent] Estado del wizard restaurado después de verificación');
      } catch (error) {
        console.error('Error al restaurar estado del wizard:', error);
      }
    }
  }

  /**
   * Navega al siguiente paso
   */
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  /**
   * Navega al paso anterior
   */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Maneja la creación exitosa de usuario y cliente
   */
  onUserCreated(event: { userId: number; clientId: number }): void {
    this.createdUserId = event.userId;
    this.createdClientId = event.clientId;
    console.log('[LLCAperturaComponent] Usuario y cliente creados:', event);
  }

  /**
   * Envía la solicitud al backend (similar a new-request)
   */
  async onFinish(): Promise<void> {
    if (this.isLoading) return;

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

      // Preparar datos para el backend (similar a new-request)
      const requestData: any = {
        type: 'apertura-llc',
        clientId: this.createdClientId || 0,
        status: 'solicitud-recibida',
        currentStepNumber: 1,
        notes: '',
        paymentMethod: 'stripe',
        paymentAmount: step3Data.amount || step2Data.amount || 0,
        stripeToken: step3Data.stripePaymentToken,
        aperturaLlcData: {
          ...step4Data,
          incorporationState: step2Data.state || step4Data.incorporationState, // Usar estado del paso 2
          members: step4Data.members || []
        }
      };

      console.log('[LLCAperturaComponent] Enviando solicitud:', requestData);

      // Crear la solicitud (createRequest ya retorna una Promise)
      const createdRequest = await this.requestsService.createRequest(requestData);

      console.log('[LLCAperturaComponent] Solicitud creada exitosamente:', createdRequest);
      
      this.successMessage = 'Solicitud creada exitosamente';
      this.isLoading = false;

      // Redirigir a la lista de solicitudes o al panel
      setTimeout(() => {
        if (this.authService.isAuthenticated()) {
          this.router.navigate(['/panel/my-requests']);
        } else {
          this.currentLang === 'es'
            ? this.router.navigate(['/'])
            : this.router.navigate(['/en']);
        }
      }, 1500);

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
