import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { ContactAdviceComponent } from "../contact-advice/contact-advice.component";
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';

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
    mobile: "/assets/hero-bg-mobile.jpg",
    tablet: "/assets/hero-bg-tablet.jpg",
    desktop: "/assets/hero-bg.jpg",
    fallback: "/assets/hero-bg.jpg",
    alt: "Contacto Hero Background",
    priority: true
  };

}
