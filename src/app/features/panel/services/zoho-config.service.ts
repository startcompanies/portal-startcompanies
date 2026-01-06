import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ZohoConfig {
  id: number;
  org: string;
  service: string;
  region: string;
  scopes: string;
  client_id: string;
  client_secret: string;
  refresh_token?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZohoConfigDto {
  org: string;
  service: string;
  region: string;
  scopes: string;
  client_id: string;
  client_secret: string;
  refresh_token?: string;
}

export interface UpdateZohoConfigDto {
  org?: string;
  service?: string;
  region?: string;
  scopes?: string;
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
}

export interface AuthorizationUrlResponse {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZohoConfigService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/orgTk`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las configuraciones
   */
  getAllConfigs(): Observable<ZohoConfig[]> {
    return this.http.get<ZohoConfig[]>(this.apiUrl);
  }

  /**
   * Buscar configuración por org y service
   */
  getConfigByOrgAndService(org: string, service: string): Observable<ZohoConfig> {
    const params = new HttpParams()
      .set('org', org)
      .set('service', service);
    return this.http.get<ZohoConfig>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Obtener configuración por ID
   */
  getConfigById(id: number): Observable<ZohoConfig> {
    return this.http.get<ZohoConfig>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nueva configuración
   */
  createConfig(config: ZohoConfigDto): Observable<ZohoConfig> {
    return this.http.post<ZohoConfig>(this.apiUrl, config);
  }

  /**
   * Actualizar configuración
   */
  updateConfig(id: number, config: UpdateZohoConfigDto): Observable<ZohoConfig> {
    return this.http.put<ZohoConfig>(`${this.apiUrl}/${id}`, config);
  }

  /**
   * Eliminar configuración
   */
  deleteConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener URL de autorización OAuth
   */
  getAuthorizationUrl(
    org: string,
    service: string,
    region: string,
    client_id: string,
    client_secret: string,
    scopes: string
  ): Observable<AuthorizationUrlResponse> {
    const params = new HttpParams()
      .set('org', org)
      .set('service', service)
      .set('region', region)
      .set('client_id', client_id)
      .set('client_secret', client_secret)
      .set('scopes', scopes);
    
    return this.http.get<AuthorizationUrlResponse>(`${this.apiUrl}/redirect`, { params });
  }
}







