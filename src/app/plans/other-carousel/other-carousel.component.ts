import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-other-carousel',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './other-carousel.component.html',
  styleUrl: './other-carousel.component.css'
})
export class OtherCarouselComponent {

}
