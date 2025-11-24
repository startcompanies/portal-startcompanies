import { Component, Inject, OnInit, PLATFORM_ID, SecurityContext } from '@angular/core';
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
export class BlogPostComponent implements OnInit {
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

  private async loadPost(slug: string | null) {
    if (!slug) return;

    this.postArticle = await this.blogService.getPostsBySlug(slug);
    if (!this.postArticle) return;

    this.blogSeoService.setPostSeo(this.postArticle);

    // SOLO parseamos HTML en navegador
    if (this.isBrowser) {
      this.contentBlocks = this.parseHtmlContent(this.postArticle.content);
      // Detectar si el contenido tiene secciones <section></section>
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
    const sectionRegex = /<section[^>]*>[\s\S]*?<\/section>/gi;
    return sectionRegex.test(content);
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
}
