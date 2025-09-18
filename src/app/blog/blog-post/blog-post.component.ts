import { Component, Inject, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { BlogService } from '../../services/blog.service';
import { BlogSeoService } from '../../services/blog-seo.service';
import { BlogComponent } from "../../sections/blog/blog.component";
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
    SharedModule
  ],
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.css'],
})
export class BlogPostComponent implements OnInit {
  isBrowser = false;
  blogService = inject(BlogService);
  blogSeoService = inject(BlogSeoService);

  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Blog Hero Background',
    priority: true,
  };

  postArticle!: Post;
  sanitizedContent!: SafeHtml;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.loadPost(slug);
  }

  private loadPost(slug: string | null) {
    if (!slug) return;

    this.blogService.getPostsBySlug(slug).then((post) => {
      if (!post) return;

      this.postArticle = post;

      // Sanitizar el contenido HTML de manera básica
      this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(
        this.cleanHtmlContent(post.content)
      );

      // Configurar SEO dinámico
      this.blogSeoService.setPostSeo(post);
    });
  }

  /**
   * Limpieza básica del HTML del post
   */
  private cleanHtmlContent(content: string): string {
    if (!content) return '';

    let cleaned = content;

    // Eliminar cualquier <script> para evitar errores SSR
    cleaned = cleaned.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

    // Eliminar párrafos vacíos
    cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');

    // Normalizar saltos de línea
    cleaned = cleaned.replace(/\n\s*\n/g, '\n');

    // Opcional: agregar target="_blank" a links de YouTube
    cleaned = cleaned.replace(
      /<a\s+href="([^"]*)"([^>]*)>/g,
      (match, href, attrs) => {
        if (href.includes('youtu.be') || href.includes('youtube.com')) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer"${attrs}>`;
        }
        return match;
      }
    );

    return cleaned;
  }
}
