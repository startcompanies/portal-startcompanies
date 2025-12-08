import { AfterViewInit, Component, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacebookPixelService } from '../../services/facebook-pixel.service';

declare global {
  interface Window {
    Cal: any;
  }
}

@Component({
  selector: 'app-calendly-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendly-section.component.html',
  styleUrl: './calendly-section.component.css',
})
export class CalendlySectionComponent implements AfterViewInit, OnDestroy {
  @Output() calendlyClick = new EventEmitter<void>();

  constructor(private facebookPixelService: FacebookPixelService) {}

  ngOnDestroy(): void {
    console.log('CalendlySectionComponent destroyed');
  }

  ngAfterViewInit(): void {
    // Remover fbclid de la URL antes de cargar Cal.com
    // para evitar que forwardQueryParams intente validarlo y falle
    this.removeFbclidFromUrl();
    this.loadCalComWidget();
  }

  /**
   * Remueve fbclid de la URL para evitar errores de validación en Cal.com
   * El fbclid se pasará manualmente en calLink, pero no en la URL
   * para que forwardQueryParams no intente validarlo
   */
  private removeFbclidFromUrl(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    
    if (fbclid) {
      // Guardar fbclid en sessionStorage antes de removerlo de la URL
      sessionStorage.setItem('fbclid_temp', fbclid);
      console.log('💾 [fbclid] Guardado en sessionStorage antes de remover de URL:', {
        value: fbclid,
        length: fbclid.length
      });
      
      // Remover de la URL
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('fbclid');
      window.history.replaceState({}, '', currentUrl.toString());
      console.log('🔧 [fbclid] Removido de URL para evitar error de validación en Cal.com');
      console.log('ℹ️ [fbclid] Se pasará manualmente en calLink');
    }
  }

  /**
   * Lee una cookie por su nombre
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Obtiene el país del usuario basado en su IP
   * Retorna un objeto con el código y nombre del país en español
   */
  private async getCountryFromIP(): Promise<{ code: string; name: string } | null> {
    try {
      // Usar ipapi.co que es gratuita y no requiere API key para uso básico
      // Especificar lang=es para obtener el nombre del país en español
      const response = await fetch('https://ipapi.co/json/?lang=es');
      if (response.ok) {
        const data = await response.json();
        if (data.country_code && data.country_name) {
          console.log('✅ País detectado:', data.country_code, data.country_name);
          return {
            code: data.country_code, // Código ISO (ej: "US", "MX", "ES")
            name: data.country_name  // Nombre completo en español (ej: "Estados Unidos", "México", "España")
          };
        }
      }
    } catch (error) {
      console.warn('Error obteniendo país desde IP:', error);
      // Intentar con API alternativa si la primera falla
      // ip-api.com no soporta español directamente, así que usaremos un mapeo
      try {
        const fallbackResponse = await fetch('https://ip-api.com/json/?fields=countryCode,country');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.countryCode && fallbackData.country) {
            // Mapear nombre en inglés a español para países comunes
            const countryNameEs = this.translateCountryToSpanish(fallbackData.country);
            console.log('✅ País detectado (fallback):', fallbackData.countryCode, countryNameEs);
            return {
              code: fallbackData.countryCode,
              name: countryNameEs
            };
          }
        }
      } catch (fallbackError) {
        console.warn('Error en API alternativa de geolocalización:', fallbackError);
      }
    }
    return null;
  }

  /**
   * Traduce el nombre del país de inglés a español para países comunes
   */
  private translateCountryToSpanish(countryNameEn: string): string {
    const countryMap: { [key: string]: string } = {
      'United States': 'Estados Unidos',
      'Mexico': 'México',
      'Spain': 'España',
      'Colombia': 'Colombia',
      'Argentina': 'Argentina',
      'Chile': 'Chile',
      'Peru': 'Perú',
      'Ecuador': 'Ecuador',
      'Venezuela': 'Venezuela',
      'Uruguay': 'Uruguay',
      'Paraguay': 'Paraguay',
      'Bolivia': 'Bolivia',
      'Costa Rica': 'Costa Rica',
      'Panama': 'Panamá',
      'Dominican Republic': 'República Dominicana',
      'Guatemala': 'Guatemala',
      'Honduras': 'Honduras',
      'El Salvador': 'El Salvador',
      'Nicaragua': 'Nicaragua',
      'Cuba': 'Cuba',
      'Puerto Rico': 'Puerto Rico',
      'Brazil': 'Brasil',
      'Portugal': 'Portugal',
      'France': 'Francia',
      'Italy': 'Italia',
      'Germany': 'Alemania',
      'United Kingdom': 'Reino Unido',
      'Canada': 'Canadá',
      'Australia': 'Australia',
      'New Zealand': 'Nueva Zelanda',
      'Japan': 'Japón',
      'China': 'China',
      'India': 'India',
      'South Korea': 'Corea del Sur',
      'Singapore': 'Singapur',
      'Philippines': 'Filipinas',
      'Thailand': 'Tailandia',
      'Vietnam': 'Vietnam',
      'Indonesia': 'Indonesia',
      'Malaysia': 'Malasia'
    };

    // Retornar traducción si existe, sino retornar el nombre original
    return countryMap[countryNameEn] || countryNameEn;
  }

  private async loadCalComWidget(): Promise<void> {
    if (typeof window === 'undefined') {
      // Prevent execution on the server
      return;
    }

    // Obtener IP del usuario (parámetro original)
    let userIp: string | null = null;
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      userIp = data.ip;
    } catch (error) {
      console.warn('Error fetching IP address:', error);
    }

    // Obtener userAgent (parámetro original)
    const userAgent = navigator.userAgent;
    console.log('📋 UserAgent:', userAgent);

    // Obtener fbclid de la URL original ANTES de que se removiera
    // Guardamos el fbclid original desde sessionStorage o lo obtenemos de otra forma
    // Nota: Ya fue removido de la URL en removeFbclidFromUrl(), así que necesitamos
    // obtenerlo de otra manera. Usaremos sessionStorage para guardarlo temporalmente.
    let fbclid: string | null = null;
    
    // Intentar obtener de sessionStorage (lo guardamos antes de remover de URL)
    const savedFbclid = sessionStorage.getItem('fbclid_temp');
    if (savedFbclid) {
      fbclid = savedFbclid;
      console.log('✅ [fbclid] Recuperado de sessionStorage:', {
        value: fbclid,
        length: fbclid.length
      });
    } else {
      // Si no está en sessionStorage, intentar obtenerlo de la URL actual
      // (aunque ya debería haberse removido)
      const urlParams = new URLSearchParams(window.location.search);
      fbclid = urlParams.get('fbclid');
      if (fbclid) {
        // Guardarlo en sessionStorage para la próxima vez
        sessionStorage.setItem('fbclid_temp', fbclid);
        console.log('✅ [fbclid] Obtenido de URL y guardado en sessionStorage:', {
          value: fbclid,
          length: fbclid.length
        });
      }
    }
    
    if (!fbclid) {
      console.warn('⚠️ [fbclid] No encontrado ni en sessionStorage ni en URL');
    }

    // Leer cookies de Facebook Pixel (nuevos parámetros)
    const _fbc = this.getCookie('_fbc'); // Facebook Click ID
    const _fbp = this.getCookie('_fbp'); // Facebook Browser ID
    console.log('🍪 [Cookies] Facebook Pixel:', {
      _fbc: {
        exists: !!_fbc,
        value: _fbc,
        length: _fbc?.length || 0
      },
      _fbp: {
        exists: !!_fbp,
        value: _fbp,
        length: _fbp?.length || 0
      },
      allCookies: document.cookie
    });

    // Obtener país del usuario (nuevo parámetro)
    const countryData = await this.getCountryFromIP();

    let calLink = 'startcompanies-businessenusa/30min';
    const queryParams = new URLSearchParams();
    
    // Parámetros originales (mantener)
    if (userIp) {
      queryParams.set('ip', userIp);
      console.log('✅ [calLink] Agregado ip:', userIp);
    }
    if (userAgent) {
      queryParams.set('userAgent', userAgent);
      console.log('✅ [calLink] Agregado userAgent');
    }
    if (fbclid) {
      queryParams.set('fbclid', fbclid);
      console.log('✅ [calLink] Agregado fbclid:', {
        value: fbclid,
        length: fbclid.length,
        encoded: encodeURIComponent(fbclid)
      });
    } else {
      console.warn('⚠️ [calLink] fbclid NO encontrado, no se agregará a calLink');
    }
    
    // Nuevos parámetros de Facebook Pixel
    if (_fbc) {
      queryParams.set('_fbc', _fbc);
      console.log('✅ [calLink] Agregado _fbc:', _fbc);
    }
    if (_fbp) {
      queryParams.set('_fbp', _fbp);
      console.log('✅ [calLink] Agregado _fbp:', _fbp);
    }

    // Parámetros de país: nombre completo y código
    if (countryData) {
      queryParams.set('pais', countryData.name); // Nombre completo del país
      queryParams.set('pais_cod', countryData.code); // Código ISO del país
      console.log('✅ [calLink] Agregado país:', countryData.name, `(${countryData.code})`);
    }

    const finalQuery = queryParams.toString();
    if (finalQuery) calLink += `?${finalQuery}`;
    
    console.log('🔗 [calLink] Final construido:', {
      calLink: calLink,
      queryString: finalQuery,
      params: Object.fromEntries(queryParams.entries()),
      hasFbclid: queryParams.has('fbclid')
    });

    // Lógica de inicialización del script de Cal.com
    // Adaptado de la función IIFE (Immediately Invoked Function Expression) original
    (function (C: Window, A: string, L: string) {
      let p = function (a: any, ar: any) {
        a.q.push(ar);
      };
      let d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            // Asegurarse de que el script solo se añada una vez
            if (!d.querySelector(`script[src="${A}"]`)) {
              d.head.appendChild(d.createElement('script')).src = A;
            }
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function () {
              p(api, arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === 'string') {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ['initNamespace', namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');

    // Configuración y carga del widget
    if (window.Cal) {
      // Asegurarse de que Cal esté disponible
      window.Cal.config = window.Cal.config || {};
      window.Cal.config.forwardQueryParams = true;
      console.log('⚙️ [Cal.com] Configuración:', {
        forwardQueryParams: window.Cal.config.forwardQueryParams,
        currentUrl: window.location.href,
        urlHasFbclid: new URLSearchParams(window.location.search).has('fbclid')
      });

      window.Cal('init', '30min', { origin: 'https://cal.com' });
      console.log('✅ [Cal.com] Inicializado');

      window.Cal.ns['30min']('inline', {
        elementOrSelector: '#my-cal-inline',
        config: { layout: 'month_view', forwardQueryParams: true },
        calLink: calLink,
      });
      console.log('✅ [Cal.com] Widget inline configurado con calLink:', calLink);

      window.Cal.ns['30min']('ui', {
        cssVarsPerTheme: {
          light: { 'cal-brand': '#006AFE' },
          dark: { 'cal-brand': '#fafafa' },
        },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });

      // Escuchar eventos de Cal.com para tracking
      this.setupCalComEventListeners();
    } else {
      console.error('Cal.com script no se cargó correctamente.');
    }
  }

  /**
   * Configura los event listeners de Cal.com para tracking
   * Cal.com usa postMessage para comunicarse entre el iframe y la página padre
   */
  private setupCalComEventListeners(): void {
    // Cal.com comunica eventos a través de postMessage
    // Escuchar mensajes del iframe de Cal.com
    const messageHandler = (event: MessageEvent) => {
      // Verificar que el mensaje venga de Cal.com
      if (event.origin !== 'https://app.cal.com' && event.origin !== 'https://cal.com') {
        return;
      }

      try {
        const data = event.data;
        
        // Cal.com envía eventos con estructura específica
        if (data && typeof data === 'object') {
          // Evento de booking exitoso
          if (data.type === 'cal-booking-success' || 
              data.event === 'bookingSuccessful' ||
              (data.data && data.data.type === 'bookingSuccessful')) {
            console.log('Cal.com: Cita confirmada exitosamente', data);
            this.facebookPixelService.trackCalComBookingConfirmed('LLC Services', 30);
            this.calendlyClick.emit();
          }
          
          // Evento cuando se abre el widget
          if (data.type === 'cal-open' || 
              data.event === 'open' ||
              (data.data && data.data.type === 'open')) {
            console.log('Cal.com: Widget abierto', data);
            this.facebookPixelService.trackCalComBookingStarted();
          }
          
          // Evento cuando se selecciona una fecha
          if (data.type === 'cal-date-selected' || 
              data.event === 'dateSelected' ||
              (data.data && data.data.type === 'dateSelected')) {
            console.log('Cal.com: Fecha seleccionada', data);
            // Opcional: trackear selección de fecha
          }
        }
      } catch (error) {
        // Ignorar errores de parsing, pueden ser mensajes de otros orígenes
      }
    };

    // Agregar listener de mensajes
    window.addEventListener('message', messageHandler);
    
    // También escuchar eventos del DOM del iframe cuando esté disponible
    const setupDOMListeners = () => {
      const calIframe = document.querySelector('#my-cal-inline iframe') as HTMLIFrameElement;
      if (calIframe) {
        // El iframe puede disparar eventos cuando se carga
        calIframe.addEventListener('load', () => {
          console.log('Cal.com: Iframe cargado');
          this.facebookPixelService.trackCalComBookingStarted();
        });
      } else {
        // Reintentar si el iframe aún no está disponible
        setTimeout(setupDOMListeners, 500);
      }
    };

    // Esperar a que el DOM esté listo
    setTimeout(setupDOMListeners, 1000);

    // Limpiar listener cuando el componente se destruya
    this.ngOnDestroy = () => {
      window.removeEventListener('message', messageHandler);
      console.log('CalendlySectionComponent destroyed');
    };

    console.log('✅ Event listeners de Cal.com configurados (postMessage)');
  }
}
