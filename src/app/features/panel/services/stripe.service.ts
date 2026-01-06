import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: Promise<Stripe | null>;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  constructor() {
    // Inicializar Stripe con la clave pública
    // TODO: Agregar la clave pública de Stripe al environment
    const stripePublishableKey = environment.stripe?.publishableKey || '';
    this.stripe = loadStripe(stripePublishableKey);
  }

  /**
   * Obtiene la instancia de Stripe
   */
  async getStripe(): Promise<Stripe | null> {
    return this.stripe;
  }

  /**
   * Crea e inicializa los elementos de Stripe
   */
  async createElements(): Promise<StripeElements | null> {
    const stripe = await this.getStripe();
    if (!stripe) {
      console.error('Stripe no está disponible');
      return null;
    }

    this.elements = stripe.elements();
    return this.elements;
  }

  /**
   * Crea el elemento de tarjeta de crédito
   */
  async createCardElement(): Promise<StripeCardElement | null> {
    if (!this.elements) {
      await this.createElements();
    }

    if (!this.elements) {
      return null;
    }

    // Crear el elemento de tarjeta si no existe
    if (!this.cardElement) {
      this.cardElement = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#9e2146',
            iconColor: '#9e2146',
          },
        },
        // Opcional: agregar campos adicionales si es necesario
        // Por defecto, el elemento 'card' incluye número, expiración y CVC
        // Si necesitas código postal, puedes usar 'cardNumber', 'cardExpiry', 'cardCvc', 'postalCode' por separado
      });
    }

    return this.cardElement;
  }

  /**
   * Monta el elemento de tarjeta en el contenedor
   */
  async mountCardElement(containerId: string, errorContainerId?: string): Promise<boolean> {
    try {
      const cardElement = await this.createCardElement();
      if (!cardElement) {
        console.error('No se pudo crear el elemento de tarjeta de Stripe');
        return false;
      }

      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Contenedor con ID ${containerId} no encontrado`);
        return false;
      }

      // Verificar que el contenedor sea visible
      if (container.offsetParent === null) {
        console.warn(`Contenedor ${containerId} no es visible`);
        // Intentar de todos modos, puede que sea un problema de timing
      }

      // Limpiar el contenedor antes de montar
      container.innerHTML = '';
      
      // Montar el elemento
      cardElement.mount(`#${containerId}`);

      // Manejar errores de validación de tarjeta
      if (errorContainerId) {
        cardElement.on('change', (event) => {
          const errorElement = document.getElementById(errorContainerId);
          if (errorElement) {
            if (event.error) {
              errorElement.textContent = event.error.message;
              errorElement.style.display = 'block';
              errorElement.className = 'stripe-card-errors text-danger';
            } else {
              errorElement.textContent = '';
              errorElement.style.display = 'none';
            }
          }
        });

        // Manejar eventos de focus y blur
        cardElement.on('focus', () => {
          const errorElement = document.getElementById(errorContainerId);
          if (errorElement) {
            errorElement.style.display = 'none';
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error al montar el elemento de Stripe:', error);
      return false;
    }
  }

  /**
   * Desmonta el elemento de tarjeta
   */
  async unmountCardElement(): Promise<void> {
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement = null;
    }
  }

  /**
   * Crea un token de pago con Stripe
   */
  async createPaymentToken(amount: number, currency: string = 'usd'): Promise<{ token: string | null; error: any }> {
    const stripe = await this.getStripe();
    if (!stripe || !this.cardElement) {
      return { token: null, error: { message: 'Stripe no está inicializado' } };
    }

    try {
      const { token, error } = await stripe.createToken(this.cardElement, {
        currency: currency.toLowerCase()
      });

      return { token: token?.id || null, error };
    } catch (error) {
      return { token: null, error };
    }
  }

  /**
   * Crea un PaymentIntent (método recomendado para pagos)
   */
  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<{ clientSecret: string | null; error: any }> {
    // Este método requiere que el backend cree el PaymentIntent
    // Por ahora retornamos null, se implementará cuando el backend esté listo
    return { clientSecret: null, error: { message: 'PaymentIntent debe ser creado en el backend' } };
  }

  /**
   * Confirma el pago con PaymentIntent
   */
  async confirmPayment(clientSecret: string): Promise<{ paymentIntent: any; error: any }> {
    const stripe = await this.getStripe();
    if (!stripe || !this.cardElement) {
      return { paymentIntent: null, error: { message: 'Stripe no está inicializado' } };
    }

    try {
      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardElement,
        }
      });

      return { paymentIntent, error };
    } catch (error) {
      return { paymentIntent: null, error };
    }
  }
}

