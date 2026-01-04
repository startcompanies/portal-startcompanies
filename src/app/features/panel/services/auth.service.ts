import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

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
    private router: Router
  ) {
    this.loadUserFromStorage();
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

  logout(): void {
    localStorage.removeItem(this.tokenKey);
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
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    if (token) {
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

  /**
   * SSO Authentication - Autenticación mediante parámetros de URL para embedding
   */
  public ssoAuth(
    email: string,
    token: string,
    customerId?: string,
    phone?: string
  ): Observable<any> {
    let url = `${this.apiUrl}/sso?email=${encodeURIComponent(
      email
    )}&token=${encodeURIComponent(token)}`;

    if (customerId) {
      url += `&customerId=${encodeURIComponent(customerId)}`;
    }

    if (phone) {
      url += `&phone=${encodeURIComponent(phone)}`;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.get<any>(url, { headers, withCredentials: true }).pipe(
      tap((response) => {
        if (response.accessToken) {
          this.setToken(response.accessToken);
          this.loadUserFromToken(response.accessToken);
          
          // Guardar refreshToken en localStorage como fallback para iframes
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }
          
          // Marcar que el login fue vía SSO
          localStorage.setItem('isSsoLogin', 'true');
        }
      })
    );
  }

  /**
   * Refresh token para SSO (usa refreshToken del localStorage)
   */
  public refreshSso(refreshToken: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/refresh-sso`,
      { refreshToken },
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    ).pipe(
      tap((response) => {
        if (response.accessToken) {
          this.setToken(response.accessToken);
          this.loadUserFromToken(response.accessToken);
        }
      })
    );
  }
}








