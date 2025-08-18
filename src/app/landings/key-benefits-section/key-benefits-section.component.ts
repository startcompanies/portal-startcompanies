import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Benefit {
  id: number;
  title: string;
  description: string;
  icon: string;
  highlight?: string;
}

@Component({
  selector: 'app-key-benefits-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './key-benefits-section.component.html',
  styleUrl: './key-benefits-section.component.css'
})
export class KeyBenefitsSectionComponent {
  // Contenido estático del componente
  readonly title = 'Beneficios de elegir Start Companies';
  readonly titleHighlight = 'Start Companies';
  readonly description = 'Nos encargamos de la burocracia para que tú te enfoques en crecer.';
  readonly subtitle = 'Descubre por qué más de 200 clientes nos califican como excelente.';
  readonly subtitleHighlights = ['200 clientes', 'excelente'];
  
  readonly benefits: Benefit[] = [
    {
      id: 1,
      title: 'Asesoría fiscal GRATUITA',
      description: 'Te acompañamos desde el inicio y solo pagas cuando entregamos la documentación.',
      icon: 'assets/benefits/idea.svg',
    },
    {
      id: 2,
      title: 'Pagas al final',
      description: 'Solo pagas una vez que te entregamos toda la documentación de tu empresa.',
      icon: 'assets/benefits/clock.svg'
    },
    {
      id: 3,
      title: 'Opera Globalmente',
      description: 'Vende en Amazon, cobra con Stripe y accede a mercados internacionales sin restricciones.',
      icon: 'assets/benefits/globe.svg'
    },
    {
      id: 4,
      title: '100% Remoto',
      description: 'No necesitas viajar ni ser residente. Gestiona todo el proceso desde la comodidad de tu hogar.',
      icon: 'assets/benefits/remote.svg'
    }
  ];
}
