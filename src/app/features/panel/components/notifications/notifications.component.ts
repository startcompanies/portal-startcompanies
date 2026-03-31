import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotificationsService, Notification } from '../../services/notifications.service';
import { SafeDatePipe } from '../../../../shared/pipes/safe-date.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeDatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;

  constructor(
    private notificationsService: NotificationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationsService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });

    this.notificationsService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notifications-container')) {
      this.closeDropdown();
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationsService.markAsRead(notification.id);
    }
    
    if (notification.link) {
      this.router.navigate([notification.link]);
      this.closeDropdown();
    }
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
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










