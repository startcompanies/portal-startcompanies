import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { ServiceType } from '../../../shared/models/request-flow-context';

// Log para debugging
console.log('[RequestsService] Environment API URL:', environment.apiUrl);

export interface Request {
  id: number;
  uuid?: string;
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  status: 'solicitud-recibida' | 'pendiente' | 'en-proceso' | 'completada' | 'rechazada';
  currentStep?: number; // Paso principal del wizard (1, 2, 3, 4)
  stage?: string; // Etapa actual del blueprint
  workDriveUrlExternal?: string; // URL externa de Zoho WorkDrive
  workDriveId?: string; // ID del recurso en Zoho WorkDrive
  client?: {
    id: number;
    userId?: number; // id del User vinculado al cliente (para validar acceso)
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
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
    scannedPassportUrl?: string;
    ssnItin?: string;
    cuit?: string;
  }>;
  // Propiedades de pago
  paymentMethod?: 'stripe' | 'transferencia' | 'free' | string;
  paymentAmount?: number;
  paymentStatus?: 'pending' | 'succeeded' | 'failed' | string;
  stripeChargeId?: string; // ID del cargo de Stripe
  paymentProofUrl?: string; // URL del comprobante de pago (para transferencias)
  createdFrom?: 'panel' | 'wizard' | string;
  /** Plan del servicio (ej. apertura-llc: Entrepreneur, Elite, Premium). Para validaciones al recargar. */
  plan?: string;
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

/** Respuesta de GET /panel/requests/service-history */
export interface ServiceHistoryItem {
  id: number;
  zohoDealId: string;
  dealName?: string;
  dealType?: string;
  stage?: string;
  status?: string;
  accountName?: string;
  llcPrincipalName?: string;
  closingDate?: string;
  modifiedTimeZoho?: string;
  createdTimeZoho?: string;
  contactEmail?: string;
  partnerPicklist?: string;
  amount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequestsService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/panel/requests`;

  constructor(private http: HttpClient) {
    // Log para debugging
    console.log('[RequestsService] Constructor - API URL configurada:', this.apiUrl);
    console.log('[RequestsService] Constructor - Environment API URL:', environment.apiUrl);
  }

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
   * Historial de servicios (Deals Zoho) para cliente o partner.
   */
  getServiceHistory(clientId?: number): Promise<ServiceHistoryItem[]> {
    let params = new HttpParams();
    if (clientId != null) {
      params = params.set('clientId', String(clientId));
    }
    return firstValueFrom(
      this.http.get<ServiceHistoryItem[]>(`${this.apiUrl}/service-history`, {
        params,
      }),
    );
  }

  /**
   * Obtener una solicitud por UUID
   */
  getRequestByUuid(uuid: string): Promise<Request> {
    return firstValueFrom(
      this.http.get<Request>(`${this.apiUrl}/uuid/${uuid}`)
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
    console.log(`[RequestsService] createRequest - URL: ${this.apiUrl}`);
    console.log(`[RequestsService] createRequest - Environment API URL: ${environment.apiUrl}`);
    console.log(`[RequestsService] createRequest - Data keys:`, Object.keys(data));
    return firstValueFrom(
      this.http.post<Request>(this.apiUrl, data)
    );
  }

  /**
   * Finalizar solicitud: subir firma (si existe) y actualizar estado a solicitud-recibida.
   * Usado al hacer "Enviar solicitud" en el paso de confirmación (panel y wizard).
   */
  async finalizeRequest(
    requestId: number,
    serviceType: ServiceType,
    signatureDataUrl?: string | null
  ): Promise<Request> {
    let signatureUrl: string | null = null;
    if (signatureDataUrl) {
      signatureUrl = await this.uploadSignature(signatureDataUrl, requestId, serviceType);
    }
    const updateData: any = { status: 'solicitud-recibida' as const };
    if (signatureUrl) {
      updateData.signatureUrl = signatureUrl;
    }
    return this.updateRequest(requestId, updateData);
  }

  private async uploadSignature(
    signatureDataUrl: string,
    requestId: number,
    serviceType: ServiceType
  ): Promise<string | null> {
    try {
      const resp = await fetch(signatureDataUrl);
      const blob = await resp.blob();
      const file = new File([blob], `signature-${requestId}-${Date.now()}.png`, { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('servicio', serviceType);
      formData.append('requestUuid', requestId.toString());
      const uploadResponse = await firstValueFrom(
        this.http.post<{ url: string; key: string; message: string }>(
          `${environment.apiUrl}/upload-file`,
          formData
        )
      );
      return uploadResponse?.url || null;
    } catch (e) {
      console.error('[RequestsService] Error al subir firma:', e);
      return null;
    }
  }

  /**
   * Actualizar una solicitud
   */
  updateRequest(id: number, data: any): Promise<Request> {
    console.log(`[RequestsService] updateRequest llamado con ID: ${id}`);
    console.log(`[RequestsService] URL: PATCH ${this.apiUrl}/${id}`);
    console.log(`[RequestsService] Datos a enviar:`, {
      paymentMethod: data.paymentMethod,
      paymentAmount: data.paymentAmount,
      stripeToken: data.stripeToken ? 'presente' : 'ausente',
      paymentProofUrl: data.paymentProofUrl,
      status: data.status,
    });
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

  /**
   * Obtiene las aperturas LLC de un cliente para renovación
   */
  getClientAperturas(clientId?: number, clientEmail?: string): Promise<any[]> {
    if (clientId) {
      return firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/client/${clientId}/aperturas`)
      );
    } else if (clientEmail) {
      return firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/client/email/${encodeURIComponent(clientEmail)}/aperturas`)
      );
    } else {
      return Promise.resolve([]);
    }
  }
}









