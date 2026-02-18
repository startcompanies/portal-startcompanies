import { Component } from '@angular/core';
import { HeaderManejoComponent } from '../../../../../features/public/forms/header-manejo/header-manejo.component';
import { ScFooterComponent } from '../../../../../shared/components/footer/sc-footer.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrowserService } from '../../../../../shared/services/browser.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [HeaderManejoComponent, ScFooterComponent, TranslocoPipe],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent {
  constructor(private browser: BrowserService) {}

  scrollToSection(sectionId: string): void {
    const doc = this.browser.document;
    if (!doc) return;

    const element = doc.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}


