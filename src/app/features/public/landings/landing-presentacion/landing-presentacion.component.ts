import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild,
  OnInit,
  HostListener,
} from '@angular/core';

import { CalendlySectionComponent } from '../calendly-section/calendly-section.component';
import { TestimonialsComponent } from '../../../../features/public/home/sections/testimonials/testimonials.component';
import { FaqComponent } from '../../../../features/public/home/sections/faq/faq.component';
import { VideoSectionComponent } from '../video-section/video-section.component';
import { VideoGridSectionComponent } from '../video-grid-section/video-grid-section.component';
import { StepsSectionComponent } from '../steps-section/steps-section.component';
import { KeyBenefitsSectionComponent } from '../key-benefits-section/key-benefits-section.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { Subscription } from 'rxjs';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { ResponsiveImage } from '../../../../shared/services/responsive-image.service';
import { FacebookPixelService } from '../../../../shared/services/facebook-pixel.service';
import { isPlatformBrowser } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { WistiaPlayerComponent } from '../wistia-player/wistia-player.component';
import { WistiaVerticalPlayerComponent } from '../wistia-vertical-player/wistia-vertical-player.component';

@Component({
  selector: 'app-landing-presentacion',
  standalone: true,
  imports: [
    WistiaPlayerComponent,
    WistiaVerticalPlayerComponent,
    ResponsiveImageComponent,
    CalendlySectionComponent,
    TestimonialsComponent,
    FaqComponent,
    VideoSectionComponent,
    VideoGridSectionComponent,
    StepsSectionComponent,
    KeyBenefitsSectionComponent,
    ResponsiveImageComponent,
    TranslocoPipe
  ],
  templateUrl: './landing-presentacion.component.html',
  styleUrl: './landing-presentacion.component.css',
})
export class LandingPresentacionComponent implements AfterViewInit, OnInit {
  @ViewChild('calendly', { static: false })
  calendlySection!: ElementRef<HTMLElement>;

  private scrollSubscription!: Subscription;
  showFloatingButton = false;
  scrollDepth = 0;

  logoImages = {
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.png',
    alt: 'Start Companies Logo',
    priority: true,
  };

  // Hero images - usando las mismas imágenes que abre-tu-llc
  heroImages: ResponsiveImage = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg-desktop.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Hero Background',
    priority: true,
  };

  constructor(
    private scrollService: ScrollService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private facebookPixelService: FacebookPixelService
  ) {}

  ngOnInit(): void {
    // Inicializar Facebook Pixel para página de presentación
    this.facebookPixelService.initializePixel('llc');

    // Trackear vista de página
    this.facebookPixelService.trackViewContent(
      'Presentación LLC Landing',
      'LLC Presentation Services'
    );

    // Trackear scroll inicial
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollDepth();
    }
  }

  ngAfterViewInit(): void {
    this.scrollSubscription = this.scrollService.scrollTarrget$.subscribe(
      (sectionId) => {
        this.scrollTargetSection(sectionId);
      }
    );
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', () => {
        this.checkScrollForFloatingButton();
      });
    }
  }

  navigateToCalendlySection() {
    this.scrollService.scrollTo('calendlySection');
  }

  private checkScrollForFloatingButton() {
    // Buscar las secciones en el DOM
    const heroSection = document.querySelector('.hero-section');
    const calendlySection = document.querySelector('.calendly-cta-section');

    if (heroSection && calendlySection) {
      const heroRect = heroSection.getBoundingClientRect();
      const calendlyRect = calendlySection.getBoundingClientRect();

      // Mostrar botón cuando ambas secciones (hero y calendly) estén fuera de vista
      const isHeroOutOfView = heroRect.bottom < 0;
      const isCalendlyOutOfView = calendlyRect.bottom < 0;

      // Mostrar botón solo en mobile y cuando ambas secciones estén fuera de vista
      this.showFloatingButton =
        window.innerWidth <= 768 && isHeroOutOfView && isCalendlyOutOfView;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScrollDepth();
      this.checkFloatingButton();
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
      this.facebookPixelService.trackDeepScroll('Presentación LLC', 25);
      this.scrollDepth = 25;
    } else if (scrollPercentage >= 50 && this.scrollDepth < 50) {
      this.facebookPixelService.trackDeepScroll('Presentación LLC', 50);
      this.scrollDepth = 50;
    } else if (scrollPercentage >= 75 && this.scrollDepth < 75) {
      this.facebookPixelService.trackDeepScroll('Presentación LLC', 75);
      this.scrollDepth = 75;
    }
  }

  private checkFloatingButton(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.showFloatingButton = scrollTop > 300;
  }

  scrollToCalendly(): void {
    if (this.calendlySection) {
      this.calendlySection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  scrollTargetSection(sectionId: string) {
    const element = this.calendlySection?.nativeElement;
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn('calendlySection no es un HTMLElement válido:', element);
    }
  }

  startProcess(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    console.log('Iniciar proceso');
  }

  // Método para trackear clicks en calendario
  onCalendlyClick(): void {
    this.facebookPixelService.trackLead(
      'Calendly CTA - Presentación LLC',
      'LLC Presentation Services',
      0.0
    );
  }

  // Método para trackear reproducción de videos
  onVideoPlay(videoTitle: string): void {
    this.facebookPixelService.trackVideoPlay(
      videoTitle,
      'Testimonial',
      'Presentación LLC Landing'
    );
  }

  ngOnDestroy() {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    // Evita scrolls pendientes al salir
    this.scrollService.clearTarget();
  }
}
