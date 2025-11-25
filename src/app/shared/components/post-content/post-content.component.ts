import { Component, Input, Inject, PLATFORM_ID, OnChanges, AfterViewInit, OnDestroy, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare global {
  interface Window {
    Cal: any;
  }
}

@Component({
  selector: 'app-post-content',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './post-content.component.html',
  styleUrl: './post-content.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class PostContentComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() html: string = '';
  @Input() isLandingPage = false;
  sanitizedHtml: SafeHtml = '';
  isBrowser = false;
  @ViewChild('contentContainer', { static: false }) contentContainer?: ElementRef;
  private calendlyLoaded = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.sanitizeHtml();
    }
  }

  ngOnChanges() {
    if (this.isBrowser) {
      this.sanitizeHtml();
      // Resetear el flag cuando cambia el contenido
      this.calendlyLoaded = false;
      // Esperar a que el contenido se renderice después del cambio
      setTimeout(() => {
        this.loadCalendlyIfNeeded();
        this.initializeAccordions();
      }, 200);
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Exponer toggleAccordion globalmente para que funcione con onclick en el HTML
      (window as any).toggleAccordion = (id: string) => {
        this.toggleAccordion(id);
      };
      
      // Esperar a que el contenido se renderice
      setTimeout(() => {
        this.loadCalendlyIfNeeded();
        this.initializeAccordions();
      }, 200);
    }
  }

  ngOnDestroy(): void {
    // Limpiar la función global
    if (this.isBrowser && (window as any).toggleAccordion) {
      delete (window as any).toggleAccordion;
    }
  }

  private initializeAccordions(): void {
    if (!this.isBrowser) return;

    // Buscar todos los botones de acordeón y añadir event listeners
    const accordionButtons = document.querySelectorAll('.custom-accordion-button');
    accordionButtons.forEach((button) => {
      const buttonElement = button as HTMLElement;
      // Verificar si ya tiene el listener para evitar duplicados
      if (!buttonElement.dataset['accordionInitialized']) {
        buttonElement.dataset['accordionInitialized'] = 'true';
        buttonElement.addEventListener('click', (event) => {
          event.preventDefault();
          // Buscar el contenido del acordeón asociado
          // Primero intentar por aria-controls
          let contentId = buttonElement.getAttribute('aria-controls');
          
          // Si no, intentar por data-target
          if (!contentId) {
            const dataTarget = buttonElement.getAttribute('data-target');
            if (dataTarget) {
              contentId = dataTarget.replace('#', '');
            }
          }
          
          // Si no, buscar el siguiente elemento con clase custom-accordion-content
          if (!contentId) {
            const accordionItem = buttonElement.closest('.custom-accordion-item') || 
                                 buttonElement.parentElement;
            const contentElement = accordionItem?.querySelector('.custom-accordion-content') as HTMLElement;
            if (contentElement) {
              contentId = contentElement.id;
            }
          }
          
          // Si aún no hay ID, buscar el siguiente elemento hermano
          if (!contentId) {
            const nextSibling = buttonElement.nextElementSibling as HTMLElement;
            if (nextSibling && nextSibling.classList.contains('custom-accordion-content')) {
              contentId = nextSibling.id;
            }
          }
          
          if (contentId) {
            this.toggleAccordion(contentId);
          }
        });
      }
    });
  }

  toggleAccordion(id: string): void {
    if (!this.isBrowser) return;

    const content = document.getElementById(id) as HTMLElement;
    if (!content) return;

    // Buscar el botón asociado
    let button: HTMLElement | null = null;
    
    // Intentar encontrar el botón por previousElementSibling
    const previousSibling = content.previousElementSibling as HTMLElement;
    if (previousSibling) {
      button = previousSibling.querySelector('button.custom-accordion-button') as HTMLElement;
    }
    
    // Si no se encuentra, buscar en el elemento padre
    if (!button) {
      const parent = content.parentElement;
      button = parent?.querySelector('button.custom-accordion-button') as HTMLElement;
    }
    
    // Si aún no se encuentra, buscar por aria-controls
    if (!button) {
      button = document.querySelector(`button[aria-controls="${id}"], button[data-target="#${id}"]`) as HTMLElement;
    }
    
    if (!button) return;

    const icon = button.querySelector('.accordion-icon') as HTMLElement;

    // Cerrar todos los demás acordeones
    const allContents = document.querySelectorAll('.custom-accordion-content');
    const allIcons = document.querySelectorAll('.accordion-icon');
    const allButtons = document.querySelectorAll('.custom-accordion-button');

    allContents.forEach((item) => {
      const itemElement = item as HTMLElement;
      if (itemElement.id !== id) {
        itemElement.style.display = 'none';
      }
    });

    allIcons.forEach((iconItem) => {
      const iconElement = iconItem as HTMLElement;
      // Solo rotar si no es el icono del acordeón actual
      if (icon && iconElement !== icon) {
        iconElement.style.transform = 'rotate(0deg)';
      }
    });

    allButtons.forEach((buttonItem) => {
      const buttonElement = buttonItem as HTMLElement;
      // Solo actualizar si no es el botón del acordeón actual
      if (buttonElement !== button) {
        buttonElement.setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle del acordeón actual
    if (content.style.display === 'none' || content.style.display === '') {
      content.style.display = 'block';
      if (icon) {
        icon.style.transform = 'rotate(90deg)';
      }
      button.setAttribute('aria-expanded', 'true');
    } else {
      content.style.display = 'none';
      if (icon) {
        icon.style.transform = 'rotate(0deg)';
      }
      button.setAttribute('aria-expanded', 'false');
    }
  }

  private sanitizeHtml() {
    // Preservar todo el HTML con estilos y clases de TinyMCE
    let content = this.html || '';
    
    if (!content) {
      this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml('');
      return;
    }
    
    // Solo limpieza mínima sin tocar atributos
    content = content.replace(/\\n/g, ''); // eliminar escapes de newline
    content = content.replace(/<p>\s*<\/p>/g, ''); // eliminar párrafos vacíos
    
    // Procesar enlaces externos preservando TODOS los atributos existentes (style, class, etc.)
    content = content.replace(/<a\s+([^>]*?)href\s*=\s*["']([^"']*)["']([^>]*?)>/gi, (match, beforeHref, href, afterHref) => {
      // Si es un enlace externo, agregar target y rel sin romper atributos existentes
      if (href && !href.startsWith('/') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        // Verificar si ya tiene target o rel
        const hasTarget = /target\s*=/i.test(beforeHref + afterHref);
        const hasRel = /rel\s*=/i.test(beforeHref + afterHref);
        
        let newAttrs = '';
        if (!hasTarget) {
          newAttrs += ' target="_blank"';
        }
        if (!hasRel) {
          newAttrs += ' rel="noopener noreferrer"';
        }
        
        // Preservar todos los atributos originales (style, class, etc.)
        return `<a ${beforeHref}href="${href}"${afterHref}${newAttrs}>`;
      }
      return match;
    });
    
    // Agregar icono de WhatsApp a enlaces que apunten a WhatsApp
    // Usar un regex más robusto que maneje contenido HTML dentro del enlace
    content = content.replace(/<a\s+([^>]*?)href\s*=\s*["']([^"']*whatsapp[^"']*)["']([^>]*?)>([\s\S]*?)<\/a>/gi, (match, beforeHref, href, afterHref, linkContent) => {
      // Verificar si el enlace ya tiene el icono
      if (!match.includes('bi-whatsapp')) {
        // Agregar el icono antes del contenido del enlace
        return `<a ${beforeHref}href="${href}"${afterHref}><span class="bi bi-whatsapp me-2" style="font-size: 1em;"></span>${linkContent}</a>`;
      }
      return match;
    });
    
    // Agregar iconos de estrellas después del span con clase veredicto-rating-number
    // Buscar todos los spans completos con veredicto-rating-number y añadir iconos después si no existen
    const ratingSpanRegex = /<span\s+[^>]*?class\s*=\s*["'][^"']*veredicto-rating-number[^"']*["'][^>]*>([^<]*?)<\/span>/gi;
    let lastIndex = 0;
    const starsHtml = `<i class="veredicto-star-filled bi bi-star-fill"></i><i class="veredicto-star-filled bi bi-star-fill"></i><i class="veredicto-star-filled bi bi-star-fill"></i><i class="veredicto-star-filled bi bi-star-fill"></i><i class="veredicto-star-empty bi bi-star"></i>`;
    let newContent = '';
    let match;
    
    while ((match = ratingSpanRegex.exec(content)) !== null) {
      // Añadir el contenido antes del match
      newContent += content.substring(lastIndex, match.index);
      
      // Verificar si ya tiene iconos después del span (en los siguientes 200 caracteres)
      const contextEnd = Math.min(content.length, ratingSpanRegex.lastIndex + 200);
      const contextAfter = content.substring(ratingSpanRegex.lastIndex, contextEnd);
      
      // Si no tiene iconos, añadirlos después del span
      if (!contextAfter.includes('veredicto-star-filled') && !contextAfter.includes('veredicto-star-empty')) {
        // Añadir el span completo y luego los iconos
        newContent += match[0] + starsHtml;
      } else {
        // Si ya tiene iconos, solo añadir el span
        newContent += match[0];
      }
      lastIndex = ratingSpanRegex.lastIndex;
    }
    
    // Añadir el resto del contenido
    if (lastIndex < content.length) {
      newContent += content.substring(lastIndex);
    }
    
    // Si se encontraron matches, usar el nuevo contenido
    if (newContent) {
      content = newContent;
    }
    
    // Reemplazar el src de la imagen con id="img-ayuda"
    content = content.replace(/<img\s+([^>]*?)id\s*=\s*["']img-ayuda["']([^>]*?)>/gi, (match, beforeId, afterId) => {
      const allAttrs = beforeId + afterId;
      // Buscar si ya tiene un atributo src
      const hasSrc = /src\s*=\s*["'][^"']*["']/i.test(allAttrs);
      if (hasSrc) {
        // Reemplazar el src existente, preservando el resto de atributos
        return match.replace(/src\s*=\s*["'][^"']*["']/i, 'src="/assets/tabs/renew_llc.webp"');
      } else {
        // Agregar el src si no existe, preservando todos los atributos existentes
        return `<img ${beforeId}id="img-ayuda"${afterId} src="/assets/tabs/renew_llc.webp">`;
      }
    });
    
    // Usar bypassSecurityTrustHtml para preservar TODOS los atributos (style, class, etc.)
    // Esto permite que los estilos inline y clases de TinyMCE se apliquen correctamente
    this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(content);
  }

  /**
   * Detecta si hay un div con id "my-cal-inline" y carga el Calendly inline
   */
  private loadCalendlyIfNeeded(): void {
    if (!this.isBrowser || this.calendlyLoaded) {
      return;
    }

    if (!this.contentContainer?.nativeElement) {
      return;
    }

    // Buscar el div con id "my-cal-inline" en el contenido renderizado
    const calendlyDiv = this.contentContainer.nativeElement.querySelector('#my-cal-inline');
    
    if (calendlyDiv && !this.calendlyLoaded) {
      this.calendlyLoaded = true;
      this.initializeCalendly();
    }
  }

  /**
   * Inicializa el widget de Calendly inline
   */
  private async initializeCalendly(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    let userIp: string | null = null;
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

    // Inicializar el script de Cal.com si no está cargado
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

    // Esperar a que Cal esté disponible y luego inicializar
    const initCalendly = () => {
      if (window.Cal) {
        window.Cal.config = window.Cal.config || {};
        window.Cal.config.forwardQueryParams = true;

        window.Cal('init', '30min', { origin: 'https://cal.com' });

        window.Cal.ns['30min']('inline', {
          elementOrSelector: '#my-cal-inline',
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
      } else {
        // Si Cal aún no está disponible, intentar de nuevo después de un breve delay
        setTimeout(initCalendly, 100);
      }
    };

    // Intentar inicializar inmediatamente o después de un delay
    if (window.Cal && window.Cal.loaded) {
      initCalendly();
    } else {
      // Esperar a que el script se cargue
      setTimeout(initCalendly, 500);
    }
  }
}
