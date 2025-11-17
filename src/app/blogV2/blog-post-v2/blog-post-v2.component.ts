import { Component, Inject, inject, OnInit, PLATFORM_ID } from '@angular/core';
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

      // ✅ Reemplaza dinámicamente las imágenes del hero con la del post
      const imageUrl = post.image_url || '/assets/hero-bg.webp';
      this.heroImages = {
        mobile: imageUrl,
        tablet: imageUrl,
        desktop: imageUrl,
        fallback: imageUrl,
        alt: post.title || 'Imagen del artículo',
        priority: true,
      };

      // ✅ SEO dinámico
      this.blogSeoService.setPostSeo(post);

      // ✅ Parseo del contenido HTML (solo en el navegador)
      if (this.isBrowser && post.content) {
        this.contentBlocks = this.parseHtmlContent(post.content);
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
}
