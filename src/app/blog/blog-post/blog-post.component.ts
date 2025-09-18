import { Component, Inject, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { BlogService } from '../../services/blog.service';
import { BlogSeoService } from '../../services/blog-seo.service';
import { BlogComponent } from '../../sections/blog/blog.component';
import { ActivatedRoute } from '@angular/router';
import { Post } from '../../shared/models/post.model';
import { SharedModule } from '../../shared/shared/shared.module';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [
    ScHeaderComponent,
    ScFooterComponent,
    SeoBaseComponent,
    ResponsiveImageComponent,
    BlogComponent,
    SharedModule,
  ],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.css',
})
export class BlogPostComponent implements OnInit {
  isBrowser = false;
  blogService = inject(BlogService);
  blogSeoService = inject(BlogSeoService);

  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Blog Hero Background',
    priority: true,
  };
  postArticle!: Post;

  postContent: string = '';
  sanitizedContent!: SafeHtml;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    console.log(this.isBrowser);
    const slug = this.route.snapshot.paramMap.get('slug');
    this.setArticle(slug);
  }

  setArticle(slug: string | null) {
    if (slug) {
      this.blogService.getPostsBySlug(slug).then((post) => {
        this.postArticle = post;

        // Limpiar y formatear el contenido HTML
        if (post && post.content) {
          const cleanedContent = this.cleanHtmlContent(post.content);
          this.sanitizedContent =
            this.sanitizer.bypassSecurityTrustHtml(cleanedContent);
        } else {
          this.sanitizedContent = '';
        }

        // Configurar SEO dinámico para el post
        if (post) {
          this.blogSeoService.setPostSeo(post);
        }
      });
    }
  }

  private cleanHtmlContent(content: string): string {
    if (!content) return '';

    // Reemplazar caracteres de escape de newlines
    let cleaned = content.replace(/\\n\\n/g, '\n\n');
    cleaned = cleaned.replace(/\\n/g, '\n');

    // Limpiar HTML mal formateado
    cleaned = cleaned.replace(/<p><\/p>/g, ''); // Eliminar párrafos vacíos
    cleaned = cleaned.replace(/\n\s*\n/g, '\n'); // Eliminar líneas vacías múltiples

    // Asegurar que los enlaces tengan target="_blank" y rel="noopener"
    cleaned = cleaned.replace(
      /<a\s+href="([^"]*)"([^>]*)>/g,
      (match, href, attributes) => {
        if (href.includes('youtu.be') || href.includes('youtube.com')) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer"${attributes}>`;
        }
        return match;
      }
    );

    // Formatear párrafos correctamente
    cleaned = cleaned.replace(/\n\n/g, '</p><p>');
    cleaned = '<p>' + cleaned + '</p>';

    // Limpiar párrafos vacíos al inicio y final
    cleaned = cleaned.replace(/^<p>\s*<\/p>/, '');
    cleaned = cleaned.replace(/<p>\s*<\/p>$/, '');

    return cleaned;
  }
}
