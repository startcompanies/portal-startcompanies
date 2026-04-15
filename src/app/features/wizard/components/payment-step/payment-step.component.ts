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
import { HttpErrorMapperService } from '../../../../shared/services/http-error-mapper.service';

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
    private wizardPlansService: WizardPlansService,
    private httpErrorMapper: HttpErrorMapperService,
  ) {
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    this.form = new FormGroup({
      paymentMethod: new FormControl(savedData.paymentMethod || 'stripe'),
      paymentProofUrl: new FormControl(savedData.paymentProofUrl || ''),
    });
  }

  ngOnInit(): void {
    const serviceType = this.wizardStateService.getServiceType();

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

      // Apertura LLC: en el nuevo orden del flujo el paso previo puede ser "Información del Servicio"
      // (sin state/plan). Resolver estado/plan/monto desde el paso de selección (step 2).
      if (serviceType === 'apertura-llc') {
        const aperturaSelection = this.getAperturaSelectionPayload();
        if (aperturaSelection.state) {
          this.state = aperturaSelection.state;
        }
        if (aperturaSelection.planRaw) {
          this.packId = this.wizardPlansService.getPlanDisplayLabel(aperturaSelection.planRaw);
        }
        if (aperturaSelection.amount > 0) {
          this.totalAmount = aperturaSelection.amount;
        } else if (aperturaSelection.planRaw) {
          // Fallback: si el amount no fue persistido en step2, calcular por plan.
          this.totalAmount = this.wizardPlansService.calculateAmount(aperturaSelection.planRaw);
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

    // Asegurar sesión leída desde sessionStorage (misma pestaña tras registro/confirmación)
    this.wizardApiService.ensureSessionFromStorage();

    // Verificar que el usuario esté autenticado (JWT en WizardApiService)
    if (!this.wizardApiService.isAuthenticated()) {
      this.errorMessage =
        'Debes verificar tu correo e iniciar sesión en el flujo antes de pagar. Si ya confirmaste el email, vuelve al paso anterior y asegúrate de completar el registro.';
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

      // Renovación LLC: solicitud ya creada tras selección de estado — cobrar vía PATCH
      const existingRenewalId = this.wizardStateService.getRequestId();
      if (serviceType === 'renovacion-llc' && existingRenewalId) {
        try {
          const patchBody: Record<string, unknown> = {
            stripeToken: this.stripePaymentToken,
            paymentAmount: this.totalAmount,
            paymentMethod: 'stripe',
            currentStep: this.stepNumber + 1,
          };
          const updated = await firstValueFrom(
            this.wizardApiService.updateRequest(existingRenewalId, patchBody),
          );
          if (updated && updated.id) {
            this.wizardStateService.setRequestId(updated.id);
          }
          this.stripePaymentProcessed = true;
          this.errorMessage = null;
          this.saveStepData();
          this.stripePaymentForm.disableCardElement();
          this.successMessage = '¡Pago procesado exitosamente!';
          this.stripeProcessing = false;
          this.paymentAndRequestCreated.emit({
            requestId: existingRenewalId,
            paymentInfo: {
              chargeId: updated?.stripeChargeId || '',
              amount: this.totalAmount,
              currency: 'usd',
              status: updated?.paymentStatus || 'succeeded',
              paid: true,
              receiptUrl: '',
            },
          });
          return true;
        } catch (error: unknown) {
          this.stripeProcessing = false;
          this.stripePaymentProcessed = false;
          this.stripePaymentToken = null;
          this.saveStepData();
          this.errorMessage = this.httpErrorMapper.mapHttpError(error, 'HTTP.payment');
          this.paymentError.emit(this.errorMessage);
          return false;
        }
      }

      // Apertura LLC: solicitud ya creada tras Estado/Plan — cobrar vía PATCH
      const existingAperturaId = this.wizardStateService.getRequestId();
      if (serviceType === 'apertura-llc' && existingAperturaId) {
        try {
          const allDataOpening = this.wizardStateService.getAllData();
          const step2Opening = allDataOpening.step2 || {};
          const step3Opening = allDataOpening.step3 || {};
          const patchBody: Record<string, unknown> = {
            stripeToken: this.stripePaymentToken,
            paymentAmount: this.totalAmount,
            paymentMethod: 'stripe',
            currentStep: this.stepNumber + 1,
            plan: step2Opening.plan,
            aperturaLlcData: {
              ...step3Opening,
              incorporationState: step2Opening.state || this.state,
              plan: step2Opening.plan,
              members: step3Opening.members || [],
            },
          };
          const updatedOpening = await firstValueFrom(
            this.wizardApiService.updateRequest(existingAperturaId, patchBody),
          );
          if (updatedOpening && updatedOpening.id) {
            this.wizardStateService.setRequestId(updatedOpening.id);
          }
          this.stripePaymentProcessed = true;
          this.errorMessage = null;
          this.saveStepData();
          this.stripePaymentForm.disableCardElement();
          this.successMessage = '¡Pago procesado exitosamente!';
          this.stripeProcessing = false;
          this.paymentAndRequestCreated.emit({
            requestId: existingAperturaId,
            paymentInfo: {
              chargeId: updatedOpening?.stripeChargeId || '',
              amount: this.totalAmount,
              currency: 'usd',
              status: updatedOpening?.paymentStatus || 'succeeded',
              paid: true,
              receiptUrl: '',
            },
          });
          return true;
        } catch (error: unknown) {
          this.stripeProcessing = false;
          this.stripePaymentProcessed = false;
          this.stripePaymentToken = null;
          this.saveStepData();
          this.errorMessage = this.httpErrorMapper.mapHttpError(error, 'HTTP.payment');
          this.paymentError.emit(this.errorMessage);
          return false;
        }
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
        source: this.wizardStateService.getFlowSource(),
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
        const step3Data = allData.step3 || {};
        requestData.plan = plan;
        requestData.aperturaLlcData = {
          ...step3Data,
          incorporationState: step2Data.state || '',
          plan,
          members: step3Data.members || [],
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

    } catch (error: unknown) {
      this.stripeProcessing = false;
      this.stripePaymentProcessed = false; // Asegurar que no se marque como procesado
      // tok_ es de un solo uso: no persistir token tras fallo para forzar uno nuevo y evitar reintentos inválidos
      this.stripePaymentToken = null;
      this.saveStepData();
      this.errorMessage = this.httpErrorMapper.mapHttpError(error, 'HTTP.payment');
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
   * Obtiene estado/plan/monto para apertura LLC desde el paso de selección.
   * Toma step2 como fuente principal y usa fallback buscando en pasos previos.
   */
  private getAperturaSelectionPayload(): { state: string; planRaw: string; amount: number } {
    const allData = this.wizardStateService.getAllData() as Record<string, any>;
    const blocks: any[] = [];

    if (allData['step2']) {
      blocks.push(allData['step2']);
    }

    for (let n = 2; n <= this.stepNumber; n++) {
      const block = allData[`step${n}`];
      if (block && !blocks.includes(block)) {
        blocks.push(block);
      }
    }

    const pickString = (field: 'state' | 'plan'): string => {
      for (const b of blocks) {
        const v = b?.[field];
        if (v != null && String(v).trim() !== '') {
          return String(v).trim();
        }
      }
      return '';
    };

    const pickAmount = (): number => {
      for (const b of blocks) {
        const v = Number(b?.amount);
        if (!isNaN(v) && v > 0) {
          return v;
        }
      }
      return 0;
    };

    return {
      state: pickString('state'),
      planRaw: pickString('plan'),
      amount: pickAmount(),
    };
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
    } catch (error: unknown) {
      this.errorMessage = this.httpErrorMapper.mapHttpError(error);
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
    this.wizardApiService.ensureSessionFromStorage();
    if (!this.wizardApiService.isAuthenticated()) {
      this.errorMessage =
        'Debes verificar tu correo antes de continuar. Si ya lo confirmaste, vuelve al paso de registro o recarga la página.';
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
      source: this.wizardStateService.getFlowSource(),
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
      const step3Data = allData.step3 || {};
      requestData.plan = plan;
      requestData.aperturaLlcData = {
        ...step3Data,
        incorporationState: step2Data.state || '',
        plan,
        members: step3Data.members || [],
      };
    } else if (serviceType === 'renovacion-llc') {
      requestData.renovacionLlcData = this.getRenovacionLlcPayload();
    } else if (serviceType === 'cuenta-bancaria') {
      requestData.cuentaBancariaData = {};
    }
    try {
      const existingId = this.wizardStateService.getRequestId();
      if (serviceType === 'renovacion-llc' && existingId) {
        const patchBody: Record<string, unknown> = {
          stripeToken: '',
          paymentAmount: this.totalAmount,
          paymentMethod: 'transferencia',
          paymentProofUrl: proofUrl,
          currentStep: this.stepNumber + 1,
        };
        const updated = await firstValueFrom(
          this.wizardApiService.updateRequest(existingId, patchBody),
        );
        if (updated?.id) {
          this.wizardStateService.setRequestId(updated.id);
        }
        this.transferenciaProcessed = true;
        this.saveStepData();
        this.paymentAndRequestCreated.emit({
          requestId: existingId,
          paymentInfo: { method: 'transferencia', amount: this.totalAmount },
        });
        return;
      }
      if (serviceType === 'apertura-llc' && existingId) {
        const step3Data = allData.step3 || {};
        const patchBody: Record<string, unknown> = {
          stripeToken: '',
          paymentAmount: this.totalAmount,
          paymentMethod: 'transferencia',
          paymentProofUrl: proofUrl,
          currentStep: this.stepNumber + 1,
          plan: step2Data.plan,
          aperturaLlcData: {
            ...step3Data,
            incorporationState: step2Data.state || '',
            plan: step2Data.plan,
            members: step3Data.members || [],
          },
        };
        const updatedTr = await firstValueFrom(
          this.wizardApiService.updateRequest(existingId, patchBody),
        );
        if (updatedTr?.id) {
          this.wizardStateService.setRequestId(updatedTr.id);
        }
        this.transferenciaProcessed = true;
        this.saveStepData();
        this.paymentAndRequestCreated.emit({
          requestId: existingId,
          paymentInfo: { method: 'transferencia', amount: this.totalAmount },
        });
        return;
      }
      const response = await firstValueFrom(this.wizardApiService.createRequest(requestData));
      if (response?.id) {
        this.wizardStateService.setRequestId(response.id);
        this.transferenciaProcessed = true;
        this.saveStepData();
        this.paymentAndRequestCreated.emit({ requestId: response.id, paymentInfo: { method: 'transferencia', amount: this.totalAmount } });
      }
    } catch (error: unknown) {
      this.errorMessage = this.httpErrorMapper.mapHttpError(error, 'HTTP.payment');
      this.paymentError.emit(this.errorMessage);
      this.transferenciaProcessed = false;
      this.saveStepData();
    }
  }
}
