import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BrowserService } from './browser.service';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
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

  constructor(private browser: BrowserService) {
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
    if (this.config.debug && this.browser.isBrowser) {
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
   * Verifica si Facebook está auto-inicializando el pixel ESPECÍFICO que necesitamos
   * Espera hasta que los scripts se carguen (hasta 3 segundos para dar tiempo a GTM)
   * IMPORTANTE: Solo retorna true si Facebook está inicializando el pixel EXACTO que necesitamos
   */
  private async checkFacebookAutoInit(pixelId: string): Promise<boolean> {
    const maxWaitTime = 3000; // 3 segundos máximo (GTM puede tardar más)
    const checkInterval = 100; // Verificar cada 100ms
    const maxChecks = maxWaitTime / checkInterval;
    let checks = 0;

    return new Promise((resolve) => {
      const checkForScripts = () => {
        checks++;
        
        const doc = this.browser.document;
        if (!doc) {
          resolve(false);
          return;
        }
        
        // Verificar si los scripts de Facebook están presentes
        // CRÍTICO: Verificar que el script de configuración sea para el pixel ESPECÍFICO que necesitamos
        const configScript = doc.querySelector(`script[src*="signals/config/${pixelId}"]`);
        const fbeventsScript = doc.querySelector(`script[src*="fbevents.js"]`);
        
        // Verificar también si hay scripts de otros pixels (para debug)
        const llcConfigScript = doc.querySelector(`script[src*="signals/config/${this.config.llcPixelId}"]`);
        const relayConfigScript = doc.querySelector(`script[src*="signals/config/${this.config.relayPixelId}"]`);
        
        // Si ambos scripts están presentes Y el script de configuración es para el pixel que necesitamos,
        // entonces Facebook está auto-inicializando el pixel correcto
        if (configScript && fbeventsScript) {
          this.debugLog(`✅ Detectado: Facebook está auto-inicializando el pixel ${pixelId}`, {
            configScript: true,
            fbeventsScript: true,
            checkNumber: checks,
            waitTime: checks * checkInterval,
            llcScriptFound: !!llcConfigScript,
            relayScriptFound: !!relayConfigScript
          });
          resolve(true);
          return;
        }

        // Si hay scripts de Facebook pero NO para el pixel que necesitamos, Facebook NO está inicializando nuestro pixel
        if (fbeventsScript && !configScript) {
          // Facebook está cargando scripts, pero no para nuestro pixel específico
          // Esto significa que debemos inicializar nosotros
          this.debugLog(`ℹ️ Facebook está cargando scripts, pero NO para el pixel ${pixelId}`, {
            fbeventsScript: true,
            configScript: false,
            llcScriptFound: !!llcConfigScript,
            relayScriptFound: !!relayConfigScript,
            checkNumber: checks
          });
          // Continuar verificando por si acaso aparece el script correcto
        }

        // Si hemos alcanzado el máximo de verificaciones, asumir que Facebook no está inicializando nuestro pixel
        if (checks >= maxChecks) {
          this.debugLog(`⏱️ Tiempo de espera agotado (${maxWaitTime}ms), Facebook no está auto-inicializando el pixel ${pixelId}`, {
            checks: checks,
            configScript: !!configScript,
            fbeventsScript: !!fbeventsScript,
            llcScriptFound: !!llcConfigScript,
            relayScriptFound: !!relayConfigScript
          });
          resolve(false);
          return;
        }

        // Continuar verificando
        setTimeout(checkForScripts, checkInterval);
      };

      // Iniciar verificación
      checkForScripts();
    });
  }

  /**
   * Inicializa el pixel de Facebook según la página
   * @param pageType - Tipo de página ('llc' o 'relay')
   * @param options - skipAutoPageView: si true, no envía PageView automático al init (para uso global + PageView explícito)
   */
  initializePixel(pageType: PageType, options?: { skipAutoPageView?: boolean }): void {
    // Solo inicializa el píxel si estamos en el navegador
    if (!this.browser.isBrowser) {
      this.debugLog('⚠️ No se puede inicializar pixel en servidor (SSR)');
      return;
    }
    
    const doc = this.browser.document;
    const win = this.browser.window;
    if (!doc || !win) {
      return;
    }

    // Si ya se inicializó este pixel, no hacer nada
    if (this.initializedPixels.has(pageType)) {
      this.debugLog(`ℹ️ Pixel ${pageType} ya inicializado`);
      return;
    }

    const pixelId = pageType === 'llc' ? this.config.llcPixelId : this.config.relayPixelId;

    this.debugLog(`🚀 Verificando pixel ${pageType}`, { pixelId });

    // Verificar si Facebook está auto-inicializando el pixel (esperando hasta 2 segundos)
    this.checkFacebookAutoInit(pixelId).then((isFacebookInitializing) => {
      if (isFacebookInitializing) {
        // Facebook está inicializando el pixel automáticamente
        // NO hacer nada, solo marcar como inicializado para que los métodos de tracking funcionen
        this.debugLog(`✅ Facebook está auto-inicializando el pixel ${pixelId}, dejando que Facebook lo maneje`);
        this.initializedPixels.add(pageType);
        
        // IMPORTANTE: NO trackear PageView aquí porque Facebook ya lo hace automáticamente
        // Solo verificar que fbq esté disponible para tracking futuro
        setTimeout(() => {
          const win = this.browser.window;
          if (win && win.fbq) {
            this.debugLog(`✅ Pixel ${pixelId} disponible para tracking (inicializado por Facebook)`);
          } else {
            this.debugLog(`⚠️ Pixel ${pixelId} marcado como inicializado por Facebook, pero fbq aún no está disponible`);
          }
        }, 500);
        
        return; // No hacer nada más, Facebook lo maneja todo (incluyendo PageView)
      }

      // Si Facebook NO está auto-inicializando, entonces nosotros lo inicializamos
      this.debugLog(`🔧 Facebook no está auto-inicializando, inicializando nosotros el pixel ${pageType}`, { pixelId });

      // Inicializar el script de Facebook Pixel si aún no existe
      if (!win.fbq) {
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
        })(win, doc, 'script', 'https://connect.facebook.net/en_US/fbevents.js', undefined, undefined, undefined);
      }

      // Inicializar el pixel específico (solo si Facebook NO lo está haciendo)
      // El código de Facebook Pixel maneja la cola automáticamente
      const initPixel = () => {
        // Verificar que el pixel no haya sido inicializado ya
        if (this.initializedPixels.has(pageType)) {
          this.debugLog(`ℹ️ Pixel ${pageType} ya inicializado, omitiendo`);
          return;
        }

        // Verificar una última vez si los scripts de Facebook aparecieron mientras esperábamos
        const configScript = doc.querySelector(`script[src*="signals/config/${pixelId}"]`);
        const fbeventsScript = doc.querySelector(`script[src*="fbevents.js"]`);
        
        if (configScript && fbeventsScript) {
          this.debugLog(`✅ Scripts de Facebook detectados en el último momento, dejando que Facebook maneje el pixel`);
          this.initializedPixels.add(pageType);
          return;
        }

        // CRÍTICO: Verificar si Facebook ya inicializó el pixel
        // Facebook puede inicializar el pixel incluso si no detectamos los scripts inmediatamente
        // Verificamos si fbq ya tiene el pixel inicializado revisando la cola de eventos
        if (win.fbq && (win as any)._fbq) {
          // Si fbq está disponible y tiene una cola, es posible que Facebook ya lo haya inicializado
          // Verificamos si hay eventos en la cola que indiquen que el pixel ya fue inicializado
          const queue = (win as any)._fbq.queue || [];
          const hasInitForThisPixel = queue.some((event: any[]) => {
            return event && event[0] === 'init' && event[1] === pixelId;
          });
          
          if (hasInitForThisPixel) {
            this.debugLog(`✅ Pixel ${pixelId} ya fue inicializado por Facebook (detectado en cola), omitiendo nuestra inicialización`);
            this.initializedPixels.add(pageType);
            return;
          }
        }

        // Marcar el flag ANTES de inicializar para evitar condiciones de carrera
        // Esto previene que dos llamadas simultáneas inicialicen el pixel dos veces
        this.initializedPixels.add(pageType);

        if (win.fbq) {
          try {
            // Solo inicializar si realmente no ha sido inicializado
            // Verificar una vez más justo antes de inicializar
            const finalCheck = doc.querySelector(`script[src*="signals/config/${pixelId}"]`);
            if (finalCheck) {
              this.debugLog(`✅ Script de Facebook detectado justo antes de inicializar, cancelando`);
              this.initializedPixels.add(pageType);
              return;
            }

            win.fbq('init', pixelId);
            // skipAutoPageView: usado cuando el PageView se envía desde el flujo global (todas las páginas no-LP)
            if (!options?.skipAutoPageView) {
              // IMPORTANTE: NO trackear PageView aquí porque:
              // 1. Si Facebook está inicializando, ya trackea PageView automáticamente
              // 2. Si nosotros inicializamos, fbq('init') ya puede haber trackeado PageView automáticamente
              // 3. Trackear PageView dos veces causa el error "pixel activated 2 times"
              // Solo trackear PageView si realmente es necesario (cuando nosotros inicializamos manualmente)
              // Pero esperar un momento para verificar si Facebook ya lo hizo
              setTimeout(() => {
                // Verificar si Facebook está manejando el pixel
                const configScript = doc.querySelector(`script[src*="signals/config/${pixelId}"]`);
                if (!configScript && win.fbq) {
                  // Solo trackear PageView si nosotros inicializamos y Facebook NO está manejando
                  // Pero verificar si ya fue trackeado revisando la cola
                  const queue = (win as any)._fbq?.queue || [];
                  const hasPageView = queue.some((event: any[]) => {
                    return event && event[0] === 'track' && event[1] === 'PageView';
                  });
                  
                  if (!hasPageView) {
                    win.fbq('track', 'PageView');
                    this.debugLog(`✅ PageView trackeado para pixel ${pageType} (inicializado manualmente)`);
                  } else {
                    this.debugLog(`ℹ️ PageView ya fue trackeado, omitiendo`);
                  }
                } else {
                  this.debugLog(`ℹ️ PageView no trackeado (Facebook está manejando el pixel)`);
                }
              }, 200);
            }
            
            this.debugLog(`✅ Pixel ${pageType} inicializado correctamente por nuestro código`);
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

      // Intentar inicializar después de un breve delay para asegurar que el script externo esté listo
      // Esto es necesario porque el script externo (fbevents.js) se carga de forma asíncrona
      // PERO también esperamos un poco más para dar tiempo a que Facebook inicialice si está cargando
      // IMPORTANTE: Ya esperamos 3 segundos en checkFacebookAutoInit, así que aquí solo esperamos un poco más
      setTimeout(() => {
        if (!this.initializedPixels.has(pageType)) {
          initPixel();
        }
      }, 300); // Esperar 300ms adicionales después de la verificación de 3 segundos

      // Crear noscript fallback solo si el body está disponible
      // IMPORTANTE: El noscript solo se ejecuta si JavaScript está deshabilitado
      // Si JavaScript está habilitado, el contenido del noscript NO se procesa
      const addNoscriptFallback = () => {
        if (doc.body) {
          // Verificar si ya existe un noscript con este pixel ID
          const existingNoscript = doc.querySelector(`noscript[data-pixel-id="${pixelId}"]`);
          // También verificar si hay algún noscript con la misma imagen de Facebook
          const existingFacebookNoscript = doc.querySelector(`noscript img[src*="tr?id=${pixelId}"]`);
          
          if (!existingNoscript && !existingFacebookNoscript) {
            const noscript = doc.createElement('noscript');
            noscript.setAttribute('data-pixel-id', pixelId);
            const img = doc.createElement('img');
            img.height = 1;
            img.width = 1;
            img.style.display = 'none';
            img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
            img.onerror = function() {
              // Silenciar el error del noscript fallback
            };
            noscript.appendChild(img);
            doc.body.insertBefore(noscript, doc.body.firstChild);
            this.debugLog(`✅ Noscript fallback creado para pixel ${pixelId}`);
          } else {
            this.debugLog(`ℹ️ Noscript fallback ya existe para pixel ${pixelId}, omitiendo`);
          }
        } else {
          if (doc.readyState === 'loading') {
            doc.addEventListener('DOMContentLoaded', addNoscriptFallback);
          } else {
            setTimeout(addNoscriptFallback, 100);
          }
        }
      };

      // Solo agregar noscript fallback si nosotros inicializamos el pixel
      // Si Facebook está inicializando, ya maneja el noscript
      addNoscriptFallback();
    });
  }

  /**
   * Trackea un evento estándar o personalizado
   * @param eventName - Nombre del evento
   * @param parameters - Parámetros del evento (validados automáticamente)
   */
  trackEvent(eventName: string, parameters?: PixelEventParameters): void {
    const win = this.browser.window;
    if (!this.browser.isBrowser || !win || !win.fbq) {
      this.debugLog('⚠️ No se puede trackear evento (no está en navegador o pixel no inicializado)');
      return;
    }

    const validatedParams = this.validateParameters(parameters);

    try {
      win.fbq('track', eventName, validatedParams);
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
    const win = this.browser.window;
    if (!this.browser.isBrowser || !win || !win.fbq) {
      return;
    }

    const validatedParams = this.validateParameters(parameters);

    try {
      win.fbq('trackCustom', eventName, validatedParams);
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
