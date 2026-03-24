import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PanelDashboardSummary {
  totalRequests: number;
  enProceso: number;
  pendientes: number;
  completadas: number;
  totalClients: number;
  totalPartners: number;
  byType: Array<{
    type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
    count: number;
  }>;
  recentRequests: Array<{
    id: number;
    type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
    clientName: string;
    status: string;
    createdAt: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class PanelDashboardService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/panel/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(): Promise<PanelDashboardSummary> {
    return firstValueFrom(this.http.get<PanelDashboardSummary>(this.apiUrl));
  }
}
