import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-sc-footer',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './sc-footer.component.html',
  styleUrl: './sc-footer.component.css'
})
export class ScFooterComponent {

}
