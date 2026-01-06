import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SyncRequestToZohoDto {
  requestId: number;
  org?: string;
}

export interface SyncMultipleRequestsDto {
  requestIds: number[];
  org?: string;
}

export interface ImportAccountsResponse {
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  errors: Array<{
    accountId: string;
    accountName: string;
    error: string;
  }>;
  details: Array<{
    created: boolean;
    requestId: number;
    accountId: string;
    accountName: string;
  }>;
}

export interface ImportAccountResponse {
  created: boolean;
  requestId: number;
  accountId: string;
  accountName: string;
}

export interface ImportDealsResponse {
  success: boolean;
  total: number;
  updated: number;
  errors: Array<{
    dealId: string;
    dealName: string;
    error: string;
  }>;
}

export interface FullSyncResponse {
  success: boolean;
  accounts: ImportAccountsResponse;
  deals?: ImportDealsResponse; // Deprecated: Los deals se procesan automáticamente con cada Account
  message?: string; // Mensaje informativo sobre el proceso
}

export interface SyncRequestResponse {
  success: boolean;
  accountId: string;
  dealId?: string;
  primaryContactId: string | null;
  contactIds: string[];
  requestId: number;
}

export interface SyncMultipleRequestsResponse {
  success: boolean;
  synced: number;
  failed: number;
  results: Array<{
    requestId: number;
    [key: string]: any;
  }>;
  errors: Array<{
    requestId: number;
    error: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ZohoSyncService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/zoho-sync`;

  constructor(private http: HttpClient) {}

  /**
   * Sincronizar una solicitud completa a Zoho CRM
   */
  syncRequestToZoho(data: SyncRequestToZohoDto): Observable<SyncRequestResponse> {
    return this.http.post<SyncRequestResponse>(`${this.apiUrl}/sync-request`, data);
  }

  /**
   * Sincronizar una solicitud por ID a Zoho CRM
   */
  syncRequestById(requestId: number, org?: string): Observable<SyncRequestResponse> {
    let params = new HttpParams();
    if (org) {
      params = params.set('org', org);
    }
    return this.http.post<SyncRequestResponse>(`${this.apiUrl}/sync-request/${requestId}`, {}, { params });
  }

  /**
   * Sincronizar múltiples solicitudes a Zoho CRM
   */
  syncMultipleRequests(data: SyncMultipleRequestsDto): Observable<SyncMultipleRequestsResponse> {
    return this.http.post<SyncMultipleRequestsResponse>(`${this.apiUrl}/sync-multiple-requests`, data);
  }

  /**
   * Importar Accounts desde Zoho CRM
   */
  importAccounts(org?: string, limit: number = 200, offset: number = 0): Observable<ImportAccountsResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    if (org) {
      params = params.set('org', org);
    }
    return this.http.get<ImportAccountsResponse>(`${this.apiUrl}/import/accounts`, { params });
  }

  /**
   * Importar un Account específico desde Zoho CRM
   */
  importAccountById(accountId: string, org?: string): Observable<ImportAccountResponse> {
    let params = new HttpParams();
    if (org) {
      params = params.set('org', org);
    }
    return this.http.post<ImportAccountResponse>(`${this.apiUrl}/import/account/${accountId}`, {}, { params });
  }

  /**
   * Importar Deals desde Zoho CRM y actualizar status de Requests
   */
  importDeals(org?: string, limit: number = 200): Observable<ImportDealsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (org) {
      params = params.set('org', org);
    }
    return this.http.get<ImportDealsResponse>(`${this.apiUrl}/import/deals`, { params });
  }

  /**
   * Sincronización completa: importa Accounts y Deals
   */
  fullSync(org?: string, accountsLimit: number = 200, dealsLimit: number = 200): Observable<FullSyncResponse> {
    let params = new HttpParams()
      .set('accountsLimit', accountsLimit.toString())
      .set('dealsLimit', dealsLimit.toString());
    if (org) {
      params = params.set('org', org);
    }
    return this.http.post<FullSyncResponse>(`${this.apiUrl}/import/full-sync`, {}, { params });
  }
}








