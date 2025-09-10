import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { ResponsiveImage } from '../../services/responsive-image.service';
import { FacebookPixelService } from '../../services/facebook-pixel.service';
import { TestimonialsComponent } from '../../sections/testimonials/testimonials.component';
import { FaqComponent } from '../../sections/faq/faq.component';
import { ScrollService } from '../../services/scroll.service';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-landing-agendar',
  standalone: true,
  imports: [
    ResponsiveImageComponent,
    TestimonialsComponent,
    FaqComponent,
  ],
  templateUrl: './landing-agendar.component.html',
  styleUrl: './landing-agendar.component.css',
})
export class LandingAgendarComponent implements OnInit, AfterViewInit{
  @ViewChild('calendly', { static: false })
  calendlySection!: ElementRef<HTMLElement>;

  private scrollSubscription!: Subscription;
  showFloatingButton = false;
  scrollDepth = 0;

  // Parámetros de URL para Cal.com
  crmId: string = '';
  email: string = '';
  firstName: string = '';
  lastName: string = '';
  fullName: string = '';

  // Hero images
  heroImages: ResponsiveImage = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg-desktop.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Hero Background',
    priority: true,
  };

  // Configuración de imágenes del logo para NgOptimizedImage
  logoImages = {
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.png',
    alt: 'Start Companies Logo',
    priority: true,
  };

  constructor(
    private facebookPixelService: FacebookPixelService,
    private scrollService: ScrollService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Capturar parámetros de URL para logging/debug
    this.route.queryParams.subscribe(params => {
      this.crmId = params['crm'] || '';
      this.email = params['email'] || '';
      this.firstName = params['firstname'] || '';
      this.lastName = params['lastname'] || '';
      this.fullName = `${this.firstName} ${this.lastName}`.trim();
      
      console.log('URL Parameters detected:', {
        crmId: this.crmId,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        fullName: this.fullName
      });
      
      // Actualizar la URL para que Cal.com pueda leer los parámetros correctamente
      this.updateUrlForCalCom();
    });
  }

  ngAfterViewInit(): void {
      this.scrollSubscription = this.scrollService.scrollTarrget$.subscribe(
        (sectionId) => {
          this.scrollTargetSection(sectionId);
        }
      );
      
      // Inicializar Cal.com después de que la vista esté lista
      if (isPlatformBrowser(this.platformId)) {
        this.initializeCalCom();
      }
  }
  
  scrollTargetSection(sectionId: string) {
    const element = this.calendlySection?.nativeElement;
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn('calendlySection no es un HTMLElement válido:', element);
    }
  }

  navigateToCalendlySection() {
    this.scrollService.scrollTo('calendlySection');
  }

  // Método para trackear clicks en calendario
  onCalendlyClick(): void {
    this.facebookPixelService.trackLead(
      'Cal.com CTA - Abre tu LLC',
      'LLC Services',
      0.0
    );
  }

  private updateUrlForCalCom(): void {
    if (this.fullName || this.email || this.crmId) {
      const url = new URL(window.location.href);
      
      // Mapear parámetros a los nombres que espera Cal.com
      if (this.fullName) {
        url.searchParams.set('name', this.fullName);
      }
      if (this.email) {
        url.searchParams.set('email', this.email);
      }
      if (this.crmId) {
        url.searchParams.set('idcrm', this.crmId);
      }
      
      // Actualizar la URL sin recargar la página
      window.history.replaceState({}, '', url.toString());
      
      console.log('URL updated for Cal.com:', url.toString());
    }
  }

  private initializeCalCom(): void {
    // Cargar el script de Cal.com con auto-forwarding de query parameters
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      (function (C, A, L) { 
        let p = function (a, ar) { a.q.push(ar); }; 
        let d = C.document; 
        C.Cal = C.Cal || function () { 
          let cal = C.Cal; 
          let ar = arguments; 
          if (!cal.loaded) { 
            cal.ns = {}; 
            cal.q = cal.q || []; 
            d.head.appendChild(d.createElement("script")).src = A; 
            cal.loaded = true; 
          } 
          if (ar[0] === L) { 
            const api = function () { p(api, arguments); }; 
            const namespace = ar[1]; 
            api.q = api.q || []; 
            if(typeof namespace === "string"){
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar); 
            return;
          } 
          p(cal, ar); 
        }; 
      })(window, "https://app.cal.com/embed/embed.js", "init");
      
      // Habilitar auto-forwarding de query parameters
      Cal.config = Cal.config || {};
      Cal.config.forwardQueryParams = true;
      
      Cal("init", "agendaformmeta", {origin:"https://app.cal.com"});

      Cal.ns.agendaformmeta("inline", {
        elementOrSelector:"#my-cal-inline-agendaformmeta",
        config: {"layout":"month_view","theme":"light"},
        calLink: "startcompanies-businessenusa/agendaformmeta"
      });

      Cal.ns.agendaformmeta("ui", {
        "theme":"light",
        "cssVarsPerTheme":{
          "light":{"cal-brand":"#006AFE"},
          "dark":{"cal-brand":"#fafafa"}
        },
        "hideEventTypeDetails":false,
        "layout":"month_view"
      });
    `;
    
    document.head.appendChild(script);
  }
}
