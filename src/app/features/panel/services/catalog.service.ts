import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl || 'http://localhost:3000'}/panel/catalog`;

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private readonly http: HttpClient) {}

  listMyItems() {
    return firstValueFrom(this.http.get<any[]>(`${BASE}/my/items`, { withCredentials: true }));
  }

  lookupForInvoice() {
    return firstValueFrom(
      this.http.get<any[]>(`${BASE}/my/lookup/invoicing`, { withCredentials: true }),
    );
  }

  createItem(payload: {
    name: string;
    description?: string;
    unitMeasure?: string;
    unitPriceUsd?: number;
  }) {
    return firstValueFrom(this.http.post(`${BASE}/my/items`, payload, { withCredentials: true }));
  }

  updateItem(
    id: number,
    payload: {
      name?: string;
      description?: string;
      unitMeasure?: string;
      unitPriceUsd?: number;
      active?: boolean;
    },
  ) {
    return firstValueFrom(this.http.patch(`${BASE}/my/items/${id}`, payload, { withCredentials: true }));
  }

  deleteItem(id: number) {
    return firstValueFrom(this.http.delete(`${BASE}/my/items/${id}`, { withCredentials: true }));
  }
}
