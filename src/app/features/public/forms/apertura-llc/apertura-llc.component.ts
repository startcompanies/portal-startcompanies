import { Component } from '@angular/core';
import { HeaderManejoComponent } from '../header-manejo/header-manejo.component';
import { ScFooterComponent } from "../../../../shared/components/footer/sc-footer.component";
import { ResponsiveImageComponent } from "../../../../shared/components/responsive-image/responsive-image.component";
import { TranslocoPipe } from '@jsverse/transloco';
import { BrowserService } from '../../../../shared/services/browser.service';

@Component({
  selector: 'app-apertura-llc',
  standalone: true,
  imports: [HeaderManejoComponent, ScFooterComponent, ResponsiveImageComponent, TranslocoPipe],
  templateUrl: './apertura-llc.component.html',
  styleUrl: './apertura-llc.component.css'
})
export class AperturaLlcComponent {

  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.webp",
    alt: "Apertura LLC Background",
    priority: false
  };

  constructor(private browser: BrowserService) {}

  openUrl(url: string){
    const win = this.browser.window;
    if (win) {
      win.open(url, '_blank');
    }
  }
}
