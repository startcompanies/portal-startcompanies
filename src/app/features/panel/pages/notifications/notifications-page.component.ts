import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotificationsService, Notification } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css'
})
export class NotificationsPageComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  filterType: 'all' | 'unread' | 'read' = 'all';
  
  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
  
  get readCount(): number {
    return this.notifications.filter(n => n.read).length;
  }
  
  get totalCount(): number {
    return this.notifications.length;
  }

  constructor(
    private notificationsService: NotificationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationsService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    if (this.filterType === 'all') {
      this.filteredNotifications = this.notifications;
    } else if (this.filterType === 'unread') {
      this.filteredNotifications = this.notifications.filter(n => !n.read);
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.read);
    }
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationsService.markAsRead(notification.id);
    }
    
    if (notification.link) {
      this.router.navigate([notification.link]);
    }
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  deleteNotification(notification: Notification): void {
    this.notificationsService.deleteNotification(notification.id);
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'info': 'bi-info-circle',
      'success': 'bi-check-circle',
      'warning': 'bi-exclamation-triangle',
      'error': 'bi-x-circle'
    };
    return icons[type] || 'bi-bell';
  }

  getNotificationClass(type: string): string {
    const classes: { [key: string]: string } = {
      'info': 'notification-info',
      'success': 'notification-success',
      'warning': 'notification-warning',
      'error': 'notification-error'
    };
    return classes[type] || '';
  }
}
