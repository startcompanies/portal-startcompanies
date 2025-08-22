import { Component } from '@angular/core';
import { SeoBaseComponent } from '../components/seo-base/seo-base.component';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { ResponsiveImageComponent } from '../components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-error-404',
  standalone: true,
  imports: [
    SeoBaseComponent,
    ScHeaderComponent,
    ScFooterComponent,
    ResponsiveImageComponent,
  ],
  templateUrl: './error-404.component.html',
  styleUrl: './error-404.component.css',
})
export class Error404Component {
  heroImages = {
    mobile: '/assets/hero-bg-mobile.jpg',
    tablet: '/assets/hero-bg-tablet.jpg',
    desktop: '/assets/hero-bg.jpg',
    fallback: '/assets/hero-bg.jpg',
    alt: 'Blog Hero Background',
    priority: true,
  };
}
