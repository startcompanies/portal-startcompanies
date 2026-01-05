import { Component, OnInit, OnDestroy, Input, OnChanges } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../../../shared/services/wizard-state.service';
import { Subscription } from 'rxjs';
import { StripeService } from '../../services/stripe.service';
import { HttpClient } from '@angular/common/http';

/**
 * Componente reutilizable para el paso de pago
 * Usado en flujos que requieren pago
 */
@Component({
  selector: 'app-wizard-payment-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './payment-step.component.html',
  styleUrls: ['./payment-step.component.css'],

})
export class WizardPaymentStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 3;
  @Input() previousStepNumber: number = 2; // Paso anterior para mostrar resumen

  @Input() packId: string = '';
  @Input() priceId: string = '';
  @Input() state: string = '';

  form!: FormGroup;
  previousStepData: any = {};
  private formSubscription?: Subscription;

  elements: any;
  clientSecret!: string;

  cardNumber: any;
  cardExpiry: any;
  cardCvc: any;

  constructor(
    private wizardStateService: WizardStateService,
    private stripeService: StripeService,
    private http: HttpClient
  ) {
    // Cargar datos guardados si existen
    const savedData = this.wizardStateService.getStepData(this.stepNumber);

    this.form = new FormGroup({
      paymentMethod: new FormControl(savedData.paymentMethod || '', Validators.required),
    });
  }

  ngOnInit(): void {
    // Cargar datos del paso anterior para mostrar resumen
    this.previousStepData = this.wizardStateService.getStepData(this.previousStepNumber);

    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
    }

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.saveStepData();

    this.cardNumber?.destroy();
    this.cardExpiry?.destroy();
    this.cardCvc?.destroy();
  }

  ngAfterViewInit(): void {
    this.initiatePayment();
  }



  /**
   * Guarda los datos del paso
   */
  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }

  async initiatePayment(): Promise<void> {
    this.packId = this.stripeService.getPackId();
    this.priceId = this.stripeService.getPriceId();
    this.state = this.stripeService.getState();
    const stripe = await this.stripeService.getStripe();

    // 1. Crear PaymentIntent
    const res: any = await this.http
      .post('http://localhost:3001/stripe', {
        priceId: 'price_1SlxUrErP4tLezcCxSXUlGyV',
      })
      .toPromise();

    this.clientSecret = res.clientSecret;

    // 2. Crear inputs Stripe

    this.elements = stripe.elements({
      fonts: [
        {
          cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500',
        },
      ],
    });

    const style = {
      base: {
        fontSize: '16px',
        color: '#111827',
        fontFamily: 'Inter, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    };
    this.cardNumber = this.elements.create('cardNumber', { style });
    this.cardExpiry = this.elements.create('cardExpiry', { style });
    this.cardCvc = this.elements.create('cardCvc', { style });

    this.cardNumber.mount('#card-number');
    this.cardExpiry.mount('#card-expiry');
    this.cardCvc.mount('#card-cvc');
  }

  async pay() {
    const stripe = await this.stripeService.getStripe();

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      this.clientSecret,
      {
        payment_method: {
          card: this.cardNumber,
        },
      }
    );

    if (error) {
      console.error(error.message);
    } else {
      console.log('Pago exitoso', paymentIntent);
    }
  }
}
