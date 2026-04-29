import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl || 'http://localhost:3000'}/panel/catalog`;

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private readonly http: HttpClient) {}

  listItems() {
    return firstValueFrom(this.http.get<any[]>(`${BASE}/items`, { withCredentials: true }));
  }

  createItem(payload: Record<string, unknown>) {
    return firstValueFrom(this.http.post(`${BASE}/items`, payload, { withCredentials: true }));
  }
}

