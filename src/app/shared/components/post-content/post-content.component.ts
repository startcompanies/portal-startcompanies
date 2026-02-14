import {
  Component,
  Input,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BrowserService } from '../../services/browser.service';
import { TESTIMONIAL_AVATAR_URLS } from '../../constants/testimonial-avatars';

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
export class PostContentComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() html: string = '';
  @Input() isLandingPage = false;
  sanitizedHtml: SafeHtml = '';
  @ViewChild('contentContainer', { static: false })
  contentContainer?: ElementRef;
  private calendlyInitialized = new Set<string>();
  private testimonialAvatarUrls = TESTIMONIAL_AVATAR_URLS;

  baseUrl = environment.baseUrl;

  // Getter para acceso desde el template
  get isBrowser(): boolean {
    return this.browser.isBrowser;
  }

  constructor(
    private browser: BrowserService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {
    if (this.browser.isBrowser) {
      this.sanitizeHtml();
    }
  }

  ngOnChanges() {
    if (this.browser.isBrowser) {
      this.sanitizeHtml();
      // Resetear los IDs inicializados cuando cambia el contenido
      this.calendlyInitialized.clear();
      // Esperar a que el contenido se renderice después del cambio
      setTimeout(() => {
        this.loadCalendlyIfNeeded();
        this.initializeAccordions();
        this.processInternalLinks();
        this.styleAuthorTitles();
      }, 200);
    }
  }

  ngAfterViewInit(): void {
    const win = this.browser.window;
    if (!win) return;

    // Exponer toggleAccordion globalmente para que funcione con onclick en el HTML
    (win as any).toggleAccordion = (id: string) => {
      this.toggleAccordion(id);
    };

    // Esperar a que el contenido se renderice
    setTimeout(() => {
      this.loadCalendlyIfNeeded();
      this.initializeAccordions();
      this.processInternalLinks();
      this.styleAuthorTitles();
    }, 200);
  }

  ngOnDestroy(): void {
    // Limpiar la función global
    const win = this.browser.window;
    if (win && (win as any).toggleAccordion) {
      delete (win as any).toggleAccordion;
    }
  }

  private initializeAccordions(): void {
    const doc = this.browser.document;
    if (!doc) return;

    // Buscar todos los botones de acordeón y añadir event listeners
    const accordionButtons = doc.querySelectorAll('.custom-accordion-button');
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
            const accordionItem =
              buttonElement.closest('.custom-accordion-item') ||
              buttonElement.parentElement;
            const contentElement = accordionItem?.querySelector(
              '.custom-accordion-content',
            ) as HTMLElement;
            if (contentElement) {
              contentId = contentElement.id;
            }
          }

          // Si aún no hay ID, buscar el siguiente elemento hermano
          if (!contentId) {
            const nextSibling = buttonElement.nextElementSibling as HTMLElement;
            if (
              nextSibling &&
              nextSibling.classList.contains('custom-accordion-content')
            ) {
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
    const doc = this.browser.document;
    if (!doc) return;

    const content = doc.getElementById(id) as HTMLElement;
    if (!content) return;

    // Buscar el botón asociado
    let button: HTMLElement | null = null;

    // Intentar encontrar el botón por previousElementSibling
    const previousSibling = content.previousElementSibling as HTMLElement;
    if (previousSibling) {
      button = previousSibling.querySelector(
        'button.custom-accordion-button',
      ) as HTMLElement;
    }

    // Si no se encuentra, buscar en el elemento padre
    if (!button) {
      const parent = content.parentElement;
      button = parent?.querySelector(
        'button.custom-accordion-button',
      ) as HTMLElement;
    }

    // Si aún no se encuentra, buscar por aria-controls
    if (!button) {
      button = doc.querySelector(
        `button[aria-controls="${id}"], button[data-target="#${id}"]`,
      ) as HTMLElement;
    }

    if (!button) return;

    const icon = button.querySelector('.accordion-icon') as HTMLElement;

    // Cerrar todos los demás acordeones
    const allContents = doc.querySelectorAll('.custom-accordion-content');
    const allIcons = doc.querySelectorAll('.accordion-icon');
    const allButtons = doc.querySelectorAll('.custom-accordion-button');

    allContents.forEach((item) => {
      const itemElement = item as HTMLElement;
      if (itemElement.id !== id) {
        itemElement.classList.remove('accordion-open');
      }
    });

    allIcons.forEach((iconItem) => {
      const iconElement = iconItem as HTMLElement;
      if (icon && iconElement !== icon) {
        iconElement.classList.remove('accordion-icon-rotated');
      }
    });

    allButtons.forEach((buttonItem) => {
      const buttonElement = buttonItem as HTMLElement;
      if (buttonElement !== button) {
        buttonElement.setAttribute('aria-expanded', 'false');
        buttonElement.classList.remove('accordion-open');
      }
    });

    // Toggle del acordeón actual usando clases CSS
    const isOpen = content.classList.contains('accordion-open');

    if (!isOpen) {
      content.classList.add('accordion-open');
      if (icon) {
        icon.classList.add('accordion-icon-rotated');
      }
      button.classList.add('accordion-open');
      button.setAttribute('aria-expanded', 'true');
    } else {
      content.classList.remove('accordion-open');
      if (icon) {
        icon.classList.remove('accordion-icon-rotated');
      }
      button.classList.remove('accordion-open');
      button.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Procesa y sanitiza el HTML del contenido del post.
   *
   * Este método realiza múltiples transformaciones:
   * - Limpieza de HTML (eliminar párrafos vacíos, etc.)
   * - Procesamiento de enlaces (internos, externos, WhatsApp, LinkedIn)
   * - Inyección de iconos (WhatsApp, LinkedIn, etc.)
   * - Aplicación de clases CSS dinámicas
   * - Procesamiento de imágenes
   *
   * NOTA: Este es un método largo (~600 líneas) que podría beneficiarse de:
   * - Separación en métodos más pequeños y específicos
   * - Reducción de manipulación DOM directa
   * - Uso de clases CSS predefinidas en lugar de estilos inline
   * - Migración de algunas transformaciones a nivel de CMS
   *
   * Sin embargo, funciona correctamente y cualquier cambio debe hacerse
   * con cuidado para no romper la funcionalidad existente.
   */
  private sanitizeHtml() {
    // Preservar todo el HTML con estilos y clases de TinyMCE
    let content = this.html || '';

    if (!content) {
      this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml('');
      return;
    }

    // Protección SSR: si no estamos en el navegador, sanitizar sin manipulación DOM
    const doc = this.browser.document;
    if (!doc) {
      this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(content);
      return;
    }

    // Solo limpieza mínima sin tocar atributos
    content = content.replace(/\\n/g, ''); // eliminar escapes de newline
    content = content.replace(/<p>\s*<\/p>/g, ''); // eliminar párrafos vacíos

    // Procesar enlaces a businessenusa.com y convertirlos a enlaces internos de Angular
    content = content.replace(
      /<a\s+([^>]*?)href\s*=\s*["']([^"']*)["']([^>]*?)>([\s\S]*?)<\/a>/gi,
      (match, beforeHref, href, afterHref, linkContent) => {
        // Verificar si el enlace apunta a businessenusa.com
        if (href && href.includes('businessenusa.com')) {
          try {
            const url = new URL(href);
            // Extraer la ruta (por ejemplo, 'que-es-llc' de 'https://businessenusa.com/que-es-llc')
            const path = url.pathname.replace(/^\//, ''); // Remover el slash inicial

            if (path) {
              // Marcar el enlace con un atributo data para procesarlo después
              // Preservar todos los atributos existentes
              const allAttrs = beforeHref + afterHref;
              const hasTarget = /target\s*=/i.test(allAttrs);
              const hasDataLink = /data-internal-link\s*=/i.test(allAttrs);

              let newAttrs = '';
              if (!hasDataLink) {
                newAttrs += ` data-internal-link="${path}"`;
              }
              // Mantener target="_blank" si ya existe, o agregarlo si no existe
              if (!hasTarget) {
                newAttrs += ' target="_blank"';
              }

              // Preservar todos los atributos originales y agregar el marcador
              return `<a ${beforeHref}href="${href}"${afterHref}${newAttrs}>${linkContent}</a>`;
            }
          } catch (e) {
            // Si hay error al parsear la URL, continuar con el procesamiento normal
            console.warn('Error parsing URL:', href, e);
          }
        }

        // Para otros enlaces externos, agregar target y rel sin romper atributos existentes
        if (
          href &&
          !href.startsWith('/') &&
          !href.startsWith('#') &&
          !href.startsWith('mailto:') &&
          !href.includes('businessenusa.com')
        ) {
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
          return `<a ${beforeHref}href="${href}"${afterHref}${newAttrs}>${linkContent}</a>`;
        }
        return match;
      },
    );

    // Agregar icono de WhatsApp a enlaces que apunten a WhatsApp
    // Usar un regex más robusto que maneje contenido HTML dentro del enlace
    content = content.replace(
      /<a\s+([^>]*?)href\s*=\s*["']([^"']*whatsapp[^"']*)["']([^>]*?)>([\s\S]*?)<\/a>/gi,
      (match, beforeHref, href, afterHref, linkContent) => {
        // Verificar si el enlace ya tiene el icono
        if (!match.includes('bi-whatsapp')) {
          // Agregar el icono antes del contenido del enlace
          return `<a ${beforeHref}href="${href}"${afterHref}><span class="bi bi-whatsapp me-2" style="font-size: 1em;"></span>${linkContent}</a>`;
        }
        return match;
      },
    );

    // Agregar icono de LinkedIn a enlaces que contengan "Sígueme en LinkedIn" o "Sigueme en Linkedin"
    // Buscar todos los enlaces que contengan el texto, sin importar mayúsculas/minúsculas o acentos
    content = content.replace(
      /<a\s+([^>]*?)href\s*=\s*["']([^"']*)["']([^>]*?)>([\s\S]*?)<\/a>/gi,
      (match, beforeHref, href, afterHref, linkContent) => {
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
      },
    );

    // Añadir enlace de WhatsApp después del contenido de cada item de FAQ
    const docForWhatsApp = this.browser.document;
    if (docForWhatsApp) {
      try {
        const whatsappUrl =
          'https://api.whatsapp.com/send/?phone=17869354213&text=Hola%2C+vengo+de+Start+Companies.+Tengo+algunas+consultas+para+hacerles.&type=phone_number&app_absent=0';
        const whatsappLinkHtml = `<a href="${whatsappUrl}" target="_blank" style="background-color: var(--color-secundario-tecnico); color: var(--color-fondo-claro); border: none; border-radius: 2.5rem; padding: .6rem 1.2rem; font-weight: 600; font-size: .9rem; display: inline-flex; align-items: center; transition: background-color .3s ease; white-space: nowrap; text-decoration: none; margin-top: 1rem;">Contáctanos por WhatsApp</a>`;

        // Usar DOM parsing para encontrar correctamente los divs custom-accordion-content
        const tempDiv = docForWhatsApp.createElement('div');
        tempDiv.innerHTML = content;

        const accordionContents = tempDiv.querySelectorAll(
          '.custom-accordion-content',
        );
        accordionContents.forEach((accordionContent: Element) => {
          const accordionElement = accordionContent as HTMLElement;
          const innerHTML = accordionElement.innerHTML;

          // Verificar si ya tiene el enlace de WhatsApp
          if (
            innerHTML.includes('Contáctanos por WhatsApp') ||
            innerHTML.includes('Contactar por WhatsApp') ||
            innerHTML.includes(whatsappUrl)
          ) {
            return;
          }

          // Añadir el enlace al final del contenido
          accordionElement.innerHTML = innerHTML + whatsappLinkHtml;
        });

        content = tempDiv.innerHTML;
      } catch (error) {
        console.warn('Error añadiendo enlaces de WhatsApp a FAQs:', error);
        // Fallback con regex si falla el DOM parsing
        const whatsappUrl =
          'https://api.whatsapp.com/send/?phone=17869354213&text=Hola%2C+vengo+de+Start+Companies.+Tengo+algunas+consultas+para+hacerles.&type=phone_number&app_absent=0';
        const whatsappLinkHtml = `<a href="${whatsappUrl}" target="_blank" style="background-color: var(--color-secundario-tecnico); color: var(--color-fondo-claro); border: none; border-radius: 2.5rem; padding: .6rem 1.2rem; font-weight: 600; font-size: .9rem; display: inline-flex; align-items: center; transition: background-color .3s ease; white-space: nowrap; text-decoration: none; margin-top: 1rem;">Contáctanos por WhatsApp</a>`;

        // Buscar divs con clase custom-accordion-content usando regex más preciso
        // Buscar el patrón completo: div con la clase, contenido, y cierre del div
        content = content.replace(
          /(<div\s+[^>]*?class\s*=\s*["'][^"']*\bcustom-accordion-content\b[^"']*["'][^>]*>)([\s\S]*?)(<\/div>\s*(?=<div[^>]*class\s*=\s*["'][^"']*\bcustom-accordion-button|<div[^>]*class\s*=\s*["'][^"']*\bcustom-accordion-item|$))/gi,
          (match, divStart, divContent, divEnd) => {
            // Verificar si ya tiene el enlace de WhatsApp
            if (
              divContent.includes('Contáctanos por WhatsApp') ||
              divContent.includes('Contactar por WhatsApp') ||
              divContent.includes(whatsappUrl)
            ) {
              return match;
            }

            // Añadir el enlace antes del cierre del div
            return `${divStart}${divContent}${whatsappLinkHtml}${divEnd}`;
          },
        );
      }
    } else {
      // Fallback con regex si no estamos en el navegador
      const whatsappUrl =
        'https://api.whatsapp.com/send/?phone=17869354213&text=Hola%2C+vengo+de+Start+Companies.+Tengo+algunas+consultas+para+hacerles.&type=phone_number&app_absent=0';
      const whatsappLinkHtml = `<a href="${whatsappUrl}" target="_blank" style="background-color: var(--color-secundario-tecnico); color: var(--color-fondo-claro); border: none; border-radius: 2.5rem; padding: .6rem 1.2rem; font-weight: 600; font-size: .9rem; display: inline-flex; align-items: center; transition: background-color .3s ease; white-space: nowrap; text-decoration: none; margin-top: 1rem;">Contáctanos por WhatsApp</a>`;

      content = content.replace(
        /(<div\s+[^>]*?class\s*=\s*["'][^"']*\bcustom-accordion-content\b[^"']*["'][^>]*>)([\s\S]*?)(<\/div>\s*(?=<div[^>]*class\s*=\s*["'][^"']*\bcustom-accordion-button|<div[^>]*class\s*=\s*["'][^"']*\bcustom-accordion-item|$))/gi,
        (match, divStart, divContent, divEnd) => {
          if (
            divContent.includes('Contáctanos por WhatsApp') ||
            divContent.includes('Contactar por WhatsApp') ||
            divContent.includes(whatsappUrl)
          ) {
            return match;
          }
          return `${divStart}${divContent}${whatsappLinkHtml}${divEnd}`;
        },
      );
    }

    // Reemplazar el contenido del botón de acordeón con el nuevo layout (texto + icono)
    content = content.replace(
      /<button\s+([^>]*?)class\s*=\s*["']([^"']*custom-accordion-button[^"']*)["']([^>]*?)>([\s\S]*?)<\/button>/gi,
      (match, beforeClass, classAttr, afterClass, buttonContent) => {
        // Extraer el texto del span dentro del botón
        const spanMatch = buttonContent.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
        const questionText = spanMatch
          ? spanMatch[1]
          : buttonContent.replace(/<[^>]*>/g, '').trim();

        // Verificar si ya tiene el icono faq-arrow-icon
        if (match.includes('faq-arrow-icon')) {
          return match;
        }

        // Crear el nuevo contenido del botón: texto + icono
        const faqArrowIcon =
          '<span class="faq-arrow-icon"><i class="bi bi-arrow-right"></i></span>';
        const newButtonContent = `<span class="faq-question">${questionText}</span>${faqArrowIcon}`;

        // Asegurar que el botón tenga los estilos necesarios para el layout flex
        let styleAttr = afterClass.match(/style\s*=\s*["']([^"']*)["']/i);
        let newAfterClass = afterClass;

        if (styleAttr) {
          const existingStyle = styleAttr[1];
          // Eliminar width: 100% si existe
          let newStyle = existingStyle
            .replace(/width\s*:\s*100%\s*;?/gi, '')
            .trim();
          // Limpiar dobles espacios y puntos y comas extra
          newStyle = newStyle
            .replace(/\s*;\s*;/g, ';')
            .replace(/^\s*;\s*/, '')
            .replace(/\s*;\s*$/, '');

          // Asegurar que tenga display: flex
          if (
            !newStyle.includes('display:') &&
            !newStyle.includes('display ')
          ) {
            newStyle = newStyle + (newStyle ? '; ' : '') + 'display: flex;';
          }

          // Asegurar que tenga justify-content: space-between
          if (!newStyle.includes('justify-content:')) {
            newStyle =
              newStyle +
              (newStyle ? ' ' : '') +
              'justify-content: space-between;';
          }

          // Asegurar que tenga align-items: center
          if (!newStyle.includes('align-items:')) {
            newStyle =
              newStyle + (newStyle ? ' ' : '') + 'align-items: center;';
          }

          newAfterClass = afterClass.replace(
            /style\s*=\s*["'][^"']*["']/i,
            `style="${newStyle}"`,
          );
        } else {
          // Si no tiene style, añadirlo completo
          newAfterClass =
            afterClass +
            ' style="text-align: left; background: none; border: none; padding: 1rem 0; display: flex; justify-content: space-between; align-items: center; cursor: pointer;"';
        }

        // Reemplazar el contenido del botón con h2 + icono
        return `<button ${beforeClass}class="${classAttr}"${newAfterClass}>${newButtonContent}</button>`;
      },
    );

    // Aplicar estilo mission-card a estructuras similares (row con col-lg-6 que contengan imagen y contenido)
    // Solo para landing pages
    if (this.isLandingPage) {
      // Buscar divs con clase "row" que contengan col-lg-6 y que tengan imagen y contenido
      content = content.replace(
        /(<div\s+[^>]*class\s*=\s*["'][^"']*row[^"']*["'][^>]*>)([\s\S]*?)(<\/div>)/gi,
        (
          match: string,
          rowStart: string,
          rowContent: string,
          rowEnd: string,
        ) => {
          // Verificar si ya tiene la clase mission-card
          if (rowStart.includes('mission-card')) {
            return match;
          }

          // Verificar si tiene col-lg-6 y contiene imagen y contenido
          const hasColLg6 = /col-lg-6/i.test(rowContent);
          const hasImage =
            /<img[^>]*>/i.test(rowContent) || /mission-image/i.test(rowContent);
          const hasContent = /mission-content|col-lg-6[\s\S]{50,}/i.test(
            rowContent,
          ); // Al menos 50 caracteres de contenido

          if (hasColLg6 && hasImage && hasContent) {
            // Agregar la clase mission-card y los estilos necesarios
            let newRowStart = rowStart;

            // Agregar mission-card a las clases
            const classMatch = rowStart.match(/class\s*=\s*["']([^"']*)["']/i);
            if (classMatch) {
              const existingClasses = classMatch[1];
              if (!existingClasses.includes('mission-card')) {
                const newClasses = `${existingClasses} mission-card align-items-center my-5 g-5 py-5`;
                newRowStart = rowStart.replace(
                  /class\s*=\s*["'][^"']*["']/i,
                  `class="${newClasses}"`,
                );
              }
            } else {
              // Si no tiene class, agregarlo
              newRowStart = rowStart.replace(
                />/,
                ' class="mission-card row align-items-center my-5 g-5 py-5">',
              );
            }

            // Asegurar que las columnas tengan mt-0
            let processedContent = rowContent.replace(
              /(<div\s+[^>]*class\s*=\s*["']([^"']*col-lg-6[^"']*)["'][^>]*>)/gi,
              (colMatch: string, colStart: string, colClasses: string) => {
                if (!colStart.includes('mt-0')) {
                  const newColClasses = colClasses.includes('mt-0')
                    ? colClasses
                    : `${colClasses} mt-0`;
                  return colStart.replace(
                    /class\s*=\s*["'][^"']*["']/i,
                    `class="${newColClasses}"`,
                  );
                }
                return colMatch;
              },
            );

            // Asegurar que las imágenes tengan mission-image-container y mission-image
            processedContent = processedContent.replace(
              /(<div\s+[^>]*>)\s*(<img\s+[^>]*>)/gi,
              (imgMatch: string, divStart: string, imgTag: string) => {
                // Verificar si ya está dentro de mission-image-container
                if (imgMatch.includes('mission-image-container')) {
                  return imgMatch;
                }
                // Verificar si el div padre tiene mission-image-container
                const parentDiv = imgMatch.match(/<div\s+[^>]*>/);
                if (
                  parentDiv &&
                  parentDiv[0].includes('mission-image-container')
                ) {
                  return imgMatch;
                }
                // Envolver la imagen con mission-image-container si no está envuelta
                return `<div class="mission-image-container">${imgTag}</div>`;
              },
            );

            // Asegurar que las imágenes tengan la clase mission-image
            processedContent = processedContent.replace(
              /(<img\s+[^>]*class\s*=\s*["']([^"']*)["'][^>]*>)/gi,
              (imgMatch: string, imgStart: string, imgClasses: string) => {
                if (!imgClasses.includes('mission-image')) {
                  const newImgClasses = `${imgClasses} mission-image img-fluid`;
                  return imgStart.replace(
                    /class\s*=\s*["'][^"']*["']/i,
                    `class="${newImgClasses}"`,
                  );
                }
                return imgMatch;
              },
            );

            // Asegurar que el contenido tenga mission-content
            processedContent = processedContent.replace(
              /(<div\s+[^>]*class\s*=\s*["']([^"']*col-lg-6[^"']*)["'][^>]*>)\s*(<div\s+[^>]*>)/gi,
              (
                contentMatch: string,
                colStart: string,
                colClasses: string,
                contentDivStart: string,
              ) => {
                // Verificar si el contenido div tiene mission-content
                if (!contentDivStart.includes('mission-content')) {
                  // Verificar si el contenido div no tiene clase
                  if (!contentDivStart.match(/class\s*=/i)) {
                    return `${colStart}<div class="mission-content">`;
                  } else {
                    // Agregar mission-content a las clases existentes
                    const contentClassMatch = contentDivStart.match(
                      /class\s*=\s*["']([^"']*)["']/i,
                    );
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
              },
            );

            return `${newRowStart}${processedContent}${rowEnd}`;
          }

          return match;
        },
      );
    }

    // Agregar iconos de estrellas después del span con clase veredicto-rating-number
    // Buscar todos los spans completos con veredicto-rating-number y añadir iconos después si no existen
    const ratingSpanRegex =
      /<span\s+[^>]*?class\s*=\s*["'][^"']*veredicto-rating-number[^"']*["'][^>]*>([^<]*?)<\/span>/gi;
    let lastIndex = 0;
    const starsHtml = `<i class="veredicto-star-filled bi bi-star-fill"></i><i class="veredicto-star-filled bi bi-star-fill"></i><i class="veredicto-star-filled bi bi-star-fill"></i><i class="veredicto-star-filled bi bi-star-fill"></i><i class="veredicto-star-empty bi bi-star"></i>`;
    let newContent = '';
    let match;

    while ((match = ratingSpanRegex.exec(content)) !== null) {
      // Añadir el contenido antes del match
      newContent += content.substring(lastIndex, match.index);

      // Verificar si ya tiene iconos después del span (en los siguientes 200 caracteres)
      const contextEnd = Math.min(
        content.length,
        ratingSpanRegex.lastIndex + 200,
      );
      const contextAfter = content.substring(
        ratingSpanRegex.lastIndex,
        contextEnd,
      );

      // Si no tiene iconos, añadirlos después del span
      if (
        !contextAfter.includes('veredicto-star-filled') &&
        !contextAfter.includes('veredicto-star-empty')
      ) {
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
    content = content.replace(
      /<img\s+([^>]*?)id\s*=\s*["']img-ayuda["']([^>]*?)>/gi,
      (match, beforeId, afterId) => {
        const allAttrs = beforeId + afterId;
        // Buscar si ya tiene un atributo src
        const hasSrc = /src\s*=\s*["'][^"']*["']/i.test(allAttrs);
        if (hasSrc) {
          // Reemplazar el src existente, preservando el resto de atributos
          return match.replace(
            /src\s*=\s*["'][^"']*["']/i,
            'src="/assets/tabs/renew_llc.webp"',
          );
        } else {
          // Agregar el src si no existe, preservando todos los atributos existentes
          return `<img ${beforeId}id="img-ayuda"${afterId} src="/assets/tabs/renew_llc.webp">`;
        }
      },
    );

    // Aplicar clase post-image-rounded a las imágenes en posts que NO son landing
    if (!this.isLandingPage) {
      content = content.replace(/(<img\s+[^>]*?)>/gi, (match, imgStart) => {
        // Verificar si ya tiene la clase post-image-rounded
        if (imgStart.includes('post-image-rounded')) {
          return match;
        }

        // Verificar si está dentro de elementos que no deben tener la clase
        const matchIndex = content.indexOf(match);
        const contextStart = Math.max(0, matchIndex - 2000);
        const contextBefore = content.substring(contextStart, matchIndex);
        if (
          contextBefore.includes('promo-card') ||
          contextBefore.includes('veredicto-defentux-card') ||
          contextBefore.includes('metric') ||
          contextBefore.includes('logo-wrap') ||
          contextBefore.includes('content-column-container')
        ) {
          return match;
        }

        // Verificar si tiene atributo class
        const classMatch = imgStart.match(/class\s*=\s*["']([^"']*)["']/i);
        if (classMatch) {
          // Agregar la clase a las clases existentes
          const existingClasses = classMatch[1];
          const newClasses = `${existingClasses} post-image-rounded`;
          return (
            imgStart.replace(
              /class\s*=\s*["'][^"']*["']/i,
              `class="${newClasses}"`,
            ) + '>'
          );
        } else {
          // Agregar el atributo class con la clase
          return imgStart + ' class="post-image-rounded">';
        }
      });
    }

    // Procesar states-card: agregar iconos a los li y enlaces al final
    const docForStates = this.browser.document;
    if (docForStates) {
      try {
        const tempDiv = docForStates.createElement('div');
        tempDiv.innerHTML = content;

        const statesCards = tempDiv.querySelectorAll('.states-card');
        statesCards.forEach((card: Element) => {
          // Procesar todos los li dentro de la card y agregar iconos
          const listItems = card.querySelectorAll('li');
          listItems.forEach((li: Element) => {
            // Verificar si ya tiene un icono
            if (li.querySelector('i.bi')) {
              return;
            }

            const text = li.textContent?.trim() || '';
            let iconClass = 'bi-check-circle';

            // Seleccionar icono según el contenido del texto
            if (/popular|favore|beneficio|ventaja/i.test(text)) {
              iconClass = 'bi-star-fill';
            } else if (/tax|impuesto|fee|precio|costo/i.test(text)) {
              iconClass = 'bi-cash-stack';
            } else if (/anual|reporte|filing/i.test(text)) {
              iconClass = 'bi-calendar-check';
            } else if (/anonimo|proteccion|legal/i.test(text)) {
              iconClass = 'bi-shield-check';
            } else if (/economico|economia|barato/i.test(text)) {
              iconClass = 'bi-currency-dollar';
            } else if (/facil|sencillo|simple/i.test(text)) {
              iconClass = 'bi-check-circle-fill';
            } else {
              iconClass = 'bi-check-circle';
            }

            // Agregar el icono al inicio del li
            const icon = docForStates.createElement('i');
            icon.className = `bi ${iconClass}`;
            li.insertBefore(icon, li.firstChild);
          });

          // Buscar divs hijos que contengan h3 y agregar enlaces
          const childDivs = Array.from(card.children).filter(
            (child) => child.tagName === 'DIV',
          );
          childDivs.forEach((div: Element) => {
            const h3 = div.querySelector('h3');
            if (h3 && h3.textContent) {
              // Verificar si ya tiene un enlace
              if (div.querySelector('a.states-card-link')) {
                return;
              }

              const title = h3.textContent.trim();
              const slug = title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '');

              if (slug) {
                const link = docForStates.createElement('a');
                link.href = `${this.baseUrl}/blog/${slug}`;
                link.setAttribute('data-internal-link', slug);
                link.className = 'states-card-link';
                link.textContent = `Ver más sobre ${title}`;
                div.appendChild(link);
              }
            }
          });
        });

        content = tempDiv.innerHTML;
      } catch (error) {
        console.warn('Error procesando states-card:', error);
      }
    } else {
      // Fallback para SSR: procesar con regex
      // Reemplazar bullets por iconos en los li dentro de states-card
      content = content.replace(
        /(<li[^>]*>)([\s\S]*?)(<\/li>)/gi,
        (liMatch, liStart, liContent, liEnd) => {
          // Solo procesar si está dentro de una states-card
          const matchIndex = content.indexOf(liMatch);
          const contextBefore = content.substring(
            Math.max(0, matchIndex - 2000),
            matchIndex,
          );
          if (!contextBefore.includes('states-card')) {
            return liMatch;
          }

          // Verificar si ya tiene un icono
          if (liStart.includes('bi-') || liContent.includes('<i class="bi')) {
            return liMatch;
          }

          const text = liContent.replace(/<[^>]*>/g, '').trim();
          let iconClass = 'bi-check-circle';

          if (/popular|favore|beneficio|ventaja/i.test(text)) {
            iconClass = 'bi-star-fill';
          } else if (/tax|impuesto|fee|precio|costo/i.test(text)) {
            iconClass = 'bi-cash-stack';
          } else if (/anual|reporte|filing/i.test(text)) {
            iconClass = 'bi-calendar-check';
          } else if (/anonimo|proteccion|legal/i.test(text)) {
            iconClass = 'bi-shield-check';
          } else if (/economico|economia|barato/i.test(text)) {
            iconClass = 'bi-currency-dollar';
          } else if (/facil|sencillo|simple/i.test(text)) {
            iconClass = 'bi-check-circle-fill';
          }

          return `${liStart}<i class="bi ${iconClass}"></i>${liContent}${liEnd}`;
        },
      );

      // Agregar enlaces al final de divs que tengan h3 dentro de states-card
      content = content.replace(
        /(<div[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?)(<\/div>)/gi,
        (divMatch, divBefore, title, divClose) => {
          // Verificar si está dentro de una states-card
          const matchIndex = content.indexOf(divMatch);
          const contextBefore = content.substring(
            Math.max(0, matchIndex - 2000),
            matchIndex,
          );
          if (!contextBefore.includes('states-card')) {
            return divMatch;
          }

          // Verificar si ya tiene un enlace
          if (
            divBefore.includes('data-internal-link') ||
            divBefore.includes('states-card-link')
          ) {
            return divMatch;
          }

          const cleanTitle = title.trim();
          const slug = cleanTitle
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '');

          if (slug) {
            const link = `<a href="${this.baseUrl}/blog/${slug}" data-internal-link="${slug}" class="states-card-link">Ver más sobre ${cleanTitle}</a>`;
            return `${divBefore}${link}${divClose}`;
          }

          return divMatch;
        },
      );
    }

    // Aplicar clase cta-card a elementos con estilos específicos de CTA
    // Detectar elementos div con color de fondo legacy o actual y borde #38B2AC
    content = content.replace(
      /(<div\s+[^>]*style\s*=\s*["']([^"']*)["'][^>]*>)/gi,
      (match, divStart, styleContent) => {
        // Verificar si tiene los estilos característicos de cta-card
        const hasBackgroundColor =
          /background-color:\s*(#2d3748|#293b49|#001627|var\(--color-oscuro-tecnico\))/i.test(
            styleContent,
          );
        const hasBorder = /border:\s*2px\s+solid\s+#38B2AC/i.test(styleContent);

        if (hasBackgroundColor && hasBorder) {
          // Verificar si ya tiene la clase cta-card
          const hasClass = /class\s*=\s*["'][^"']*cta-card[^"']*["']/i.test(
            divStart,
          );
          if (hasClass) {
            // Ya tiene la clase, retornar sin cambios
            return match;
          }

          // Verificar si tiene atributo class
          const classMatch = divStart.match(/class\s*=\s*["']([^"']*)["']/i);
          if (classMatch) {
            // Agregar la clase a las clases existentes
            const existingClasses = classMatch[1];
            const newClasses = `${existingClasses} cta-card`;
            return divStart.replace(
              /class\s*=\s*["'][^"']*["']/i,
              `class="${newClasses}"`,
            );
          } else {
            // Agregar el atributo class con la clase
            return divStart.replace(/>$/, ' class="cta-card">');
          }
        }

        return match;
      },
    );

    // Reemplazar cta-card por el CTA estándar
    const hadCtaCard = /class\s*=\s*["'][^"']*\bcta-card\b[^"']*["']/i.test(
      content,
    );
    content = this.replaceCtaCards(content);

    // Insertar CTA intermedio en el contenido (después del 50% y antes de un título)
    if (!hadCtaCard) {
      content = this.injectMidPostCta(content);
    }

    // Usar bypassSecurityTrustHtml para preservar TODOS los atributos (style, class, etc.)
    // Esto permite que los estilos inline y clases de TinyMCE se apliquen correctamente
    this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(content);
  }

  private injectMidPostCta(content: string): string {
    const doc = this.browser.document;
    if (!doc || !content) return content;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = content;

      if (tempDiv.querySelector('.mid-post-cta')) {
        return content;
      }

      const headings = Array.from(
        tempDiv.querySelectorAll('h2, h3, h4, h5, h6'),
      );
      if (headings.length === 0) {
        return content;
      }

      const totalTextLength = this.getTextLength(tempDiv);
      if (totalTextLength === 0) {
        return content;
      }

      let targetHeading: Element | null = null;
      for (const heading of headings) {
        const beforeLength = this.getTextLengthBefore(tempDiv, heading);
        if (beforeLength / totalTextLength >= 0.5) {
          targetHeading = heading;
          break;
        }
      }

      if (!targetHeading) {
        targetHeading = headings[headings.length - 1];
      }

      const ctaWrapper = doc.createElement('div');
      ctaWrapper.className = 'mid-post-cta';
      ctaWrapper.innerHTML = this.getMidPostCtaMarkup();

      targetHeading.parentNode?.insertBefore(ctaWrapper, targetHeading);
      return tempDiv.innerHTML;
    } catch (error) {
      console.warn('Error insertando CTA intermedio:', error);
      return content;
    }
  }

  private replaceCtaCards(content: string): string {
    const doc = this.browser.document;
    if (!doc || !content) return content;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = content;

      const ctaCards = tempDiv.querySelectorAll('.cta-card');
      if (ctaCards.length === 0) {
        return content;
      }

      ctaCards.forEach((card) => {
        const wrapper = doc.createElement('div');
        wrapper.className = 'mid-post-cta';
        wrapper.innerHTML = this.getMidPostCtaMarkup();
        card.replaceWith(wrapper);
      });

      return tempDiv.innerHTML;
    } catch (error) {
      console.warn('Error reemplazando cta-card:', error);
      return content;
    }
  }

  private getMidPostCtaMarkup(): string {
    const avatarsMarkup = this.testimonialAvatarUrls
      .map(
        (url, index) =>
          `<img class="mid-post-cta-avatar" src="${url}" alt="Testimonial ${index + 1}">`,
      )
      .join('');

    return `
      <div class="mid-post-cta-inner">
        <h3 class="mid-post-cta-title">Abre tu LLC en cualquier</h3>
        <h3 class="mid-post-cta-subtitle">estado de USA</h3>
        <p class="mid-post-cta-text text-center">
          Tu LLC operativa en menos de 25 días, desde $499 USD, en menos de 10 días.<br/>Agenda una consulta gratuita para resolver todas tus dudas.
        </p>
        <div class="mid-post-cta-actions">
          <a data-cal-link="startcompanies-businessenusa/agenda-organica" data-cal-namespace="agenda-organica"
            data-cal-config='{"layout":"month_view","theme":"light"}' class="mid-post-cta-btn is-primary">
            Agendar una asesoría gratis
          </a>
          <a href="https://api.whatsapp.com/send/?text=%C2%BFC%C3%B3mo+abrir+una+LLC+siendo+NO+residente+en+EE.+UU.%3F+-+Start+Companies+http%3A%2F%2Flocalhost%3A4200%2Fblog%2Fcomo-abrir-una-llc-siendo-no-residente-en-ee-uu&type=custom_url&app_absent=0" target="_blank" class="mid-post-cta-btn is-secondary">Consulta por WhatsApp</a>
        </div>
        <div class="mid-post-cta-proof">
          <div class="mid-post-cta-avatars">
            ${avatarsMarkup}
          </div>
          <div class="mid-post-cta-rating">
            <span class="mid-post-cta-count">+300 LLC abiertas</span>
            <div class="mid-post-cta-stars">
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <span class="mid-post-cta-score">4.8/5</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private getTextLength(root: HTMLElement): number {
    const doc = this.browser.document;
    if (!doc) return 0;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let length = 0;
    let node: Node | null;
    while ((node = walker.nextNode())) {
      length += (node.textContent || '').trim().length;
    }
    return length;
  }

  private getTextLengthBefore(root: HTMLElement, target: Element): number {
    const doc = this.browser.document;
    if (!doc) return 0;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let length = 0;
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (target.contains(node)) {
        break;
      }
      length += (node.textContent || '').trim().length;
    }
    return length;
  }

  /**
   * Procesa los enlaces internos marcados con data-internal-link y los convierte a enlaces de Angular
   */
  private processInternalLinks(): void {
    if (!this.browser.isBrowser || !this.contentContainer?.nativeElement) {
      return;
    }

    const container = this.contentContainer.nativeElement;
    const internalLinks = container.querySelectorAll(
      'a[data-internal-link]',
    ) as NodeListOf<HTMLAnchorElement>;

    internalLinks.forEach((link) => {
      const route = link.getAttribute('data-internal-link');
      if (!route) return;

      // Verificar si ya se procesó este enlace
      if (link.hasAttribute('data-processed-internal-link')) {
        return;
      }

      // Marcar como procesado
      link.setAttribute('data-processed-internal-link', 'true');

      // Remover el atributo data-internal-link para limpiar
      link.removeAttribute('data-internal-link');

      // Agregar event listener para navegación con Angular Router
      link.addEventListener('click', (event: MouseEvent) => {
        // Permitir middle/ctrl/meta/shift/alt clicks y enlaces con target distinto
        if (
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return; // dejar comportamiento por defecto
        }

        const target = link.getAttribute('target');
        if (target && target !== '_self') {
          return; // permitir abrir en nueva pestaña si piden
        }

        // Prevenir el comportamiento por defecto y navegar con Angular Router
        event.preventDefault();

        // Navegar usando el Router de Angular
        // La ruta puede ser un string simple o un array
        // Agregar 'blog' antes de la ruta
        const routeArray = route
          .split('/')
          .filter((segment) => segment.length > 0);
        this.router.navigate(['blog', ...routeArray]).catch((error) => {
          console.warn('Error navegando a ruta:', route, error);
        });
      });

      // Actualizar el href para que funcione con "abrir en nueva pestaña" y sea SEO-friendly
      // Construir la URL completa usando baseUrl con 'blog' en medio
      const fullUrl = `${this.baseUrl}/blog/${route}`;
      link.setAttribute('href', fullUrl);
    });
  }

  /**
   * Detecta si hay divs con id "my-cal-inline" y carga todos los Calendly inline
   */
  private loadCalendlyIfNeeded(): void {
    if (!this.browser.isBrowser) {
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
    const allDivs = Array.from(
      container.querySelectorAll('div'),
    ) as HTMLElement[];
    let calendlyDivs = allDivs.filter((div) => {
      const id = div.getAttribute('id') || '';
      return id.includes('my-cal-inline');
    });

    // Si no encontramos ninguno, buscar por id exacto (puede haber solo uno)
    if (calendlyDivs.length === 0) {
      const singleDiv = container.querySelector(
        '#my-cal-inline',
      ) as HTMLElement;
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
  private async initializeCalendly(
    elementId: string,
    index: number,
  ): Promise<void> {
    const win = this.browser.window;
    if (!win) return;

    let userIp: string | null = null;
    const urlParams = new URLSearchParams(win.location.search);
    const fbclid = urlParams.get('fbclid');
    const userAgent = win.navigator.userAgent;

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
    const docForCal = this.browser.document;
    if (!docForCal) return;

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
    })(win, 'https://app.cal.com/embed/embed.js', 'init');

    // Crear un namespace único para cada instancia de Calendly
    const namespace = `30min-${index}`;

    // Esperar a que Cal esté disponible y luego inicializar
    const initCalendly = () => {
      if (win.Cal) {
        win.Cal.config = win.Cal.config || {};
        win.Cal.config.forwardQueryParams = true;

        // Inicializar el namespace único para este Calendly
        win.Cal('init', namespace, { origin: 'https://cal.com' });

        // Inicializar el widget inline en el elemento específico
        win.Cal.ns[namespace]('inline', {
          elementOrSelector: `#${elementId}`,
          calLink: calLink,
        });

        win.Cal.ns[namespace]('ui', {
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
    if (win.Cal && win.Cal.loaded) {
      initCalendly();
    } else {
      // Esperar a que el script se cargue
      setTimeout(initCalendly, 500);
    }
  }

  /**
   * Aplica estilos directamente a los enlaces para quitar azul y subrayado
   * Se ejecuta después de renderizar para asegurar que se apliquen sobre Bootstrap
   */
  /**
   * Detecta y estiliza el título "Sobre los autores" para que tenga el mismo estilo
   * que "Preguntas Frecuentes" y "¿Deseas conocer más?"
   */
  private styleAuthorTitles(): void {
    if (!this.browser.isBrowser || !this.contentContainer?.nativeElement) {
      return;
    }

    const container = this.contentContainer.nativeElement;

    // Buscar todos los títulos h2 y h3
    const headings = container.querySelectorAll(
      'h2, h3',
    ) as NodeListOf<HTMLElement>;

    headings.forEach((heading) => {
      const text = heading.textContent?.trim().toLowerCase() || '';

      // Verificar si el título contiene "sobre los autores" o variaciones
      if (
        text.includes('sobre los autores') ||
        text.includes('sobre los autor') ||
        text === 'sobre los autores' ||
        text === 'sobre los autor'
      ) {
        // Agregar la clase para aplicar los estilos
        heading.classList.add('sobre-autores-title');

        // Aplicar estilos directamente también para asegurar que se apliquen (con !important)
        heading.style.setProperty('text-align', 'center', 'important');
        heading.style.setProperty('margin-bottom', '3rem', 'important');
        heading.style.setProperty('font-size', '1.75rem', 'important');
        heading.style.setProperty('font-weight', '800', 'important');
        heading.style.setProperty('line-height', '1.3', 'important');

        // Si tiene un span dentro, aplicar color turquesa
        const span = heading.querySelector('span') as HTMLElement;
        if (span) {
          span.style.setProperty('color', '#006afe', 'important');
        }
      }
    });
  }
}
