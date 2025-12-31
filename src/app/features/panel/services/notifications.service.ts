import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

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

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private authService: AuthService) {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    // TODO: Cargar notificaciones desde el backend
    const mockNotifications: Notification[] = [
      {
        id: 1,
        type: 'success',
        title: 'Solicitud Completada',
        message: 'Tu solicitud de Apertura LLC #123 ha sido completada',
        read: false,
        createdAt: new Date('2024-01-20T10:30:00'),
        link: '/panel/my-requests/123',
        requestId: 123
      },
      {
        id: 2,
        type: 'info',
        title: 'Nueva Etapa',
        message: 'Tu solicitud #456 ha avanzado a la etapa: Procesamiento',
        read: false,
        createdAt: new Date('2024-01-20T09:15:00'),
        link: '/panel/my-requests/456',
        requestId: 456
      },
      {
        id: 3,
        type: 'warning',
        title: 'Documento Requerido',
        message: 'Se requiere documentación adicional para tu solicitud #789',
        read: true,
        createdAt: new Date('2024-01-19T14:20:00'),
        link: '/panel/my-requests/789',
        requestId: 789
      }
    ];

    this.notificationsSubject.next(mockNotifications);
    this.updateUnreadCount();
  }

  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  markAsRead(notificationId: number): void {
    const notifications = this.notificationsSubject.value;
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1 && !notifications[index].read) {
      notifications[index].read = true;
      this.notificationsSubject.next([...notifications]);
      this.updateUnreadCount();
      
      // TODO: Marcar como leída en el backend
    }
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    
    // TODO: Marcar todas como leídas en el backend
  }

  deleteNotification(notificationId: number): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    
    // TODO: Eliminar notificación en el backend
  }

  createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      read: false,
      createdAt: new Date()
    };

    const notifications = [newNotification, ...this.notificationsSubject.value];
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    
    // TODO: Crear notificación en el backend
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }
}







