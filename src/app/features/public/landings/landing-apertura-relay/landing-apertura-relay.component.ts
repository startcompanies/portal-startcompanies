import {
  Component,
  OnInit,
  HostListener,
} from '@angular/core';
import { FaqComponent } from '../../../../features/public/home/sections/faq/faq.component';
import { VideoGridSectionComponent } from '../video-grid-section/video-grid-section.component';
import { VideoSectionComponent } from '../video-section/video-section.component';
import { PlansContainerComponent } from '../plans-container/plans-container.component';
import { SupportContainerComponent } from '../support-container/support-container.component';
import { TestimonialsCarouselComponent } from '../testimonials-carousel/testimonials-carousel.component';
import { CommonModule } from '@angular/common';
import { WistiaPlayerComponent } from '../wistia-player/wistia-player.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { ResponsiveImage } from '../../../../shared/services/responsive-image.service';
import { FacebookPixelService } from '../../../../shared/services/facebook-pixel.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrowserService } from '../../../../shared/services/browser.service';

@Component({
  selector: 'app-landing-apertura-relay',
  standalone: true,
  imports: [
    CommonModule,
    FaqComponent,
    VideoGridSectionComponent,
    VideoSectionComponent,
    PlansContainerComponent,
    SupportContainerComponent,
    TestimonialsCarouselComponent,
    WistiaPlayerComponent,
    ResponsiveImageComponent,
    TranslocoPipe,
  ],
  templateUrl: './landing-apertura-relay.component.html',
  styleUrl: './landing-apertura-relay.component.css',
})
export class LandingAperturaRelayComponent implements OnInit {
  scrollDepth = 0;

  // Configuración de imágenes del hero para NgOptimizedImage
  heroImages: ResponsiveImage = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg-desktop.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Hero Background',
    priority: true,
  };

  // Configuración de imágenes del logo para NgOptimizedImage
  logoImages = {
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.png',
    alt: 'Start Companies Logo',
    priority: true,
  };

  constructor(
    private facebookPixelService: FacebookPixelService,
    private browser: BrowserService
  ) {}

  ngOnInit(): void {
    // Inicializar Facebook Pixel para página Relay
    this.facebookPixelService.initializePixel('relay');

    // Trackear vista de página
    this.facebookPixelService.trackViewContent(
      'Apertura Relay Landing',
      'Banking Services'
    );

    // Trackear scroll inicial solo en el navegador
    if (this.browser.isBrowser) {
      this.checkScrollDepth();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.browser.isBrowser) {
      this.checkScrollDepth();
    }
  }

  private checkScrollDepth(): void {
    const win = this.browser.window;
    const doc = this.browser.document;
    if (!win || !doc) return;
    
    const scrollTop = win.pageYOffset || doc.documentElement.scrollTop;
    const windowHeight = win.innerHeight;
    const documentHeight = doc.documentElement.scrollHeight;
    const scrollPercentage = Math.round(
      (scrollTop / (documentHeight - windowHeight)) * 100
    );

    // Trackear scroll profundo en puntos clave
    if (scrollPercentage >= 25 && this.scrollDepth < 25) {
      this.facebookPixelService.trackDeepScroll('Apertura Relay', 25);
      this.scrollDepth = 25;
    } else if (scrollPercentage >= 50 && this.scrollDepth < 50) {
      this.facebookPixelService.trackDeepScroll('Apertura Relay', 50);
      this.scrollDepth = 50;
    } else if (scrollPercentage >= 75 && this.scrollDepth < 75) {
      this.facebookPixelService.trackDeepScroll('Apertura Relay', 75);
      this.scrollDepth = 75;
    }
  }

  // Método para click en botón CTA (sin tracking InitiateCheckout)
  onServiceButtonClick(): void {}

  // Método para trackear vista de planes
  onPlansView(): void {
    this.facebookPixelService.trackViewContent(
      'Relay Plans Section',
      'Banking Services'
    );
  }

  // Método para trackear click en Trustpilot
  onTrustpilotClick(): void {
    this.facebookPixelService.trackViewContent(
      'Trustpilot Reviews',
      'Social Proof'
    );
  }
}
