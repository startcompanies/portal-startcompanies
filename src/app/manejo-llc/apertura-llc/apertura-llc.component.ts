import { Component } from '@angular/core';
import { ScFooterComponent } from "../../sc-footer/sc-footer.component";
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";
import { SeoBaseComponent } from "../../shared/components/seo-base/seo-base.component";
import { ResponsiveImageComponent } from "../../shared/components/responsive-image/responsive-image.component";

@Component({
  selector: 'app-apertura-llc',
  standalone: true,
  imports: [ScFooterComponent, HeaderManejoComponent, SeoBaseComponent, ResponsiveImageComponent],
  templateUrl: './apertura-llc.component.html',
  styleUrl: './apertura-llc.component.css'
})
export class AperturaLlcComponent {

  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.jpg",
    tablet: "/assets/hero-bg-tablet.jpg",
    desktop: "/assets/hero-bg.jpg",
    fallback: "/assets/hero-bg.jpg",
    alt: "Apertura LLC Background",
    priority: false
  };

  openUrl(url: string){
    window.open(url, '_blank');
  }
}
