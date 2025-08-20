import { Component } from '@angular/core';
import { FaqComponent } from "../../sections/faq/faq.component";
import { VideoGridSectionComponent } from "../video-grid-section/video-grid-section.component";
import { VideoSectionComponent } from "../video-section/video-section.component";
import { PlansContainerComponent } from "../plans-container/plans-container.component";
import { SupportContainerComponent } from "../support-container/support-container.component";
import { TestimonialsCarouselComponent } from "../testimonials-carousel/testimonials-carousel.component";
import { CommonModule } from '@angular/common';
import { WistiaPlayerComponent } from "../wistia-player/wistia-player.component";

@Component({
  selector: 'app-landing-presentation',
  standalone: true,
  imports: [CommonModule, FaqComponent, VideoGridSectionComponent, VideoSectionComponent, PlansContainerComponent, SupportContainerComponent, TestimonialsCarouselComponent, WistiaPlayerComponent],
  templateUrl: './landing-presentation.component.html',
  styleUrl: './landing-presentation.component.css'
})
export class LandingPresentationComponent {
}
