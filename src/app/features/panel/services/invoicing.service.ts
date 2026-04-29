import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

const BASE = `${environment.apiUrl || 'http://localhost:3000'}/panel/invoicing`;

@Injectable({ providedIn: 'root' })
export class InvoicingService {
  constructor(private readonly http: HttpClient) {}

  listInvoices() {
    return firstValueFrom(this.http.get<any[]>(`${BASE}/invoices`, { withCredentials: true }));
  }

  createInvoice(payload: Record<string, unknown>) {
    return firstValueFrom(this.http.post(`${BASE}/invoices`, payload, { withCredentials: true }));
  }

  addPayment(invoiceId: number, amount: number, method?: string) {
    return firstValueFrom(
      this.http.post(`${BASE}/invoices/${invoiceId}/payments`, { amount, method }, { withCredentials: true }),
    );
  }
}

