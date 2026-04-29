import { Component } from '@angular/core';
import { ScHeaderComponent } from '../components/header/sc-header.component';
import { ScFooterComponent } from '../components/footer/sc-footer.component';
import { ResponsiveImageComponent } from '../components/responsive-image/responsive-image.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangRouterLinkDirective } from '../directives/lang-router-link.directive';

@Component({
  selector: 'app-error-404',
  standalone: true,
  imports: [
    ScHeaderComponent,
    ScFooterComponent,
    ResponsiveImageComponent,
    TranslocoPipe,
    LangRouterLinkDirective
  ],
  templateUrl: './error-404.component.html',
  styleUrl: './error-404.component.css',
})
export class Error404Component {
  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Blog Hero Background',
    priority: true,
  };
}
