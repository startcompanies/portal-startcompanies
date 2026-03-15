import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente base para formularios.
 * Usar en panel/new-request y wizard/llc-apertura.
 * Implementar manualmente según las necesidades de cada formulario.
 */
@Component({
  selector: 'app-form-base',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-base.component.html',
  styleUrls: ['./form-base.component.css']
})
export class FormBaseComponent {}
