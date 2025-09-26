import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangRouterLinkDirective } from '../../shared/directives/lang-router-link.directive';

@Component({
  selector: 'app-us-potential',
  standalone: true,
  imports: [TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './us-potential.component.html',
  styleUrl: './us-potential.component.css'
})
export class UsPotentialComponent {

}
