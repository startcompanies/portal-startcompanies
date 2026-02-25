import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { FacebookPixelService } from '../../../../shared/services/facebook-pixel.service';
import { LangRouterLinkDirective } from '../../../../shared/directives/lang-router-link.directive';

@Component({
  selector: 'app-plans-container',
  standalone: true,
  imports: [TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './plans-container.component.html',
  styleUrl: './plans-container.component.css'
})
export class PlansContainerComponent {

  constructor(private facebookPixelService: FacebookPixelService) {}

  /**
   * Trackea cuando el usuario hace clic en el CTA que lleva al formulario Relay
   */
  onFormClick(): void {
    this.facebookPixelService.trackLead(
      'Formulario Apertura Relay - Ir al formulario',
      'Banking Services',
      0
    );
  }
}
