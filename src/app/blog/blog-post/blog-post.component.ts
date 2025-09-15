import { Component, inject, OnInit } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { BlogService } from '../../services/blog.service';
import { BlogComponent } from "../../sections/blog/blog.component";
import { ActivatedRoute } from '@angular/router';
import { Post } from '../../shared/models/post.model';
import { SharedModule } from '../../shared/shared/shared.module';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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

  blogService = inject(BlogService);
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

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer){}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.setArticle(slug);
  }
  
  setArticle(slug: string | null) {
    if (slug) {
      this.blogService.getPostsBySlug(slug).then((post) => {
        this.postArticle = post;
        this.sanitizedContent = post != undefined ? this.sanitizer.bypassSecurityTrustHtml(post.content) : '';
      });
    }
  }
}
