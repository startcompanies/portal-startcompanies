// src/app/sections/blog-post/blog-post.component.ts
import {
  Component,
  Inject,
  inject,
  OnInit,
  PLATFORM_ID,
  TransferState,
  makeStateKey
} from '@angular/core';
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
  styleUrl: './blog-post.component.css',
})
export class BlogPostComponent implements OnInit {
  isBrowser = false;

  // inyectados con la API nueva (estilo que ya usas en otros servicios)
  blogService = inject(BlogService);
  blogSeoService = inject(BlogSeoService);
  private transferState = inject(TransferState);

  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Blog Hero Background',
    priority: true,
  };

  postArticle!: Post | null;
  sanitizedContent: SafeHtml | '' = '';

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // mover isBrowser a ngOnInit para que *ngIf funcione correctamente en cliente
    this.isBrowser = isPlatformBrowser(this.platformId);

    const slug = this.route.snapshot.paramMap.get('slug');
    this.setArticle(slug);
  }

  private postStateKey(slug: string) {
    return makeStateKey<Post>('post-' + slug);
  }

  async setArticle(slug: string | null) {
    if (!slug) return;

    const key = this.postStateKey(slug);

    // Si estamos en cliente, intentar leer TransferState para evitar re-fetch
    if (this.isBrowser) {
      const saved = this.transferState.get<Post | null>(key, null as any);
      if (saved) {
        this.postArticle = saved;
        this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(
          this.cleanHtmlContent(saved.content || '')
        );
        this.transferState.remove(key); // limpiar
        this.blogSeoService.setPostSeo(saved);
        return;
      }
    }

    // Si no está en TransferState, hacer fetch (server o cliente)
    try {
      const post = await this.blogService.getPostsBySlug(slug);
      if (!post) {
        this.postArticle = null;
        this.sanitizedContent = '';
        return;
      }

      this.postArticle = post;

      // En servidor: guardar en TransferState para el cliente
      if (!this.isBrowser) {
        this.transferState.set<Post>(key, post);
      }

      const cleaned = this.cleanHtmlContent(post.content || '');
      this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(cleaned);

      this.blogSeoService.setPostSeo(post);
    } catch (err) {
      console.error('Error obteniendo post:', err);
      this.postArticle = null;
      this.sanitizedContent = '';
    }
  }

  private cleanHtmlContent(content: string): string {
    if (!content) return '';

    let cleaned = content;
    cleaned = cleaned.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '');
    cleaned = cleaned.replace(/\son\w+=(["'])(?:\\.|[^\\])*?\1/gi, '');
    cleaned = cleaned.replace(/javascript:/gi, '');

    cleaned = cleaned.replace(/\\n\\n/g, '\n\n');
    cleaned = cleaned.replace(/\\n/g, '\n');
    cleaned = cleaned.replace(/<p><\/p>/g, '');
    cleaned = cleaned.replace(/\n\s*\n/g, '\n');

    cleaned = cleaned.replace(/<a\s+href="([^"]*)"([^>]*)>/g, (match, href, attributes) => {
      if (href.includes('youtu.be') || href.includes('youtube.com')) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"${attributes}>`;
      }
      return `<a href="${href}" rel="noopener noreferrer"${attributes}>`;
    });

    cleaned = cleaned.replace(/\n\n/g, '</p><p>');
    cleaned = '<p>' + cleaned + '</p>';
    cleaned = cleaned.replace(/^<p>\s*<\/p>/, '');
    cleaned = cleaned.replace(/<p>\s*<\/p>$/, '');

    return cleaned;
  }
}
