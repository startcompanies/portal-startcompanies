import { Component } from '@angular/core';
import { ScFooterComponent } from "../../sc-footer/sc-footer.component";
import { HeroSectionComponent } from "../hero-section/hero-section.component";
import { CalendlySectionComponent } from "../calendly-section/calendly-section.component";
import { TestimonialsComponent } from "../../sections/testimonials/testimonials.component";
import { FaqComponent } from "../../sections/faq/faq.component";
import { VideoSectionComponent } from "../video-section/video-section.component";
import { VideoGridSectionComponent } from "../video-grid-section/video-grid-section.component";
import { StepsSectionComponent } from "../steps-section/steps-section.component";
import { KeyBenefitsSectionComponent } from "../key-benefits-section/key-benefits-section.component";

@Component({
  selector: 'app-landing-open-relay',
  standalone: true,
  imports: [
    ScFooterComponent,
    HeroSectionComponent,
    CalendlySectionComponent,
    TestimonialsComponent,
    FaqComponent,
    VideoSectionComponent,
    VideoGridSectionComponent,
    StepsSectionComponent,
    KeyBenefitsSectionComponent
  ],
  templateUrl: './landing-open-relay.component.html',
  styleUrl: './landing-open-relay.component.css'
})
export class LandingOpenRelayComponent {
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
  startProcess(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    console.log('Iniciar proceso');
  }
}
