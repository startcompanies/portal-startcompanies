import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../../../../shared/components/header/sc-header.component';
import { ScFooterComponent } from '../../../../../shared/components/footer/sc-footer.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { ContactAdviceComponent } from "../contact-advice/contact-advice.component";
import { SeoBaseComponent } from '../../../../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../../../../shared/components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent, TranslocoPipe, ContactAdviceComponent, ContactAdviceComponent, SeoBaseComponent, ResponsiveImageComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.css'
})
export class ContactPageComponent {

  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.webp",
    alt: "Contacto Hero Background",
    priority: true
  };

}
