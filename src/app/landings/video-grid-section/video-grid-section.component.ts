import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { WistiaPlayerComponent } from "../wistia-player/wistia-player.component";

@Component({
  selector: 'app-video-grid-section',
  standalone: true,
  imports: [CommonModule, WistiaPlayerComponent],
  templateUrl: './video-grid-section.component.html',
  styleUrl: './video-grid-section.component.css',
})
export class VideoGridSectionComponent {
  @Input() title: string = '';
  @Input() titleHighlight: string = '';
  @Input() description: string = '';
  @Input() maxVideosPerRow: number = 3;
}
