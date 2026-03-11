import {
  AfterViewInit,
  Component,
  ElementRef,
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
import { TranslocoPipe } from '@jsverse/transloco';
import { BrowserService } from '../../../../shared/services/browser.service';

@Component({
  selector: 'app-landing-presentacion-2',
  standalone: true,
  imports: [
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
  templateUrl: './landing-presentacion-2.component.html',
  styleUrl: '../landing-presentacion/landing-presentacion.component.css',
})
export class LandingPresentacion2Component implements AfterViewInit, OnInit {
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
    private facebookPixelService: FacebookPixelService,
    private browser: BrowserService
  ) {}

  ngOnInit(): void {
    this.facebookPixelService.initializePixel('llc');
    this.facebookPixelService.trackViewContent(
      'Landing Presentación 2 - Evaluar caso',
      'LLC Presentation Services'
    );
    if (this.browser.isBrowser) {
      this.checkScrollDepth();
    }
  }

  ngAfterViewInit(): void {
    this.scrollSubscription = this.scrollService.scrollTarrget$.subscribe(
      (sectionId) => {
        this.scrollTargetSection(sectionId);
      }
    );
    if (this.browser.isBrowser) {
      const win = this.browser.window;
      if (win) {
        win.addEventListener('scroll', () => {
          this.checkScrollForFloatingButton();
        });
      }
    }
  }

  navigateToCalendlySection() {
    this.scrollService.scrollTo('calendlySection');
  }

  private checkScrollForFloatingButton() {
    const doc = this.browser.document;
    const win = this.browser.window;
    if (!doc || !win) return;
    const isMobile = win.innerWidth <= 768;
    if (!isMobile) return;
    const whoForSection = doc.querySelector('.lp-steps-section');
    if (whoForSection) {
      const rect = whoForSection.getBoundingClientRect();
      const windowHeight = win.innerHeight;
      this.showFloatingButton = rect.top <= windowHeight * 0.85;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.browser.isBrowser) {
      this.checkScrollDepth();
      this.checkFloatingButton();
      this.checkScrollForFloatingButton();
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
    if (scrollPercentage >= 25 && this.scrollDepth < 25) {
      this.facebookPixelService.trackDeepScroll('Landing Presentación 2', 25);
      this.scrollDepth = 25;
    } else if (scrollPercentage >= 50 && this.scrollDepth < 50) {
      this.facebookPixelService.trackDeepScroll('Landing Presentación 2', 50);
      this.scrollDepth = 50;
    } else if (scrollPercentage >= 75 && this.scrollDepth < 75) {
      this.facebookPixelService.trackDeepScroll('Landing Presentación 2', 75);
      this.scrollDepth = 75;
    }
  }

  private checkFloatingButton(): void {
    const win = this.browser.window;
    const doc = this.browser.document;
    if (!win || !doc) return;
    if (win.innerWidth > 768) {
      const scrollTop = win.pageYOffset || doc.documentElement.scrollTop;
      this.showFloatingButton = scrollTop > 300;
    }
  }

  scrollToCalendly(): void {
    if (this.calendlySection) {
      this.calendlySection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  openCalModal(): void {
    if (typeof window !== 'undefined' && (window as any).Cal) {
      const Cal = (window as any).Cal;
      if (Cal.ns && Cal.ns['30min']) {
        Cal.ns['30min']('ui');
      }
    }
  }

  scrollTargetSection(sectionId: string) {
    const element = this.calendlySection?.nativeElement;
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onCalendlyClick(): void {
    this.facebookPixelService.trackLead(
      'Calendly CTA - Landing Presentación 2',
      'LLC Presentation Services',
      0.0
    );
  }

  onVideoPlay(videoTitle: string): void {
    this.facebookPixelService.trackVideoPlay(
      videoTitle,
      'Testimonial',
      'Landing Presentación 2'
    );
  }

  ngOnDestroy() {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    this.scrollService.clearTarget();
  }
}
