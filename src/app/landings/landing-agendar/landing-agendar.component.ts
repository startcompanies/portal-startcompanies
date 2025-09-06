import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { ResponsiveImage } from '../../services/responsive-image.service';
import { CalendlySectionComponent } from '../calendly-section/calendly-section.component';
import { FacebookPixelService } from '../../services/facebook-pixel.service';
import { TestimonialsComponent } from '../../sections/testimonials/testimonials.component';
import { FaqComponent } from '../../sections/faq/faq.component';
import { ScrollService } from '../../services/scroll.service';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-landing-agendar',
  standalone: true,
  imports: [
    ResponsiveImageComponent,
    CalendlySectionComponent,
    TestimonialsComponent,
    FaqComponent,
  ],
  templateUrl: './landing-agendar.component.html',
  styleUrl: './landing-agendar.component.css',
})
export class LandingAgendarComponent implements AfterViewInit{
  @ViewChild('calendly', { static: false })
  calendlySection!: ElementRef<HTMLElement>;

  private scrollSubscription!: Subscription;
  showFloatingButton = false;
  scrollDepth = 0;

  // Hero images
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
    private scrollService: ScrollService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
      this.scrollSubscription = this.scrollService.scrollTarrget$.subscribe(
        (sectionId) => {
          this.scrollTargetSection(sectionId);
        }
      );
      /*if (isPlatformBrowser(this.platformId)) {
        window.addEventListener('scroll', () => {
          this.checkScrollForFloatingButton();
        });        
      }*/
  }
  
  scrollTargetSection(sectionId: string) {
    const element = this.calendlySection?.nativeElement;
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn('calendlySection no es un HTMLElement válido:', element);
    }
  }

  navigateToCalendlySection() {
    this.scrollService.scrollTo('calendlySection');
  }

  // Método para trackear clicks en calendario
  onCalendlyClick(): void {
    this.facebookPixelService.trackLead(
      'Calendly CTA - Abre tu LLC',
      'LLC Services',
      0.0
    );
  }
}
