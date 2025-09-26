import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangRouterLinkDirective } from '../../shared/directives/lang-router-link.directive';

@Component({
  selector: 'app-llc-carousel',
  standalone: true,
  imports: [TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './llc-carousel.component.html',
  styleUrl: './llc-carousel.component.css'
})
export class LlcCarouselComponent {

}
