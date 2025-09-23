import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

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
    @Inject(PLATFORM_ID) private platformId: Object
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
}
