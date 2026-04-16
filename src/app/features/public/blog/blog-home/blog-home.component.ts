import {
  Component,
  Inject,
  inject,
  OnInit,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScHeaderComponent } from '../../../../shared/components/header/sc-header.component';
import { ScFooterComponent } from '../../../../shared/components/footer/sc-footer.component';
import { BlogComponent } from '../../home/sections/blog/blog.component';
import { BlogArticlesComponent } from '../blog-articles/blog-articles.component';
import { BlogQuestionsComponent } from '../blog-questions/blog-questions.component';
import { SeoBaseComponent } from '../../../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { BlogSeoService } from '../../../../shared/services/blog-seo.service';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { isPlatformBrowser } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [
    ScHeaderComponent,
    ScFooterComponent,
    BlogComponent,
    BlogArticlesComponent,
    BlogQuestionsComponent,
    SeoBaseComponent,
    ResponsiveImageComponent,
    SharedModule,
    TranslocoPipe
  ],
  templateUrl: './blog-home.component.html',
  styleUrl: './blog-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogHomeComponent implements OnInit {
  isBrowser = false;
  blogSeoService = inject(BlogSeoService);

  /** Slug de `blog/category/:slug`; null en `/blog` (lista completa). Lo usa `BlogArticlesComponent` embebido. */
  private readonly route = inject(ActivatedRoute);
  readonly blogCategorySlug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug'))),
    /** Evita un fotograma con slug null y doble petición en `/blog/category/...`. */
    { initialValue: this.route.snapshot.paramMap.get('slug') },
  );

  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Blog Hero Background',
    priority: true,
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Configurar SEO para la página principal del blog
    this.blogSeoService.setBlogHomeSeo();
  }
}
