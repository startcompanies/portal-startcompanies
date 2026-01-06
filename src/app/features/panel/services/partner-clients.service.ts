import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PartnerClient {
  id: number;
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
   * Obtener clientes del admin
   */
  getAdminClients(): Observable<PartnerClient[]> {
    return this.http.get<PartnerClient[]>(`${this.apiUrl}/admin-clients`);
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
   * Eliminar un cliente
   */
  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}









