import { Component, OnInit, OnDestroy, Input, OnChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { StripeService } from '../../services/stripe.service';
import { HttpClient } from '@angular/common/http';
import { StripePaymentFormComponent, StripePaymentResult } from '../../../panel/components/stripe-payment-form/stripe-payment-form.component';

/**
 * Componente reutilizable para el paso de pago
 * Usado en flujos que requieren pago
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
  
  @ViewChild(StripePaymentFormComponent, { static: false }) stripePaymentForm!: StripePaymentFormComponent;
  
  totalAmount: number = 0;
  stripeProcessing = false;
  stripePaymentProcessed = false;
  stripePaymentToken: string | null = null;

  form!: FormGroup;
  previousStepData: any = {};
  private formSubscription?: Subscription;

  constructor(
    private wizardStateService: WizardStateService,
    private stripeService: StripeService,
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
        this.packId = this.previousStepData.plan || this.packId;
        this.state = this.previousStepData.state || this.state;
        
        // Obtener monto del paso anterior
        if (this.previousStepData.amount) {
          this.totalAmount = this.previousStepData.amount;
        } else {
          // Calcular según el estado si no hay monto guardado
          const stateValue = this.previousStepData.state || this.state;
          if (stateValue) {
            if (stateValue === 'New Mexico') {
              this.totalAmount = 649;
            } else if (stateValue === 'Texas') {
              this.totalAmount = 850;
            } else {
              this.totalAmount = 750;
            }
          }
        }
      }
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
   * Procesa el pago con Stripe
   * Similar a new-request pero adaptado para wizard
   */
  async processStripePayment(): Promise<boolean> {
    if (!this.stripePaymentForm) {
      console.error('StripePaymentFormComponent no está disponible');
      return false;
    }

    if (this.stripePaymentProcessed) {
      console.log('Pago ya procesado anteriormente');
      return true;
    }

    this.stripeProcessing = true;

    try {
      // 1. Obtener el token de Stripe del formulario
      const paymentResult = await this.stripePaymentForm.createPaymentToken();

      if (paymentResult.error || !paymentResult.token) {
        this.stripeProcessing = false;
        console.error('Error al crear token de pago:', paymentResult.error);
        return false;
      }

      // Guardar el token del pago
      this.stripePaymentToken = paymentResult.token;
      
      // 2. Guardar estado del pago en el wizard
      this.stripePaymentProcessed = true;
      this.saveStepData();
      
      // 3. Bloquear los campos de la tarjeta
      this.stripePaymentForm.disableCardElement();
      
      this.stripeProcessing = false;
      return true;

    } catch (error: any) {
      this.stripeProcessing = false;
      console.error('Error al procesar pago:', error);
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
