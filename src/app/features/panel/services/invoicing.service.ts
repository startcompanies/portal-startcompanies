import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

const BASE = `${environment.apiUrl || 'http://localhost:3000'}/panel/invoicing`;

export type InvoiceLinePayload = {
  productName?: string;
  description: string;
  unitMeasure?: string;
  qty: number;
  unitPrice: number;
  discountPercent?: number;
};

export type InvoicePayload = {
  currency?: string;
  issueDate?: string;
  dueDate?: string | null;
  taxRate?: number;
  taxLabel?: string | null;
  notes?: string | null;
  billTo?: Record<string, unknown> | null;
  paymentInstructions?: Record<string, unknown> | null;
  status?: string;
  items?: InvoiceLinePayload[];
};

@Injectable({ providedIn: 'root' })
export class InvoicingService {
  constructor(private readonly http: HttpClient) {}

  listInvoices() {
    return firstValueFrom(this.http.get<any[]>(`${BASE}/invoices`, { withCredentials: true }));
  }

  getInvoice(id: number) {
    return firstValueFrom(this.http.get<any>(`${BASE}/invoices/${id}`, { withCredentials: true }));
  }

  createInvoice(payload: InvoicePayload) {
    return firstValueFrom(this.http.post<any>(`${BASE}/invoices`, payload, { withCredentials: true }));
  }

  updateInvoice(id: number, payload: InvoicePayload) {
    return firstValueFrom(
      this.http.patch<any>(`${BASE}/invoices/${id}`, payload, { withCredentials: true }),
    );
  }

  sendInvoice(id: number) {
    return firstValueFrom(this.http.post<any>(`${BASE}/invoices/${id}/send`, {}, { withCredentials: true }));
  }

  addPayment(invoiceId: number, amount: number, method?: string) {
    return firstValueFrom(
      this.http.post(`${BASE}/invoices/${invoiceId}/payments`, { amount, method }, { withCredentials: true }),
    );
  }

  async downloadPdfBlob(invoiceId: number): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`${BASE}/invoices/${invoiceId}/pdf`, {
        withCredentials: true,
        responseType: 'blob',
      }),
    );
  }
}
