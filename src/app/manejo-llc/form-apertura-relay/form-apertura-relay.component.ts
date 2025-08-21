import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { HeaderManejoComponent } from "../header-manejo/header-manejo.component";
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';

@Component({
  selector: 'app-form-apertura-relay',
  standalone: true,
  imports: [ScFooterComponent, HeaderManejoComponent, SeoBaseComponent],
  templateUrl: './form-apertura-relay.component.html',
  styleUrl: './form-apertura-relay.component.css',
})
export class FormAperturaRelayComponent {
  openUrl(url: string) {
    window.open(url, '_blank');
  }
}
