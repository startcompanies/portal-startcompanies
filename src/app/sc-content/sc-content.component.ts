import { Component } from '@angular/core';
import { ScHeaderComponent } from '../sc-header/sc-header.component';
import { ScFooterComponent } from '../sc-footer/sc-footer.component';

@Component({
  selector: 'app-sc-content',
  standalone: true,
  imports: [
    ScHeaderComponent,
    ScFooterComponent
  ],
  templateUrl: './sc-content.component.html',
  styleUrl: './sc-content.component.css'
})
export class ScContentComponent {

}
