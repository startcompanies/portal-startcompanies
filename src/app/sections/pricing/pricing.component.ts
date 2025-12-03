import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { ResponsiveImage } from '../../services/responsive-image.service';
import { LangRouterLinkDirective } from '../../shared/directives/lang-router-link.directive';
import { SafeStorageService } from '../../services/safe-storage.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [TranslocoPipe, ResponsiveImageComponent, LangRouterLinkDirective],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
})
export class PricingComponent {
  pricingImages: ResponsiveImage = {
    mobile: '/assets/pricing-bg-mobile.webp',
    tablet: '/assets/pricing-bg-tablet.webp',
    desktop: '/assets/pricing-bg.webp',
    fallback: '/assets/pricing-bg.jpg',
    alt: 'Pricing Background',
    priority: false,
  };

  constructor(private storage: SafeStorageService) {}

  selectPlan(planName: string) {
    this.storage.setItem('selectedPlan', planName);
    console.log('💾 Plan guardado:', planName);
  }
}
