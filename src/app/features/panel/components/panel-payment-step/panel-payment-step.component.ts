import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RequestFlowStateService } from '../../../../shared/services/request-flow-state.service';
import { RequestFlowStep, ServiceType } from '../../../../shared/models/request-flow-context';
import { RequestsService } from '../../services/requests.service';
import { StripePaymentFormComponent, StripePaymentResult } from '../stripe-payment-form/stripe-payment-form.component';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardPlansService } from '../../../wizard/services/wizard-plans.service';

/**
 * Componente de pago para el flujo del panel
 * Soporta Stripe y transferencia bancaria
 */
@Component({
  selector: 'app-panel-payment-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StripePaymentFormComponent, TranslocoPipe],
  templateUrl: './panel-payment-step.component.html',
  styleUrls: ['./panel-payment-step.component.css']
})
export class PanelPaymentStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 1;
  @Input() serviceType: ServiceType = 'apertura-llc';
  @Input() requestId?: number; // ID del request si ya fue creado
  /** UUID de la solicitud (`requests.uuid`) para subidas bajo `request/{servicio}/{uuid}/`. */
  @Input() requestUuid?: string | null;
  
  @Output() paymentAndRequestCreated = new EventEmitter<{
    requestId: number;
    requestUuid?: string;
    paymentInfo: any;
  }>();
  @Output() paymentError = new EventEmitter<string | null>();
  @Output() stepValid = new EventEmitter<boolean>();
  
  @ViewChild(StripePaymentFormComponent, { static: false }) stripePaymentForm!: StripePaymentFormComponent;
  
  form!: FormGroup;
  paymentAmount: number = 0;
  stripeProcessing = false;
  stripePaymentProcessed = false;
  stripePaymentToken: string | null = null;
  
  // Transferencia bancaria
  selectedPaymentProofFile: File | null = null;
  isUploadingPaymentProof = false;
  paymentProofUploadProgress = 0;
  
  // Estados
  paymentAlreadyProcessed = false;
  processedPaymentMethod: string = '';
  processedPaymentAmount: number = 0;
  processedStripeChargeId: string = '';
  processedPaymentStatus: string = '';
  
  errorMessage: string | null = null;
  successMessage: string | null = null;
  
  private formSubscription?: Subscription;
  
  paymentMethods = [
    { value: 'stripe', labelKey: 'PANEL.payment_step.stripe_label', icon: 'bi-credit-card' },
    { value: 'transferencia', labelKey: 'PANEL.payment_step.transfer_label', icon: 'bi-bank' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private flowStateService: RequestFlowStateService,
    private requestsService: RequestsService,
    private http: HttpClient,
    private wizardPlansService: WizardPlansService
  ) {
    const savedData = this.flowStateService.getStepData(RequestFlowStep.PAYMENT);
    
    this.form = this.fb.group({
      paymentMethod: [savedData.paymentMethod || 'stripe', Validators.required],
      paymentAmount: [savedData.paymentAmount || 0, [Validators.required, Validators.min(0)]],
      paymentProofUrl: [savedData.paymentProofUrl || ''],
      notes: [savedData.notes || '']
    });
  }
  
  ngOnInit(): void {
    // Calcular monto automáticamente
    this.calculatePaymentAmount();
    
    // Cargar datos guardados
    const savedData = this.flowStateService.getStepData(RequestFlowStep.PAYMENT);
    if (savedData) {
      if (savedData.paymentProcessed) {
        this.paymentAlreadyProcessed = true;
        this.processedPaymentMethod = savedData.paymentInfo?.method || savedData.paymentMethod || '';
        this.processedPaymentAmount = savedData.paymentInfo?.amount || savedData.paymentAmount || 0;
        this.processedStripeChargeId = savedData.paymentInfo?.chargeId || '';
        this.processedPaymentStatus = savedData.paymentInfo?.status || 'succeeded';
        this.stripePaymentProcessed = savedData.paymentMethod === 'stripe';
        this.form.patchValue({
          paymentMethod: savedData.paymentMethod || 'stripe',
          paymentAmount: savedData.paymentAmount || 0,
          paymentProofUrl: savedData.paymentProofUrl || ''
        });
      } else {
        this.form.patchValue(savedData);
      }
    }
    
    // Guardar cambios
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.flowStateService.setStepData(RequestFlowStep.PAYMENT, this.form.value);
      this.updateStepValidity();
    });
    
    // Actualizar monto cuando cambia el método de pago
    this.form.get('paymentMethod')?.valueChanges.subscribe(() => {
      this.calculatePaymentAmount();
    });
    
    this.updateStepValidity();
  }
  
  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }
  
  /**
   * Calcula el monto del pago según el tipo de servicio.
   * Prioridad: (1) amount ya guardado en statePlanData, (2) recalculado desde state+llcType o plan,
   * (3) paymentAmount guardado en PAYMENT (p. ej. al volver a cargar un borrador).
   */
  calculatePaymentAmount(): void {
    if (this.serviceType === 'cuenta-bancaria') {
      this.paymentAmount = 0;
      this.form.patchValue({ paymentAmount: 0 }, { emitEvent: false });
      return;
    }

    const planStateData = this.flowStateService.getStepData(RequestFlowStep.PLAN_STATE_SELECTION);
    const stateData = this.flowStateService.getStepData(RequestFlowStep.STATE_SELECTION);
    const statePlanData = planStateData || stateData;

    let amount = 0;

    if (statePlanData?.amount) {
      amount = statePlanData.amount;
    } else if (stateData?.state && stateData?.llcType) {
      // Recalcular desde state + llcType (renovacion-llc)
      const result = this.wizardPlansService.calculateRenewalAmount(stateData.state, stateData.llcType);
      amount = result.amount ?? 0;
    } else if (planStateData?.plan) {
      // Recalcular desde plan (apertura-llc)
      amount = this.wizardPlansService.calculateAmount(planStateData.plan);
    } else {
      // Fallback: usar paymentAmount ya guardado en el paso de pago (borrador sin statePlanData)
      const savedPayment = this.flowStateService.getStepData(RequestFlowStep.PAYMENT);
      amount = savedPayment?.paymentAmount ?? 0;
    }

    this.paymentAmount = amount;
    this.form.patchValue({ paymentAmount: amount }, { emitEvent: false });
  }
  
  /**
   * Verifica si el monto debe calcularse automáticamente
   */
  shouldCalculateAmount(): boolean {
    return this.serviceType !== 'cuenta-bancaria' || this.paymentAmount === 0;
  }
  
  /**
   * Procesa el pago con Stripe
   */
  async processStripePayment(): Promise<void> {
    if (!this.stripePaymentForm) {
      this.errorMessage = 'Error: Formulario de pago no disponible';
      this.paymentError.emit(this.errorMessage);
      return;
    }
    
    if (this.stripePaymentProcessed && this.requestId) {
      this.successMessage = 'Pago ya procesado anteriormente';
      return;
    }
    
    this.stripeProcessing = true;
    this.errorMessage = null;
    this.successMessage = null;
    
    try {
      // Obtener token de Stripe
      const paymentResult = await this.stripePaymentForm.createPaymentToken();
      
      if (paymentResult.error || !paymentResult.token) {
        this.errorMessage = paymentResult.error || 'Error al crear token de pago';
        this.stripeProcessing = false;
        this.paymentError.emit(this.errorMessage);
        return;
      }
      
      this.stripePaymentToken = paymentResult.token;
      
      // Si ya hay un request, actualizarlo con el pago
      if (this.requestId) {
        await this.updateRequestWithPayment('stripe', this.stripePaymentToken);
      } else {
        // Crear nuevo request con pago
        await this.createRequestWithPayment('stripe', this.stripePaymentToken);
      }
      
      this.stripePaymentProcessed = true;
      this.paymentAlreadyProcessed = true;
      this.processedPaymentMethod = 'stripe';
      this.processedPaymentAmount = this.paymentAmount;
      this.processedPaymentStatus = 'succeeded';
      
      this.stripePaymentForm.disableCardElement();
      this.successMessage = '¡Pago procesado exitosamente!';
      this.stripeProcessing = false;
      
      this.updateStepValidity();
      
    } catch (error: any) {
      this.stripeProcessing = false;
      this.errorMessage = error?.error?.message || 'Error al procesar el pago';
      this.paymentError.emit(this.errorMessage);
    }
  }
  
  /**
   * Maneja la selección de archivo de comprobante
   */
  onPaymentProofFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'El archivo es demasiado grande. Máximo 10MB';
        return;
      }
      
      // Validar tipo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Tipo de archivo no permitido. Use PDF, JPG, PNG, DOC o DOCX';
        return;
      }
      
      this.selectedPaymentProofFile = file;
      this.errorMessage = null;
      this.uploadPaymentProof();
    }
  }
  
  /**
   * Sube el comprobante de transferencia
   */
  async uploadPaymentProof(): Promise<void> {
    if (!this.selectedPaymentProofFile) return;
    
    this.isUploadingPaymentProof = true;
    this.paymentProofUploadProgress = 0;
    this.errorMessage = null;
    
    try {
      const formData = new FormData();
      formData.append('file', this.selectedPaymentProofFile);
      formData.append('servicio', this.serviceType);
      
      const folderUuid = (this.requestUuid || '').trim();
      if (folderUuid) {
        formData.append('requestUuid', folderUuid);
      }
      
      const response = await firstValueFrom(
        this.http.post<{ url: string; key: string; message: string }>(
          `${environment.apiUrl}/upload-file`,
          formData
        )
      );
      
      if (response && response.url) {
        const url = response.url;
        this.form.patchValue({ paymentProofUrl: url });
        
        // Si ya hay un request, actualizarlo
        if (this.requestId) {
          await this.updateRequestWithPayment('transferencia');
        } else {
          // Crear nuevo request con transferencia
          await this.createRequestWithPayment('transferencia');
        }
        
        this.selectedPaymentProofFile = null;
        this.paymentAlreadyProcessed = true;
        this.processedPaymentMethod = 'transferencia';
        this.processedPaymentAmount = this.paymentAmount;
        this.processedPaymentStatus = 'pending';
        
        this.successMessage = 'Comprobante subido exitosamente';
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Error al subir el comprobante';
      this.paymentError.emit(this.errorMessage);
    } finally {
      this.isUploadingPaymentProof = false;
      this.paymentProofUploadProgress = 0;
    }
  }
  
  /**
   * Limpia el archivo de comprobante
   */
  clearPaymentProofFile(): void {
    this.selectedPaymentProofFile = null;
    this.form.patchValue({ paymentProofUrl: '' });
    this.errorMessage = null;
    this.updateStepValidity();
  }
  
  /**
   * Crea un request con pago
   */
  private async createRequestWithPayment(method: 'stripe' | 'transferencia', token?: string): Promise<void> {
    const clientData = this.flowStateService.getStepData(RequestFlowStep.CLIENT_SELECTION);
    const serviceData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
    const statePlanData = this.flowStateService.getStepData(RequestFlowStep.PLAN_STATE_SELECTION) ||
                         this.flowStateService.getStepData(RequestFlowStep.STATE_SELECTION);
    
    const requestData: any = {
      type: this.serviceType,
      currentStepNumber: 3,
      status: method === 'stripe' ? 'solicitud-recibida' : 'pendiente',
      paymentMethod: method,
      paymentAmount: this.paymentAmount,
      notes: this.form.get('notes')?.value || ''
    };
    
    if (method === 'stripe' && token) {
      requestData.stripeToken = token;
    } else if (method === 'transferencia') {
      requestData.paymentProofUrl = this.form.get('paymentProofUrl')?.value;
    }
    
    // Agregar datos del cliente
    if (clientData.clientId) {
      requestData.clientId = clientData.clientId;
    } else if (clientData.clientFirstName) {
      // Crear cliente nuevo
      requestData.clientData = {
        firstName: clientData.clientFirstName,
        lastName: clientData.clientLastName,
        email: clientData.clientEmail,
        phone: clientData.clientPhone
      };
    }
    
    // Agregar datos del servicio (plan se envía al crear para apertura-llc)
    if (this.serviceType === 'apertura-llc') {
      const plan = statePlanData?.plan || '';
      requestData.plan = plan;
      requestData.aperturaLlcData = {
        ...serviceData,
        incorporationState: statePlanData?.state || '',
        plan
      };
    } else if (this.serviceType === 'renovacion-llc') {
      requestData.renovacionLlcData = {
        ...serviceData,
        state: statePlanData?.state || '',
        llcType: statePlanData?.llcType || ''
      };
    } else if (this.serviceType === 'cuenta-bancaria') {
      requestData.cuentaBancariaData = serviceData;
    }
    
    const response = await this.requestsService.createRequest(requestData);
    
    if (response && response.id) {
      this.requestId = response.id;
      const ru = (response.uuid || '').trim();
      
      // Guardar en el estado
      this.flowStateService.setStepData(RequestFlowStep.PAYMENT, {
        paymentProcessed: true,
        requestId: response.id,
        ...(ru ? { requestUuid: ru } : {}),
        paymentMethod: method,
        paymentAmount: this.paymentAmount,
        paymentInfo: {
          method,
          amount: this.paymentAmount,
          chargeId: response.stripeChargeId || '',
          status: response.paymentStatus || (method === 'stripe' ? 'succeeded' : 'pending')
        }
      });
      
      this.paymentAndRequestCreated.emit({
        requestId: response.id,
        requestUuid: ru || undefined,
        paymentInfo: {
          method,
          amount: this.paymentAmount,
          chargeId: response.stripeChargeId || '',
          status: response.paymentStatus || (method === 'stripe' ? 'succeeded' : 'pending')
        }
      });
    }
  }
  
  /**
   * Actualiza un request existente con el pago
   */
  private async updateRequestWithPayment(method: 'stripe' | 'transferencia', token?: string): Promise<void> {
    if (!this.requestId) return;
    
    const updateData: any = {
      paymentMethod: method,
      paymentAmount: this.paymentAmount,
      status: method === 'stripe' ? 'solicitud-recibida' : 'pendiente'
    };
    
    if (method === 'stripe' && token) {
      updateData.stripeToken = token;
    } else if (method === 'transferencia') {
      updateData.paymentProofUrl = this.form.get('paymentProofUrl')?.value;
    }
    
    const response = await this.requestsService.updateRequest(this.requestId, updateData);
    
    if (response) {
      const ru = (response.uuid || '').trim();
      this.flowStateService.setStepData(RequestFlowStep.PAYMENT, {
        paymentProcessed: true,
        requestId: response.id,
        ...(ru ? { requestUuid: ru } : {}),
        paymentMethod: method,
        paymentAmount: this.paymentAmount,
        paymentInfo: {
          method,
          amount: this.paymentAmount,
          chargeId: response.stripeChargeId || '',
          status: response.paymentStatus || (method === 'stripe' ? 'succeeded' : 'pending')
        }
      });
      
      this.paymentAndRequestCreated.emit({
        requestId: response.id,
        requestUuid: ru || undefined,
        paymentInfo: {
          method,
          amount: this.paymentAmount,
          chargeId: response.stripeChargeId || '',
          status: response.paymentStatus || (method === 'stripe' ? 'succeeded' : 'pending')
        }
      });
    }
  }
  
  /**
   * Valida el paso actual
   */
  validate(): boolean {
    this.form.markAllAsTouched();
    
    // Si el monto es 0 (cuenta bancaria gratuita), es válido
    if (this.paymentAmount === 0) {
      return true;
    }
    
    // Si el pago ya fue procesado, es válido
    if (this.paymentAlreadyProcessed) {
      return true;
    }
    
    // Validar según el método de pago
    const method = this.form.get('paymentMethod')?.value;
    
    if (method === 'stripe') {
      return this.stripePaymentProcessed;
    } else if (method === 'transferencia') {
      return !!this.form.get('paymentProofUrl')?.value;
    }
    
    return false;
  }
  
  /**
   * Actualiza la validez del paso
   */
  private updateStepValidity(): void {
    const isValid = this.validate();
    this.stepValid.emit(isValid);
  }
  
  /**
   * Obtiene los datos del formulario
   */
  getFormData(): any {
    return {
      ...this.form.value,
      paymentProcessed: this.paymentAlreadyProcessed,
      requestId: this.requestId
    };
  }
  
  /**
   * Handlers de eventos de Stripe
   */
  onStripePaymentSuccess(result: StripePaymentResult): void {
    if (result.token) {
      this.stripePaymentToken = result.token;
    }
  }
  
  onStripePaymentError(error: string): void {
    this.errorMessage = error;
    this.stripeProcessing = false;
    this.paymentError.emit(error);
  }
}
