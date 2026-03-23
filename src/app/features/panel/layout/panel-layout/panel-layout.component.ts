import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { AuthService, User } from '../../services/auth.service';
import { NotificationsComponent } from '../../components/notifications/notifications.component';
import { PanelLanguageService } from '../../services/panel-language.service';
import { PanelPreferencesService } from '../../services/panel-preferences.service';
import { ChooseLanguageModalComponent } from '../../components/choose-language-modal/choose-language-modal.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-panel-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    DashboardComponent,
    ResponsiveImageComponent,
    NotificationsComponent,
    ChooseLanguageModalComponent,
    TranslocoPipe
  ],
  templateUrl: './panel-layout.component.html',
  styleUrl: './panel-layout.component.css'
})
export class PanelLayoutComponent implements OnInit {
  isSidebarOpen = true;
  currentUser: User | null = null;
  showLanguageModal = false;

  logoImages = {
    // Logo blanco (negativo) para sidebar con fondo azul
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.png',
    alt: 'Start Companies Logo',
    priority: true
  };

  menuItems: { label: string; route: string; icon: string; roles?: ('client' | 'partner' | 'admin' | 'user')[] }[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private panelLanguage: PanelLanguageService,
    private panelPreferences: PanelPreferencesService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.panelLanguage.applyStoredLanguage();
    const localPrefs = this.panelPreferences.readLocalFallback();
    if (localPrefs?.theme) {
      this.panelPreferences.applyTheme(localPrefs.theme);
    }
    this.setupMenuItems();
    // Cargar preferencias desde la API (idioma, tema, etc.) y luego decidir si mostrar modal
    this.panelLanguage.loadPreferencesFromApi().then(() => {
      this.showLanguageModal = this.panelLanguage.shouldShowLanguageModal();
    });
  }

  onLanguageModalClosed(): void {
    this.showLanguageModal = false;
  }

  setupMenuItems(): void {
    const user = this.currentUser;
    
    if (user?.type === 'admin') {
      this.menuItems = [
        { label: 'PANEL.menu.dashboard', route: '/panel/dashboard', icon: 'bi-speedometer2', roles: ['admin'] },
        { label: 'PANEL.menu.zoho_sync', route: '/panel/zoho-sync', icon: 'bi-arrow-repeat', roles: ['admin'] },
        { label: 'PANEL.menu.requests', route: '/panel/requests', icon: 'bi-file-earmark-text', roles: ['admin'] },
        { label: 'PANEL.menu.clients', route: '/panel/clients', icon: 'bi-people', roles: ['admin'] },
        { label: 'PANEL.menu.partners', route: '/panel/partners', icon: 'bi-briefcase', roles: ['admin'] },
        { label: 'PANEL.menu.partner_reports', route: '/panel/partner-reports', icon: 'bi-graph-up', roles: ['admin'] },
        { label: 'PANEL.menu.settings', route: '/panel/settings', icon: 'bi-gear', roles: ['admin'] },
      ];
    } else if (user?.type === 'user') {
      this.menuItems = [
        { label: 'PANEL.menu.dashboard', route: '/panel/dashboard', icon: 'bi-speedometer2', roles: ['user'] },
        { label: 'PANEL.menu.requests', route: '/panel/requests', icon: 'bi-file-earmark-text', roles: ['user'] },
        { label: 'PANEL.menu.partners', route: '/panel/partners', icon: 'bi-briefcase', roles: ['user'] },
        { label: 'PANEL.menu.settings', route: '/panel/settings', icon: 'bi-gear', roles: ['user'] },
      ];
    } else if (user?.type === 'partner') {
      this.menuItems = [
        { label: 'PANEL.menu.dashboard', route: '/panel/client-dashboard', icon: 'bi-speedometer2', roles: ['partner', 'client'] },
        { label: 'PANEL.menu.my_requests', route: '/panel/my-requests', icon: 'bi-file-earmark-text', roles: ['partner', 'client'] },
        { label: 'PANEL.menu.my_clients', route: '/panel/my-clients', icon: 'bi-people', roles: ['partner'] },
        { label: 'PANEL.menu.settings', route: '/panel/settings', icon: 'bi-gear', roles: ['partner'] },
      ];
    } else {
      // Cliente final
      this.menuItems = [
        { label: 'PANEL.menu.dashboard', route: '/panel/client-dashboard', icon: 'bi-speedometer2', roles: ['partner', 'client'] },
        { label: 'PANEL.menu.my_requests', route: '/panel/my-requests', icon: 'bi-file-earmark-text', roles: ['partner', 'client'] },
        { label: 'PANEL.menu.settings', route: '/panel/settings', icon: 'bi-gear', roles: ['client'] },
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
