import { Component } from '@angular/core';
import { HeaderManejoComponent } from '../../manejo-llc/header-manejo/header-manejo.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [HeaderManejoComponent, ScFooterComponent, TranslocoPipe],
  templateUrl: './terms-and-conditions.component.html',
  styleUrls: ['./terms-and-conditions.component.css']
})
export class TermsAndConditionsComponent {}


