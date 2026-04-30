import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

const BASE = `${environment.apiUrl || 'http://localhost:3000'}/panel/media`;

@Injectable({ providedIn: 'root' })
export class MediaAdminService {
  constructor(private readonly http: HttpClient) {}

  listVideos() {
    return firstValueFrom(this.http.get<any[]>(`${BASE}/admin/videos`, { withCredentials: true }));
  }

  createVideo(body: { title: string; description: string; videoUrl: string; isPublished?: boolean }) {
    return firstValueFrom(this.http.post(`${BASE}/admin/videos`, body, { withCredentials: true }));
  }

  updateVideo(id: number, body: Partial<{ title: string; description: string; videoUrl: string; isPublished: boolean }>) {
    return firstValueFrom(this.http.patch(`${BASE}/admin/videos/${id}`, body, { withCredentials: true }));
  }

  deleteVideo(id: number) {
    return firstValueFrom(this.http.delete(`${BASE}/admin/videos/${id}`, { withCredentials: true }));
  }

  listGuides() {
    return firstValueFrom(this.http.get<any[]>(`${BASE}/admin/guides`, { withCredentials: true }));
  }

  createGuide(body: { title: string; content: string; isPublished?: boolean }) {
    return firstValueFrom(this.http.post(`${BASE}/admin/guides`, body, { withCredentials: true }));
  }

  updateGuide(id: number, body: Partial<{ title: string; content: string; isPublished: boolean }>) {
    return firstValueFrom(this.http.patch(`${BASE}/admin/guides/${id}`, body, { withCredentials: true }));
  }

  deleteGuide(id: number) {
    return firstValueFrom(this.http.delete(`${BASE}/admin/guides/${id}`, { withCredentials: true }));
  }
}
