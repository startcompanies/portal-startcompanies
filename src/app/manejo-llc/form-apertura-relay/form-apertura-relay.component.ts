import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-form-apertura-relay',
  standalone: true,
  imports: [ScFooterComponent, HeaderManejoComponent, SeoBaseComponent, ResponsiveImageComponent, TranslocoPipe],
  templateUrl: './form-apertura-relay.component.html',
  styleUrl: './form-apertura-relay.component.css',
})
export class FormAperturaRelayComponent {
  
  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.webp",
    alt: "Form Apertura Relay Background",
    priority: false
  };

  openUrl(url: string) {
    window.open(url, '_blank');
  }
}
