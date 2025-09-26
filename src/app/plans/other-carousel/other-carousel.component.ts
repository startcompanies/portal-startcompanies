import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangRouterLinkDirective } from '../../shared/directives/lang-router-link.directive';

@Component({
  selector: 'app-other-carousel',
  standalone: true,
  imports: [TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './other-carousel.component.html',
  styleUrl: './other-carousel.component.css'
})
export class OtherCarouselComponent {

}
