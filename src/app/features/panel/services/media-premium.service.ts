import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl || 'http://localhost:3000'}/panel/media`;

@Injectable({ providedIn: 'root' })
export class MediaPremiumService {
  constructor(private readonly http: HttpClient) {}

  listVideos() {
    return firstValueFrom(this.http.get<any[]>(`${BASE}/videos`, { withCredentials: true }));
  }

  listGuides() {
    return firstValueFrom(this.http.get<any[]>(`${BASE}/guides`, { withCredentials: true }));
  }
}

