import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  throwError,
  of,
  switchMap,
  shareReplay,
  finalize,
  firstValueFrom,
  catchError,
  timeout,
} from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BrowserService } from '../../../shared/services/browser.service';

export interface User {
  id: number;
  username: string;
  email: string;
  status: boolean;
  type: 'client' | 'partner' | 'admin' | 'user';
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  bio?: string;
}

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  user?: User;
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

const AUTH_BASE = `${environment.apiUrl || 'http://localhost:3000'}/auth`;

/** Unifica respuesta de signIn y payload JWT de GET /auth/me (userName vs username). */
function normalizePanelUser(raw: unknown): User | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const r = raw as Record<string, unknown>;
  const rawId = r['id'];
  const idNum =
    typeof rawId === 'number'
      ? rawId
      : typeof rawId === 'string'
        ? parseInt(rawId, 10)
        : NaN;
  if (!Number.isFinite(idNum)) {
    return null;
  }
  const email = r['email'];
  if (typeof email !== 'string') {
    return null;
  }
  const usernameSrc = r['username'] ?? r['userName'];
  const username = typeof usernameSrc === 'string' ? usernameSrc : email;
  const tr = r['type'];
  const type: User['type'] =
    tr === 'admin' || tr === 'partner' || tr === 'client' || tr === 'user'
      ? tr
      : 'client';
  return {
    id: idNum,
    username,
    email,
    status: Boolean(r['status']),
    type,
    first_name: typeof r['first_name'] === 'string' ? r['first_name'] : undefined,
    last_name: typeof r['last_name'] === 'string' ? r['last_name'] : undefined,
    phone: typeof r['phone'] === 'string' ? r['phone'] : undefined,
    company: typeof r['company'] === 'string' ? r['company'] : undefined,
    bio: typeof r['bio'] === 'string' ? r['bio'] : undefined,
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private refreshInFlight$: Observable<void> | null = null;
  private router = inject(Router);
  /** Promesa única de /auth/me (APP_INITIALIZER + guards) para evitar carrera guard vs sesión. */
  private loadUserPromise: Promise<void> | null = null;

  constructor(
    private http: HttpClient,
    private browser: BrowserService,
  ) {}

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * GET /auth/me con reintento tras refresh si el access expiró (401).
   * El interceptor no aplica refresh a /auth/me; sin esto el guard puede mandar a login con sesión válida.
   */
  private fetchMeObservable(): Observable<unknown> {
    return this.http.get<unknown>(`${AUTH_BASE}/me`, { withCredentials: true }).pipe(
      timeout(8000),
      catchError((err: unknown) => {
        const status = err instanceof HttpErrorResponse ? err.status : 0;
        if (status === 401) {
          return this.refresh().pipe(
            switchMap(() =>
              this.http.get<unknown>(`${AUTH_BASE}/me`, { withCredentials: true }).pipe(
                timeout(8000),
                catchError(() => of(null)),
              ),
            ),
            catchError(() => of(null)),
          );
        }
        return of(null);
      }),
    );
  }

  /**
   * Carga el usuario en segundo plano (solo en browser). Timeout 8s para no colgar.
   * Idempotente: varias llamadas comparten la misma promesa (evita flash login en F5 si el guard corre en paralelo).
   */
  loadUser(): Promise<void> {
    if (!this.browser.isBrowser) {
      return Promise.resolve();
    }
    if (this.loadUserPromise) {
      return this.loadUserPromise;
    }
    this.loadUserPromise = firstValueFrom(this.fetchMeObservable())
      .then((raw) => {
        this.currentUserSubject.next(normalizePanelUser(raw));
      })
      .catch(() => {
        this.currentUserSubject.next(null);
      });
    return this.loadUserPromise;
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${AUTH_BASE}/signin`, credentials, {
        withCredentials: true,
      })
      .pipe(
        switchMap((response) => {
          const user = response?.user ?? null;
          if (!user) {
            // El backend puede responder con un body de error (sin `user`) pero con `message`.
            // En ese caso, mostramos el mensaje real en vez del genérico.
            const backendMessage =
              (response as any)?.message ??
              (response as any)?.error?.message ??
              'Credenciales inválidas';
            return throwError(() => new Error(backendMessage));
          }
          const normalized = normalizePanelUser(user);
          if (normalized) {
            this.currentUserSubject.next(normalized);
          }
          return of(response);
        }),
        catchError((err) => {
          const message =
            err?.error?.message ?? err?.message ?? 'Error de autenticación';
          return throwError(() => new Error(message));
        }),
      );
  }

  register(data: RegisterData): Observable<User> {
    return this.http.post<User>(`${AUTH_BASE}/signup`, data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${AUTH_BASE}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${AUTH_BASE}/reset-password`, {
      token,
      newPassword,
    });
  }

  sendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${AUTH_BASE}/send-verification-email`, { email });
  }

  verifyEmail(token: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${AUTH_BASE}/verify-email`,
        { token },
        { withCredentials: true },
      )
      .pipe(
        switchMap((response) => {
          if (response?.user) {
            const u = normalizePanelUser(response.user);
            if (u) {
              this.currentUserSubject.next(u);
            }
          } else if (response?.token) {
            this.loadUserFromToken(response.token);
          }
          return of(response);
        }),
      );
  }

  private loadUserFromToken(token: string): void {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return;
      const payload = JSON.parse(atob(parts[1]));
      const user = normalizePanelUser(payload);
      this.currentUserSubject.next(user);
    } catch {
      this.currentUserSubject.next(null);
    }
  }

  logout(): void {
    this.refreshInFlight$ = null;
    this.loadUserPromise = null;
    if (this.browser.isBrowser) {
      this.http
        .post(`${AUTH_BASE}/logout`, {}, { withCredentials: true })
        .subscribe({
          complete: () => {},
          error: () => {},
        });
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/panel/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  /**
   * Renueva el access token usando la cookie refresh_token (HttpOnly).
   */
  refresh(): Observable<void> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }
    this.refreshInFlight$ = this.http
      .post<{
        token: string;
      }>(`${AUTH_BASE}/refresh`, {}, { withCredentials: true })
      .pipe(
        switchMap(() => of(undefined)),
        shareReplay(1),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
      );
    return this.refreshInFlight$;
  }

  hasRole(role: 'client' | 'partner' | 'admin' | 'user'): boolean {
    const user = this.getCurrentUser();
    return user?.type === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /** Staff operativo: solicitudes/partners sin configuración Zoho completa. */
  isStaffUser(): boolean {
    return this.hasRole('user');
  }

  isPartner(): boolean {
    return this.hasRole('partner');
  }

  isClient(): boolean {
    return this.hasRole('client');
  }
}
