import { Component, Input } from '@angular/core';
import { LazyWistiaDirective } from '../../shared/directives/lazy-wistia.directive';

@Component({
  selector: 'app-wistia-vertical-player',
  standalone: true,
  imports: [LazyWistiaDirective],
  templateUrl: './wistia-vertical-player.component.html',
  styleUrl: './wistia-vertical-player.component.css'
})
export class WistiaVerticalPlayerComponent {
  @Input() mediaId!: string;
}
