import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { WizardStateService } from '../../services/wizard-state.service';
import { WizardApiService } from '../../services/wizard-api.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { StripeService } from '../../services/stripe.service';
import { StripePaymentFormComponent, StripePaymentResult } from '../../../panel/components/stripe-payment-form/stripe-payment-form.component';
import { WizardPlansService } from '../../services/wizard-plans.service';
import { TranslocoPipe } from '@jsverse/transloco';

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
  imports: [SharedModule, ReactiveFormsModule, StripePaymentFormComponent, TranslocoPipe],
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

  // Transferencia bancaria
  selectedPaymentProofFile: File | null = null;
  isUploadingPaymentProof = false;
  paymentProofUploadProgress = 0;
  transferenciaProcessed = false;

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
    private wizardPlansService: WizardPlansService
  ) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    this.form = new FormGroup({
      paymentMethod: new FormControl(savedData.paymentMethod || 'stripe'),
      paymentProofUrl: new FormControl(savedData.paymentProofUrl || ''),
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

      // Renovación: estado/monto pueden estar en step 3 u otro índice si hubo solapamiento en localStorage
      if (this.wizardStateService.getServiceType() === 'renovacion-llc') {
        const { state: mergedState } = this.getRenovacionLlcPayload();
        if (mergedState) {
          this.state = mergedState;
        }
        if (!this.totalAmount) {
          for (const n of [this.previousStepNumber, 2, 3, 4]) {
            const a = this.wizardStateService.getStepData(n)?.amount;
            if (a != null && Number(a) > 0) {
              this.totalAmount = Number(a);
              break;
            }
          }
        }
      }
    }

    const serviceType = this.wizardStateService.getServiceType();
    // Fallback de etiqueta de "Plan" para flujos sin plan (renovación/cuenta bancaria)
    if (!this.packId) {
      this.packId = this.wizardPlansService.getServiceLabel(serviceType);
    }

    // Cargar datos guardados (paso configurado + cualquier paso que tenga bloque de pago, p. ej. clave 4)
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    const payAny = this.wizardStateService.findPersistedPaymentData();
    const merged = { ...payAny, ...(savedData && Object.keys(savedData).length > 0 ? savedData : {}) };
    if (merged && Object.keys(merged).length > 0) {
      this.form.patchValue({
        paymentMethod: merged.paymentMethod || 'stripe',
        paymentProofUrl: merged.paymentProofUrl || '',
      });
      if (merged.stripePaymentProcessed || payAny.stripePaymentProcessed) {
        this.stripePaymentProcessed = true;
        this.stripePaymentToken = merged.stripePaymentToken ?? payAny.stripePaymentToken ?? null;
      }
      if (merged.transferenciaProcessed || payAny.transferenciaProcessed) {
        this.transferenciaProcessed = true;
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

      // 3. Construir el payload según el tipo de servicio.
      // currentStep: paso siguiente al pago (ya se completó el pago), para que al recargar/panel se abra en el formulario de info.
      const requestData: any = {
        type: serviceType,
        currentStepNumber: 1,
        currentStep: this.stepNumber + 1,
        status: 'pendiente',
        notes: '',
        stripeToken: this.stripePaymentToken || '',
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

      // Agregar datos específicos del servicio (plan se envía al crear para apertura-llc)
      if (serviceType === 'apertura-llc') {
        const plan = step2Data.plan || '';
        requestData.plan = plan;
        requestData.aperturaLlcData = {
          incorporationState: step2Data.state || '',
          plan
        };
      } else if (serviceType === 'renovacion-llc') {
        requestData.renovacionLlcData = this.getRenovacionLlcPayload();
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
      // tok_ es de un solo uso: no persistir token tras fallo para forzar uno nuevo y evitar reintentos inválidos
      this.stripePaymentToken = null;
      this.saveStepData();
      this.errorMessage = error?.error?.message || 'Error al procesar el pago';
      console.error('Error al procesar pago:', error);
      this.paymentError.emit(this.errorMessage);
      return false;
    }
  }

  /**
   * Maneja el evento de éxito del pago desde StripePaymentFormComponent
   */
  /**
   * Solo guarda el token cuando el elemento de tarjeta lo emite.
   * NO marcar stripePaymentProcessed aquí: el pago real se confirma al crear el request en el backend (processStripePayment).
   */
  onStripePaymentSuccess(result: StripePaymentResult): void {
    if (result.token) {
      this.stripePaymentToken = result.token;
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
   * Estado y tipo LLC para renovación: merge de pasos 2–4 y UI (localStorage puede tener datos en clave distinta).
   */
  private getRenovacionLlcPayload(): { state: string; llcType: string } {
    const { stateStep, paymentStep } = this.wizardStateService.getRenovacionStorageLayout();
    const idx = new Set(
      [stateStep - 1, stateStep, stateStep + 1, paymentStep, paymentStep + 1].filter((n) => n >= 2)
    );
    const blocks = [...idx]
      .sort((a, b) => a - b)
      .map((n) => this.wizardStateService.getStepData(n) || {});
    const pick = (field: 'state' | 'llcType'): string => {
      for (const b of blocks) {
        const v = b[field];
        if (v != null && String(v).trim() !== '') {
          return String(v).trim();
        }
      }
      if (field === 'state' && this.state?.trim()) {
        return this.state.trim();
      }
      return '';
    };
    return { state: pick('state'), llcType: pick('llcType') };
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
      transferenciaProcessed: this.transferenciaProcessed,
      packId: this.packId,
      priceId: this.priceId,
      state: this.state
    };
    this.wizardStateService.setStepData(this.stepNumber, dataToSave);
  }

  onPaymentProofFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedPaymentProofFile = file;
      this.errorMessage = null;
      this.uploadPaymentProof();
    }
  }

  clearPaymentProofFile(): void {
    this.selectedPaymentProofFile = null;
    this.form.patchValue({ paymentProofUrl: '' });
    this.errorMessage = null;
  }

  async uploadPaymentProof(): Promise<void> {
    if (!this.selectedPaymentProofFile) return;
    this.isUploadingPaymentProof = true;
    this.paymentProofUploadProgress = 0;
    this.errorMessage = null;
    const serviceType = this.wizardStateService.getServiceType() || 'apertura-llc';
    try {
      const formData = new FormData();
      formData.append('file', this.selectedPaymentProofFile);
      formData.append('servicio', serviceType);
      const response = await firstValueFrom(
        this.wizardApiService.uploadFile(formData)
      );
      if (response?.url) {
        this.form.patchValue({ paymentProofUrl: response.url });
        this.selectedPaymentProofFile = null;
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Error al subir el comprobante';
      this.paymentError.emit(this.errorMessage);
    } finally {
      this.isUploadingPaymentProof = false;
      this.paymentProofUploadProgress = 0;
    }
  }

  async processTransferenciaPayment(): Promise<void> {
    const proofUrl = this.form.get('paymentProofUrl')?.value;
    if (!proofUrl || this.totalAmount <= 0) {
      this.errorMessage = 'Sube el comprobante de transferencia antes de continuar.';
      return;
    }
    if (!this.wizardApiService.isAuthenticated()) {
      this.errorMessage = 'Debes verificar tu email antes de continuar.';
      this.paymentError.emit(this.errorMessage);
      return;
    }
    this.errorMessage = null;
    const serviceType = this.wizardStateService.getServiceType();
    if (!serviceType) {
      this.errorMessage = 'Tipo de servicio no definido';
      return;
    }
    const allData = this.wizardStateService.getAllData();
    const step1Data = allData.step1 || {};
    const step2Data = allData.step2 || {};
    const user = this.wizardApiService.getUser();
    if (!user) {
      this.errorMessage = 'Error de autenticación';
      return;
    }
    // currentStep: paso siguiente al pago (ya se completó), para que al recargar/panel se abra en el formulario de info.
    const requestData: any = {
      type: serviceType,
      currentStepNumber: 1,
      currentStep: this.stepNumber + 1,
      status: 'pendiente',
      notes: '',
      stripeToken: '',
      paymentAmount: this.totalAmount,
      paymentMethod: 'transferencia',
      paymentProofUrl: proofUrl,
      clientData: {
        firstName: step1Data.firstName || user.firstName || '',
        lastName: step1Data.lastName || user.lastName || '',
        email: step1Data.email || user.email,
        phone: step1Data.phone || user.phone || '',
        password: step1Data.password || ''
      }
    };
    if (serviceType === 'apertura-llc') {
      const plan = step2Data.plan || '';
      requestData.plan = plan;
      requestData.aperturaLlcData = { incorporationState: step2Data.state || '', plan };
    } else if (serviceType === 'renovacion-llc') {
      requestData.renovacionLlcData = this.getRenovacionLlcPayload();
    } else if (serviceType === 'cuenta-bancaria') {
      requestData.cuentaBancariaData = {};
    }
    try {
      const response = await firstValueFrom(this.wizardApiService.createRequest(requestData));
      if (response?.id) {
        this.wizardStateService.setRequestId(response.id);
        this.transferenciaProcessed = true;
        this.saveStepData();
        this.paymentAndRequestCreated.emit({ requestId: response.id, paymentInfo: { method: 'transferencia', amount: this.totalAmount } });
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Error al crear la solicitud';
      this.paymentError.emit(this.errorMessage);
      this.transferenciaProcessed = false;
      this.saveStepData();
    }
  }
}
