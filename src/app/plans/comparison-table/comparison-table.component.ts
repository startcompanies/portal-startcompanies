import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-comparison-table',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './comparison-table.component.html',
  styleUrl: './comparison-table.component.css'
})
export class ComparisonTableComponent {

}
