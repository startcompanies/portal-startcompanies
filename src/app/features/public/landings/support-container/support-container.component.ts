import { Component } from '@angular/core';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { ResponsiveImage } from '../../../../shared/services/responsive-image.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { FacebookPixelService } from '../../../../shared/services/facebook-pixel.service';
import { LangRouterLinkDirective } from '../../../../shared/directives/lang-router-link.directive';

@Component({
  selector: 'app-support-container',
  standalone: true,
  imports: [ResponsiveImageComponent, TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './support-container.component.html',
  styleUrl: './support-container.component.css'
})
export class SupportContainerComponent {
  supportImages: ResponsiveImage = {
    mobile: '/assets/relay/work-llc.webp',
    tablet: '/assets/relay/work-llc.webp',
    desktop: '/assets/relay/work-llc.webp',
    fallback: '/assets/relay/work-llc.webp',
    alt: 'Hombre trabajando en laptop',
    priority: false
  };

  constructor(private facebookPixelService: FacebookPixelService) {}

  /**
   * Trackea cuando el usuario hace clic en el CTA que lleva al formulario Relay
   */
  onSupportClick(): void {
    this.facebookPixelService.trackLead(
      'Formulario Apertura Relay - Sección soporte',
      'Banking Services',
      0
    );
  }
}
