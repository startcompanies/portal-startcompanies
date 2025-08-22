import { Component } from '@angular/core';
import { ScHeaderComponent } from "../../sc-header/sc-header.component";
import { ScFooterComponent } from "../../sc-footer/sc-footer.component";
import { OurPricingComponent } from "../our-pricing/our-pricing.component";
import { ComparisonTableComponent } from "../comparison-table/comparison-table.component";
import { ResponsiveImageComponent } from "../../shared/components/responsive-image/responsive-image.component";

@Component({
  selector: 'app-pricing-planes',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent, OurPricingComponent, ComparisonTableComponent, ResponsiveImageComponent],
  templateUrl: './pricing-planes.component.html',
  styleUrl: './pricing-planes.component.css'
})
export class PricingPlanesComponent {

  // Configuración de imágenes para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.jpg",
    tablet: "/assets/hero-bg-tablet.jpg",
    desktop: "/assets/hero-bg.jpg",
    fallback: "/assets/hero-bg.jpg",
    alt: "Planes y Precios Hero Background",
    priority: true
  };

}
