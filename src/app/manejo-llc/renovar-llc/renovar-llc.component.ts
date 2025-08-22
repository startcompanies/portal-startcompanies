import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-renovar-llc',
  standalone: true,
  imports: [ScFooterComponent, HeaderManejoComponent, SeoBaseComponent, ResponsiveImageComponent],
  templateUrl: './renovar-llc.component.html',
  styleUrl: './renovar-llc.component.css'
})
export class RenovarLlcComponent {
  
  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.jpg",
    tablet: "/assets/hero-bg-tablet.jpg",
    desktop: "/assets/hero-bg.jpg",
    fallback: "/assets/hero-bg.jpg",
    alt: "Renovar LLC Background",
    priority: false
  };

  openUrl(url: string){
    window.open(url, '_blank');
  }
}
