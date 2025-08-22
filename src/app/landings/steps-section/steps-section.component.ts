import { Component } from '@angular/core';
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
  // Contenido estático del componente
  readonly title = 'Tu LLC en menos de 7 días en 3 Pasos sencillos';
  readonly steps = [
    {
      id: 1,
      title: 'Elige tu Plan',
      description: 'Selecciona el paquete de servicios que necesitas.',
      class: 'step-one'
    },
    {
      id: 2,
      title: 'Completa el Formulario',
      description: 'Bríndanos la información de tu empresa en 5 minutos.',
      class: 'step-two'
    },
    {
      id: 3,
      title: 'Recibe tus Documentos',
      description: 'Nosotros nos encargamos y te enviamos todo digitalmente.',
      class: 'step-three'
    }
  ];
  readonly bottomStatement = '¡Pagas solo cuando tienes tu cuenta de banco y empresa funcionando!';

  // Configuración de imágenes del hero para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.jpg",
    alt: "Hero Background",
    priority: false
  };
}
