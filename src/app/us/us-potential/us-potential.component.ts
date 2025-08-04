import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-us-potential',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './us-potential.component.html',
  styleUrl: './us-potential.component.css'
})
export class UsPotentialComponent {

}
