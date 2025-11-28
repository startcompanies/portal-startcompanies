import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { FacebookPixelService } from '../../services/facebook-pixel.service';

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Trackear cuando el usuario llega a la página del formulario
    if (isPlatformBrowser(this.platformId)) {
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
    window.open(url, '_blank');
  }
}
