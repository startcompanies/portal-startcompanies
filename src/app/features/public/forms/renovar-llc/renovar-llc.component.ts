import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../../../shared/components/header/sc-header.component';
import { ScFooterComponent } from '../../../../shared/components/footer/sc-footer.component';
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";
import { SeoBaseComponent } from '../../../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-renovar-llc',
  standalone: true,
  imports: [ScFooterComponent, HeaderManejoComponent, SeoBaseComponent, ResponsiveImageComponent, TranslocoPipe],
  templateUrl: './renovar-llc.component.html',
  styleUrl: './renovar-llc.component.css'
})
export class RenovarLlcComponent {
  
  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.webp",
    alt: "Renovar LLC Background",
    priority: false
  };

  openUrl(url: string){
    window.open(url, '_blank');
  }
}
