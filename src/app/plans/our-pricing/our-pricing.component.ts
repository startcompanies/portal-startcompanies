import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LlcCarouselComponent } from "../llc-carousel/llc-carousel.component";
import { OtherCarouselComponent } from "../other-carousel/other-carousel.component";

@Component({
  selector: 'app-our-pricing',
  standalone: true,
  imports: [TranslocoPipe, LlcCarouselComponent, OtherCarouselComponent],
  templateUrl: './our-pricing.component.html',
  styleUrl: './our-pricing.component.css'
})
export class OurPricingComponent {

}
