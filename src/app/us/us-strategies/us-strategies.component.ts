import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
  
@Component({
  selector: 'app-us-strategies',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './us-strategies.component.html',
  styleUrl: './us-strategies.component.css'
})
export class UsStrategiesComponent {

}
