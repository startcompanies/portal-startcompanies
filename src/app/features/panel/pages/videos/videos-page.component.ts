import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MediaPremiumService } from '../../services/media-premium.service';

@Component({
  selector: 'app-videos-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <h5>Videos premium</h5>
      <div class="card mb-2" *ngFor="let video of videos">
        <div class="card-body">
          <strong>{{ video.title }}</strong>
          <p class="mb-0">{{ video.description }}</p>
        </div>
      </div>
    </section>
  `,
})
export class VideosPageComponent implements OnInit {
  videos: any[] = [];

  constructor(private readonly mediaService: MediaPremiumService) {}

  async ngOnInit(): Promise<void> {
    this.videos = await this.mediaService.listVideos();
  }
}

