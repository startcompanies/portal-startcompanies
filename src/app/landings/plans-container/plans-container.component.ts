import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { FacebookPixelService } from '../../services/facebook-pixel.service';

@Component({
  selector: 'app-plans-container',
  standalone: true,
  imports: [TranslocoPipe, RouterLink],
  templateUrl: './plans-container.component.html',
  styleUrl: './plans-container.component.css'
})
export class PlansContainerComponent {

  constructor(private facebookPixelService: FacebookPixelService) {}

  /**
   * Trackea cuando el usuario hace clic en "Aplicar Gratis"
   * Ahora lleva al formulario embebido en lugar de WhatsApp
   */
  onFreeApplicationClick(): void {
    // Trackear como Lead ya que va al formulario gratuito
    this.facebookPixelService.trackLead(
      'Formulario Apertura Relay - Aplicar Gratis',
      'Banking Services',
      0
    );
  }

  /**
   * Trackea cuando el usuario hace clic en "Aplicar por $99 USD"
   */
  onPaidApplicationClick(): void {
    this.facebookPixelService.trackWhatsAppPaidApplication('Banking Services');
  }
}
