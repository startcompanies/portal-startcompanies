import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ScHeaderComponent } from '../sc-header/sc-header.component';
import { ScFooterComponent } from '../sc-footer/sc-footer.component';
import { ScrollService } from '../services/scroll.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sc-content',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent],
  templateUrl: './sc-content.component.html',
  styleUrl: './sc-content.component.css',
})
export class ScContentComponent implements AfterViewInit {
  @ViewChild('heroSection') heroSection!: ElementRef;
  @ViewChild('servicesSection') servicesSection!: ElementRef;
  @ViewChild('howToLlcSection') howToLlcSection!: ElementRef;
  @ViewChild('pricingSection') pricingSection!: ElementRef;
  @ViewChild('benefitsSection') benefitsSection!: ElementRef;
  @ViewChild('testimonialsSection') testimonialsSection!: ElementRef;
  @ViewChild('blogSection') blogSection!: ElementRef;
  @ViewChild('faqSection') faqSection!: ElementRef;
  @ViewChild('footerSection') footerSection!: ElementRef;

  private scrollSubscription!: Subscription;

  constructor(private scrollService: ScrollService) { }

  ngAfterViewInit() {
    this.scrollSubscription = this.scrollService.scrollTarrget$.subscribe((sectionId) => {
      this.scrollToTargetSection(sectionId);
    });
  }

  scrollToTargetSection(sectionId: string) {
    let element: HTMLElement | null = null;

    switch (sectionId) {
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
        element = this.faqSection?.nativeElement;
        break;
      case 'footerSection': // Para el enlace de "Contacto" que apunta al footer
        element = this.footerSection?.nativeElement;
        break;
      default:
        console.warn(`Sección con ID "${sectionId}" no encontrada o no mapeada.`);
        break;
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnDestroy() {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
  }
}
