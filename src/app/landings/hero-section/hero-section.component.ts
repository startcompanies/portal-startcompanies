import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollService } from '../../services/scroll.service';
import { WistiaPlayerComponent } from '../wistia-player/wistia-player.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, WistiaPlayerComponent, ResponsiveImageComponent],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css',
})
export class HeroSectionComponent implements OnInit {
  // Configuración de imágenes del logo para NgOptimizedImage
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
