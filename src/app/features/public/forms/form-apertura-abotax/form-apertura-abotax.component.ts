import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoBaseComponent } from '../../../../shared/components/seo-base/seo-base.component';
import { HeaderManejoComponent } from '../header-manejo/header-manejo.component';
import { ScFooterComponent } from '../../../../shared/components/footer/sc-footer.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrowserService } from '../../../../shared/services/browser.service';

@Component({
  selector: 'app-form-apertura-abotax',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SeoBaseComponent,
    HeaderManejoComponent,
    ScFooterComponent,
    ResponsiveImageComponent,
    TranslocoPipe
  ],
  templateUrl: './form-apertura-abotax.component.html',
  styleUrl: './form-apertura-abotax.component.css'
})
export class FormAperturaAbotaxComponent {
  heroImages = {
    mobile: 'assets/hero-bg-mobile.webp',
    tablet: 'assets/hero-bg-tablet.webp',
    desktop: 'assets/hero-bg-desktop.webp',
    fallback: 'assets/hero-bg-desktop.webp',
    alt: 'Imagen de fondo hero',
    priority: false
  };

  constructor(private browser: BrowserService) {}

  openUrl(url: string): void {
    const win = this.browser.window;
    if (win) {
      win.open(url, '_blank');
    }
  }
}
