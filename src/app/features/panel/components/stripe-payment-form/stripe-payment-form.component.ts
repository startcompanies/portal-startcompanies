import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { StripeService } from '../../services/stripe.service';
import { loadStripe, Stripe, StripeElements, StripeCardElement, StripeCardElementChangeEvent } from '@stripe/stripe-js';

export interface StripePaymentResult {
  token?: string;
  paymentIntent?: any;
  error?: any;
}

@Component({
  selector: 'app-stripe-payment-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stripe-payment-form.component.html',
  styleUrl: './stripe-payment-form.component.css'
})
export class StripePaymentFormComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() amount: number = 0;
  @Input() currency: string = 'usd';
  @Input() showAmount: boolean = true;
  @Input() cardElementId: string = 'stripe-card-element';
  @Input() errorElementId: string = 'stripe-card-errors';
  @Input() disabled: boolean = false;
  
  @Output() paymentReady = new EventEmitter<boolean>();
  @Output() paymentError = new EventEmitter<string>();
  @Output() paymentSuccess = new EventEmitter<StripePaymentResult>();

  @ViewChild('cardElementContainer', { static: false }) cardElementContainer!: ElementRef;
  @ViewChild('errorElementContainer', { static: false }) errorElementContainer!: ElementRef;

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;
  
  isInitialized = false;
  isProcessing = false;
  isValid = false;
  errorMessage: string | null = null;

  private mountAttempted = false;

  constructor(
    private stripeService: StripeService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    // Inicializar Stripe
    await this.initializeStripe();
  }

  async ngAfterViewInit(): Promise<void> {
    // Esperar a que el DOM esté completamente listo
    // Usar setTimeout para asegurar que el ViewChild esté disponible
    setTimeout(async () => {
      if (!this.mountAttempted) {
        await this.mountCardElementWithRetry();
      }
    }, 200);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const disabledChange = changes['disabled'];
    if (disabledChange && this.cardElement) {
      if (disabledChange.currentValue) {
        this.disableCardElement();
      } else if (!disabledChange.firstChange) {
        this.enableCardElement();
      }
    }
  }

  ngAfterViewChecked(): void {
    // Si el elemento aún no se ha montado y ahora está disponible, intentar montarlo
    if (!this.mountAttempted && this.cardElementContainer?.nativeElement && this.elements && !this.cardElement) {
      this.mountAttempted = true;
      setTimeout(async () => {
        await this.mountCardElementWithRetry();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.unmountCardElement();
  }

  /**
   * Inicializa Stripe
   */
  private async initializeStripe(): Promise<void> {
    try {
      console.log('Inicializando Stripe...');
      this.stripe = await this.stripeService.getStripe();
      
      if (!this.stripe) {
        console.error('Stripe no está disponible');
        this.handleError('No se pudo inicializar Stripe. Por favor, verifica tu configuración.');
        return;
      }

      console.log('Stripe inicializado correctamente');

      // Crear elementos de Stripe
      this.elements = this.stripe.elements({
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0066cc',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '4px',
          },
        },
      });

      this.isInitialized = true;
      console.log('Stripe Elements creado correctamente');
    } catch (error: any) {
      console.error('Error al inicializar Stripe:', error);
      this.handleError('Error al inicializar Stripe: ' + (error.message || 'Error desconocido'));
    }
  }

  /**
   * Monta el elemento de tarjeta con reintentos
   */
  private async mountCardElementWithRetry(): Promise<void> {
    // Si ya está montado, no hacer nada
    if (this.cardElement) {
      return;
    }

    const maxAttempts = 15;
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Verificar que tanto el contenedor como elements estén disponibles
      const container = this.cardElementContainer?.nativeElement;
      if (container && this.elements) {
        // Verificar que el contenedor sea visible
        const isVisible = container.offsetParent !== null || container.offsetWidth > 0;
        
        if (isVisible) {
          try {
            await this.mountCardElement();
            this.mountAttempted = true;
            this.cdr.detectChanges();
            return;
          } catch (error) {
            console.warn(`Intento ${attempts + 1} fallido, reintentando...`, error);
          }
        }
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.error('No se pudo montar el elemento de tarjeta después de múltiples intentos');
    this.handleError('Error al cargar el formulario de pago. Por favor, recarga la página.');
  }

  /**
   * Monta el elemento de tarjeta
   */
  private async mountCardElement(): Promise<void> {
    if (!this.elements) {
      throw new Error('Stripe Elements no está inicializado');
    }

    if (!this.cardElementContainer?.nativeElement) {
      throw new Error('El contenedor del elemento de tarjeta no está disponible');
    }

    // Verificar que el elemento no esté ya montado
    if (this.cardElement) {
      try {
        this.cardElement.unmount();
      } catch (error) {
        // Ignorar errores al desmontar
      }
      this.cardElement = null;
    }

    try {
      // Crear el elemento de tarjeta
      // Stripe Elements maneja automáticamente el CVV como campo seguro
      this.cardElement = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#30313d',
            fontFamily: 'system-ui, sans-serif',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#df1b41',
            iconColor: '#df1b41',
          },
        },
        // El CVV se maneja automáticamente por Stripe Elements como campo seguro
      });

      // Limpiar el contenedor antes de montar
      const container = this.cardElementContainer.nativeElement;
      container.innerHTML = '';

      // Montar el elemento
      this.cardElement.mount(container);

      // Escuchar cambios en el elemento
      this.cardElement.on('change', (event: StripeCardElementChangeEvent) => {
        this.handleCardChange(event);
      });

      // Escuchar eventos de focus
      this.cardElement.on('focus', () => {
        this.clearError();
      });

      // Escuchar cuando el elemento esté listo
      this.cardElement.on('ready', () => {
        console.log('Elemento de tarjeta de Stripe listo y visible');
      });

      console.log('Elemento de tarjeta de Stripe montado correctamente');

    } catch (error: any) {
      console.error('Error al montar el elemento de tarjeta:', error);
      throw error;
    }
  }

  /**
   * Maneja los cambios en el elemento de tarjeta
   */
  private handleCardChange(event: StripeCardElementChangeEvent): void {
    if (event.error) {
      this.handleError(event.error.message);
      this.isValid = false;
    } else {
      this.clearError();
      this.isValid = event.complete || false;
    }
    
    // Emitir el estado de validez
    this.paymentReady.emit(this.isValid);
  }

  /**
   * Maneja errores
   */
  private handleError(message: string): void {
    this.errorMessage = message;
    this.paymentError.emit(message);
    
    if (this.errorElementContainer) {
      this.errorElementContainer.nativeElement.textContent = message;
      this.errorElementContainer.nativeElement.style.display = 'block';
    }
  }

  /**
   * Limpia el mensaje de error
   */
  private clearError(): void {
    this.errorMessage = null;
    if (this.errorElementContainer) {
      this.errorElementContainer.nativeElement.textContent = '';
      this.errorElementContainer.nativeElement.style.display = 'none';
    }
  }

  /**
   * Desmonta el elemento de tarjeta
   */
  private unmountCardElement(): void {
    if (this.cardElement) {
      try {
        this.cardElement.unmount();
      } catch (error) {
        console.error('Error al desmontar el elemento de tarjeta:', error);
      }
      this.cardElement = null;
    }
  }

  /**
   * Crea un token de pago
   */
  async createPaymentToken(): Promise<StripePaymentResult> {
    if (!this.stripe || !this.cardElement) {
      return {
        error: { message: 'Stripe no está inicializado' }
      };
    }

    if (!this.isValid) {
      return {
        error: { message: 'Por favor, completa correctamente los datos de la tarjeta' }
      };
    }

    this.isProcessing = true;
    this.clearError();

    try {
      const { token, error } = await this.stripe.createToken(this.cardElement, {
        currency: this.currency.toLowerCase()
      });

      this.isProcessing = false;

      if (error) {
        this.handleError(error.message || 'Error al procesar el pago');
        return { error };
      }

      if (token) {
        const result: StripePaymentResult = { token: token.id };
        this.paymentSuccess.emit(result);
        return result;
      }

      return {
        error: { message: 'No se pudo crear el token de pago' }
      };
    } catch (error: any) {
      this.isProcessing = false;
      const errorMessage = error.message || 'Error desconocido al procesar el pago';
      this.handleError(errorMessage);
      return { error: { message: errorMessage } };
    }
  }

  /**
   * Confirma un pago con PaymentIntent
   */
  async confirmPayment(clientSecret: string): Promise<StripePaymentResult> {
    if (!this.stripe || !this.cardElement) {
      return {
        error: { message: 'Stripe no está inicializado' }
      };
    }

    if (!this.isValid) {
      return {
        error: { message: 'Por favor, completa correctamente los datos de la tarjeta' }
      };
    }

    this.isProcessing = true;
    this.clearError();

    try {
      const { paymentIntent, error } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardElement,
        }
      });

      this.isProcessing = false;

      if (error) {
        this.handleError(error.message || 'Error al confirmar el pago');
        return { error };
      }

      if (paymentIntent) {
        const result: StripePaymentResult = { paymentIntent };
        this.paymentSuccess.emit(result);
        return result;
      }

      return {
        error: { message: 'No se pudo confirmar el pago' }
      };
    } catch (error: any) {
      this.isProcessing = false;
      const errorMessage = error.message || 'Error desconocido al confirmar el pago';
      this.handleError(errorMessage);
      return { error: { message: errorMessage } };
    }
  }

  /**
   * Recarga el elemento de tarjeta
   */
  async reload(): Promise<void> {
    this.unmountCardElement();
    await this.mountCardElementWithRetry();
  }

  /**
   * Resetea el formulario
   */
  reset(): void {
    this.clearError();
    this.isValid = false;
    this.isProcessing = false;
    if (this.cardElement) {
      this.cardElement.clear();
    }
  }

  /**
   * Deshabilita el elemento de tarjeta (bloquea los campos)
   */
  disableCardElement(): void {
    if (this.cardElement) {
      try {
        // Stripe Elements no tiene un método directo para deshabilitar, pero podemos usar CSS
        // y prevenir la interacción
        const container = this.cardElementContainer?.nativeElement;
        if (container) {
          container.style.pointerEvents = 'none';
          container.style.opacity = '0.6';
          container.classList.add('disabled');
        }
        this.disabled = true;
      } catch (error) {
        console.error('Error al deshabilitar el elemento de tarjeta:', error);
      }
    }
  }

  /**
   * Habilita el elemento de tarjeta
   */
  enableCardElement(): void {
    if (this.cardElement) {
      try {
        const container = this.cardElementContainer?.nativeElement;
        if (container) {
          container.style.pointerEvents = 'auto';
          container.style.opacity = '1';
          container.classList.remove('disabled');
        }
        this.disabled = false;
      } catch (error) {
        console.error('Error al habilitar el elemento de tarjeta:', error);
      }
    }
  }
}

