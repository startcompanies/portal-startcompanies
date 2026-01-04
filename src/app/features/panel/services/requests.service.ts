import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface Request {
  id: number;
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  status: 'solicitud-recibida' | 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  stage?: string; // Etapa actual del blueprint
  workDriveUrlExternal?: string; // URL externa de Zoho WorkDrive
  client?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  partner?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  clientId: number;
  partnerId?: number;
  notes?: string;
  zohoAccountId?: string;
  createdAt: string;
  updatedAt: string;
  aperturaLlcRequest?: any;
  renovacionLlcRequest?: any;
  cuentaBancariaRequest?: any;
  zohoAccount?: any; // Datos completos del Account de Zoho
  zohoDeal?: {
    Deal_Name?: string;
    Type?: string;
    Stage?: string;
    Account_Name?: any;
    Contact_Name?: any;
    Created_Time?: string;
    Modified_Time?: string;
  };
  dealStages?: Array<{
    display_value?: string;
    sequence_number?: number;
    probability?: number;
    expected_revenue?: number;
    actual_amount?: number;
  }>;
  members?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    passportNumber: string;
    nationality: string;
    dateOfBirth: string;
    email: string;
    phoneNumber: string;
    memberAddress: {
      street: string;
      unit?: string;
      city: string;
      stateRegion: string;
      postalCode: string;
      country: string;
    };
    percentageOfParticipation: number;
    validatesBankAccount: boolean;
  }>;
}

export interface RequestFilters {
  status?: 'solicitud-recibida' | 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  type?: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  clientId?: number;
  partnerId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequestsService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/panel/requests`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las solicitudes con filtros opcionales y paginación (solo admin)
   */
  getAllRequests(filters?: RequestFilters): Promise<PaginatedResponse<Request>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.type) {
        params = params.set('type', filters.type);
      }
      if (filters.clientId) {
        params = params.set('clientId', filters.clientId.toString());
      }
      if (filters.partnerId) {
        params = params.set('partnerId', filters.partnerId.toString());
      }
      if (filters.search && filters.search.trim().length > 0) {
        params = params.set('search', filters.search.trim());
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
    }

    return firstValueFrom(
      this.http.get<PaginatedResponse<Request>>(this.apiUrl, { params })
    );
  }

  /**
   * Obtener solicitudes del usuario actual
   */
  getMyRequests(role?: 'client' | 'partner'): Promise<Request[]> {
    let params = new HttpParams();
    if (role) {
      params = params.set('role', role);
    }

    return firstValueFrom(
      this.http.get<Request[]>(`${this.apiUrl}/me`, { params })
    );
  }

  /**
   * Obtener una solicitud por ID
   */
  getRequestById(id: number): Promise<Request> {
    return firstValueFrom(
      this.http.get<Request>(`${this.apiUrl}/${id}`)
    );
  }

  /**
   * Crear una nueva solicitud
   */
  createRequest(data: any): Promise<Request> {
    return firstValueFrom(
      this.http.post<Request>(this.apiUrl, data)
    );
  }

  /**
   * Actualizar una solicitud
   */
  updateRequest(id: number, data: any): Promise<Request> {
    return firstValueFrom(
      this.http.patch<Request>(`${this.apiUrl}/${id}`, data)
    );
  }

  /**
   * Eliminar una solicitud
   */
  deleteRequest(id: number): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}`)
    );
  }

  /**
   * Aprobar una solicitud (solo admin)
   */
  approveRequest(id: number, initialStage?: string, notes?: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/${id}/approve`, {
        initialStage,
        notes,
      })
    );
  }

  /**
   * Rechazar una solicitud (solo admin)
   */
  rejectRequest(id: number, notes?: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/${id}/reject`, {
        notes,
      })
    );
  }

  /**
   * Obtener documentos requeridos por tipo de solicitud
   */
  getRequiredDocuments(
    type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria',
    llcType?: 'single' | 'multi'
  ): Promise<any> {
    let params = new HttpParams().set('type', type);
    if (llcType) {
      params = params.set('llcType', llcType);
    }

    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/required-documents`, { params })
    );
  }
}






