import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YoutubePlayerComponent } from '../youtube-player/youtube-player.component';

@Component({
  selector: 'app-video-section',
  standalone: true,
  imports: [CommonModule, YoutubePlayerComponent],
  templateUrl: './video-section.component.html',
  styleUrls: ['./video-section.component.css'],
})
export class VideoSectionComponent {
  @Input() subtitle: string = '';
  @Input() title: string = '';
  @Input() titleHighlight: string = '';
  @Input() description: string = '';
  @Input() videoUrl: string = '';
  @Input() videoTitle: string = 'Video';

  get videoId(): string | null {
    if (!this.videoUrl) return null;

    // Casos como: https://youtu.be/ID
    const shortUrlMatch = this.videoUrl.match(/youtu\.be\/([^?&]+)/);
    if (shortUrlMatch) return shortUrlMatch[1];

    // Casos como: https://www.youtube.com/watch?v=ID
    const longUrlMatch = this.videoUrl.match(/v=([^?&]+)/);
    if (longUrlMatch) return longUrlMatch[1];

    // Casos como: https://www.youtube.com/embed/ID
    const embedUrlMatch = this.videoUrl.match(/embed\/([^?&]+)/);
    if (embedUrlMatch) return embedUrlMatch[1];

    return null;
  }
}
