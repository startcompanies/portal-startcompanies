import { Component } from '@angular/core';
import { FaqComponent } from "../../sections/faq/faq.component";
import { VideoGridSectionComponent } from "../video-grid-section/video-grid-section.component";
import { VideoSectionComponent } from "../video-section/video-section.component";
import { PlansContainerComponent } from "../plans-container/plans-container.component";
import { SupportContainerComponent } from "../support-container/support-container.component";
import { TestimonialsCarouselComponent } from "../testimonials-carousel/testimonials-carousel.component";
import { CommonModule } from '@angular/common';
import { WistiaPlayerComponent } from "../wistia-player/wistia-player.component";
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-landing-apertura-relay',
  standalone: true,
  imports: [CommonModule, FaqComponent, VideoGridSectionComponent, VideoSectionComponent, PlansContainerComponent, SupportContainerComponent, TestimonialsCarouselComponent, WistiaPlayerComponent, ResponsiveImageComponent],
  templateUrl: './landing-apertura-relay.component.html',
  styleUrl: './landing-apertura-relay.component.css',
})
export class LandingAperturaRelayComponent {
  // Configuración de imágenes del hero para NgOptimizedImage
  heroImages = {
    mobile: "/assets/hero-bg-mobile.webp",
    tablet: "/assets/hero-bg-tablet.webp",
    desktop: "/assets/hero-bg.webp",
    fallback: "/assets/hero-bg.webp",
    alt: "Hero Background",
    priority: true
  };

  // Configuración de imágenes del logo para NgOptimizedImage
  logoImages = {
    mobile: "/assets/logo-mobile.webp",
    tablet: "/assets/logo-tablet.webp",
    desktop: "/assets/logo.webp",
    fallback: "/assets/logo.png",
    alt: "Start Companies Logo",
    priority: true
  };
}
