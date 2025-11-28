import { Component, Inject, OnInit, AfterViewInit, PLATFORM_ID, SecurityContext } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { BlogComponent } from '../../sections/blog/blog.component';
import { SharedModule } from '../../shared/shared/shared.module';
import { PostContentComponent } from '../../shared/components/post-content/post-content.component';

import { BlogService } from '../../services/blog.service';
import { BlogSeoService } from '../../services/blog-seo.service';
import { Post } from '../../shared/models/post.model';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [
    ScHeaderComponent,
    ScFooterComponent,
    SeoBaseComponent,
    ResponsiveImageComponent,
    BlogComponent,
    PostContentComponent,
    SharedModule
  ],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.css',
})
export class BlogPostComponent implements OnInit, AfterViewInit {
  isBrowser = false;
  postArticle!: Post;
  contentBlocks: any[] = [];
  hasSections = false;
  firstSectionContent = '';
  firstSectionImage = '';
  remainingContent = '';

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
    if (this.postArticle?.image_url) {
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
    private blogService: BlogService,
    private blogSeoService: BlogSeoService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.loadPost(slug);
  }

  ngAfterViewInit(): void {
    // La inicialización del TOC se hace después de cargar el post
  }

  private initializeTOC(): void {
    if (!this.isBrowser) return;

    // Buscar el card-header que contiene "Indice del artículo" o "Índice del artículo"
    const cardHeaders = document.querySelectorAll('.card-header');
    cardHeaders.forEach((header) => {
      const h5 = header.querySelector('h5');
      if (h5) {
        const headerText = h5.textContent?.trim() || '';
        // Buscar variaciones del texto
        if (headerText.includes('Indice') || headerText.includes('Índice') || headerText.includes('indice')) {
          const headerElement = header as HTMLElement;
          
          // Añadir el icono de toggle si no existe
          if (!header.querySelector('#toc-toggle-icon')) {
            const icon = document.createElement('i');
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
        }
      }
    });
  }

  private async loadPost(slug: string | null) {
    if (!slug) return;

    // Resetear hasSections antes de cargar el nuevo post
    this.hasSections = false;
    this.postArticle = await this.blogService.getPostsBySlug(slug);
    
    // Inicializar TOC después de que el contenido se renderice
    if (this.isBrowser) {
      setTimeout(() => {
        this.initializeTOC();
      }, 800);
    }
    if (!this.postArticle) return;

    this.blogSeoService.setPostSeo(this.postArticle);

    // SOLO parseamos HTML en navegador
    if (this.isBrowser) {
      this.contentBlocks = this.parseHtmlContent(this.postArticle.content);
      // Detectar si el contenido tiene secciones <section></section>
      // Solo considerar como landing si hay secciones al inicio del contenido
      this.hasSections = this.detectSections(this.postArticle.content);
      // Si tiene secciones, extraer la primera sección
      if (this.hasSections) {
        this.extractFirstSection(this.postArticle.content);
      }
    }
  }

  // Función que convierte HTML en bloques simples para PostContentComponent
  private parseHtmlContent(content: string): any[] {
    const blocks: any[] = [];
    const container = document.createElement('div');
    container.innerHTML = content;

    Array.from(container.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent?.trim()) {
          blocks.push({ type: 'p', content: node.textContent.trim() });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'P') {
          blocks.push({ type: 'p', content: el.innerText.trim() });
        } else if (el.tagName === 'IMG') {
          blocks.push({ type: 'img', src: el.getAttribute('src'), alt: el.getAttribute('alt') || '' });
        } else if (el.tagName === 'A') {
          blocks.push({ type: 'a', href: el.getAttribute('href'), text: el.innerText.trim() });
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
    if (!this.isBrowser || !content) return;

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
    const sectionContentMatch = fullFirstSection.match(/<section[^>]*>([\s\S]*)<\/section>/i);
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
      this.firstSectionImage = this.postArticle.image_url || '';
    }

    // Remover títulos (h1, h2, h3) del contenido para evitar duplicación con el título del post
    firstSectionHtml = firstSectionHtml.replace(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/gi, '').trim();

    // Remover el div completo que contiene "Fact Checked por nuestro experto legal" (data-id="4c70b4c0")
    firstSectionHtml = firstSectionHtml.replace(/<div[^>]*data-id="4c70b4c0"[^>]*>[\s\S]*?<\/div>/gi, '').trim();

    // Remover el div completo que contiene "Sobre los autores" (data-id="65935626")
    firstSectionHtml = firstSectionHtml.replace(/<div[^>]*data-id="65935626"[^>]*>[\s\S]*?<\/div>/gi, '').trim();

    // Sanitizar el contenido de la primera sección
    this.firstSectionContent = this.sanitizeHtmlString(firstSectionHtml);

    // Remover la primera sección completa del contenido original
    this.remainingContent = (
      content.substring(0, firstSectionStart) + 
      content.substring(sectionEnd)
    ).trim();
  }

  private sanitizeHtmlString(html: string): string {
    if (!html) return '';
    // Usar DomSanitizer para sanitizar el HTML
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, html);
    return sanitized || '';
  }

  getSanitizedFirstSection(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.firstSectionContent);
  }

  getCurrentUrl(): string {
    if (this.isBrowser) {
      return window.location.href;
    }
    return '';
  }

  getShareText(): string {
    if (this.postArticle) {
      return `${this.postArticle.title} - Start Companies`;
    }
    return 'Start Companies';
  }

  shareOnWhatsApp(): void {
    if (!this.isBrowser) return;
    const url = encodeURIComponent(this.getCurrentUrl());
    const text = encodeURIComponent(this.getShareText());
    const whatsappUrl = `https://wa.me/?text=${text}%20${url}`;
    window.open(whatsappUrl, '_blank');
  }

  shareOnLinkedIn(): void {
    if (!this.isBrowser) return;
    const url = encodeURIComponent(this.getCurrentUrl());
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    window.open(linkedinUrl, '_blank');
  }

  shareOnFacebook(): void {
    if (!this.isBrowser) return;
    const url = encodeURIComponent(this.getCurrentUrl());
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(facebookUrl, '_blank');
  }

  shareNative(): void {
    if (!this.isBrowser) return;
    
    if (navigator.share) {
      navigator.share({
        title: this.postArticle?.title || 'Start Companies',
        text: this.getShareText(),
        url: this.getCurrentUrl(),
      }).catch((error) => {
        console.log('Error al compartir:', error);
      });
    } else {
      // Fallback: copiar al portapapeles
      this.copyToClipboard();
    }
  }

  private copyToClipboard(): void {
    if (!this.isBrowser) return;
    
    const url = this.getCurrentUrl();
    navigator.clipboard.writeText(url).then(() => {
      // Opcional: mostrar un mensaje de confirmación
      alert('Enlace copiado al portapapeles');
    }).catch((error) => {
      console.log('Error al copiar:', error);
    });
  }

  toggleTOC(): void {
    if (!this.isBrowser) return;
    
    const tocBody = document.getElementById('toc-body');
    const toggleIcon = document.getElementById('toc-toggle-icon');
    
    if (tocBody && toggleIcon) {
      if (tocBody.style.display === 'none' || tocBody.style.display === '') {
        tocBody.style.display = 'block';
        toggleIcon.style.transform = 'rotate(180deg)';
      } else {
        tocBody.style.display = 'none';
        toggleIcon.style.transform = 'rotate(0deg)';
      }
    }
  }
}
