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
   */
  private setupCalComEventListeners(): void {
    // Esperar a que Cal.com esté completamente cargado
    const setupListeners = () => {
      if (window.Cal && window.Cal.ns && window.Cal.ns['30min']) {
        try {
          // Evento cuando se inicia el proceso de booking
          window.Cal.ns['30min'].on('bookingSuccessful', (event: any) => {
            console.log('Cal.com: Cita confirmada exitosamente', event);
            this.facebookPixelService.trackCalComBookingConfirmed('LLC Services', 30);
            this.calendlyClick.emit();
          });

          // Evento cuando se abre el widget
          window.Cal.ns['30min'].on('open', () => {
            console.log('Cal.com: Widget abierto');
            this.facebookPixelService.trackCalComBookingStarted();
          });

          // Evento cuando se selecciona una fecha/hora
          window.Cal.ns['30min'].on('dateSelected', (event: any) => {
            console.log('Cal.com: Fecha seleccionada', event);
            // Opcional: trackear selección de fecha
          });

          // Evento cuando se completa el formulario de booking
          window.Cal.ns['30min'].on('bookingFormSubmitted', (event: any) => {
            console.log('Cal.com: Formulario de booking enviado', event);
            // El evento bookingSuccessful se dispara después de esto
          });

          console.log('✅ Event listeners de Cal.com configurados');
        } catch (error) {
          console.warn('⚠️ Error configurando event listeners de Cal.com:', error);
          // Reintentar después de un delay
          setTimeout(setupListeners, 500);
        }
      } else {
        // Si Cal.com aún no está listo, reintentar
        setTimeout(setupListeners, 200);
      }
    };

    // Iniciar configuración después de un breve delay para asegurar que Cal.com esté listo
    setTimeout(setupListeners, 500);
  }
}
