import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { ScHeaderComponent } from '../sc-header/sc-header.component';
import { ScFooterComponent } from '../sc-footer/sc-footer.component';
import { ScrollService } from '../services/scroll.service';
import { Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { SectionsModule } from '../sections/sections.module';
import { TestimonialsComponent } from '../sections/testimonials/testimonials.component';
import { FaqComponent } from '../sections/faq/faq.component';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { SeoBaseComponent } from '../shared/components/seo-base/seo-base.component';

declare var bootstrap: any;

@Component({
  selector: 'app-sc-content',
  standalone: true,
  imports: [
    ScHeaderComponent,
    ScFooterComponent,
    TranslocoPipe,
    SectionsModule,
    TestimonialsComponent,
    FaqComponent,
    SeoBaseComponent,
  ],
  templateUrl: './sc-content.component.html',
  styleUrl: './sc-content.component.css',
})
export class ScContentComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pricingSection', { static: false })
  pricingSection!: ElementRef<HTMLElement>;

  private scrollSubscription!: Subscription;
  private carousel: any;

  constructor(
    private scrollService: ScrollService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    this.scrollSubscription = this.scrollService.scrollTarrget$.subscribe(
      (sectionId) => {
        this.scrollToTargetSection(sectionId);
      }
    );

    // Inicializar el carrusel de Bootstrap
    if (isPlatformBrowser(this.platformId)) {
      this.initializeCarousel();
    }

    // Si se entra directamente a /planes, hacer scroll a pricingSection
    if (isPlatformBrowser(this.platformId) && this.router.url === '/planes') {
      requestAnimationFrame(() => this.scrollToTargetSection('pricingSection'));
    }
  }

  ngOnDestroy() {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    
    // Limpiar el carrusel
    if (this.carousel) {
      this.carousel.dispose();
    }
  }

  private initializeCarousel() {
    const carouselElement = document.getElementById('carouselExampleIndicators');
    if (carouselElement && typeof bootstrap !== 'undefined') {
      this.carousel = new bootstrap.Carousel(carouselElement, {
        interval: 5000, // Cambiar cada 5 segundos
        wrap: true, // Loop infinito
        keyboard: true, // Navegación con teclado
        pause: 'hover' // Pausar al hacer hover
      });
    }
  }

  scrollToTargetSection(sectionId: string) {
    const element = this.pricingSection?.nativeElement;
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn('pricingSection no es un HTMLElement válido:', element);
    }
  }
}
