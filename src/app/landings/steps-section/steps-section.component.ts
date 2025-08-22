import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-steps-section',
  standalone: true,
  imports: [CommonModule, ResponsiveImageComponent],
  templateUrl: './steps-section.component.html',
  styleUrl: './steps-section.component.css'
})
export class StepsSectionComponent {
  @ViewChild('calendly', { static: false }) calendlySection!: ElementRef<HTMLElement>;

  // Contenido estático del componente
  readonly title = 'Tu LLC en menos de 7 días en 4 Pasos sencillos';
  readonly steps = [
    {
      id: 1,
      title: 'Agenda una llamada',
      description: 'Agenda una llamada hoy mismo.',
      class: 'step-one',
      hasCta: true
    },
    {
      id: 2,
      title: 'Elige tu Plan',
      description: 'Selecciona el paquete de servicios que necesitas.',
      class: 'step-two'
    },
    {
      id: 3,
      title: 'Completa el Formulario',
      description: 'Bríndanos la información de tu empresa en 5 minutos.',
      class: 'step-three'
    },
    {
      id: 4,
      title: 'Paga cuando esté todo listo',
      description: 'Solo pagas cuando tengas tu cuenta de banco y empresa funcionando.',
      class: 'step-four'
    }
  ];
  readonly bottomStatement = '¡Simple, rápido y sin complicaciones!';

  // Configuración de imágenes del hero para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.jpg",
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
