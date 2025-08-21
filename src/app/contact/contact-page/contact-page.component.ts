import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { ContactAdviceComponent } from "../contact-advice/contact-advice.component";
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent, TranslocoPipe, ContactAdviceComponent, ContactAdviceComponent, SeoBaseComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.css'
})
export class ContactPageComponent {

}
