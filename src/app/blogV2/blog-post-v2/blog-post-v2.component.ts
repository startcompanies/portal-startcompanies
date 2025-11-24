import { Component, Inject, inject, OnInit, PLATFORM_ID, SecurityContext } from '@angular/core';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { BlogSectionV2Component } from '../blog-section-v2/blog-section-v2.component';
import { BlogService } from '../../services/blog.service';
import { Post } from '../../shared/models/post.model';
import { SharedModule } from '../../shared/shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { BlogSeoService } from '../../services/blog-seo.service';
import { isPlatformBrowser } from '@angular/common';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { PostContentComponent } from '../../shared/components/post-content/post-content.component';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  ],
  templateUrl: './blog-post-v2.component.html',
  styleUrl: './blog-post-v2.component.css',
})
export class BlogPostV2Component implements OnInit {
  private blogService = inject(BlogService);

  postArticle!: Post;
  isBrowser = false;
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
    private blogSeoService: BlogSeoService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    /*const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) this.loadPost(slug);*/
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.loadPost(slug);
    });
  }

  private async loadPost(slug: string): Promise<void> {
    try {
      const post = await this.blogService.getPostsBySlug(slug);
      if (!post) return;

      this.postArticle = post;
      if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });

      // ✅ SEO dinámico
      this.blogSeoService.setPostSeo(post);

      // ✅ Parseo del contenido HTML (solo en el navegador)
      if (this.isBrowser && post.content) {
        this.contentBlocks = this.parseHtmlContent(post.content);
        // Detectar si el contenido tiene secciones <section></section>
        this.hasSections = this.detectSections(post.content);
        // Si tiene secciones, extraer la primera sección
        if (this.hasSections) {
          this.extractFirstSection(post.content);
        }
      }
      //console.log(this.postArticle)
    } catch (error) {
      console.error('❌ Error cargando post:', error);
    }
  }

  private parseHtmlContent(content: string): any[] {
    const blocks: any[] = [];
    const container = document.createElement('div');
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
