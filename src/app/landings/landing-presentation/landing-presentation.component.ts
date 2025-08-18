import { Component } from '@angular/core';
import { FaqComponent } from "../../sections/faq/faq.component";
import { VideoGridSectionComponent } from "../video-grid-section/video-grid-section.component";
import { VideoSectionComponent } from "../video-section/video-section.component";
import { PlansContainerComponent } from "../plans-container/plans-container.component";
import { SupportContainerComponent } from "../support-container/support-container.component";
import { TestimonialsCarouselComponent } from "../testimonials-carousel/testimonials-carousel.component";
import { YoutubePlayerComponent } from '../youtube-player/youtube-player.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-presentation',
  standalone: true,
  imports: [CommonModule, FaqComponent, VideoGridSectionComponent, VideoSectionComponent, PlansContainerComponent, SupportContainerComponent, TestimonialsCarouselComponent, YoutubePlayerComponent],
  templateUrl: './landing-presentation.component.html',
  styleUrl: './landing-presentation.component.css'
})
export class LandingPresentationComponent {
  videoUrl: any = 'https://www.youtube.com/embed/IlsBAs3mepI';
  videoTitle: any = 'Aplica y crea cuenta Relay Bank 100% Online - Start Companies LLC';

  videoTestimonials = [
    {
      id: '1',
      url: 'https://www.youtube.com/embed/vTCE6ZbvKHA',
      title: '¿Quieres Abrir una cuenta bancaria con Relay ? - En Start Companies LLC te ayudamos a realizarlo.'
    },
    {
      id: '2',
      url: 'https://www.youtube.com/embed/OlVmAaSS4z0',
      title: '¿Quieres Abrir una cuenta bancaria con Relay ? - En Start Companies LLC te ayudamos a realizarlo.'
    },
    {
      id: '3',
      url: 'https://www.youtube.com/embed/C4LivIlBcAI',
      title: '¿Quieres Abrir una cuenta bancaria con Relay ? - En Start Companies LLC te ayudamos a realizarlo.'
    }
  ];

  get videoId(): string | null {
    if (!this.videoUrl) return null;
    // Casos como: https://youtu.be/ID
    const shortUrlMatch = this.videoUrl.match(/youtu\.be\/([^?&]+)/);
    if (shortUrlMatch) return shortUrlMatch[1];

    // Casos como: https://www.youtube.com/watch?v=ID
    const longUrlMatch = this.videoUrl.match(/v=([^?&]+)/);
    if (longUrlMatch) return longUrlMatch[1];

    // Casos como: https://www.youtube.com/embed/ID
    const embedUrlMatch = this.videoUrl.match(/embed\/([^?&]+)/);
    if (embedUrlMatch) return embedUrlMatch[1];

    return null;
  }
}
