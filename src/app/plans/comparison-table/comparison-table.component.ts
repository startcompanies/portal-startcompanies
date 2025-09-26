import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangRouterLinkDirective } from "../../shared/directives/lang-router-link.directive";

@Component({
  selector: 'app-comparison-table',
  standalone: true,
  imports: [TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './comparison-table.component.html',
  styleUrl: './comparison-table.component.css'
})
export class ComparisonTableComponent {

}
