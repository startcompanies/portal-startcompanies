import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css'
})
export class HeroSectionComponent {
  // Propiedades para estilos personalizados
  @Input() contentClass: string | string[] | { [key: string]: boolean } = '';
  @Input() contentStyles: { [key: string]: string } = {};

  // Este componente actúa como contenedor
  // El contenido se inyecta desde otros componentes usando content projection
}
