import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ResponsiveImageComponent } from '../shared/components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-sc-footer',
  standalone: true,
  imports: [TranslocoPipe, ResponsiveImageComponent],
  templateUrl: './sc-footer.component.html',
  styleUrl: './sc-footer.component.css',
})
export class ScFooterComponent {
  
  // Configuración de imágenes del logo del footer para NgOptimizedImage
  footerLogoImages = {
    mobile: "/assets/footer/img_footer_logo.webp",
    tablet: "/assets/footer/img_footer_logo.webp",
    desktop: "/assets/footer/img_footer_logo.webp",
    fallback: "/assets/footer/img_footer_logo.webp",
    alt: "Start Companies Footer Logo",
    priority: false
  };

  openUrl(url: string) {
    window.open(url, '_blank');
  }
}
