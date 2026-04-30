import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

const BASE = `${environment.apiUrl || 'http://localhost:3000'}/panel/accounting`;

@Injectable({ providedIn: 'root' })
export class AccountingService {
  constructor(private readonly http: HttpClient) {}

  previewCsv(csv: string) {
    return firstValueFrom(
      this.http.post<any>(`${BASE}/imports/preview`, { csv }, { withCredentials: true }),
    );
  }

  importCsv(body: { bankAccountId?: number; importedByUserId?: number; fileName: string; csv: string }) {
    return firstValueFrom(this.http.post(`${BASE}/imports/csv`, body, { withCredentials: true }));
  }

  listCategories() {
    return firstValueFrom(this.http.get<any>(`${BASE}/categories`, { withCredentials: true }));
  }

  listTransactions(uncategorized: boolean) {
    const q = uncategorized ? '?uncategorized=1' : '?uncategorized=0';
    return firstValueFrom(this.http.get<any[]>(`${BASE}/transactions${q}`, { withCredentials: true }));
  }

  patchTransaction(
    id: number,
    body: {
      categoryId?: number | null;
      accountCode?: string | null;
      accountingDate?: string | null;
      invoiceMatchNote?: string | null;
    },
  ) {
    return firstValueFrom(
      this.http.patch(`${BASE}/transactions/${id}`, body, { withCredentials: true }),
    );
  }

  suggestCategory(description: string) {
    return firstValueFrom(
      this.http.post<any>(`${BASE}/suggest-category`, { description }, { withCredentials: true }),
    );
  }

  getProfitAndLoss(fromDate: string, toDate: string) {
    return firstValueFrom(
      this.http.get<any>(`${BASE}/pl`, {
        params: { fromDate, toDate },
        withCredentials: true,
      }),
    );
  }

  downloadPlCsv(fromDate: string, toDate: string) {
    return firstValueFrom(
      this.http.get(`${BASE}/pl/export.csv`, {
        params: { fromDate, toDate },
        withCredentials: true,
        responseType: 'blob',
      }),
    );
  }
}
