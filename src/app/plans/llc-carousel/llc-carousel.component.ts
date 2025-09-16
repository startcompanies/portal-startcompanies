import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-llc-carousel',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './llc-carousel.component.html',
  styleUrl: './llc-carousel.component.css'
})
export class LlcCarouselComponent {

}
