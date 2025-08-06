import { Component } from '@angular/core';
import { ScFooterComponent } from "../../sc-footer/sc-footer.component";
import { HeroSectionComponent } from "../hero-section/hero-section.component";
import { CalendlySectionComponent } from "../calendly-section/calendly-section.component";

@Component({
  selector: 'app-landing-open-relay',
  standalone: true,
  imports: [ScFooterComponent, HeroSectionComponent, CalendlySectionComponent],
  templateUrl: './landing-open-relay.component.html',
  styleUrl: './landing-open-relay.component.css'
})
export class LandingOpenRelayComponent {
  startProcess() {
    console.log('Iniciar proceso');
  }
}
