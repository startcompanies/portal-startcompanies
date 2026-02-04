import {
  Component,
  inject,
  OnInit,
  AfterViewInit,
  SecurityContext,
} from '@angular/core';
import { ScFooterComponent } from '../../../../shared/components/footer/sc-footer.component';
import { BlogSectionV2Component } from '../blog-section-v2/blog-section-v2.component';
import { BlogService } from '../../../../shared/services/blog.service';
import { Post } from '../../../../shared/models/post.model';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { BlogSeoService } from '../../../../shared/services/blog-seo.service';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { PostContentComponent } from '../../../../shared/components/post-content/post-content.component';
import { ScHeaderComponent } from '../../../../shared/components/header/sc-header.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LangRouterLinkDirective } from '../../../../shared/directives/lang-router-link.directive';
import { environment } from '../../../../../environments/environment';
import { BrowserService } from '../../../../shared/services/browser.service';
import { BlogAuthorCardComponent } from '../../../../shared/components/blog-author-card/blog-author-card.component';
import { BlogPostHeroComponent } from '../../../../shared/components/blog-post-hero/blog-post-hero.component';

@Component({
  selector: 'app-blog-post-v2',
  standalone: true,
  imports: [
    SharedModule,
    ScFooterComponent,
    BlogSectionV2Component,
    ResponsiveImageComponent,
    PostContentComponent,
    ScHeaderComponent,
    LangRouterLinkDirective,
    BlogAuthorCardComponent,
    BlogPostHeroComponent,
  ],
  templateUrl: './blog-post-v2.component.html',
  styleUrl: './blog-post-v2.component.css',
})
export class BlogPostV2Component implements OnInit, AfterViewInit {
  private blogService = inject(BlogService);
  baseUrl = environment.baseUrl;

  postArticle?: Post;
  contentBlocks: any[] = [];
  hasSections = false;
  firstSectionContent = '';
  firstSectionImage = '';
  remainingContent = '';
  heroCardContent = ''; // Contenido para la card hero en posts no-landing
  tocLinks: Array<{ href: string; text: string }> = [];
  tocOpen = true;
  isLoading = true; // Estado de carga
  postNotFound = false; // Estado para indicar que el post no existe

  // Getter para acceso desde el template
  get isBrowser(): boolean {
    return this.browser.isBrowser;
  }

  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Blog Hero Background',
    priority: true,
  };

  // Getter para obtener las imágenes del hero según el tipo de post
  get postHeroImages() {
    // Si es landing (hasSections), usar la imagen de fondo genérica
    if (this.hasSections) {
      return this.heroImages;
    }
    // Si no es landing, usar la imagen del post
    if (this.postArticle && this.postArticle.image_url) {
      return {
        mobile: this.postArticle.image_url,
        tablet: this.postArticle.image_url,
        desktop: this.postArticle.image_url,
        fallback: this.postArticle.image_url,
        alt: this.postArticle.title || 'Post Image',
        priority: true,
      };
    }
    // Fallback a imagen genérica si no hay imagen del post
    return this.heroImages;
  }

  constructor(
    private route: ActivatedRoute,
    private blogSeoService: BlogSeoService,
    private browser: BrowserService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    /*const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) this.loadPost(slug);*/
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.loadPost(slug);
    });
  }

  ngAfterViewInit(): void {
    // La inicialización del TOC se hace después de cargar el post en loadPost
  }

  private async loadPost(slug: string): Promise<void> {
    // Resetear estados
    this.isLoading = true;
    this.postNotFound = false;
    this.postArticle = undefined;

    try {
      const response = await this.blogService.getPostsBySlug(slug);

      // El servicio devuelve un array, tomar el primer elemento
      const post = Array.isArray(response)
        ? response.length > 0
          ? response[0]
          : null
        : response;

      // Verificar si el post existe
      if (
        !post ||
        (typeof post === 'object' && Object.keys(post).length === 0)
      ) {
        // Esperar un momento antes de marcar como no encontrado para evitar parpadeo
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.postNotFound = true;
        this.isLoading = false;
        return;
      }

      // Resetear hasSections antes de cargar el nuevo post
      this.hasSections = false;
      this.heroCardContent = '';
      this.firstSectionContent = '';
      this.firstSectionImage = '';
      this.postArticle = post;
      this.postNotFound = false;
      const win = this.browser.window;
      if (win) win.scrollTo({ top: 0, behavior: 'smooth' });

      // ✅ SEO dinámico
      this.blogSeoService.setPostSeo(post);

      // ✅ Parseo del contenido HTML (solo en el navegador)
      if (this.browser.isBrowser && post.content) {
        this.contentBlocks = this.parseHtmlContent(post.content);
        // Detectar si el contenido tiene secciones <section></section>
        // Solo considerar como landing si hay secciones al inicio del contenido
        this.hasSections = this.detectSections(post.content);
        // Si tiene secciones, extraer la primera sección
        if (this.hasSections) {
          this.extractFirstSection(post.content);
        } else {
          // Para posts no-landing, extraer contenido inicial para la card hero
          this.extractHeroCardContent(post.content);
        }
      }

      // Extraer enlaces del contenido para el TOC (solo si no es landing)
      if (this.browser.isBrowser && !this.hasSections && post.content) {
        this.tocLinks = this.extractTOCLinks(post.content);
        // Asignar IDs a los encabezados después de que se renderice el contenido
        setTimeout(() => {
          this.assignHeadingIds();
        }, 500);
      } else {
        this.tocLinks = [];
      }

      // Inicializar TOC después de que el contenido se renderice
      if (this.browser.isBrowser) {
        // Para posts tipo landing, esperar más tiempo para que el contenido se renderice completamente
        const timeout = this.hasSections ? 1200 : 800;
        setTimeout(() => {
          this.initializeTOC();
          // Para posts tipo landing, reintentar inicialización después de más tiempo
          if (this.hasSections) {
            setTimeout(() => {
              this.initializeTOC();
            }, 1000);
          }
        }, timeout);
      }
      //console.log(this.postArticle)
      this.isLoading = false;
    } catch (error) {
      console.error('❌ Error cargando post:', error);
      // Esperar un momento antes de marcar como no encontrado
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.postNotFound = true;
      this.isLoading = false;
    }
  }

  private parseHtmlContent(content: string): any[] {
    const doc = this.browser.document;
    if (!doc) return [];

    const blocks: any[] = [];
    const container = doc.createElement('div');
    container.innerHTML = content;

    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        blocks.push({ type: 'p', content: node.textContent.trim() });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        switch (el.tagName) {
          case 'P':
            blocks.push({ type: 'p', content: el.innerText.trim() });
            break;
          case 'IMG':
            blocks.push({
              type: 'img',
              src: el.getAttribute('src'),
              alt: el.getAttribute('alt') || '',
            });
            break;
          case 'A':
            blocks.push({
              type: 'a',
              href: el.getAttribute('href'),
              text: el.innerText.trim(),
            });
            break;
        }
      }
    });

    return blocks;
  }

  private detectSections(content: string): boolean {
    if (!content) return false;
    // Buscar si hay etiquetas <section> en el contenido
    // Solo considerar como landing si hay secciones al inicio del contenido (primeros 2000 caracteres)
    // para evitar falsos positivos con secciones dentro del contenido del post
    const contentStart = content.substring(0, 2000);
    const sectionRegex = /<section[^>]*>[\s\S]*?<\/section>/gi;
    return sectionRegex.test(contentStart);
  }

  private extractFirstSection(content: string): void {
    const doc = this.browser.document;
    if (!doc || !content) return;

    // Encontrar el inicio de la primera sección
    const firstSectionStart = content.indexOf('<section');
    if (firstSectionStart === -1) {
      // No hay secciones, el contenido restante es el contenido completo
      this.remainingContent = content;
      return;
    }

    // Encontrar el cierre de la etiqueta de apertura
    const openTagEnd = content.indexOf('>', firstSectionStart);
    if (openTagEnd === -1) {
      this.remainingContent = content;
      return;
    }

    // Encontrar el cierre correspondiente de la primera sección (manejando secciones anidadas)
    let depth = 1;
    let currentPos = openTagEnd + 1;
    let sectionEnd = -1;

    while (currentPos < content.length && depth > 0) {
      const nextOpen = content.indexOf('<section', currentPos);
      const nextClose = content.indexOf('</section>', currentPos);

      if (nextClose === -1) {
        // No se encontró cierre, salir
        break;
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Hay otra sección anidada
        depth++;
        currentPos = content.indexOf('>', nextOpen) + 1;
      } else {
        // Se encontró un cierre
        depth--;
        if (depth === 0) {
          sectionEnd = nextClose + '</section>'.length;
          break;
        }
        currentPos = nextClose + '</section>'.length;
      }
    }

    if (sectionEnd === -1) {
      // No se pudo encontrar el cierre, usar todo el contenido como primera sección
      this.remainingContent = '';
      return;
    }

    // Extraer la primera sección completa
    const fullFirstSection = content.substring(firstSectionStart, sectionEnd);

    // Extraer solo el contenido interno (sin las etiquetas section)
    const sectionContentMatch = fullFirstSection.match(
      /<section[^>]*>([\s\S]*)<\/section>/i
    );
    let firstSectionHtml = sectionContentMatch ? sectionContentMatch[1] : '';

    // Extraer imagen de la primera sección
    const imgRegex = /<img[^>]*src\s*=\s*["']([^"']*)["'][^>]*>/i;
    const imgMatch = firstSectionHtml.match(imgRegex);
    if (imgMatch && imgMatch[1]) {
      this.firstSectionImage = imgMatch[1];
      // Remover la imagen del contenido para no duplicarla
      firstSectionHtml = firstSectionHtml.replace(imgRegex, '').trim();
    } else {
      // Si no hay imagen en la sección, usar la imagen del post
      this.firstSectionImage = this.postArticle?.image_url || '';
    }

    // Remover títulos (h1, h2, h3) del contenido para evitar duplicación con el título del post
    firstSectionHtml = firstSectionHtml
      .replace(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/gi, '')
      .trim();

    // Remover el div completo que contiene "Fact Checked por nuestro experto legal" (data-id="4c70b4c0")
    firstSectionHtml = firstSectionHtml
      .replace(/<div[^>]*data-id="4c70b4c0"[^>]*>[\s\S]*?<\/div>/gi, '')
      .trim();

    // Remover el div completo que contiene "Sobre los autores" (data-id="65935626")
    firstSectionHtml = firstSectionHtml
      .replace(/<div[^>]*data-id="65935626"[^>]*>[\s\S]*?<\/div>/gi, '')
      .trim();

    // Remover el div completo que genera espacio innecesario en móviles (data-id="741d5f43")
    // Usar DOM parsing para manejar correctamente divs anidados
    firstSectionHtml = this.removeDivByDataId(firstSectionHtml, '741d5f43');

    // Eliminar videos del contenido (iframe, video tags, etc.) ya que afectan las dimensiones de la card
    firstSectionHtml = this.removeVideos(firstSectionHtml);

    // Procesar columnas Bootstrap dentro de mission-description:
    // 1. Eliminar columnas vacías
    // 2. Convertir col-12 col-lg-6 a col-lg-12 para que el contenido ocupe todo el ancho
    firstSectionHtml = this.processBootstrapColumns(firstSectionHtml);

    // Aplicar estilos y añadir icono al enlace "Abrir tu LLC" o "Abre tu corporation" con href="#contact" o "../#contact"
    // Buscar enlaces que tengan href="#contact" o cualquier variación (incluyendo "../#contact")
    firstSectionHtml = firstSectionHtml.replace(
      /<a([^>]*?)href\s*=\s*["']([^"']*#contact[^"']*)["']([^>]*?)>([\s\S]*?)<\/a>/gi,
      (match, beforeHref, href, afterHref, linkContent) => {
        // Verificar si el contenido del enlace contiene "Abrir tu LLC", "Abre tu LLC" o "Abre tu corporation" (case insensitive)
        const cleanContent = linkContent.replace(/<[^>]*>/g, '').trim();
        const hasAbrirLLCText = /abrir\s+tu\s+llc/i.test(cleanContent);
        const hasAbreLLCText = /abre\s+tu\s+llc/i.test(cleanContent);
        const hasAbreCorpText =
          /abre\s+tu\s+corporation|abre\s+tu\s+corp/i.test(cleanContent);

        if (hasAbrirLLCText || hasAbreLLCText || hasAbreCorpText) {
          // Verificar si ya tiene el icono
          const hasIcon =
            linkContent.includes('bi-arrow-right') ||
            linkContent.includes('<i class="bi bi-arrow-right');

          // Construir los estilos según las especificaciones del usuario
          const forcedStyles =
            'background-color: var(--color-secundario-tecnico) !important; color: var(--color-fondo-claro) !important; border: none !important; border-radius: 2.5rem !important; padding: .6rem 1.2rem !important; font-weight: 400 !important; font-size: .9rem !important; display: inline-flex !important; align-items: center !important; transition: background-color .3s ease !important; white-space: nowrap !important;';
          const forcedStylesWithText = `${forcedStyles} text-decoration: none !important; text-transform: none !important;`;

          // Obtener los atributos existentes
          const allAttrs = beforeHref + afterHref;
          const classMatch = allAttrs.match(/class\s*=\s*["']([^"']*)["']/i);
          const styleMatch = allAttrs.match(/style\s*=\s*["']([^"']*)["']/i);

          // Construir los nuevos atributos
          let newBeforeHref = beforeHref;
          let newAfterHref = afterHref;

          // Reemplazar o agregar style - FORZAR los estilos
          if (styleMatch) {
            // Reemplazar style existente con los estilos forzados
            if (beforeHref.includes('style')) {
              newBeforeHref = beforeHref.replace(
                /style\s*=\s*["'][^"']*["']/i,
                `style="${forcedStylesWithText}"`
              );
            } else if (afterHref.includes('style')) {
              newAfterHref = afterHref.replace(
                /style\s*=\s*["'][^"']*["']/i,
                `style="${forcedStylesWithText}"`
              );
            }
          } else {
            // Agregar style nuevo
            newAfterHref =
              newAfterHref +
              (newAfterHref.trim() ? ' ' : '') +
              `style="${forcedStylesWithText}"`;
          }

          // Remover clases Bootstrap existentes
          if (classMatch) {
            let existingClasses = classMatch[1];
            // Remover clases específicas de Bootstrap
            existingClasses = existingClasses
              .replace(/\bbtn\b/g, '')
              .replace(/\bbtn-light\b/g, '')
              .replace(/\brounded-pill\b/g, '')
              .replace(/\bmt-3\b/g, '')
              .replace(/\s+/g, ' ')
              .trim();

            if (existingClasses) {
              if (beforeHref.includes('class')) {
                newBeforeHref = newBeforeHref.replace(
                  /class\s*=\s*["'][^"']*["']/i,
                  `class="${existingClasses}"`
                );
              } else if (afterHref.includes('class')) {
                newAfterHref = newAfterHref.replace(
                  /class\s*=\s*["'][^"']*["']/i,
                  `class="${existingClasses}"`
                );
              } else {
                newAfterHref =
                  newAfterHref +
                  (newAfterHref.trim() ? ' ' : '') +
                  `class="${existingClasses}"`;
              }
            } else {
              // Si no quedan clases, remover el atributo class
              newBeforeHref = newBeforeHref.replace(
                /class\s*=\s*["'][^"']*["']/i,
                ''
              );
              newAfterHref = newAfterHref.replace(
                /class\s*=\s*["'][^"']*["']/i,
                ''
              );
            }
          }

          // Preparar el contenido con el icono después del texto (adelante = después del texto)
          let finalContent = linkContent.trim();
          if (!hasIcon) {
            // Limpiar espacios y agregar el icono después del texto
            // Reemplazar "Abrir tu LLC", "Abre tu LLC" o "Abre tu corporation" con el texto + icono
            if (hasAbrirLLCText) {
              finalContent = finalContent.replace(
                /(Abrir\s+tu\s+LLC)/gi,
                (match: string) => {
                  return match + ' <i class="bi bi-arrow-right ms-2"></i>';
                }
              );
            } else if (hasAbreLLCText) {
              finalContent = finalContent.replace(
                /(Abre\s+tu\s+LLC)/gi,
                (match: string) => {
                  return match + ' <i class="bi bi-arrow-right ms-2"></i>';
                }
              );
            } else if (hasAbreCorpText) {
              finalContent = finalContent.replace(
                /(Abre\s+tu\s+corporation|Abre\s+tu\s+corp)/gi,
                (match: string) => {
                  return match + ' <i class="bi bi-arrow-right ms-2"></i>';
                }
              );
            }
            // Si no se encontró el texto exacto, agregar al final
            if (finalContent === linkContent.trim()) {
              finalContent =
                linkContent.trim() + ' <i class="bi bi-arrow-right ms-2"></i>';
            }
          }

          // Construir el nuevo enlace con estilos forzados
          // Asegurar que el style attribute esté presente
          let finalBeforeHref = newBeforeHref.trim();
          let finalAfterHref = newAfterHref.trim();

          // Verificar si ya tiene style
          if (
            !finalBeforeHref.includes('style=') &&
            !finalAfterHref.includes('style=')
          ) {
            finalAfterHref =
              (finalAfterHref ? `${finalAfterHref} ` : '') +
              `style="${forcedStylesWithText}"`;
          }

          const beforeAttr = finalBeforeHref ? ` ${finalBeforeHref}` : '';
          const afterAttr = finalAfterHref ? ` ${finalAfterHref}` : '';

          // Mantener el href original (puede ser "#contact" o "../#contact")
          return `<a${beforeAttr} href="${href}"${afterAttr}>${finalContent}</a>`;
        }
        return match;
      }
    );

    // Limpiar wrappers, plantillas y bloques vacios que generan espacios extra
    firstSectionHtml = this.cleanMissionDescriptionHtml(firstSectionHtml);

    // Sanitizar el contenido de la primera sección
    this.firstSectionContent = this.sanitizeHtmlString(firstSectionHtml);

    // Remover la primera sección completa del contenido original
    this.remainingContent = (
      content.substring(0, firstSectionStart) + content.substring(sectionEnd)
    ).trim();
  }

  /**
   * Procesa las columnas Bootstrap dentro de mission-description:
   * 1. Elimina columnas vacías (que solo contienen &nbsp; o están vacías)
   * 2. Convierte cualquier col-* dentro de un row a col-lg-12 para que ocupe todo el ancho
   */
  private processBootstrapColumns(html: string): string {
    const doc = this.browser.document;
    if (!html || !doc) return html;

    try {
      // Usar DOM parsing para encontrar y procesar rows con columnas
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      // Buscar todos los divs con clase "row"
      const rows = tempDiv.querySelectorAll('div.row');

      rows.forEach((row) => {
        const columns = row.querySelectorAll('div[class*="col-"]');

        // Verificar si hay columnas vacías o que necesitan ser convertidas
        columns.forEach((col: Element) => {
          const colElement = col as HTMLElement;
          const classList = colElement.className;
          const content = colElement.textContent?.trim() || '';
          const innerHTML = colElement.innerHTML.trim();

          // Eliminar columnas vacías (solo &nbsp; o vacías, especialmente las d-none d-lg-block)
          if (
            (content === '' ||
              content === '&nbsp;' ||
              content === '\u00A0' ||
              innerHTML === '&nbsp;' ||
              innerHTML === '') &&
            (classList.includes('d-none') || classList.includes('col-lg-2'))
          ) {
            colElement.remove();
          } else {
            // Si la columna tiene contenido, convertirla a col-lg-12
            // Eliminar todas las clases col-* y agregar solo col-lg-12
            let newClasses = classList
              .split(/\s+/)
              .filter((cls) => !cls.startsWith('col-'))
              .join(' ')
              .trim();

            // Agregar col-lg-12 si no está vacía
            if (newClasses) {
              newClasses = `col-lg-12 ${newClasses}`;
            } else {
              newClasses = 'col-lg-12';
            }

            colElement.className = newClasses;
          }
        });
      });

      return tempDiv.innerHTML;
    } catch (error) {
      console.warn('Error procesando columnas Bootstrap:', error);
      // Fallback: eliminar div específico conocido
      html = this.removeDivByDataId(html, 'c76af68');
      return html;
    }
  }

  private cleanMissionDescriptionHtml(html: string): string {
    const doc = this.browser.document;
    if (!html || !doc) return html;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      // Remover templates/share buttons embebidos que duplican funcionalidad
      tempDiv
        .querySelectorAll(
          '[data-widget_type="template.default"], [data-widget_type="share-buttons.default"], .elementor-share-buttons'
        )
        .forEach((el) => el.remove());

      this.removeEmptyNodes(tempDiv);

      return tempDiv.innerHTML.trim();
    } catch (error) {
      console.warn('Error limpiando HTML de mission-description:', error);
      return html;
    }
  }

  private removeEmptyNodes(root: HTMLElement): void {
    const candidates = Array.from(
      root.querySelectorAll(
        'section, div, article, header, footer, p, span, h1, h2, h3, h4, h5, h6, ul, ol, li'
      )
    );

    for (let i = candidates.length - 1; i >= 0; i--) {
      const element = candidates[i] as HTMLElement;
      if (!this.hasMeaningfulContent(element)) {
        element.remove();
      }
    }
  }

  private hasMeaningfulContent(element: Element): boolean {
    const text = (element.textContent || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, '')
      .trim();
    if (text.length > 0) return true;

    return Boolean(
      element.querySelector(
        'img, svg, picture, video, iframe, ul, ol, li, table, blockquote, pre, code, hr, button, input, select, textarea, a[href]'
      )
    );
  }

  /**
   * Elimina videos (iframe, video tags, etc.) y las columnas que los contienen
   */
  private removeVideos(html: string): string {
    const doc = this.browser.document;
    if (!html || !doc) return html;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      // Buscar todos los divs y verificar si contienen videos
      const allDivs = Array.from(tempDiv.querySelectorAll('div'));

      // Procesar de atrás hacia adelante para evitar problemas al eliminar
      for (let i = allDivs.length - 1; i >= 0; i--) {
        const divElement = allDivs[i] as HTMLElement;

        // Verificar si el div contiene video, iframe, o elementos relacionados
        const hasVideo = divElement.querySelector(
          'video, iframe, [class*="video"], [class*="embed"], [class*="youtube"], [class*="vimeo"]'
        );
        const hasRatio =
          divElement.classList.contains('ratio') ||
          divElement.classList.contains('ratio-16x9') ||
          divElement.classList.contains('ratio-21x9') ||
          divElement.classList.contains('ratio-4x3') ||
          divElement.querySelector('[class*="ratio-"]');

        if (hasVideo || hasRatio) {
          // Obtener el contenido sin el video para verificar si hay algo más
          const clone = divElement.cloneNode(true) as HTMLElement;
          clone
            .querySelectorAll(
              'video, iframe, [class*="video"], [class*="embed"], [class*="youtube"], [class*="vimeo"], [class*="ratio"]'
            )
            .forEach((el) => el.remove());

          const textContent = clone.textContent?.trim() || '';
          const innerHTML = clone.innerHTML.trim();

          // Si el div solo contiene el video/ratio (sin contenido relevante), eliminar el div completo
          // También eliminar si es una col que contiene solo video/ratio
          if (
            textContent.length < 20 &&
            (innerHTML.length < 100 ||
              innerHTML.replace(/<[^>]+>/g, '').trim().length < 10)
          ) {
            divElement.remove();
          }
        }
      }

      // Eliminar elementos video, iframe y ratio que puedan quedar sueltos
      tempDiv
        .querySelectorAll(
          'video, iframe, [class*="ratio-16x9"], [class*="ratio-21x9"], [class*="ratio-4x3"], .ratio'
        )
        .forEach((el) => {
          const element = el as HTMLElement;
          // Si está dentro de un div que solo contiene este elemento, eliminar el div padre
          const parent = element.parentElement;
          if (parent && parent.tagName === 'DIV') {
            const parentText = parent.textContent?.trim() || '';
            const parentClone = parent.cloneNode(true) as HTMLElement;
            parentClone
              .querySelectorAll('video, iframe, [class*="ratio"]')
              .forEach((v) => v.remove());
            const parentContent = parentClone.innerHTML
              .trim()
              .replace(/<[^>]+>/g, '')
              .trim();

            if (parentText.length < 20 && parentContent.length < 10) {
              parent.remove();
            } else {
              element.remove();
            }
          } else {
            element.remove();
          }
        });

      html = tempDiv.innerHTML;

      // Limpiar con regex también (fallback para casos edge)
      // Eliminar divs que contengan solo ratio/video
      html = html.replace(
        /<div[^>]*class\s*=\s*["'][^"']*\bcol-[^"']*["'][^>]*>[\s\S]*?<div[^>]*class\s*=\s*["'][^"']*\bratio[^"']*["'][^>]*>[\s\S]*?<\/div>[\s\S]*?<\/div>/gi,
        ''
      );
      html = html.replace(
        /<div[^>]*>[\s\S]*?<(video|iframe)[^>]*>[\s\S]*?<\/(video|iframe)>[\s\S]*?<\/div>/gi,
        ''
      );
      html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
      html = html.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '');
      html = html.replace(/<source[^>]*>/gi, '');

      return html.trim();
    } catch (error) {
      console.warn('Error eliminando videos:', error);
      // Fallback: usar solo regex
      html = html.replace(
        /<div[^>]*class\s*=\s*["'][^"']*\bcol-[^"']*["'][^>]*>[\s\S]*?<div[^>]*class\s*=\s*["'][^"']*\bratio[^"']*["'][^>]*>[\s\S]*?<\/div>[\s\S]*?<\/div>/gi,
        ''
      );
      html = html.replace(
        /<div[^>]*>[\s\S]*?<(video|iframe)[^>]*>[\s\S]*?<\/(video|iframe)>[\s\S]*?<\/div>/gi,
        ''
      );
      html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
      html = html.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '');
      html = html.replace(/<source[^>]*>/gi, '');
      return html.trim();
    }
  }

  /**
   * Elimina un div completo por su data-id, manejando correctamente divs anidados
   */
  private removeDivByDataId(html: string, dataId: string): string {
    const doc = this.browser.document;
    if (!html || !doc) return html;

    try {
      // Crear un contenedor temporal para parsear el HTML parcial
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      const divToRemove = tempDiv.querySelector(`div[data-id="${dataId}"]`);

      if (divToRemove) {
        divToRemove.remove();
        return tempDiv.innerHTML.trim();
      }
    } catch (error) {
      console.warn('Error al eliminar div por data-id:', error);
      // Fallback a regex si falla el parsing DOM
      return html
        .replace(
          new RegExp(
            `<div[^>]*data-id="${dataId}"[^>]*>[\\s\\S]*?</div>`,
            'gi'
          ),
          ''
        )
        .trim();
    }

    return html;
  }

  private sanitizeHtmlString(html: string): string {
    if (!html) return '';
    // Para mantener los estilos inline, no sanitizar completamente
    // Solo limpiar lo peligroso pero mantener style attributes
    return html;
  }

  getSanitizedFirstSection(): SafeHtml {
    // Usar bypassSecurityTrustHtml para preservar los estilos inline aplicados
    return this.sanitizer.bypassSecurityTrustHtml(this.firstSectionContent);
  }

  getSanitizedHeroCardContent(): SafeHtml {
    // Usar bypassSecurityTrustHtml para preservar los estilos inline aplicados
    return this.sanitizer.bypassSecurityTrustHtml(this.heroCardContent);
  }

  /**
   * Extrae el primer párrafo del post para mostrar en la card hero (posts no-landing)
   */
  private extractHeroCardContent(content: string): void {
    const doc = this.browser.document;
    if (!doc || !content) return;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = content;

      // Extraer solo el primer párrafo <p></p>
      const firstParagraph = tempDiv.querySelector('p');
      let extractedContent = '';

      if (firstParagraph) {
        extractedContent = firstParagraph.outerHTML;
      }

      // Limpiar el contenido extraído
      extractedContent = this.cleanHeroCardContent(extractedContent);

      this.heroCardContent = this.sanitizeHtmlString(extractedContent);
      this.firstSectionImage = this.postArticle?.image_url || '';
    } catch (error) {
      console.warn('Error extrayendo contenido para card hero:', error);
      this.heroCardContent = '';
      this.firstSectionImage = this.postArticle?.image_url || '';
    }
  }

  /**
   * Limpia el contenido extraído para la card hero
   */
  private cleanHeroCardContent(html: string): string {
    const doc = this.browser.document;
    if (!html || !doc) return html;

    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      // Remover videos
      tempDiv
        .querySelectorAll('video, iframe, [class*="video"], [class*="embed"]')
        .forEach((el) => el.remove());

      // Remover imágenes grandes o que puedan afectar el diseño
      tempDiv.querySelectorAll('img').forEach((img) => {
        const imgElement = img as HTMLImageElement;
        // Mantener solo imágenes pequeñas o con clases específicas
        if (imgElement.width && imgElement.width > 300) {
          imgElement.remove();
        }
      });

      // Remover enlaces que puedan causar problemas
      tempDiv.querySelectorAll('a[href^="#"]').forEach((link) => {
        // Mantener los enlaces pero simplificarlos si es necesario
        const linkElement = link as HTMLAnchorElement;
        if (linkElement.href.includes('#contact')) {
          // Mantener estos enlaces
        }
      });

      return tempDiv.innerHTML.trim();
    } catch (error) {
      console.warn('Error limpiando contenido de card hero:', error);
      return html;
    }
  }

  getCurrentUrl(): string {
    const win = this.browser.window;
    if (win) {
      return win.location.href;
    }
    return '';
  }

  getShareText(): string {
    if (this.postArticle) {
      return `${this.postArticle.title} - Start Companies`;
    }
    return 'Start Companies';
  }

  formatPublishedDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  }

  getAuthorDisplayName(): string {
    const user = this.postArticle?.user;
    if (!user) return 'Start Companies';
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return fullName || user.username || 'Start Companies';
  }

  shareOnWhatsApp(): void {
    const win = this.browser.window;
    if (!win) return;
    const url = encodeURIComponent(this.getCurrentUrl());
    const text = encodeURIComponent(this.getShareText());
    const whatsappUrl = `https://wa.me/?text=${text}%20${url}`;
    win.open(whatsappUrl, '_blank');
  }

  shareOnLinkedIn(): void {
    const win = this.browser.window;
    if (!win) return;
    const url = encodeURIComponent(this.getCurrentUrl());
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    win.open(linkedinUrl, '_blank');
  }

  shareOnFacebook(): void {
    const win = this.browser.window;
    if (!win) return;
    const url = encodeURIComponent(this.getCurrentUrl());
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    win.open(facebookUrl, '_blank');
  }

  shareNative(): void {
    const win = this.browser.window;
    if (!win) return;

    if (win.navigator.share) {
      win.navigator
        .share({
          title: this.postArticle?.title || 'Start Companies',
          text: this.getShareText(),
          url: this.getCurrentUrl(),
        })
        .catch((error) => {
          console.log('Error al compartir:', error);
        });
    } else {
      // Fallback: copiar al portapapeles
      this.copyToClipboard();
    }
  }

  private copyToClipboard(): void {
    const win = this.browser.window;
    if (!win) return;

    const url = this.getCurrentUrl();
    win.navigator.clipboard
      .writeText(url)
      .then(() => {
        // Opcional: mostrar un mensaje de confirmación
        alert('Enlace copiado al portapapeles');
      })
      .catch((error) => {
        console.log('Error al copiar:', error);
      });
  }

  private initializeTOC(): void {
    const doc = this.browser.document;
    if (!doc) return;

    // Buscar el card-header que contiene "Indice del artículo" o "Índice del artículo"
    const cardHeaders = doc.querySelectorAll('.card-header');
    cardHeaders.forEach((header) => {
      const h5 = header.querySelector('h5');
      if (h5) {
        const headerText = h5.textContent?.trim() || '';
        // Buscar variaciones del texto
        if (
          headerText.includes('Indice') ||
          headerText.includes('Índice') ||
          headerText.includes('indice')
        ) {
          const headerElement = header as HTMLElement;

          // Añadir el icono de toggle si no existe
          if (!header.querySelector('#toc-toggle-icon')) {
            const icon = doc.createElement('i');
            icon.id = 'toc-toggle-icon';
            icon.className = 'bi bi-chevron-down';
            icon.style.transition = 'transform 0.3s ease';
            headerElement.style.cursor = 'pointer';
            header.appendChild(icon);
          }

          // Añadir el evento click solo si no tiene ya un listener
          if (!headerElement.dataset['tocInitialized']) {
            headerElement.dataset['tocInitialized'] = 'true';
            headerElement.addEventListener('click', () => {
              this.toggleTOC();
            });
          }

          // Inicializar navegación por scroll para los enlaces del índice (posts tipo landing)
          const card = header.closest('.card');
          if (card) {
            const tocBody = card.querySelector('#toc-body');
            if (tocBody && !tocBody.hasAttribute('data-scroll-initialized')) {
              tocBody.setAttribute('data-scroll-initialized', 'true');
              this.initializeTOCLinksNavigation(card);
            }
          }
        }
      }
    });
  }


  /**
   * Inicializa la navegación por scroll para los enlaces del índice en posts tipo landing
   */
  private initializeTOCLinksNavigation(tocCard: Element): void {
    if (!this.browser.isBrowser) return;

    const tocBody = tocCard.querySelector('#toc-body');
    if (!tocBody) return;

    // Buscar todos los enlaces dentro del índice
    const tocLinks = tocBody.querySelectorAll('a[href]');

    tocLinks.forEach((link) => {
      const linkElement = link as HTMLAnchorElement;
      const href = linkElement.getAttribute('href');

      if (href && href.startsWith('#')) {
        // Verificar si ya tiene un listener para evitar duplicados
        if (!linkElement.hasAttribute('data-toc-link-initialized')) {
          linkElement.setAttribute('data-toc-link-initialized', 'true');

          linkElement.addEventListener('click', (event) => {
            event.preventDefault();
            this.scrollToSection(href, event);
          });
        }
      }
    });
  }

  toggleTOC(): void {
    this.tocOpen = !this.tocOpen;
    const doc = this.browser.document;
    if (!doc) return;

    const tocBody = doc.getElementById('toc-body');
    const toggleIcon = doc.getElementById('toc-toggle-icon');

    if (tocBody && toggleIcon) {
      tocBody.style.display = this.tocOpen ? 'block' : 'none';
      toggleIcon.style.transform = this.tocOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  }

  /**
   * Genera un ID único basado en el texto del encabezado
   */
  private generateHeadingId(text: string): string {
    if (!text) return '';
    // Convertir a minúsculas, eliminar acentos y caracteres especiales
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .substring(0, 50); // Limitar longitud
  }

  /**
   * Extrae los encabezados y enlaces del contenido HTML del post para generar el TOC
   */
  private extractTOCLinks(
    content: string
  ): Array<{ href: string; text: string; isHeading?: boolean }> {
    const doc = this.browser.document;
    if (!content || !doc) return [];

    const links: Array<{ href: string; text: string; isHeading?: boolean }> =
      [];
    const container = doc.createElement('div');
    container.innerHTML = content;

    // Primero, buscar todos los encabezados (h1, h2, h3, h4, h5, h6)
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading) => {
      const headingElement = heading as HTMLElement;
      const text = headingElement.textContent?.trim() || '';

      if (text) {
        // Obtener o generar ID para el encabezado
        let headingId = headingElement.id;

        if (!headingId) {
          // Generar un ID basado en el texto
          headingId = this.generateHeadingId(text);
          // Asegurar que el ID sea único añadiendo un contador si es necesario
          let uniqueId = headingId;
          let counter = 1;
          while (links.some((link) => link.href === `#${uniqueId}`)) {
            uniqueId = `${headingId}-${counter}`;
            counter++;
          }
          headingId = uniqueId;
        }

        links.push({
          href: `#${headingId}`,
          text,
          isHeading: true,
        });
      }
    });

    // También buscar enlaces con anclas internas (como respaldo)
    const anchorElements = container.querySelectorAll('a[href]');
    anchorElements.forEach((anchor) => {
      const href = anchor.getAttribute('href');
      const anchorElement = anchor as HTMLElement;
      let text =
        anchor.textContent?.trim() || anchorElement.innerText?.trim() || '';

      if (href && text) {
        // Solo incluir enlaces que sean anclas internas (empiezan con #)
        if (href.startsWith('#')) {
          // Verificar que no esté ya en la lista
          if (!links.some((link) => link.href === href)) {
            links.push({ href, text, isHeading: false });
          }
        } else if (href.startsWith('/')) {
          // Enlaces internos del sitio que pueden tener anclas
          const hashIndex = href.indexOf('#');
          if (hashIndex !== -1) {
            const anchorPart = href.substring(hashIndex);
            if (!links.some((link) => link.href === anchorPart)) {
              links.push({ href: anchorPart, text, isHeading: false });
            }
          }
        } else {
          const win = this.browser.window;
          if (
            win &&
            href.includes('#') &&
            (href.includes(win.location.hostname) || !href.startsWith('http'))
          ) {
            // URLs absolutas o relativas con anclas
            const hashIndex = href.indexOf('#');
            if (hashIndex !== -1) {
              const anchorPart = href.substring(hashIndex);
              if (!links.some((link) => link.href === anchorPart)) {
                links.push({ href: anchorPart, text, isHeading: false });
              }
            }
          }
        }
      }
    });

    return links;
  }

  /**
   * Asigna IDs a los encabezados que no los tengan para permitir navegación
   */
  private assignHeadingIds(): void {
    const doc = this.browser.document;
    if (!doc) return;

    const contentContainer = doc.querySelector('.app-post-content');
    if (!contentContainer) return;

    const headings = contentContainer.querySelectorAll(
      'h1, h2, h3, h4, h5, h6'
    );

    headings.forEach((heading) => {
      const headingElement = heading as HTMLElement;

      // Solo asignar ID si no tiene uno
      if (!headingElement.id) {
        const text = headingElement.textContent?.trim() || '';
        if (text) {
          const generatedId = this.generateHeadingId(text);

          // Asegurar que el ID sea único en el documento
          let uniqueId = generatedId;
          let counter = 1;
          while (doc.getElementById(uniqueId)) {
            uniqueId = `${generatedId}-${counter}`;
            counter++;
          }

          headingElement.id = uniqueId;
        }
      }
    });
  }

  /**
   * Navega a la sección del contenido cuando se hace clic en un elemento del TOC
   */
  scrollToSection(href: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const doc = this.browser.document;
    const win = this.browser.window;
    if (!doc || !win || !href) return;

    // Normalizar el href para asegurarse de que tenga el #
    const normalizedHref = href.startsWith('#') ? href : `#${href}`;
    const anchorId = normalizedHref.substring(1);

    // Validar que el anchorId no esté vacío
    if (!anchorId || anchorId.trim() === '') {
      console.warn('El href está vacío o no es válido:', href);
      return;
    }

    // Función auxiliar para hacer scroll
    const performScroll = () => {
      let targetElement: HTMLElement | null = null;

      // Para posts tipo landing, buscar en todo el documento
      // Para posts no landing, buscar solo en el contenedor de contenido
      const defaultContainer = this.hasSections
        ? doc.body // Para landing, buscar en todo el body
        : doc.querySelector('.app-post-content'); // Para no landing, solo en el contenido

      if (!defaultContainer && !this.hasSections) {
        console.warn('No se encontró el contenedor de contenido');
        return;
      }

      // Primero, asegurar que los encabezados tengan IDs asignados (solo para posts no landing)
      if (!this.hasSections) {
        const contentContainer = doc.querySelector('.app-post-content');
        if (contentContainer) {
          this.assignHeadingIds();
        }
      }

      // Estrategia 1: Buscar elemento por ID directamente
      try {
        targetElement = doc.getElementById(anchorId);
      } catch (e) {
        // Ignorar errores de ID inválido
      }

      // Estrategia 2: Buscar dentro del contenedor por ID
      if (!targetElement) {
        try {
          const escapedId = CSS.escape(anchorId);
          // Para posts tipo landing, buscar en todo el contenido renderizado
          const searchContainer = this.hasSections
            ? doc.body
            : defaultContainer;
          if (searchContainer) {
            targetElement = searchContainer.querySelector(
              `#${escapedId}`
            ) as HTMLElement;
          }
        } catch (e) {
          // Ignorar errores
        }
      }

      // Estrategia 3: Buscar todos los elementos con ese ID (puede haber múltiples)
      if (!targetElement) {
        try {
          const escapedId = CSS.escape(anchorId);
          const searchContainer = this.hasSections
            ? doc.body
            : defaultContainer;
          if (searchContainer) {
            const allElements = searchContainer.querySelectorAll(
              `#${escapedId}`
            );
            if (allElements.length > 0) {
              targetElement = allElements[0] as HTMLElement;
            }
          }
        } catch (e) {
          // Ignorar errores
        }
      }

      // Estrategia 3.5: Buscar encabezados por texto si no se encuentra por ID (solo para posts no landing)
      if (!targetElement && !this.hasSections) {
        const contentContainer = doc.querySelector('.app-post-content');
        if (contentContainer) {
          // Primero asegurar que los encabezados tengan IDs
          this.assignHeadingIds();

          // Buscar el enlace correspondiente en tocLinks para obtener el texto
          const tocLink = this.tocLinks.find(
            (link) => link.href === normalizedHref || link.href === href
          );
          if (tocLink) {
            const headings = contentContainer.querySelectorAll(
              'h1, h2, h3, h4, h5, h6'
            );
            for (let i = 0; i < headings.length; i++) {
              const heading = headings[i] as HTMLElement;
              const headingText = heading.textContent?.trim() || '';
              // Comparar texto exacto o normalizado
              if (
                headingText === tocLink.text ||
                headingText.toLowerCase().trim() ===
                  tocLink.text.toLowerCase().trim()
              ) {
                targetElement = heading;
                break;
              }
            }
          }
        }
      }

      // Estrategia 4: Buscar el enlace que apunta a este href
      if (!targetElement) {
        const searchContainer = this.hasSections ? doc.body : defaultContainer;
        if (searchContainer) {
          const allLinks = searchContainer.querySelectorAll('a[href]');

          for (let i = 0; i < allLinks.length; i++) {
            const link = allLinks[i] as HTMLElement;
            const linkHref = link.getAttribute('href');

            // Comparar hrefs de manera flexible
            if (linkHref) {
              const linkHrefNormalized = linkHref.trim();
              const compareHref =
                linkHrefNormalized === normalizedHref ||
                linkHrefNormalized === href ||
                linkHrefNormalized.endsWith(normalizedHref) ||
                (linkHrefNormalized.includes('#') &&
                  linkHrefNormalized.split('#')[1] === anchorId);

              if (compareHref) {
                // Encontramos el enlace, ahora buscar su destino

                // Primero buscar si hay un elemento con el ID objetivo en el documento completo
                const possibleTarget = doc.getElementById(anchorId);
                if (possibleTarget) {
                  targetElement = possibleTarget;
                  break;
                }

                // Buscar el siguiente elemento significativo después del enlace
                let searchElement: Element | null = link.nextElementSibling;
                let searchDepth = 0;

                // Buscar en los siguientes 10 elementos hermanos
                while (searchElement && searchDepth < 10) {
                  const element = searchElement as HTMLElement;

                  // Si tiene el ID que buscamos, usar ese
                  if (element.id === anchorId) {
                    targetElement = element;
                    break;
                  }

                  // Si es un elemento de bloque significativo, usarlo
                  if (
                    element.tagName &&
                    [
                      'H1',
                      'H2',
                      'H3',
                      'H4',
                      'H5',
                      'H6',
                      'SECTION',
                      'DIV',
                      'ARTICLE',
                      'P',
                    ].includes(element.tagName)
                  ) {
                    targetElement = element;
                    break;
                  }

                  searchElement = searchElement.nextElementSibling;
                  searchDepth++;
                }

                // Si no encontramos un siguiente elemento, buscar en el padre
                if (!targetElement) {
                  let parent = link.parentElement;
                  while (parent && parent !== searchContainer) {
                    if (parent.id === anchorId) {
                      targetElement = parent;
                      break;
                    }
                    if (
                      parent.tagName &&
                      [
                        'H1',
                        'H2',
                        'H3',
                        'H4',
                        'H5',
                        'H6',
                        'SECTION',
                        'DIV',
                        'ARTICLE',
                      ].includes(parent.tagName)
                    ) {
                      targetElement = parent;
                      break;
                    }
                    parent = parent.parentElement;
                  }
                }

                // Si aún no encontramos nada, usar el enlace mismo
                if (!targetElement) {
                  targetElement = link;
                }

                break;
              }
            }
          }
        }
      }

      // Estrategia 5: Buscar por atributo name
      if (!targetElement) {
        try {
          const escapedId = CSS.escape(anchorId);
          const searchContainer = this.hasSections
            ? doc.body
            : defaultContainer;
          if (searchContainer) {
            targetElement = searchContainer.querySelector(
              `a[name="${escapedId}"], [name="${escapedId}"]`
            ) as HTMLElement;
          }
        } catch (e) {
          // Ignorar errores
        }
      }

      // Hacer scroll al elemento si se encontró
      if (targetElement) {
        const headerOffset = 120;

        // Calcular posición
        const elementTop =
          targetElement.getBoundingClientRect().top + win.pageYOffset;
        const offsetPosition = elementTop - headerOffset;

        // Usar scrollIntoView primero
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });

        // Ajustar manualmente después del scroll
        setTimeout(() => {
          win.scrollTo({
            top: offsetPosition,
            behavior: 'auto',
          });
        }, 350);
      } else {
        // Estrategia final: Usar navegación nativa del navegador
        try {
          // Establecer el hash
          win.location.hash = normalizedHref;

          // Después de un momento, intentar scroll suave si se encontró el elemento
          setTimeout(() => {
            const element = doc.getElementById(anchorId);
            if (element) {
              const headerOffset = 120;
              const elementTop =
                element.getBoundingClientRect().top + win.pageYOffset;

              element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });

              setTimeout(() => {
                win.scrollTo({
                  top: elementTop - headerOffset,
                  behavior: 'auto',
                });
              }, 350);
            }
          }, 150);
        } catch (e) {
          console.warn('No se pudo navegar al elemento:', anchorId, e);
        }
      }
    };

    // Esperar a que el contenido esté completamente renderizado
    // Usar múltiples intentos si es necesario
    requestAnimationFrame(() => {
      setTimeout(performScroll, 150);
      // Intentar de nuevo después de más tiempo por si el contenido aún se está cargando
      setTimeout(performScroll, 500);
    });
  }
}
