import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
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
  ],
  templateUrl: './sc-content.component.html',
  styleUrl: './sc-content.component.css',
})
export class ScContentComponent implements AfterViewInit {
  /*@ViewChild('heroSection') heroSection!: ElementRef;
  @ViewChild('servicesSection') servicesSection!: ElementRef;
  @ViewChild('howToLlcSection') howToLlcSection!: ElementRef;*/
  /*@ViewChild('pricingSection') pricingSection!: ElementRef;*/
  /*@ViewChild('benefitsSection') benefitsSection!: ElementRef;
  @ViewChild('testimonialsSection') testimonialsSection!: ElementRef;
  @ViewChild('blogSection') blogSection!: ElementRef;
  @ViewChild('faqSection') faqSection!: ElementRef;
  @ViewChild('footerSection') footerSection!: ElementRef;*/
  @ViewChild('pricingSection', { static: false })
  pricingSection!: ElementRef<HTMLElement>;

  private scrollSubscription!: Subscription;

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

    // Si se entra directamente a /planes, hacer scroll a pricingSection
    if (isPlatformBrowser(this.platformId) && this.router.url === '/planes') {
      requestAnimationFrame(() => this.scrollToTargetSection('pricingSection'));
    }
  }

  scrollToTargetSection(sectionId: string) {
    const element = this.pricingSection?.nativeElement;
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn('pricingSection no es un HTMLElement válido:', element);
    }
    /*switch (sectionId) {
      case 'heroSection':
        element = this.heroSection?.nativeElement;
        break;
      case 'servicesSection':
        element = this.servicesSection?.nativeElement;
        break;
      case 'howToLlcSection':
        element = this.howToLlcSection?.nativeElement;
        break;
      case 'pricingSection':
        element = this.pricingSection?.nativeElement;
        break;
      case 'benefitsSection':
        element = this.benefitsSection?.nativeElement;
        break;
      case 'testimonialsSection':
        element = this.testimonialsSection?.nativeElement;
        break;
      case 'blogSection':
        element = this.blogSection?.nativeElement;
        break;
      case 'faqSection':
        // Para el componente FAQ, necesitamos acceder al elemento nativo del componente
        element = this.faqSection?.nativeElement;
        break;
      case 'footerSection': // Para el enlace de "Contacto" que apunta al footer
        element = this.footerSection?.nativeElement;
        break;
      default:
        console.warn(
          `Sección con ID "${sectionId}" no encontrada o no mapeada.`
        );
        break;
    }*/

    /*if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn(
        `Elemento para sección "${sectionId}" no encontrado o no es un HTMLElement.`
      );
    }*/
  }

  ngOnDestroy() {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    // Evita scrolls pendientes al salir
    this.scrollService.clearTarget();
  }
}
