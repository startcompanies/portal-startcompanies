import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-steps-section',
  standalone: true,
  imports: [CommonModule, ResponsiveImageComponent, TranslocoPipe],
  templateUrl: './steps-section.component.html',
  styleUrl: './steps-section.component.css'
})
export class StepsSectionComponent {
  @ViewChild('calendly', { static: false }) calendlySection!: ElementRef<HTMLElement>;
  
  // Configuración de imágenes del hero para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.webp",
    alt: "Hero Background",
    priority: false
  };

  scrollToCalendly(): void {
    // Buscar la sección de calendly en el DOM
    const calendlySection = document.querySelector('.calendly-cta-section');
    if (calendlySection) {
      calendlySection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}
