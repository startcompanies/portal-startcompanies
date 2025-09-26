import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangRouterLinkDirective } from "../../shared/directives/lang-router-link.directive";

@Component({
  selector: 'app-contact-advice',
  standalone: true,
  imports: [TranslocoPipe, LangRouterLinkDirective],
  templateUrl: './contact-advice.component.html',
  styleUrl: './contact-advice.component.css'
})
export class ContactAdviceComponent {

}
