import { Component, inject, OnInit } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [
    ScHeaderComponent,
    ScFooterComponent,
    SeoBaseComponent,
    ResponsiveImageComponent,
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

  constructor(){}

  ngOnInit(): void {
      
  }
}
