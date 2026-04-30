import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { MediaAdminService } from '../../services/media-admin.service';

@Component({
  selector: 'app-admin-media-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  templateUrl: './admin-media-page.component.html',
})
export class AdminMediaPageComponent implements OnInit {
  tab: 'videos' | 'guides' = 'videos';
  videos: any[] = [];
  guides: any[] = [];
  videoForm = { title: '', description: '', videoUrl: '', isPublished: true };
  guideForm = { title: '', content: '', isPublished: true };
  editingVideoId: number | null = null;
  editingGuideId: number | null = null;
  busy = false;

  constructor(private readonly mediaAdmin: MediaAdminService) {}

  async ngOnInit(): Promise<void> {
    await this.reloadVideos();
    await this.reloadGuides();
  }

  setTab(t: 'videos' | 'guides'): void {
    this.tab = t;
  }

  async reloadVideos(): Promise<void> {
    this.videos = await this.mediaAdmin.listVideos();
  }

  async reloadGuides(): Promise<void> {
    this.guides = await this.mediaAdmin.listGuides();
  }

  editVideo(v: any): void {
    this.editingVideoId = v.id;
    this.videoForm = {
      title: v.title,
      description: v.description,
      videoUrl: v.videoUrl,
      isPublished: v.isPublished,
    };
  }

  editGuide(g: any): void {
    this.editingGuideId = g.id;
    this.guideForm = { title: g.title, content: g.content, isPublished: g.isPublished };
  }

  cancelEdit(): void {
    this.editingVideoId = null;
    this.editingGuideId = null;
    this.videoForm = { title: '', description: '', videoUrl: '', isPublished: true };
    this.guideForm = { title: '', content: '', isPublished: true };
  }

  async saveVideo(): Promise<void> {
    this.busy = true;
    try {
      if (this.editingVideoId) {
        await this.mediaAdmin.updateVideo(this.editingVideoId, this.videoForm);
      } else {
        await this.mediaAdmin.createVideo(this.videoForm);
      }
      await this.reloadVideos();
      this.cancelEdit();
    } finally {
      this.busy = false;
    }
  }

  async saveGuide(): Promise<void> {
    this.busy = true;
    try {
      if (this.editingGuideId) {
        await this.mediaAdmin.updateGuide(this.editingGuideId, this.guideForm);
      } else {
        await this.mediaAdmin.createGuide(this.guideForm);
      }
      await this.reloadGuides();
      this.cancelEdit();
    } finally {
      this.busy = false;
    }
  }

  async deleteVideo(id: number): Promise<void> {
    if (!confirm('¿Eliminar video?')) return;
    await this.mediaAdmin.deleteVideo(id);
    await this.reloadVideos();
  }

  async deleteGuide(id: number): Promise<void> {
    if (!confirm('¿Eliminar guía?')) return;
    await this.mediaAdmin.deleteGuide(id);
    await this.reloadGuides();
  }
}
