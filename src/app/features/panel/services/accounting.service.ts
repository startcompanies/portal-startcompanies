import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl || 'http://localhost:3000'}/panel/accounting`;

@Injectable({ providedIn: 'root' })
export class AccountingService {
  constructor(private readonly http: HttpClient) {}

  importCsv(payload: { bankAccountId: number; importedByUserId: number; fileName: string; csv: string }) {
    return firstValueFrom(this.http.post(`${BASE}/imports/csv`, payload, { withCredentials: true }));
  }

  getProfitAndLoss(fromDate: string, toDate: string) {
    return firstValueFrom(
      this.http.get(`${BASE}/pl`, { withCredentials: true, params: { fromDate, toDate } }),
    );
  }
}

