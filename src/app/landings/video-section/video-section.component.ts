import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WistiaPlayerComponent } from "../wistia-player/wistia-player.component";

@Component({
  selector: 'app-video-section',
  standalone: true,
  imports: [CommonModule, WistiaPlayerComponent],
  templateUrl: './video-section.component.html',
  styleUrls: ['./video-section.component.css'],
})
export class VideoSectionComponent{
  @Input() subtitle: string = '';
  @Input() title: string = '';
  @Input() titleHighlight: string = '';
  @Input() description: string = '';
  @Input() videoUrl: string = '';
  @Input() videoTitle: string = 'Video';
  @Input() videoId: string = '';
}
