import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-steps-section',
  standalone: true,
  imports: [CommonModule],
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
      description: 'Selecciona el paquete de servicios que necesitas.'
    },
    {
      id: 2,
      title: 'Completa el Formulario',
      description: 'Bríndanos la información de tu empresa en 5 minutos.'
    },
    {
      id: 3,
      title: 'Recibe tus Documentos',
      description: 'Nosotros nos encargamos y te enviamos todo digitalmente.'
    }
  ];
  readonly bottomStatement = '¡Pagas solo cuando tienes tu cuenta de banco y empresa funcionando!';
}
