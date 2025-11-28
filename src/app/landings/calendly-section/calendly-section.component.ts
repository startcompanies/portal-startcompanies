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
    this.loadCalComWidget();
  }

  private async loadCalComWidget(): Promise<void> {
    let userIp: string | null = null;
    if (typeof window === 'undefined') {
      // Prevent execution on the server
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    const userAgent = navigator.userAgent;

    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      userIp = data.ip;
    } catch (error) {
      console.warn('Error fetching IP address:', error);
    }

    let calLink = 'startcompanies-businessenusa/30min';
    const queryParams = new URLSearchParams();
    if (userIp) queryParams.set('ip', userIp);
    if (userAgent) queryParams.set('userAgent', userAgent);
    if (fbclid) queryParams.set('notes', `fbclid=${fbclid}`);
    const finalQuery = queryParams.toString();
    if (finalQuery) calLink += `?${finalQuery}`;

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

      window.Cal('init', '30min', { origin: 'https://cal.com' });

      window.Cal.ns['30min']('inline', {
        elementOrSelector: '#my-cal-inline',
        config: { layout: 'month_view', forwardQueryParams: true },
        calLink: calLink,
      });

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
