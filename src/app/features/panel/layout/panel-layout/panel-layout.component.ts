import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { AuthService, User } from '../../services/auth.service';
import { NotificationsComponent } from '../../components/notifications/notifications.component';

@Component({
  selector: 'app-panel-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, DashboardComponent, ResponsiveImageComponent, NotificationsComponent],
  templateUrl: './panel-layout.component.html',
  styleUrl: './panel-layout.component.css'
})
export class PanelLayoutComponent implements OnInit {
  isSidebarOpen = true;
  currentUser: User | null = null;

  logoImages = {
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.webp',
    alt: 'Start Companies Logo',
    priority: true
  };

  menuItems: { label: string; route: string; icon: string; roles?: ('client' | 'partner' | 'admin')[] }[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.setupMenuItems();
  }

  setupMenuItems(): void {
    const user = this.currentUser;
    
    if (user?.type === 'admin') {
      this.menuItems = [
        { label: 'Dashboard', route: '/panel/dashboard', icon: 'bi-speedometer2', roles: ['admin'] },
        { label: 'Solicitudes', route: '/panel/requests', icon: 'bi-file-earmark-text', roles: ['admin'] },
        { label: 'Clientes', route: '/panel/clients', icon: 'bi-people', roles: ['admin'] },
        { label: 'Partners', route: '/panel/partners', icon: 'bi-briefcase', roles: ['admin'] },
        { label: 'Reportes Partners', route: '/panel/partner-reports', icon: 'bi-graph-up', roles: ['admin'] },
        { label: 'Configuración', route: '/panel/settings', icon: 'bi-gear', roles: ['admin'] },
      ];
    } else if (user?.type === 'partner') {
      this.menuItems = [
        { label: 'Dashboard', route: '/panel/client-dashboard', icon: 'bi-speedometer2', roles: ['partner', 'client'] },
        { label: 'Mis Solicitudes', route: '/panel/my-requests', icon: 'bi-file-earmark-text', roles: ['partner', 'client'] },
        { label: 'Mis Clientes', route: '/panel/my-clients', icon: 'bi-people', roles: ['partner'] },
        { label: 'Configuración', route: '/panel/settings', icon: 'bi-gear', roles: ['partner'] },
      ];
    } else {
      // Cliente final
      this.menuItems = [
        { label: 'Dashboard', route: '/panel/client-dashboard', icon: 'bi-speedometer2', roles: ['partner', 'client'] },
        { label: 'Mis Solicitudes', route: '/panel/my-requests', icon: 'bi-file-earmark-text', roles: ['partner', 'client'] },
        { label: 'Configuración', route: '/panel/settings', icon: 'bi-gear', roles: ['client'] },
      ];
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.authService.logout();
  }

  getUserDisplayName(): string {
    const user = this.currentUser;
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || user?.email || 'Usuario';
  }
}
