import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-plans-container',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './plans-container.component.html',
  styleUrl: './plans-container.component.css'
})
export class PlansContainerComponent {

}
