import { Component } from '@angular/core';
import { ScHeaderComponent } from '../../sc-header/sc-header.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';

@Component({
  selector: 'app-form-apertura-relay',
  standalone: true,
  imports: [ScHeaderComponent, ScFooterComponent],
  templateUrl: './form-apertura-relay.component.html',
  styleUrl: './form-apertura-relay.component.css',
})
export class FormAperturaRelayComponent {
  openUrl(url: string) {
    window.open(url, '_blank');
  }
}
