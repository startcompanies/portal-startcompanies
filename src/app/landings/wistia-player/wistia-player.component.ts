import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { LazyWistiaDirective } from '../../shared/directives/lazy-wistia.directive';

@Component({
  selector: 'app-wistia-player',
  standalone: true,
  imports: [LazyWistiaDirective],
  templateUrl: './wistia-player.component.html',
  styleUrl: './wistia-player.component.css',
})
export class WistiaPlayerComponent {
  @Input() mediaId!: string;
}
