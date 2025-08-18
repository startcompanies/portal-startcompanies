import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-us-proposal',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './us-proposal.component.html',
  styleUrl: './us-proposal.component.css'
})
export class UsProposalComponent {

}
