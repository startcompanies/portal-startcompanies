import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';
import { WizardApiService } from '../../services/wizard-api.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { StripeService } from '../../services/stripe.service';
import { HttpClient } from '@angular/common/http';
import { StripePaymentFormComponent, StripePaymentResult } from '../../../panel/components/stripe-payment-form/stripe-payment-form.component';
import { WizardPlansService } from '../../services/wizard-plans.service';

/**
 * Componente reutilizable para el paso de pago
 * Usado en flujos que requieren pago
 * 
 * FLUJO:
 * 1. Usuario ingresa datos de tarjeta
 * 2. Al procesar pago → Se crea el request en BD con el token de Stripe
 * 3. El backend procesa el pago y crea el request
 * 4. Se guarda el requestId para actualizaciones posteriores
 */
@Component({
  selector: 'app-wizard-payment-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule, StripePaymentFormComponent],
  templateUrl: './payment-step.component.html',
  styleUrls: ['./payment-step.component.css'],

})
export class WizardPaymentStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 3;
  @Input() previousStepNumber: number = 2; // Paso anterior para mostrar resumen

  @Input() packId: string = '';
  @Input() priceId: string = '';
  @Input() state: string = '';
  @Input() fixedAmount: number | null = null; // Monto fijo para flujos como cuenta bancaria (99 USD)
  @Input() currency: string = 'USD';
  
  // Evento emitido cuando el pago y la creación del request son exitosos
  @Output() paymentAndRequestCreated = new EventEmitter<{ requestId: number; paymentInfo: any }>();
  @Output() paymentError = new EventEmitter<string | null>();
  
  @ViewChild(StripePaymentFormComponent, { static: false }) stripePaymentForm!: StripePaymentFormComponent;
  
  totalAmount: number = 0;
  stripeProcessing = false;
  stripePaymentProcessed = false;
  stripePaymentToken: string | null = null;
  
  // Mensaje de error/éxito para mostrar en UI
  errorMessage: string | null = null;
  successMessage: string | null = null;

  form!: FormGroup;
  previousStepData: any = {};
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private stripeService: StripeService,
    private wizardPlansService: WizardPlansService,
    private http: HttpClient
  ) {
    // Cargar datos guardados si existen
    const savedData = this.wizardStateService.getStepData(this.stepNumber);

    /**
     * CAMPOS OPCIONALES - Se puede navegar sin completar el pago
     * - paymentMethod: Método de pago seleccionado (opcional)
     * 
     * NOTA: Los campos ya no son obligatorios para navegar entre pasos.
     * El usuario puede avanzar sin completar el pago de Stripe.
     */
    this.form = new FormGroup({
      paymentMethod: new FormControl(savedData.paymentMethod || ''),
    });
  }

  ngOnInit(): void {
    // Si hay un monto fijo, usarlo directamente (para flujos como cuenta bancaria)
    if (this.fixedAmount !== null && this.fixedAmount > 0) {
      this.totalAmount = this.fixedAmount;
    } else {
      // Cargar datos del paso anterior para mostrar resumen
      this.previousStepData = this.wizardStateService.getStepData(this.previousStepNumber);
      
      // Obtener plan y estado del paso anterior
      if (this.previousStepData) {
        const rawPlanValue = this.previousStepData.plan;
        // `plan` se usa en apertura (estado/plan). En renovación guardamos `service`.
        this.packId = rawPlanValue
          ? this.wizardPlansService.getPlanDisplayLabel(rawPlanValue)
          : (this.previousStepData.service || this.packId);
        this.state = this.previousStepData.state || this.state;
        
        // Obtener monto del paso anterior
        if (this.previousStepData.amount) {
          this.totalAmount = this.previousStepData.amount;
        } else {
          // Fallback: calcular según el plan (centralizado, consistente con /planes)
          this.totalAmount = this.wizardPlansService.calculateAmount(rawPlanValue);
        }
      }
    }

    const serviceType = this.wizardStateService.getServiceType();
    // Fallback de etiqueta de "Plan" para flujos sin plan (renovación/cuenta bancaria)
    if (!this.packId) {
      this.packId = this.wizardPlansService.getServiceLabel(serviceType);
    }

    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
      if (savedData.stripePaymentProcessed) {
        this.stripePaymentProcessed = savedData.stripePaymentProcessed;
        this.stripePaymentToken = savedData.stripePaymentToken;
      }
    }

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  /**
   * Procesa el pago con Stripe y crea el request en la BD
   * 
   * FLUJO:
   * 1. Obtener token de Stripe
   * 2. Enviar al backend para crear request + procesar pago
   * 3. Guardar requestId para actualizaciones posteriores
   */
  async processStripePayment(): Promise<boolean> {
    if (!this.stripePaymentForm) {
      console.error('StripePaymentFormComponent no está disponible');
      this.errorMessage = 'Error: Formulario de pago no disponible';
      return false;
    }

    // Si ya se procesó el pago y existe un request, retornar true
    if (this.stripePaymentProcessed && this.wizardStateService.hasRequest()) {
      console.log('Pago ya procesado anteriormente, requestId:', this.wizardStateService.getRequestId());
      return true;
    }

    // Verificar que el usuario esté autenticado
    if (!this.wizardApiService.isAuthenticated()) {
      this.errorMessage = 'Error: Debes verificar tu email antes de procesar el pago';
      this.paymentError.emit(this.errorMessage);
      return false;
    }

    this.stripeProcessing = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      // 1. Obtener el token de Stripe del formulario
      const paymentResult = await this.stripePaymentForm.createPaymentToken();

      if (paymentResult.error || !paymentResult.token) {
        this.stripeProcessing = false;
        this.errorMessage = paymentResult.error || 'Error al crear token de pago';
        console.error('Error al crear token de pago:', paymentResult.error);
        this.paymentError.emit(this.errorMessage);
        return false;
      }

      this.stripePaymentToken = paymentResult.token;
      console.log('[PaymentStep] Token de Stripe obtenido:', this.stripePaymentToken);

      // 2. Preparar datos para crear el request
      const serviceType = this.wizardStateService.getServiceType();
      if (!serviceType) {
        this.errorMessage = 'Error: Tipo de servicio no definido';
        this.stripeProcessing = false;
        this.paymentError.emit(this.errorMessage);
        return false;
      }

      const allData = this.wizardStateService.getAllData();
      const step1Data = allData.step1 || {};
      const step2Data = allData.step2 || {};
      const user = this.wizardApiService.getUser();

      if (!user) {
        this.errorMessage = 'Error de autenticación';
        this.stripeProcessing = false;
        this.paymentError.emit(this.errorMessage);
        return false;
      }

      // 3. Construir el payload según el tipo de servicio
      const requestData: any = {
        type: serviceType,
        currentStepNumber: 1, // Paso inicial, se actualizará después
        currentStep: this.stepNumber,
        status: 'pendiente',
        notes: '',
        stripeToken: this.stripePaymentToken,
        paymentAmount: this.totalAmount,
        paymentMethod: 'stripe',
        clientData: {
          firstName: step1Data.firstName || user.firstName || '',
          lastName: step1Data.lastName || user.lastName || '',
          email: step1Data.email || user.email,
          phone: step1Data.phone || user.phone || '',
          password: step1Data.password || ''
        }
      };

      // Agregar datos específicos del servicio
      if (serviceType === 'apertura-llc') {
        requestData.aperturaLlcData = {
          incorporationState: step2Data.state || '',
          plan: step2Data.plan || ''
        };
      } else if (serviceType === 'renovacion-llc') {
        requestData.renovacionLlcData = {
          state: step2Data.state || ''
        };
      } else if (serviceType === 'cuenta-bancaria') {
        requestData.cuentaBancariaData = {};
      }

      console.log('[PaymentStep] Creando request con pago:', requestData);

      // 4. Enviar al backend para crear request + procesar pago
      const response = await firstValueFrom(this.wizardApiService.createRequest(requestData));

      console.log('[PaymentStep] Request creado exitosamente:', response);

      // 5. Guardar el requestId para actualizaciones posteriores
      if (response && response.id) {
        this.wizardStateService.setRequestId(response.id);
        console.log('[PaymentStep] RequestId guardado:', response.id);
      }

      // 6. Marcar pago como procesado y limpiar errores
      this.stripePaymentProcessed = true;
      this.errorMessage = null; // Limpiar cualquier error previo
      this.saveStepData();
      
      // 7. Bloquear los campos de la tarjeta
      this.stripePaymentForm.disableCardElement();
      
      this.successMessage = '¡Pago procesado exitosamente!';
      this.stripeProcessing = false;
      
      // 8. Emitir evento de éxito
      this.paymentAndRequestCreated.emit({
        requestId: response.id,
        paymentInfo: response.payment
      });

      return true;

    } catch (error: any) {
      this.stripeProcessing = false;
      this.stripePaymentProcessed = false; // Asegurar que no se marque como procesado
      this.errorMessage = error?.error?.message || 'Error al procesar el pago';
      console.error('Error al procesar pago:', error);
      this.paymentError.emit(this.errorMessage);
      return false;
    }
  }

  /**
   * Maneja el evento de éxito del pago desde StripePaymentFormComponent
   */
  onStripePaymentSuccess(result: StripePaymentResult): void {
    if (result.token) {
      this.stripePaymentToken = result.token;
      this.stripePaymentProcessed = true;
      this.saveStepData();
    }
  }

  /**
   * Maneja errores del pago
   */
  handlePaymentError(error: string): void {
    console.error('Error en pago de Stripe:', error);
    this.stripeProcessing = false;
  }

  /**
   * Guarda los datos del paso incluyendo estado del pago
   */
  private saveStepData(): void {
    const dataToSave = {
      ...this.form.value,
      amount: this.totalAmount,
      stripePaymentProcessed: this.stripePaymentProcessed,
      stripePaymentToken: this.stripePaymentToken,
      packId: this.packId,
      priceId: this.priceId,
      state: this.state
    };
    this.wizardStateService.setStepData(this.stepNumber, dataToSave);
  }
}
