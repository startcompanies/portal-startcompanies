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
  private calendlyInitialized = new Set<string>();

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
      // Resetear los IDs inicializados cuando cambia el contenido
      this.calendlyInitialized.clear();
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
    
    // Agregar icono de LinkedIn a enlaces que contengan "Sígueme en LinkedIn" o "Sigueme en Linkedin"
    // Buscar todos los enlaces que contengan el texto, sin importar mayúsculas/minúsculas o acentos
    content = content.replace(/<a\s+([^>]*?)href\s*=\s*["']([^"']*)["']([^>]*?)>([\s\S]*?)<\/a>/gi, (match, beforeHref, href, afterHref, linkContent) => {
      // Verificar si el contenido del enlace contiene el texto (case insensitive)
      const hasLinkedInText = /s[ií]gueme en linkedin/i.test(linkContent);
      // Verificar si el enlace ya tiene el icono de LinkedIn
      const hasIcon = match.includes('bi-linkedin');
      
      if (hasLinkedInText && !hasIcon) {
        // Limpiar espacios extra al inicio del contenido
        const cleanedContent = linkContent.trim();
        // Agregar el icono antes del contenido del enlace con un pequeño margen
        return `<a ${beforeHref}href="${href}"${afterHref}><i class="bi bi-linkedin me-1"></i>${cleanedContent}</a>`;
      }
      return match;
    });
    
    // Agregar estilos e icono de flecha a enlaces que contengan "Abrir tu LLC" o "Abre tu corporation" o que estén dentro de mission-card o secciones con background-image
    content = content.replace(/<a\s+([^>]*?)href\s*=\s*["']([^"']*)["']([^>]*?)>([\s\S]*?)<\/a>/gi, (match, beforeHref, href, afterHref, linkContent) => {
      // Limpiar el contenido del enlace para comparar (eliminar HTML interno y espacios)
      const cleanContent = linkContent.replace(/<[^>]*>/g, '').trim();
      // Verificar si el contenido del enlace contiene el texto "Abrir tu LLC" o "Abre tu corporation" (case insensitive)
      const hasAbrirLLCText = /abrir\s+tu\s+llc/i.test(cleanContent);
      const hasAbreLLCText = /abre\s+tu\s+llc/i.test(cleanContent);
      const hasAbreCorpText = /abre\s+tu\s+corporation|abre\s+tu\s+corp/i.test(cleanContent);
      // Verificar si el enlace ya tiene los estilos aplicados
      const hasStyles = match.includes('abrir-llc-btn') || match.includes('background-color: var(--color-secundario-tecnico)');
      
      // Verificar si el enlace está dentro de una mission-card o sección con background-image
      // Buscar el contexto anterior (hasta 2000 caracteres antes) para ver si hay mission-card o section con background-image
      const contextStart = Math.max(0, content.indexOf(match) - 2000);
      const contextBefore = content.substring(contextStart, content.indexOf(match));
      const isInMissionCard = /mission-card/i.test(contextBefore);
      const isInBackgroundSection = /section[^>]*style\s*=\s*["'][^"']*background-image[^"']*["']/i.test(contextBefore);
      
      if ((hasAbrirLLCText || hasAbreLLCText || hasAbreCorpText || isInMissionCard || isInBackgroundSection) && !hasStyles) {
        // Obtener los atributos existentes de toda la etiqueta
        const allAttrs = beforeHref + afterHref;
        const classMatch = allAttrs.match(/class\s*=\s*["']([^"']*)["']/i);
        const styleMatch = allAttrs.match(/style\s*=\s*["']([^"']*)["']/i);
        
        // Construir los nuevos estilos según las especificaciones del usuario
        const newStyles = 'background-color: var(--color-secundario-tecnico) !important; color: var(--color-fondo-claro) !important; border: none !important; border-radius: 2.5rem !important; padding: .6rem 1.2rem !important; font-weight: 600 !important; font-size: .9rem !important; display: inline-flex !important; align-items: center !important; transition: background-color .3s ease !important; white-space: nowrap !important;';
        
        // Mantener las clases existentes y añadir abrir-llc-btn si no existe
        let newClass = 'abrir-llc-btn';
        if (classMatch) {
          const existingClasses = classMatch[1];
          if (!existingClasses.includes('abrir-llc-btn')) {
            newClass = `${existingClasses} abrir-llc-btn`;
          } else {
            newClass = existingClasses;
          }
        }
        
        // Construir los nuevos atributos
        let newBeforeHref = beforeHref;
        let newAfterHref = afterHref;
        
        // Reemplazar o agregar style
        if (styleMatch) {
          // Reemplazar style existente
          if (beforeHref.includes('style')) {
            newBeforeHref = beforeHref.replace(/style\s*=\s*["'][^"']*["']/i, `style="${newStyles}"`);
          } else if (afterHref.includes('style')) {
            newAfterHref = afterHref.replace(/style\s*=\s*["'][^"']*["']/i, `style="${newStyles}"`);
          }
        } else {
          // Agregar style nuevo
          newAfterHref = newAfterHref + (newAfterHref.trim() ? ' ' : '') + `style="${newStyles}"`;
        }
        
        // Reemplazar o agregar class
        if (classMatch) {
          // Reemplazar class existente manteniendo las clases originales
          if (beforeHref.includes('class')) {
            newBeforeHref = newBeforeHref.replace(/class\s*=\s*["'][^"']*["']/i, `class="${newClass}"`);
          } else if (afterHref.includes('class')) {
            newAfterHref = newAfterHref.replace(/class\s*=\s*["'][^"']*["']/i, `class="${newClass}"`);
          }
        } else {
          // Agregar class nuevo
          newAfterHref = newAfterHref + (newAfterHref.trim() ? ' ' : '') + `class="${newClass}"`;
        }
        
        // Verificar si el contenido ya tiene el icono
        const hasIcon = linkContent.includes('bi-arrow-right') || linkContent.includes('<i class="bi bi-arrow-right');
        const iconHtml = hasIcon ? '' : '<i class="bi bi-arrow-right ms-2"></i>';
        
        // Construir el nuevo enlace con el icono después del contenido (como en el ejemplo del usuario)
        return `<a ${newBeforeHref}href="${href}"${newAfterHref}>${linkContent}${iconHtml}</a>`;
      }
      return match;
    });
    
    // Reemplazar el contenido del botón de acordeón con solo el icono
    // Extraer el texto del span dentro del botón y mantenerlo, pero reemplazar el SVG con el icono
    content = content.replace(/<button\s+([^>]*?)class\s*=\s*["']([^"']*custom-accordion-button[^"']*)["']([^>]*?)>([\s\S]*?)<\/button>/gi, (match, beforeClass, classAttr, afterClass, buttonContent) => {
      // Extraer el texto del span dentro del botón
      const spanMatch = buttonContent.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
      const questionText = spanMatch ? spanMatch[1] : buttonContent.replace(/<[^>]*>/g, '').trim();
      
      // Verificar si ya tiene el icono faq-arrow-icon
      if (match.includes('faq-arrow-icon')) {
        return match;
      }
      
      // Crear el nuevo contenido del botón: h2 con el texto + icono
      const faqArrowIcon = '<i class="bi bi-chevron-down faq-arrow-icon" style="margin: 0 0.5rem;"></i>';
      const newButtonContent = `<h2 style="font-size: 1.1rem; margin: 0;">${questionText}</h2>${faqArrowIcon}`;
      
      // Asegurar que el botón tenga los estilos necesarios para el layout flex
      let styleAttr = afterClass.match(/style\s*=\s*["']([^"']*)["']/i);
      let newAfterClass = afterClass;
      
      if (styleAttr) {
        const existingStyle = styleAttr[1];
        // Eliminar width: 100% si existe
        let newStyle = existingStyle.replace(/width\s*:\s*100%\s*;?/gi, '').trim();
        // Limpiar dobles espacios y puntos y comas extra
        newStyle = newStyle.replace(/\s*;\s*;/g, ';').replace(/^\s*;\s*/, '').replace(/\s*;\s*$/, '');
        
        // Asegurar que tenga display: flex
        if (!newStyle.includes('display:') && !newStyle.includes('display ')) {
          newStyle = newStyle + (newStyle ? '; ' : '') + 'display: flex;';
        }
        
        // Asegurar que tenga justify-content: space-between
        if (!newStyle.includes('justify-content:')) {
          newStyle = newStyle + (newStyle ? ' ' : '') + 'justify-content: space-between;';
        }
        
        // Asegurar que tenga align-items: center
        if (!newStyle.includes('align-items:')) {
          newStyle = newStyle + (newStyle ? ' ' : '') + 'align-items: center;';
        }
        
        newAfterClass = afterClass.replace(/style\s*=\s*["'][^"']*["']/i, `style="${newStyle}"`);
      } else {
        // Si no tiene style, añadirlo completo
        newAfterClass = afterClass + ' style="text-align: left; background: none; border: none; padding: 1rem 0; display: flex; justify-content: space-between; align-items: center; cursor: pointer;"';
      }
      
      // Reemplazar el contenido del botón con h2 + icono
      return `<button ${beforeClass}class="${classAttr}"${newAfterClass}>${newButtonContent}</button>`;
    });
    
    // Aplicar estilo mission-card a estructuras similares (row con col-lg-6 que contengan imagen y contenido)
    // Solo para landing pages
    if (this.isLandingPage) {
      // Buscar divs con clase "row" que contengan col-lg-6 y que tengan imagen y contenido
      content = content.replace(/(<div\s+[^>]*class\s*=\s*["'][^"']*row[^"']*["'][^>]*>)([\s\S]*?)(<\/div>)/gi, (match: string, rowStart: string, rowContent: string, rowEnd: string) => {
        // Verificar si ya tiene la clase mission-card
        if (rowStart.includes('mission-card')) {
          return match;
        }
        
        // Verificar si tiene col-lg-6 y contiene imagen y contenido
        const hasColLg6 = /col-lg-6/i.test(rowContent);
        const hasImage = /<img[^>]*>/i.test(rowContent) || /mission-image/i.test(rowContent);
        const hasContent = /mission-content|col-lg-6[\s\S]{50,}/i.test(rowContent); // Al menos 50 caracteres de contenido
        
        if (hasColLg6 && hasImage && hasContent) {
          // Agregar la clase mission-card y los estilos necesarios
          let newRowStart = rowStart;
          
          // Agregar mission-card a las clases
          const classMatch = rowStart.match(/class\s*=\s*["']([^"']*)["']/i);
          if (classMatch) {
            const existingClasses = classMatch[1];
            if (!existingClasses.includes('mission-card')) {
              const newClasses = `${existingClasses} mission-card align-items-center my-5 g-5 py-5`;
              newRowStart = rowStart.replace(/class\s*=\s*["'][^"']*["']/i, `class="${newClasses}"`);
            }
          } else {
            // Si no tiene class, agregarlo
            newRowStart = rowStart.replace(/>/, ' class="mission-card row align-items-center my-5 g-5 py-5">');
          }
          
          // Asegurar que las columnas tengan mt-0
          let processedContent = rowContent.replace(/(<div\s+[^>]*class\s*=\s*["']([^"']*col-lg-6[^"']*)["'][^>]*>)/gi, (colMatch: string, colStart: string, colClasses: string) => {
            if (!colStart.includes('mt-0')) {
              const newColClasses = colClasses.includes('mt-0') ? colClasses : `${colClasses} mt-0`;
              return colStart.replace(/class\s*=\s*["'][^"']*["']/i, `class="${newColClasses}"`);
            }
            return colMatch;
          });
          
          // Asegurar que las imágenes tengan mission-image-container y mission-image
          processedContent = processedContent.replace(/(<div\s+[^>]*>)\s*(<img\s+[^>]*>)/gi, (imgMatch: string, divStart: string, imgTag: string) => {
            // Verificar si ya está dentro de mission-image-container
            if (imgMatch.includes('mission-image-container')) {
              return imgMatch;
            }
            // Verificar si el div padre tiene mission-image-container
            const parentDiv = imgMatch.match(/<div\s+[^>]*>/);
            if (parentDiv && parentDiv[0].includes('mission-image-container')) {
              return imgMatch;
            }
            // Envolver la imagen con mission-image-container si no está envuelta
            return `<div class="mission-image-container">${imgTag}</div>`;
          });
          
          // Asegurar que las imágenes tengan la clase mission-image
          processedContent = processedContent.replace(/(<img\s+[^>]*class\s*=\s*["']([^"']*)["'][^>]*>)/gi, (imgMatch: string, imgStart: string, imgClasses: string) => {
            if (!imgClasses.includes('mission-image')) {
              const newImgClasses = `${imgClasses} mission-image img-fluid`;
              return imgStart.replace(/class\s*=\s*["'][^"']*["']/i, `class="${newImgClasses}"`);
            }
            return imgMatch;
          });
          
          // Asegurar que el contenido tenga mission-content
          processedContent = processedContent.replace(/(<div\s+[^>]*class\s*=\s*["']([^"']*col-lg-6[^"']*)["'][^>]*>)\s*(<div\s+[^>]*>)/gi, (contentMatch: string, colStart: string, colClasses: string, contentDivStart: string) => {
            // Verificar si el contenido div tiene mission-content
            if (!contentDivStart.includes('mission-content')) {
              // Verificar si el contenido div no tiene clase
              if (!contentDivStart.match(/class\s*=/i)) {
                return `${colStart}<div class="mission-content">`;
              } else {
                // Agregar mission-content a las clases existentes
                const contentClassMatch = contentDivStart.match(/class\s*=\s*["']([^"']*)["']/i);
                if (contentClassMatch) {
                  const existingContentClasses = contentClassMatch[1];
                  if (!existingContentClasses.includes('mission-content')) {
                    const newContentClasses = `${existingContentClasses} mission-content`;
                    return `${colStart}${contentDivStart.replace(/class\s*=\s*["'][^"']*["']/i, `class="${newContentClasses}"`)}`;
                  }
                }
              }
            }
            return contentMatch;
          });
          
          return `${newRowStart}${processedContent}${rowEnd}`;
        }
        
        return match;
      });
    }
    
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
   * Detecta si hay divs con id "my-cal-inline" y carga todos los Calendly inline
   */
  private loadCalendlyIfNeeded(): void {
    if (!this.isBrowser) {
      return;
    }

    if (!this.contentContainer?.nativeElement) {
      return;
    }

    // Buscar TODOS los divs con id "my-cal-inline" en el contenido renderizado
    // Nota: querySelectorAll puede no encontrar todos los divs si tienen IDs duplicados,
    // así que buscamos manualmente todos los divs y verificamos su id
    const container = this.contentContainer.nativeElement;
    
    // Buscar todos los divs en el contenedor y filtrar los que tienen id relacionado con "my-cal-inline"
    const allDivs = Array.from(container.querySelectorAll('div')) as HTMLElement[];
    let calendlyDivs = allDivs.filter(div => {
      const id = div.getAttribute('id') || '';
      return id.includes('my-cal-inline');
    });
    
    // Si no encontramos ninguno, buscar por id exacto (puede haber solo uno)
    if (calendlyDivs.length === 0) {
      const singleDiv = container.querySelector('#my-cal-inline') as HTMLElement;
      if (singleDiv) {
        calendlyDivs = [singleDiv];
      }
    }
    
    // Si hay múltiples divs con el mismo ID, necesitamos generar IDs únicos
    calendlyDivs.forEach((div, index) => {
      let currentId = div.getAttribute('id') || '';
      let uniqueId = currentId;
      
      // Si el ID es "my-cal-inline" y hay más de uno, generar un ID único
      if (currentId === 'my-cal-inline' && calendlyDivs.length > 1) {
        uniqueId = `my-cal-inline-${index}`;
        div.setAttribute('id', uniqueId);
      } else if (!currentId || currentId === '') {
        // Si no tiene ID, asignarle uno
        uniqueId = `my-cal-inline-${index}`;
        div.setAttribute('id', uniqueId);
      }
      
      // Inicializar cada Calendly si no ha sido inicializado
      if (!this.calendlyInitialized.has(uniqueId)) {
        this.calendlyInitialized.add(uniqueId);
        this.initializeCalendly(uniqueId, index);
      }
    });
  }

  /**
   * Inicializa el widget de Calendly inline para un elemento específico
   */
  private async initializeCalendly(elementId: string, index: number): Promise<void> {
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

    // Crear un namespace único para cada instancia de Calendly
    const namespace = `30min-${index}`;

    // Esperar a que Cal esté disponible y luego inicializar
    const initCalendly = () => {
      if (window.Cal) {
        window.Cal.config = window.Cal.config || {};
        window.Cal.config.forwardQueryParams = true;

        // Inicializar el namespace único para este Calendly
        window.Cal('init', namespace, { origin: 'https://cal.com' });

        // Inicializar el widget inline en el elemento específico
        window.Cal.ns[namespace]('inline', {
          elementOrSelector: `#${elementId}`,
          calLink: calLink,
        });

        window.Cal.ns[namespace]('ui', {
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
