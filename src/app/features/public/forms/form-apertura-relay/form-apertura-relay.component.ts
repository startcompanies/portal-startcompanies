import { Component, OnInit } from '@angular/core';
import { ScFooterComponent } from '../../../../shared/components/footer/sc-footer.component';
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";
import { SeoBaseComponent } from '../../../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { FacebookPixelService } from '../../../../shared/services/facebook-pixel.service';
import { BrowserService } from '../../../../shared/services/browser.service';

@Component({
  selector: 'app-form-apertura-relay',
  standalone: true,
  imports: [ScFooterComponent, HeaderManejoComponent, SeoBaseComponent, ResponsiveImageComponent, TranslocoPipe],
  templateUrl: './form-apertura-relay.component.html',
  styleUrl: './form-apertura-relay.component.css',
})
export class FormAperturaRelayComponent implements OnInit {

  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.webp",
    alt: "Form Apertura Relay Background",
    priority: false
  };

  constructor(
    private facebookPixelService: FacebookPixelService,
    private browser: BrowserService
  ) {}

  ngOnInit(): void {
    // Trackear cuando el usuario llega a la página del formulario
    if (this.browser.isBrowser) {
      this.facebookPixelService.trackViewContent(
        'Formulario Apertura Relay',
        'Banking Services'
      );

      // También trackear como Lead ya que es un paso importante en el funnel
      this.facebookPixelService.trackLead(
        'Formulario Apertura Relay - Página Cargada',
        'Banking Services',
        0
      );
    }
  }

  openUrl(url: string) {
    const win = this.browser.window;
    if (win) {
      win.open(url, '_blank');
    }
  }
}
