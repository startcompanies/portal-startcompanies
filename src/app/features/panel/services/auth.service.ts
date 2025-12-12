import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';
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
    // En modo desarrollo, simular login con usuarios mockup
    if (!environment.production) {
      const mockUsers: Array<{ email: string; password: string; user: User }> = [
        { 
          email: 'admin@test.com', 
          password: 'test123', 
          user: { id: 1, username: 'admin_test', email: 'admin@test.com', status: true, type: 'admin' as const, first_name: 'Admin', last_name: 'Test' } 
        },
        { 
          email: 'partner@test.com', 
          password: 'test123', 
          user: { id: 2, username: 'partner_test', email: 'partner@test.com', status: true, type: 'partner' as const, first_name: 'Partner', last_name: 'Test' } 
        },
        { 
          email: 'client@test.com', 
          password: 'test123', 
          user: { id: 3, username: 'client_test', email: 'client@test.com', status: true, type: 'client' as const, first_name: 'Client', last_name: 'Test' } 
        }
      ];

      const mockUser = mockUsers.find(u => u.email === credentials.email && u.password === credentials.password);
      
      if (mockUser) {
        // Simular token JWT (solo para desarrollo)
        const mockToken = this.generateMockToken(mockUser.user);
        const response: AuthResponse = { token: mockToken };
        
        // Guardar también el usuario en localStorage para recuperarlo si el token falla
        localStorage.setItem('mock_user', JSON.stringify(mockUser.user));
        this.setToken(mockToken);
        this.currentUserSubject.next(mockUser.user);
        
        return of(response);
      } else {
        // Simular error de autenticación
        return new Observable(observer => {
          observer.error({ 
            status: 401, 
            error: { message: 'Credenciales inválidas' } 
          });
        });
      }
    }

    // En producción, usar el backend real
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, credentials).pipe(
      tap(response => {
        this.setToken(response.token);
        this.loadUserFromToken(response.token);
      })
    );
  }

  private generateMockToken(user: User): string {
    // Generar un token JWT mockup simple (solo para desarrollo)
    // En producción siempre se usa el token real del backend
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      id: user.id,
      userName: user.username,
      email: user.email,
      status: user.status,
      type: user.type,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    }));
    return `${header}.${payload}.mock_signature`;
  }

  register(data: RegisterData): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/signup`, data);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('mock_user');
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
      // En desarrollo, si es un token mockup, intentar cargar desde localStorage
      if (!environment.production) {
        const storedUser = localStorage.getItem('mock_user');
        if (storedUser) {
          try {
            this.currentUserSubject.next(JSON.parse(storedUser));
            return;
          } catch (e) {
            // Si falla, continuar con logout
          }
        }
      }
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
