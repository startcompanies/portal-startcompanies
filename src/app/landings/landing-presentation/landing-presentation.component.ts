import { Component } from '@angular/core';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { FaqComponent } from "../../sections/faq/faq.component";
import { VideoGridSectionComponent } from "../video-grid-section/video-grid-section.component";
import { VideoSectionComponent } from "../video-section/video-section.component";

@Component({
  selector: 'app-landing-presentation',
  standalone: true,
  imports: [ScFooterComponent, FaqComponent, VideoGridSectionComponent, VideoSectionComponent],
  templateUrl: './landing-presentation.component.html',
  styleUrl: './landing-presentation.component.css'
})
export class LandingPresentationComponent {
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
}
