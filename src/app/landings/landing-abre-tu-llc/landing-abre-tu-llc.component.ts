import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { CalendlySectionComponent } from '../calendly-section/calendly-section.component';
import { TestimonialsComponent } from '../../sections/testimonials/testimonials.component';
import { FaqComponent } from '../../sections/faq/faq.component';
import { VideoSectionComponent } from '../video-section/video-section.component';
import { VideoGridSectionComponent } from '../video-grid-section/video-grid-section.component';
import { StepsSectionComponent } from '../steps-section/steps-section.component';
import { KeyBenefitsSectionComponent } from '../key-benefits-section/key-benefits-section.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { Subscription } from 'rxjs';
import { ScrollService } from '../../services/scroll.service';

@Component({
  selector: 'app-landing-abre-tu-llc',
  standalone: true,
  imports: [
    HeroSectionComponent,
    CalendlySectionComponent,
    TestimonialsComponent,
    FaqComponent,
    VideoSectionComponent,
    VideoGridSectionComponent,
    StepsSectionComponent,
    KeyBenefitsSectionComponent,
    ResponsiveImageComponent
],
  templateUrl: './landing-abre-tu-llc.component.html',
  styleUrl: './landing-abre-tu-llc.component.css',
})
export class LandingAbreTuLlcComponent implements AfterViewInit {
  @ViewChild('calendly', { static: false })
  calendlySection!: ElementRef<HTMLElement>;

  private scrollSubscription!: Subscription;
  showFloatingButton = false;

  constructor(
    private scrollService: ScrollService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  videoTestimonials = [
    {
      id: '1',
      url: 'https://www.youtube.com/embed/vTCE6ZbvKHA',
      title:
        '¿Quieres Abrir una cuenta bancaria con Relay ? - En Start Companies LLC te ayudamos a realizarlo.',
    },
    {
      id: '2',
      url: 'https://www.youtube.com/embed/OlVmAaSS4z0',
      title:
        '¿Quieres Abrir una cuenta bancaria con Relay ? - En Start Companies LLC te ayudamos a realizarlo.',
    },
    {
      id: '3',
      url: 'https://www.youtube.com/embed/C4LivIlBcAI',
      title:
        '¿Quieres Abrir una cuenta bancaria con Relay ? - En Start Companies LLC te ayudamos a realizarlo.',
    },
  ];

  // Configuración de imágenes del hero para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.jpg",
    alt: "Hero Background",
    priority: true
  };

  ngAfterViewInit(): void {
    this.scrollSubscription = this.scrollService.scrollTarrget$.subscribe(
      (sectionId) => {
        this.scrollTargetSection(sectionId);
      }
    );

    // Agregar listener de scroll para el botón flotante
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.checkScrollForFloatingButton();
      });
    }
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
      this.showFloatingButton = window.innerWidth <= 768 && isHeroOutOfView && isCalendlyOutOfView;
    }
  }

  scrollToCalendly(): void {
    if (this.calendlySection) {
      this.calendlySection.nativeElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
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

  ngOnDestroy() {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    // Evita scrolls pendientes al salir
    this.scrollService.clearTarget();
  }
}
