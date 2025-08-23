import { Component } from '@angular/core';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { ResponsiveImage } from '../../services/responsive-image.service';

@Component({
  selector: 'app-support-container',
  standalone: true,
  imports: [ResponsiveImageComponent],
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
}
