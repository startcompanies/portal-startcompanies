import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MediaPremiumService } from '../../services/media-premium.service';

@Component({
  selector: 'app-guias-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <h5>Guias LLC</h5>
      <div class="card mb-2" *ngFor="let guide of guides">
        <div class="card-body">
          <strong>{{ guide.title }}</strong>
        </div>
      </div>
    </section>
  `,
})
export class GuiasPageComponent implements OnInit {
  guides: any[] = [];

  constructor(private readonly mediaService: MediaPremiumService) {}

  async ngOnInit(): Promise<void> {
    this.guides = await this.mediaService.listGuides();
  }
}

