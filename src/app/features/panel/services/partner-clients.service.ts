import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PartnerClient {
  id: number;
  /** ID en tabla clients para filtrar solicitudes; null si es solo usuario portal sin fila clients */
  requestClientId?: number | null;
  uuid: string;
  partnerId?: number;
  userId?: number;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  status: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerClientDto {
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  partnerId?: number;
  userId?: number;
  status?: boolean;
  notes?: string;
}

export interface UpdatePartnerClientDto {
  full_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  status?: boolean;
  notes?: string;
}

export interface ClientStats {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
}

export interface AdminClientsPage {
  data: PartnerClient[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class PartnerClientsService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/panel/clients`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener los clientes del partner actual
   */
  getMyClients(): Observable<PartnerClient[]> {
    return this.http.get<PartnerClient[]>(`${this.apiUrl}/my-clients`);
  }

  /**
   * Obtener clientes del admin (paginado)
   */
  /**
   * Clientes de un partner con estadísticas (admin y staff).
   */
  getClientsForPartner(partnerId: number): Observable<
    Array<{
      id: number;
      full_name: string;
      email: string;
      totalRequests: number;
      activeRequests: number;
      completedRequests: number;
      createdAt: string;
      lastRequestDate: string | null;
    }>
  > {
    return this.http.get<
      Array<{
        id: number;
        full_name: string;
        email: string;
        totalRequests: number;
        activeRequests: number;
        completedRequests: number;
        createdAt: string;
        lastRequestDate: string | null;
      }>
    >(`${this.apiUrl}/for-partner/${partnerId}`);
  }

  getAdminClients(params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: 'all' | 'active' | 'inactive';
  }): Observable<AdminClientsPage> {
    let httpParams = new HttpParams();
    if (params?.page != null) {
      httpParams = httpParams.set('page', String(params.page));
    }
    if (params?.limit != null) {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    if (params?.q) {
      httpParams = httpParams.set('q', params.q);
    }
    if (params?.status && params.status !== 'all') {
      httpParams = httpParams.set('status', params.status);
    }
    return this.http.get<AdminClientsPage>(`${this.apiUrl}/admin-clients`, {
      params: httpParams,
    });
  }

  /**
   * Obtener un cliente por ID
   */
  getClientById(id: number): Observable<PartnerClient> {
    return this.http.get<PartnerClient>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener un cliente por UUID (envía el UUID en el body para mayor seguridad)
   */
  getClientByUuid(uuid: string): Observable<PartnerClient> {
    return this.http.post<PartnerClient>(`${this.apiUrl}/by-uuid`, { uuid });
  }

  /**
   * Obtener estadísticas de un cliente
   */
  getClientStats(id: number): Observable<ClientStats> {
    return this.http.get<ClientStats>(`${this.apiUrl}/${id}/stats`);
  }

  /**
   * Crear un nuevo cliente
   */
  createClient(clientData: CreatePartnerClientDto): Observable<PartnerClient> {
    return this.http.post<PartnerClient>(`${this.apiUrl}`, clientData);
  }

  /**
   * Actualizar un cliente
   */
  updateClient(id: number, clientData: UpdatePartnerClientDto): Observable<PartnerClient> {
    return this.http.patch<PartnerClient>(`${this.apiUrl}/${id}`, clientData);
  }

  /**
   * Activar/Desactivar un cliente
   */
  toggleClientStatus(id: number): Observable<PartnerClient> {
    return this.http.patch<PartnerClient>(`${this.apiUrl}/${id}/status`, {});
  }

  /**
   * Admin: convertir usuario cliente en partner
   */
  convertClientToPartner(
    id: number,
    body: { phone?: string; listItemUserOnly?: boolean },
  ): Observable<{ user: PartnerClient & { type: string }; message: string }> {
    return this.http.post<{ user: PartnerClient & { type: string }; message: string }>(
      `${this.apiUrl}/${id}/convert-to-partner`,
      body,
    );
  }

  /**
   * Eliminar un cliente
   */
  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}









