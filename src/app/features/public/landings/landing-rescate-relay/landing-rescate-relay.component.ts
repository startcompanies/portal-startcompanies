import {
  Component,
  OnInit,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { FaqComponent } from '../../../../features/public/home/sections/faq/faq.component';
import { VideoGridSectionComponent } from '../video-grid-section/video-grid-section.component';
import { VideoSectionComponent } from '../video-section/video-section.component';
import { TestimonialsCarouselComponent } from '../testimonials-carousel/testimonials-carousel.component';
import { CommonModule } from '@angular/common';
import { WistiaPlayerComponent } from '../wistia-player/wistia-player.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { ResponsiveImage } from '../../../../shared/services/responsive-image.service';
import { FacebookPixelService } from '../../../../shared/services/facebook-pixel.service';
import { isPlatformBrowser } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-rescate-relay',
  standalone: true,
  imports: [
    CommonModule,
    FaqComponent,
    VideoGridSectionComponent,
    VideoSectionComponent,
    TestimonialsCarouselComponent,
    WistiaPlayerComponent,
    ResponsiveImageComponent,
    TranslocoPipe,
  ],
  templateUrl: './landing-rescate-relay.component.html',
  styleUrl: './landing-rescate-relay.component.css',
})
export class LandingRescateRelayComponent implements OnInit {
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
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Inicializar Facebook Pixel para página de rescate Relay
    this.facebookPixelService.initializePixel('relay');

    // Trackear vista de página
    this.facebookPixelService.trackViewContent(
      'Relay Rescue Landing',
      'Banking Services'
    );

    // Trackear scroll inicial solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollDepth();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollDepth();
    }
  }

  private checkScrollDepth(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPercentage = Math.round(
      (scrollTop / (documentHeight - windowHeight)) * 100
    );

    // Trackear scroll profundo en puntos clave
    if (scrollPercentage >= 25 && this.scrollDepth < 25) {
      this.facebookPixelService.trackDeepScroll('Relay Rescue', 25);
      this.scrollDepth = 25;
    } else if (scrollPercentage >= 50 && this.scrollDepth < 50) {
      this.facebookPixelService.trackDeepScroll('Relay Rescue', 50);
      this.scrollDepth = 50;
    } else if (scrollPercentage >= 75 && this.scrollDepth < 75) {
      this.facebookPixelService.trackDeepScroll('Relay Rescue', 75);
      this.scrollDepth = 75;
    }
  }

  // Método para trackear click en botón "Completa el formulario ahora"
  onCompleteFormClick(): void {
    this.facebookPixelService.trackInitiateCheckout(
      'Relay Form Completion',
      'Banking Services',
      0.0
    );
    
    // Redirigir al formulario
    this.router.navigate(['/form-apertura-relay']);
  }

  // Método para trackear reproducción de video Wistia
  onWistiaVideoPlay(): void {
    this.facebookPixelService.trackVideoPlay(
      'Relay Banking Service',
      'Wistia Video',
      'Relay Rescue Landing'
    );
  }

  // Método para trackear reproducción de video YouTube
  onYouTubeVideoPlay(): void {
    this.facebookPixelService.trackVideoPlay(
      'Relay Banking Service',
      'YouTube Video',
      'Relay Rescue Landing'
    );
  }

  // Método para trackear interacción con testimonios
  onTestimonialsInteraction(): void {
    this.facebookPixelService.trackViewContent(
      'Customer Testimonials',
      'Social Proof'
    );
  }
}
