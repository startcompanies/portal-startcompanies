import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-our-pricing',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './our-pricing.component.html',
  styleUrl: './our-pricing.component.css'
})
export class OurPricingComponent {

}
