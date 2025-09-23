import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { OurPricingComponent } from '../our-pricing/our-pricing.component';
import { ComparisonTableComponent } from '../comparison-table/comparison-table.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-pricing-planes',
  standalone: true,
  imports: [
    ScHeaderComponent,
    ScFooterComponent,
    OurPricingComponent,
    ComparisonTableComponent,
    ResponsiveImageComponent,
    TranslocoPipe,
  ],
  templateUrl: './pricing-planes.component.html',
  styleUrl: './pricing-planes.component.css',
})
export class PricingPlanesComponent {
  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: '/assets/hero-bg-mobile.webp',
    tablet: '/assets/hero-bg-tablet.webp',
    desktop: '/assets/hero-bg.webp',
    fallback: '/assets/hero-bg.webp',
    alt: 'Planes y Precios Hero Background',
    priority: true,
  };
}
