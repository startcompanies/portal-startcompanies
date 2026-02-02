import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BrowserService } from '../../../shared/services/browser.service';

export interface User {
  id: number;
  username: string;
  email: string;
  status: boolean;
  type: 'client' | 'partner' | 'admin';
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  bio?: string;
}

export interface AuthResponse {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';

  constructor(
    private http: HttpClient,
    private router: Router,
    private browser: BrowserService
  ) {
    // Solo cargar usuario desde storage si estamos en el navegador
    if (this.browser.isBrowser) {
      this.loadUserFromStorage();
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, credentials).pipe(
      tap(response => {
        this.setToken(response.token);
        this.loadUserFromToken(response.token);
      })
    );
  }

  register(data: RegisterData): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/signup`, data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      token,
      newPassword
    });
  }

  /**
   * Envía email de verificación al usuario recién registrado
   */
  sendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-verification-email`, { email });
  }

  /**
   * Verifica el email del usuario usando el token recibido por correo
   */
  verifyEmail(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-email`, { token }).pipe(
      tap(response => {
        // Si la verificación incluye un token, hacer login automático
        if (response.token) {
          this.setToken(response.token);
          this.loadUserFromToken(response.token);
        }
      })
    );
  }

  logout(): void {
    const win = this.browser.window;
    if (win) {
      // Limpiar token de sessionStorage y localStorage (por si acaso)
      if (win.sessionStorage) {
        win.sessionStorage.removeItem(this.tokenKey);
      }
      if (win.localStorage) {
        win.localStorage.removeItem(this.tokenKey);
      }
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/panel/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    const win = this.browser.window;
    if (!win) {
      return null;
    }
    // Usar sessionStorage para tokens (más seguro)
    if (win.sessionStorage) {
      const token = win.sessionStorage.getItem(this.tokenKey);
      if (token) {
        return token;
      }
    }
    // Fallback: verificar localStorage por compatibilidad y migrar
    if (win.localStorage) {
      const oldToken = win.localStorage.getItem(this.tokenKey);
      if (oldToken) {
        // Migrar token antiguo a sessionStorage
        if (win.sessionStorage) {
          win.sessionStorage.setItem(this.tokenKey, oldToken);
        }
        win.localStorage.removeItem(this.tokenKey);
        return oldToken;
      }
    }
    return null;
  }

  private setToken(token: string): void {
    const win = this.browser.window;
    if (!win) {
      return;
    }
    // Guardar token en sessionStorage (más seguro, se borra al cerrar el navegador)
    if (win.sessionStorage) {
      win.sessionStorage.setItem(this.tokenKey, token);
    }
    // Limpiar token antiguo de localStorage si existe
    if (win.localStorage) {
      win.localStorage.removeItem(this.tokenKey);
    }
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    if (token) {
      // Verificar que el token no haya expirado
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token expirado, limpiar
            this.logout();
            return;
          }
        }
      } catch (e) {
        // Si no se puede decodificar, intentar cargar de todas formas
      }
      this.loadUserFromToken(token);
    }
  }

  private loadUserFromToken(token: string): void {
    try {
      // Decodificar el token JWT (parte del payload)
      const parts = token.split('.');
      if (parts.length < 2) {
        throw new Error('Token inválido');
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const user: User = {
        id: payload.id,
        username: payload.userName || payload.username,
        email: payload.email,
        status: payload.status,
        type: payload.type || 'client',
        first_name: payload.first_name,
        last_name: payload.last_name
      };
      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Error al decodificar token:', error);
      this.logout();
    }
  }

  hasRole(role: 'client' | 'partner' | 'admin'): boolean {
    const user = this.getCurrentUser();
    return user?.type === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isPartner(): boolean {
    return this.hasRole('partner');
  }

  isClient(): boolean {
    return this.hasRole('client');
  }
}










