import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { WistiaPlayerComponent } from '../wistia-player/wistia-player.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { WistiaVerticalPlayerComponent } from "../wistia-vertical-player/wistia-vertical-player.component";
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, WistiaPlayerComponent, ResponsiveImageComponent, WistiaVerticalPlayerComponent, TranslocoPipe],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css',
})
export class HeroSectionComponent implements OnInit {
  // Fondo oscuro: usar logo (negativo/blanco)
  logoImages = {
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.png',
    alt: 'Start Companies Logo',
    priority: true,
  };
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private scrollService: ScrollService
  ) {}

  ngOnInit(): void {}

  navigateToCalendlySection() {
    this.scrollService.scrollTo('calendlySection');
  }
}
