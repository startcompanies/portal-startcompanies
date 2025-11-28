import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

/**
 * Parámetros estándar para eventos de Facebook Pixel
 * Basado en la documentación oficial: https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking
 */
export interface PixelEventParameters {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  value?: number;
  currency?: string;
  num_items?: number;
  search_string?: string;
  status?: boolean;
  delivery_category?: 'in_store' | 'curbside' | 'home_delivery';
  predicted_ltv?: number;
  [key: string]: any; // Para propiedades personalizadas
}

/**
 * Tipos de eventos estándar de Facebook Pixel
 */
export type StandardEventName =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Schedule'
  | 'Contact';

/**
 * Tipo de página para inicialización del pixel
 */
export type PageType = 'llc' | 'relay';

/**
 * Configuración del pixel desde environment
 */
interface PixelConfig {
  llcPixelId: string;
  relayPixelId: string;
  debug: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FacebookPixelService {

  private initializedPixels = new Set<PageType>();
  private config: PixelConfig;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Cargar configuración desde environment
    this.config = environment.facebookPixel || {
      llcPixelId: '703523572287021',
      relayPixelId: '1055049486479771',
      debug: false
    };
  }

  /**
   * Log en modo debug
   */
  private debugLog(message: string, data?: any): void {
    if (this.config.debug && isPlatformBrowser(this.platformId)) {
      console.log(`[Facebook Pixel Debug] ${message}`, data || '');
    }
  }

  /**
   * Valida los parámetros del evento según la documentación de Facebook
   */
  private validateParameters(parameters?: PixelEventParameters): PixelEventParameters | undefined {
    if (!parameters) return undefined;

    const validated: PixelEventParameters = { ...parameters };

    // Validar currency (debe ser código ISO 4217 de 3 letras)
    if (validated.currency && !/^[A-Z]{3}$/.test(validated.currency)) {
      this.debugLog('⚠️ Currency inválido, usando USD por defecto', validated.currency);
      validated.currency = 'USD';
    }

    // Validar value (debe ser numérico y positivo)
    if (validated.value !== undefined) {
      const numValue = Number(validated.value);
      if (isNaN(numValue) || numValue < 0) {
        this.debugLog('⚠️ Value inválido, removiendo del evento', validated.value);
        delete validated.value;
      } else {
        validated.value = numValue;
      }
    }

    // Validar num_items (debe ser entero positivo)
    if (validated.num_items !== undefined) {
      const numItems = Math.floor(Number(validated.num_items));
      if (isNaN(numItems) || numItems < 0) {
        this.debugLog('⚠️ num_items inválido, removiendo del evento', validated.num_items);
        delete validated.num_items;
      } else {
        validated.num_items = numItems;
      }
    }

    // Validar contents (debe ser array de objetos con id y quantity)
    if (validated.contents && Array.isArray(validated.contents)) {
      validated.contents = validated.contents.filter(item => {
        if (!item.id || item.quantity < 0) {
          this.debugLog('⚠️ Item inválido en contents, removiendo', item);
          return false;
        }
        return true;
      });
      if (validated.contents.length === 0) {
        delete validated.contents;
      }
    }

    return validated;
  }

  /**
   * Inicializa el pixel de Facebook según la página
   * @param pageType - Tipo de página ('llc' o 'relay')
   */
  initializePixel(pageType: PageType): void {
    // Solo inicializa el píxel si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      this.debugLog('⚠️ No se puede inicializar pixel en servidor (SSR)');
      return;
    }

    // Si ya se inicializó este pixel, no hacer nada
    if (this.initializedPixels.has(pageType)) {
      this.debugLog(`ℹ️ Pixel ${pageType} ya inicializado`);
      return;
    }

    const pixelId = pageType === 'llc' ? this.config.llcPixelId : this.config.relayPixelId;

    this.debugLog(`🚀 Inicializando pixel ${pageType}`, { pixelId });

    // Inicializar el script de Facebook Pixel si aún no existe
    if (!window.fbq) {
      // Ejecutar el código de Facebook Pixel directamente
      (function(f: any, b: Document, e: string, v: string, n: any, t: any, s: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e) as HTMLScriptElement;
        t.async = true;
        t.src = v;
        t.onerror = function() {
          console.warn('Error cargando Facebook Pixel script. Esto puede ser normal si hay restricciones de red.');
        };
        s = b.getElementsByTagName(e)[0];
        if (s && s.parentNode) {
          s.parentNode.insertBefore(t, s);
        } else {
          b.head.appendChild(t);
        }
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js', undefined, undefined, undefined);
    }

    // Inicializar el pixel específico
    // El código de Facebook Pixel maneja la cola automáticamente
    const initPixel = () => {
      // Verificar que el pixel no haya sido inicializado ya
      if (this.initializedPixels.has(pageType)) {
        this.debugLog(`ℹ️ Pixel ${pageType} ya inicializado, omitiendo`);
        return;
      }

      // Marcar el flag ANTES de inicializar para evitar condiciones de carrera
      // Esto previene que dos llamadas simultáneas inicialicen el pixel dos veces
      this.initializedPixels.add(pageType);

      if (window.fbq) {
        try {
          window.fbq('init', pixelId);
          window.fbq('track', 'PageView');
          this.debugLog(`✅ Pixel ${pageType} inicializado correctamente`);
        } catch (error) {
          // Si hay un error, remover el flag para permitir reintento
          this.initializedPixels.delete(pageType);
          console.warn('Error inicializando Facebook Pixel:', error);
          this.debugLog('❌ Error inicializando pixel', error);
        }
      } else {
        // Si fbq no está disponible, remover el flag para permitir reintento
        this.initializedPixels.delete(pageType);
        this.debugLog(`⚠️ fbq no disponible aún, se reintentará`);
      }
    };

    // Intentar inicializar inmediatamente
    initPixel();

    // También intentar después de un breve delay para asegurar que el script externo esté listo
    // Esto es necesario porque el script externo (fbevents.js) se carga de forma asíncrona
    // Pero solo si aún no se ha inicializado
    setTimeout(() => {
      if (!this.initializedPixels.has(pageType)) {
        initPixel();
      }
    }, 100);

    // Crear noscript fallback solo si el body está disponible
    const addNoscriptFallback = () => {
      if (document.body) {
        const existingNoscript = document.querySelector(`noscript[data-pixel-id="${pixelId}"]`);
        if (!existingNoscript) {
          const noscript = document.createElement('noscript');
          noscript.setAttribute('data-pixel-id', pixelId);
          const img = document.createElement('img');
          img.height = 1;
          img.width = 1;
          img.style.display = 'none';
          img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
          img.onerror = function() {
            // Silenciar el error del noscript fallback
          };
          noscript.appendChild(img);
          document.body.insertBefore(noscript, document.body.firstChild);
        }
      } else {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', addNoscriptFallback);
        } else {
          setTimeout(addNoscriptFallback, 100);
        }
      }
    };

    addNoscriptFallback();
  }

  /**
   * Trackea un evento estándar o personalizado
   * @param eventName - Nombre del evento
   * @param parameters - Parámetros del evento (validados automáticamente)
   */
  trackEvent(eventName: string, parameters?: PixelEventParameters): void {
    if (!isPlatformBrowser(this.platformId) || !window.fbq) {
      this.debugLog('⚠️ No se puede trackear evento (no está en navegador o pixel no inicializado)');
      return;
    }

    const validatedParams = this.validateParameters(parameters);

    try {
      window.fbq('track', eventName, validatedParams);
      this.debugLog(`📊 Evento trackeado: ${eventName}`, validatedParams);
    } catch (error) {
      console.error('Error trackeando evento de Facebook Pixel:', error);
      this.debugLog('❌ Error trackeando evento', error);
    }
  }

  /**
   * Trackea un evento personalizado
   * @param eventName - Nombre del evento personalizado
   * @param parameters - Parámetros del evento
   */
  trackCustomEvent(eventName: string, parameters?: PixelEventParameters): void {
    if (!isPlatformBrowser(this.platformId) || !window.fbq) {
      return;
    }

    const validatedParams = this.validateParameters(parameters);

    try {
      window.fbq('trackCustom', eventName, validatedParams);
      this.debugLog(`📊 Evento personalizado trackeado: ${eventName}`, validatedParams);
    } catch (error) {
      console.error('Error trackeando evento personalizado:', error);
      this.debugLog('❌ Error trackeando evento personalizado', error);
    }
  }

  // ========== EVENTOS ESTÁNDAR EXISTENTES ==========

  trackLead(contentName: string, contentCategory: string, value: number = 0): void {
    this.trackEvent('Lead', {
      content_name: contentName,
      content_category: contentCategory,
      value: value,
      currency: 'USD'
    });
  }

  trackViewContent(contentName: string, contentCategory: string, parameters?: PixelEventParameters): void {
    this.trackEvent('ViewContent', {
      content_name: contentName,
      content_category: contentCategory,
      ...parameters
    });
  }

  trackInitiateCheckout(contentName: string, contentCategory: string, value: number, numItems?: number): void {
    this.trackEvent('InitiateCheckout', {
      content_name: contentName,
      content_category: contentCategory,
      value: value,
      currency: 'USD',
      num_items: numItems
    });
  }

  trackCTAClick(buttonName: string, pageLocation: string, serviceType: string): void {
    this.trackEvent('Lead', {
      content_name: `${buttonName} - ${pageLocation}`,
      content_category: serviceType,
      value: 0.00,
      currency: 'USD'
    });
  }

  trackDeepScroll(pageName: string, scrollDepth: number): void {
    this.trackCustomEvent('DeepScroll', {
      content_name: `${pageName} - Deep Engagement`,
      content_category: 'User Engagement',
      custom_parameter: `scroll_${scrollDepth}%`
    });
  }

  trackVideoPlay(videoTitle: string, videoType: string, pageLocation: string): void {
    this.trackCustomEvent('VideoPlay', {
      content_name: `${videoTitle} - ${videoType}`,
      content_category: 'Video Content',
      custom_parameter: pageLocation
    });
  }

  // ========== NUEVOS EVENTOS ESTÁNDAR ==========

  /**
   * Trackea una compra completada
   * @param value - Valor total de la compra
   * @param currency - Moneda (default: USD)
   * @param contentName - Nombre del producto/servicio
   * @param contentCategory - Categoría del producto/servicio
   * @param contents - Array de productos comprados
   * @param numItems - Número de items
   */
  trackPurchase(
    value: number,
    currency: string = 'USD',
    contentName?: string,
    contentCategory?: string,
    contents?: Array<{ id: string; quantity: number; item_price?: number }>,
    numItems?: number
  ): void {
    const parameters: PixelEventParameters = {
      value: value,
      currency: currency
    };

    if (contentName) parameters.content_name = contentName;
    if (contentCategory) parameters.content_category = contentCategory;
    if (contents && contents.length > 0) {
      parameters.contents = contents;
      parameters.content_type = 'product';
    }
    if (numItems) parameters.num_items = numItems;

    this.trackEvent('Purchase', parameters);
  }

  /**
   * Trackea cuando un usuario agenda una cita (útil para Calendly)
   * @param serviceName - Nombre del servicio agendado
   * @param serviceType - Tipo de servicio
   * @param value - Valor del servicio (opcional)
   */
  trackSchedule(serviceName: string, serviceType: string, value?: number): void {
    const parameters: PixelEventParameters = {
      content_name: serviceName,
      content_category: serviceType
    };

    if (value !== undefined) {
      parameters.value = value;
      parameters.currency = 'USD';
    }

    this.trackEvent('Schedule', parameters);
  }

  /**
   * Trackea una búsqueda realizada por el usuario
   * @param searchString - Término de búsqueda
   * @param contentCategory - Categoría de búsqueda (opcional)
   */
  trackSearch(searchString: string, contentCategory?: string): void {
    const parameters: PixelEventParameters = {
      search_string: searchString
    };

    if (contentCategory) {
      parameters.content_category = contentCategory;
    }

    this.trackEvent('Search', parameters);
  }

  /**
   * Trackea cuando un producto se agrega al carrito
   * @param contentName - Nombre del producto
   * @param contentCategory - Categoría del producto
   * @param value - Valor del producto
   * @param contentId - ID del producto
   * @param quantity - Cantidad agregada
   */
  trackAddToCart(
    contentName: string,
    contentCategory: string,
    value: number,
    contentId?: string,
    quantity: number = 1
  ): void {
    const parameters: PixelEventParameters = {
      content_name: contentName,
      content_category: contentCategory,
      value: value,
      currency: 'USD',
      num_items: quantity
    };

    if (contentId) {
      parameters.content_ids = [contentId];
      parameters.contents = [{ id: contentId, quantity: quantity }];
      parameters.content_type = 'product';
    }

    this.trackEvent('AddToCart', parameters);
  }

  /**
   * Trackea cuando se completa un registro
   * @param registrationType - Tipo de registro
   * @param status - Estado del registro (true = exitoso)
   * @param value - Valor asociado (opcional)
   */
  trackCompleteRegistration(registrationType: string, status: boolean = true, value?: number): void {
    const parameters: PixelEventParameters = {
      content_name: registrationType,
      status: status
    };

    if (value !== undefined) {
      parameters.value = value;
      parameters.currency = 'USD';
    }

    this.trackEvent('CompleteRegistration', parameters);
  }

  /**
   * Trackea cuando un usuario hace contacto
   * @param contactMethod - Método de contacto (email, phone, form, etc.)
   * @param contentName - Nombre del contenido relacionado
   */
  trackContact(contactMethod: string, contentName?: string): void {
    const parameters: PixelEventParameters = {
      content_category: contactMethod
    };

    if (contentName) {
      parameters.content_name = contentName;
    }

    this.trackEvent('Contact', parameters);
  }

  // ========== MÉTODOS HELPER ADICIONALES ==========

  /**
   * Trackea un evento de formulario completado
   * @param formName - Nombre del formulario
   * @param formType - Tipo de formulario
   * @param value - Valor asociado (opcional)
   */
  trackFormSubmit(formName: string, formType: string, value?: number): void {
    this.trackLead(`${formName} - Form Submitted`, formType, value || 0);
  }

  /**
   * Trackea cuando un usuario hace clic en un enlace externo
   * @param linkText - Texto del enlace
   * @param linkUrl - URL del enlace
   * @param linkCategory - Categoría del enlace
   */
  trackExternalLink(linkText: string, linkUrl: string, linkCategory: string): void {
    this.trackCustomEvent('ExternalLinkClick', {
      content_name: linkText,
      content_category: linkCategory,
      custom_parameter: linkUrl
    });
  }

  /**
   * Trackea cuando un usuario descarga un archivo
   * @param fileName - Nombre del archivo
   * @param fileType - Tipo de archivo
   */
  trackDownload(fileName: string, fileType: string): void {
    this.trackCustomEvent('Download', {
      content_name: fileName,
      content_category: fileType
    });
  }

  /**
   * Trackea cuando un usuario comparte contenido
   * @param contentName - Nombre del contenido compartido
   * @param shareMethod - Método de compartir (facebook, twitter, etc.)
   */
  trackShare(contentName: string, shareMethod: string): void {
    this.trackCustomEvent('Share', {
      content_name: contentName,
      content_category: shareMethod
    });
  }

  /**
   * Trackea cuando un usuario inicia sesión
   * @param loginMethod - Método de login
   */
  trackLogin(loginMethod: string): void {
    this.trackCustomEvent('Login', {
      content_category: loginMethod
    });
  }

  /**
   * Trackea cuando un usuario se suscribe a un newsletter
   * @param newsletterName - Nombre del newsletter
   */
  trackNewsletterSubscribe(newsletterName: string): void {
    this.trackLead(`Newsletter Subscription - ${newsletterName}`, 'Newsletter', 0);
  }

  // ========== MÉTODOS ESPECÍFICOS PARA CAL.COM Y WHATSAPP ==========

  /**
   * Trackea cuando un usuario confirma una cita en Cal.com
   * @param serviceType - Tipo de servicio (LLC Services, etc.)
   * @param meetingDuration - Duración de la reunión en minutos
   */
  trackCalComBookingConfirmed(serviceType: string = 'LLC Services', meetingDuration: number = 30): void {
    this.trackSchedule(
      `Cal.com Consultation - ${meetingDuration}min`,
      serviceType,
      0 // Consulta gratuita
    );
    this.debugLog('✅ Cita confirmada en Cal.com', { serviceType, meetingDuration });
  }

  /**
   * Trackea cuando un usuario hace clic en "Aplicar Gratis" (WhatsApp)
   * @param serviceType - Tipo de servicio
   */
  trackWhatsAppFreeApplication(serviceType: string = 'Banking Services'): void {
    this.trackLead(
      'WhatsApp - Aplicar Gratis Relay',
      serviceType,
      0
    );
    this.debugLog('📱 Click en "Aplicar Gratis" (WhatsApp)');
  }

  /**
   * Trackea cuando un usuario hace clic en "Aplicar por $99 USD" (WhatsApp)
   * @param serviceType - Tipo de servicio
   */
  trackWhatsAppPaidApplication(serviceType: string = 'Banking Services'): void {
    this.trackInitiateCheckout(
      'WhatsApp - Aplicar por $99 USD Relay',
      serviceType,
      99.0
    );
    this.debugLog('💰 Click en "Aplicar por $99 USD" (WhatsApp)');
  }

  /**
   * Trackea cuando un usuario inicia el proceso de agendar en Cal.com
   * (cuando abre el widget o selecciona una fecha)
   */
  trackCalComBookingStarted(): void {
    this.trackCustomEvent('CalComBookingStarted', {
      content_category: 'LLC Services'
    });
    this.debugLog('📅 Usuario inició proceso de agendamiento en Cal.com');
  }

  /**
   * Trackea cuando un usuario completa un formulario embebido
   * @param formName - Nombre del formulario
   * @param formType - Tipo de formulario
   * @param value - Valor asociado (opcional)
   */
  trackEmbeddedFormSubmit(formName: string, formType: string, value?: number): void {
    this.trackLead(
      `Form Submission - ${formName}`,
      formType,
      value || 0
    );
    this.debugLog('📝 Formulario embebido completado', { formName, formType, value });
  }
}
