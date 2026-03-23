import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, catchError, of } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { BrowserService } from '../../../shared/services/browser.service';
import { environment } from '../../../../environments/environment';
import { PanelPreferencesService } from './panel-preferences.service';

export interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  requestId?: number;
}

interface NotificationApiPayload {
  id: number;
  userId?: number;
  type: Notification['type'];
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  requestId?: number | null;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService implements OnDestroy {
  private readonly apiBase = `${environment.apiUrl}/panel/notifications`;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private socket: Socket | null = null;
  private authSub: Subscription | null = null;
  private prefsSub: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private browser: BrowserService,
    private panelPreferences: PanelPreferencesService,
  ) {
    if (this.browser.isBrowser) {
      this.authSub = this.authService.currentUser$.subscribe((user) => {
        if (user) {
          this.loadFromApi();
          void this.syncSocketWithPushPreference();
        } else {
          this.disconnectSocket();
          this.notificationsSubject.next([]);
          this.updateUnreadCount();
        }
      });
      /** Si push=false en preferencias, no mantener WebSocket (persistido en API; ver PanelPreferencesService). */
      this.prefsSub = this.panelPreferences.preferences$.subscribe(() => {
        if (this.authService.getCurrentUser()) {
          this.syncSocketWithPushPreference();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.prefsSub?.unsubscribe();
  }

  /** Espera GET /panel/settings/preferences para respetar notifications.push antes de abrir el socket. */
  private async syncSocketWithPushPreference(): Promise<void> {
    if (!this.authService.getCurrentUser()) {
      return;
    }
    await this.panelPreferences.loadFromApi();
    if (!this.panelPreferences.isPushEnabled()) {
      this.disconnectSocket();
      return;
    }
    this.connectSocket();
  }

  private mapNotification(raw: NotificationApiPayload): Notification {
    return {
      id: raw.id,
      type: raw.type,
      title: raw.title,
      message: raw.message,
      read: raw.read,
      link: raw.link ?? undefined,
      requestId: raw.requestId ?? undefined,
      createdAt: new Date(raw.createdAt),
    };
  }

  private loadFromApi(): void {
    this.http
      .get<NotificationApiPayload[]>(`${this.apiBase}/me`, { withCredentials: true })
      .pipe(
        catchError(() => of([] as NotificationApiPayload[])),
      )
      .subscribe((rows) => {
        const list = rows.map((r) => this.mapNotification(r));
        this.notificationsSubject.next(list);
        this.updateUnreadCount();
      });
  }

  private connectSocket(): void {
    if (!this.browser.isBrowser) {
      return;
    }
    this.disconnectSocket();
    const url = `${environment.apiUrl}/notifications`;
    this.socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    });

    this.socket.on('notification', (payload: NotificationApiPayload) => {
      const n = this.mapNotification(payload);
      const cur = this.notificationsSubject.value.filter((x) => x.id !== n.id);
      this.notificationsSubject.next([n, ...cur]);
      this.updateUnreadCount();
    });

    this.socket.on('notification:read', (data: { id: number; read: boolean }) => {
      const cur = this.notificationsSubject.value.map((n) =>
        n.id === data.id ? { ...n, read: data.read } : n,
      );
      this.notificationsSubject.next(cur);
      this.updateUnreadCount();
    });

    this.socket.on('notification:removed', (data: { id: number }) => {
      const cur = this.notificationsSubject.value.filter((n) => n.id !== data.id);
      this.notificationsSubject.next(cur);
      this.updateUnreadCount();
    });

    this.socket.on('notifications:read-all', () => {
      const cur = this.notificationsSubject.value.map((n) => ({ ...n, read: true }));
      this.notificationsSubject.next(cur);
      this.updateUnreadCount();
    });
  }

  private disconnectSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  markAsRead(notificationId: number): void {
    this.http
      .patch<NotificationApiPayload>(
        `${this.apiBase}/${notificationId}/read`,
        {},
        { withCredentials: true },
      )
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res) {
          const n = this.mapNotification(res);
          const cur = this.notificationsSubject.value.map((x) =>
            x.id === n.id ? n : x,
          );
          this.notificationsSubject.next(cur);
          this.updateUnreadCount();
        }
      });
  }

  markAllAsRead(): void {
    this.http
      .patch<unknown>(`${this.apiBase}/me/read-all`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        const cur = this.notificationsSubject.value.map((n) => ({ ...n, read: true }));
        this.notificationsSubject.next(cur);
        this.updateUnreadCount();
      });
  }

  deleteNotification(notificationId: number): void {
    this.http
      .delete(`${this.apiBase}/${notificationId}`, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        const cur = this.notificationsSubject.value.filter((n) => n.id !== notificationId);
        this.notificationsSubject.next(cur);
        this.updateUnreadCount();
      });
  }

  /**
   * Solo administradores (POST /panel/notifications restringido en API).
   * Notifica a un usuario concreto (p. ej. cliente/partner al actualizar un paso).
   */
  createNotificationRemote(body: {
    userId: number;
    type: Notification['type'];
    title: string;
    message: string;
    link?: string;
    requestId?: number;
  }): void {
    if (!this.browser.isBrowser || !this.authService.isAdmin()) {
      return;
    }
    this.http
      .post<NotificationApiPayload>(this.apiBase, body, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res) {
          const n = this.mapNotification(res);
          const cur = this.notificationsSubject.value.filter((x) => x.id !== n.id);
          this.notificationsSubject.next([n, ...cur]);
          this.updateUnreadCount();
        }
      });
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter((n) => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }
}
