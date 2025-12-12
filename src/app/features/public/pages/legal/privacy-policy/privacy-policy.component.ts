import { Component } from '@angular/core';
import { HeaderManejoComponent } from '../../../../../features/public/forms/header-manejo/header-manejo.component';
import { ScFooterComponent } from '../../../../../shared/components/footer/sc-footer.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [HeaderManejoComponent, ScFooterComponent, TranslocoPipe],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent {
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}


