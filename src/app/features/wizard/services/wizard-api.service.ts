import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface WizardRegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface WizardRegisterResponse {
  message: string;
  email: string;
  id: number;
}

export interface WizardConfirmEmailData {
  email: string;
  confirmationToken: string;
}

export interface WizardConfirmEmailResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    status: boolean;
    type: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export interface WizardClientData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface WizardCreateRequestData {
  type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria';
  currentStepNumber: number;
  currentStep?: number;
  status?: string;
  notes?: string;
  stripeToken: string;
  paymentAmount: number;
  paymentMethod: 'stripe' | 'transferencia';
  paymentProofUrl?: string;
  clientData: WizardClientData;
  aperturaLlcData?: any;
  renovacionLlcData?: any;
  cuentaBancariaData?: any;
}

export interface WizardRequestResponse {
  id: number;
  type: string;
  status: string;
  payment: {
    chargeId: string;
    amount: number;
    currency: string;
    status: string;
    paid: boolean;
    receiptUrl: string;
  };
}

export interface EmailAvailabilityResponse {
  available: boolean;
  message: string;
  emailVerified?: boolean;
}

/**
 * Servicio para comunicarse con los endpoints del wizard en el backend (apiUrl).
 * Todas las validaciones y solicitudes usan environment.apiUrl.
 *
 * Endpoints:
 * - GET  {apiUrl}/wizard/requests/check-email - Verificar disponibilidad de email
 * - POST {apiUrl}/wizard/requests/register - Registrar usuario
 * - POST {apiUrl}/wizard/requests/confirm-email - Confirmar email y obtener tokens
 * - POST {apiUrl}/wizard/requests - Crear solicitud (requiere autenticación)
 * - PATCH {apiUrl}/wizard/requests/:id - Actualizar solicitud (requiere autenticación)
 * - POST {apiUrl}/upload-file - Subir archivos (comprobantes, pasaportes, etc.)
 */
@Injectable({
  providedIn: 'root'
})
export class WizardApiService {
  /** Base URL de la API (environment.apiUrl). Todas las peticiones del wizard usan esta base. */
  private readonly baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/wizard/requests`;
  
  // Estado de autenticación del wizard
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private userDataSubject = new BehaviorSubject<WizardConfirmEmailResponse['user'] | null>(null);
  
  accessToken$ = this.accessTokenSubject.asObservable();
  userData$ = this.userDataSubject.asObservable();

  constructor(private http: HttpClient) {
    // Intentar recuperar token guardado
    this.loadStoredToken();
  }

  /**
   * Carga el token guardado en sessionStorage si existe
   * Usamos sessionStorage para tokens por seguridad (se borra al cerrar el navegador)
   */
  private loadStoredToken(): void {
    const storedData = sessionStorage.getItem('wizard_auth');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.accessToken && data.user) {
          // Verificar que el token no haya expirado (si tiene exp)
          const token = data.accessToken;
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              // Token expirado, limpiar
              this.clearToken();
              return;
            }
          } catch (e) {
            // Si no se puede decodificar, asumir que es válido
          }
          
          this.accessTokenSubject.next(data.accessToken);
          this.userDataSubject.next(data.user);
        }
      } catch (e) {
        console.error('[WizardApiService] Error loading stored token:', e);
        this.clearToken();
      }
    }
  }

  /**
   * Guarda el token en sessionStorage
   * sessionStorage es más seguro para tokens porque se borra al cerrar el navegador
   * Esto previene que tokens queden expuestos en dispositivos compartidos
   */
  private storeToken(accessToken: string, refreshToken: string, user: WizardConfirmEmailResponse['user']): void {
    sessionStorage.setItem('wizard_auth', JSON.stringify({
      accessToken,
      refreshToken,
      user,
      timestamp: Date.now()
    }));
  }

  /**
   * Limpia el token guardado (tanto sessionStorage como localStorage por si acaso)
   */
  clearToken(): void {
    sessionStorage.removeItem('wizard_auth');
    // Limpiar también localStorage por si había datos antiguos
    localStorage.removeItem('wizard_auth');
    this.accessTokenSubject.next(null);
    this.userDataSubject.next(null);
  }

  /**
   * Obtiene los headers con autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.accessTokenSubject.value;
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders();
  }

  /**
   * Verifica si el usuario está autenticado en el wizard
   */
  isAuthenticated(): boolean {
    return !!this.accessTokenSubject.value;
  }

  /**
   * Obtiene los datos del usuario autenticado
   */
  getUser(): WizardConfirmEmailResponse['user'] | null {
    return this.userDataSubject.value;
  }

  /**
   * Verifica si un email está disponible para registro
   * GET /wizard/requests/check-email?email=...
   */
  checkEmailAvailability(email: string): Observable<EmailAvailabilityResponse> {
    return this.http.get<EmailAvailabilityResponse>(`${this.apiUrl}/check-email`, {
      params: { email }
    });
  }

  /**
   * Registra un nuevo usuario en el flujo wizard
   * POST /wizard/requests/register
   */
  register(data: WizardRegisterData): Observable<WizardRegisterResponse> {
    console.log('[WizardApiService] Registrando usuario:', data.email);
    return this.http.post<WizardRegisterResponse>(`${this.apiUrl}/register`, data);
  }

  /**
   * Confirma el email del usuario usando el código de verificación
   * POST /wizard/requests/confirm-email
   * Retorna tokens de acceso para continuar el flujo
   */
  confirmEmail(data: WizardConfirmEmailData): Observable<WizardConfirmEmailResponse> {
    console.log('[WizardApiService] Confirmando email:', data.email);
    return this.http.post<WizardConfirmEmailResponse>(`${this.apiUrl}/confirm-email`, data).pipe(
      tap(response => {
        // Guardar tokens y datos del usuario
        this.accessTokenSubject.next(response.accessToken);
        this.userDataSubject.next(response.user);
        this.storeToken(response.accessToken, response.refreshToken, response.user);
        console.log('[WizardApiService] Email confirmado, tokens guardados');
      })
    );
  }

  /**
   * Crea una solicitud desde el wizard
   * POST /wizard/requests
   * Requiere autenticación (token obtenido de confirmEmail)
   */
  createRequest(data: WizardCreateRequestData): Observable<WizardRequestResponse> {
    console.log('[WizardApiService] Creando solicitud:', data.type);
    const headers = this.getAuthHeaders();
    return this.http.post<WizardRequestResponse>(this.apiUrl, data, { headers });
  }

  /**
   * Actualiza una solicitud del wizard
   * PATCH /wizard/requests/:id
   * Requiere autenticación
   */
  updateRequest(id: number, data: any): Observable<any> {
    console.log('[WizardApiService] Actualizando solicitud:', id);
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.apiUrl}/${id}`, data, { headers });
  }

  /**
   * Sube un archivo al backend (apiUrl).
   * POST {apiUrl}/upload-file
   * Usado por flow-llc, flow-renovacion, payment-step e información de servicio.
   */
  uploadFile(formData: FormData): Observable<{ url: string; key: string; message: string }> {
    return this.http.post<{ url: string; key: string; message: string }>(
      `${this.baseUrl}/upload-file`,
      formData
    );
  }
}
