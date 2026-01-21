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

/**
 * Servicio para comunicarse con los endpoints del wizard en el backend
 * Endpoints:
 * - POST /wizard/requests/register - Registrar usuario
 * - POST /wizard/requests/confirm-email - Confirmar email y obtener tokens
 * - POST /wizard/requests - Crear solicitud (requiere autenticación)
 * - PATCH /wizard/requests/:id - Actualizar solicitud (requiere autenticación)
 */
@Injectable({
  providedIn: 'root'
})
export class WizardApiService {
  private apiUrl = `${environment.apiUrl}/wizard/requests`;
  
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
   * Carga el token guardado en localStorage si existe
   */
  private loadStoredToken(): void {
    const storedData = localStorage.getItem('wizard_auth');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.accessToken && data.user) {
          this.accessTokenSubject.next(data.accessToken);
          this.userDataSubject.next(data.user);
        }
      } catch (e) {
        console.error('[WizardApiService] Error loading stored token:', e);
      }
    }
  }

  /**
   * Guarda el token en localStorage
   */
  private storeToken(accessToken: string, refreshToken: string, user: WizardConfirmEmailResponse['user']): void {
    localStorage.setItem('wizard_auth', JSON.stringify({
      accessToken,
      refreshToken,
      user,
      timestamp: Date.now()
    }));
  }

  /**
   * Limpia el token guardado
   */
  clearToken(): void {
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
}
