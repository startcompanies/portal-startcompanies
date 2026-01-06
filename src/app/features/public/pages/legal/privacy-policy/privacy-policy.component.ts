import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  scrollToSection(sectionId: string): void {
    // Solo ejecutar en el navegador (no en SSR)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}


