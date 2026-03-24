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

/** Respuesta de POST /zoho-sync/import/deal-timeline */
export interface ImportDealTimelineResponse {
  success: boolean;
  upserted: number;
  errors: Array<{ dealId?: string; error: string }>;
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

/** Alineado con el backend (zoho-sync.dto) */
export interface ZohoImportFullSyncMeta {
  batchIndex: number;
  batchOffset: number;
  estimatedTotal?: number;
}

export type ZohoImportAccountsProgressEvent =
  | { phase: 'count'; totalAccounts: number }
  | { phase: 'prefetch_list'; accumulated: number }
  | { phase: 'list_ready'; totalAccounts: number }
  | {
      phase: 'coql';
      pageTotal: number;
      offset: number;
      limit: number;
      fullSync?: ZohoImportFullSyncMeta;
    }
  | {
      phase: 'fetch_detail' | 'import';
      current: number;
      total: number;
      accountId: string;
      accountName?: string;
      fullSync?: ZohoImportFullSyncMeta;
    };

type ZohoImportNdjsonLine =
  | { type: 'progress'; data: ZohoImportAccountsProgressEvent }
  | { type: 'done'; payload: unknown }
  | { type: 'error'; message: string };

@Injectable({
  providedIn: 'root'
})
export class ZohoSyncService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/zoho-sync`;

  constructor(private http: HttpClient) {}

  /**
   * Importar Accounts con stream NDJSON (progreso). Usa fetch + cookies (no pasa por HttpClient).
   */
  async importAccountsStream(
    org: string | undefined,
    limit: number,
    offset: number,
    onProgress: (data: ZohoImportAccountsProgressEvent) => void,
  ): Promise<ImportAccountsResponse> {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (org) {
      params.set('org', org);
    }
    const url = `${this.apiUrl}/import/accounts-stream?${params.toString()}`;
    return this.consumeZohoNdjsonStream<ImportAccountsResponse>(url, { method: 'GET' }, onProgress);
  }

  /**
   * Sincronización completa con stream NDJSON (progreso).
   */
  async fullSyncStream(
    org: string | undefined,
    onProgress: (data: ZohoImportAccountsProgressEvent) => void,
  ): Promise<FullSyncResponse> {
    const params = new URLSearchParams();
    if (org) {
      params.set('org', org);
    }
    const q = params.toString();
    const url = `${this.apiUrl}/import/full-sync-stream${q ? `?${q}` : ''}`;
    return this.consumeZohoNdjsonStream<FullSyncResponse>(
      url,
      { method: 'POST' },
      onProgress,
    );
  }

  private async consumeZohoNdjsonStream<T>(
    url: string,
    init: RequestInit,
    onProgress: (data: ZohoImportAccountsProgressEvent) => void,
  ): Promise<T> {
    const res = await fetch(url, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/x-ndjson, application/json',
        ...(init.headers as Record<string, string>),
      },
    });
    if (!res.ok) {
      let detail = '';
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
      throw new Error(detail || `Error HTTP ${res.status}`);
    }
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Respuesta sin cuerpo');
    }
    const decoder = new TextDecoder();
    let buffer = '';
    let finalPayload: T | undefined;
    const handleLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }
      let parsed: ZohoImportNdjsonLine;
      try {
        parsed = JSON.parse(trimmed) as ZohoImportNdjsonLine;
      } catch {
        return;
      }
      if (parsed.type === 'progress') {
        onProgress(parsed.data);
      } else if (parsed.type === 'done') {
        finalPayload = parsed.payload as T;
      } else if (parsed.type === 'error') {
        throw new Error(parsed.message);
      }
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        handleLine(line);
      }
    }
    if (buffer.trim()) {
      handleLine(buffer);
    }
    if (finalPayload === undefined) {
      throw new Error('La respuesta terminó sin resultado');
    }
    return finalPayload;
  }

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

  /**
   * Importa Deals a la tabla de historial del portal (una fila por Deal).
   */
  importDealTimeline(
    org?: string,
    limit: number = 200,
    maxPages?: number,
  ): Observable<ImportDealTimelineResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    if (org) {
      params = params.set('org', org);
    }
    if (maxPages != null && Number.isFinite(maxPages)) {
      params = params.set('maxPages', String(maxPages));
    }
    return this.http.post<ImportDealTimelineResponse>(
      `${this.apiUrl}/import/deal-timeline`,
      {},
      { params },
    );
  }
}








