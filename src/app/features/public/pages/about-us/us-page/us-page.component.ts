import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { ScHeaderComponent } from '../../../../../shared/components/header/sc-header.component';
import { ScFooterComponent } from '../../../../../shared/components/footer/sc-footer.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { UsPotentialComponent } from '../us-potential/us-potential.component';
import { UsProposalComponent } from "../us-proposal/us-proposal.component";
import { VideoSectionComponent } from "../../../landings/video-section/video-section.component";
import { SeoBaseComponent } from '../../../../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../../../../shared/components/responsive-image/responsive-image.component';
import { BrowserService } from '../../../../../shared/services/browser.service';

declare var bootstrap: any;

@Component({
  selector: 'app-us-page',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent, TranslocoPipe, UsPotentialComponent, UsProposalComponent, UsProposalComponent, VideoSectionComponent, SeoBaseComponent, ResponsiveImageComponent],
  templateUrl: './us-page.component.html',
  styleUrl: './us-page.component.css'
})
export class UsPageComponent implements AfterViewInit, OnDestroy {
  private carousel: any;

  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.webp",
    alt: "Nosotros Hero Background",
    priority: true
  };

  // Configuración de imágenes del carousel para NgOptimizedImage
  carouselImages = {
    mission: {
      mobile: "/assets/us/mission-person.webp",
      tablet: "/assets/us/mission-person.webp",
      desktop: "/assets/us/mission-person.webp",
      fallback: "/assets/us/mission-person.webp",
      alt: "Emprendedor trabajando",
      priority: false
    },
    vision: {
      mobile: "/assets/us/vision.webp",
      tablet: "/assets/us/vision.webp",
      desktop: "/assets/us/vision.webp",
      fallback: "/assets/us/vision.webp",
      alt: "Visión de la empresa",
      priority: false
    }
  };

  constructor(private browser: BrowserService) {}

  ngAfterViewInit() {
    // Inicializar el carrusel de Bootstrap
    if (this.browser.isBrowser) {
      this.initializeCarousel();
    }
  }

  ngOnDestroy() {
    // Limpiar el carrusel
    if (this.carousel) {
      this.carousel.dispose();
    }
  }

  private initializeCarousel() {
    const doc = this.browser.document;
    const win = this.browser.window;
    if (!doc || !win || typeof (win as any).bootstrap === 'undefined') return;
    
    const carouselElement = doc.getElementById('carouselExampleIndicators');
    if (carouselElement) {
      this.carousel = new (win as any).bootstrap.Carousel(carouselElement, {
        interval: 5000, // Cambiar cada 5 segundos
        wrap: true, // Loop infinito
        keyboard: true, // Navegación con teclado
        pause: 'hover' // Pausar al hacer hover
      });
    }
  }
}
