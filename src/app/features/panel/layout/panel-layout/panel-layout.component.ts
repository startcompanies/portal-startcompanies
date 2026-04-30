import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
  ActivatedRoute,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { AuthService, User } from '../../services/auth.service';
import { NotificationsComponent } from '../../components/notifications/notifications.component';
import { PanelLanguageService } from '../../services/panel-language.service';
import { PanelPreferencesService } from '../../services/panel-preferences.service';
import { ChooseLanguageModalComponent } from '../../components/choose-language-modal/choose-language-modal.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { environment } from '../../../../../environments/environment';
import { BillingAccessService } from '../../services/billing-access.service';
import { BillingViewState } from '../../../../shared/models/billing-access.model';

@Component({
  selector: 'app-panel-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    ResponsiveImageComponent,
    NotificationsComponent,
    ChooseLanguageModalComponent,
    TranslocoPipe
  ],
  templateUrl: './panel-layout.component.html',
  styleUrl: './panel-layout.component.css'
})
export class PanelLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = true;
  currentUser: User | null = null;
  showLanguageModal = false;
  billingState: BillingViewState | null = null;

  /** Título/subtítulo del módulo actual (ruta hoja); si no hay, se usa el fallback por rol */
  panelTitleKey: string | null = null;
  panelSubtitleKey: string | null = null;
  /** Oculta el bloque de título del header (p. ej. client-dashboard con bienvenida propia) */
  hideLayoutHeader = false;

  private routeEventsSub?: Subscription;
  private billingSub?: Subscription;

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
    private route: ActivatedRoute,
    private panelLanguage: PanelLanguageService,
    private panelPreferences: PanelPreferencesService,
    private billingAccess: BillingAccessService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.billingState = this.billingAccess.getSnapshot();
    void this.billingAccess.loadForUser(this.currentUser);
    this.billingSub = this.billingAccess.state$.subscribe((state) => {
      this.billingState = state;
    });
    this.panelLanguage.applyStoredLanguage();
    const localPrefs = this.panelPreferences.readLocalFallback();
    if (localPrefs?.theme) {
      this.panelPreferences.applyTheme(localPrefs.theme);
    }
    this.setupMenuItems();
    this.routeEventsSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.updateHeaderFromRoute());
    queueMicrotask(() => this.updateHeaderFromRoute());
    // Cargar preferencias desde la API (idioma, tema, etc.) y luego decidir si mostrar modal
    this.panelLanguage.loadPreferencesFromApi().then(() => {
      this.showLanguageModal = this.panelLanguage.shouldShowLanguageModal();
    });
  }

  ngOnDestroy(): void {
    this.routeEventsSub?.unsubscribe();
    this.billingSub?.unsubscribe();
  }

  /** Clave i18n del título mostrado en el header (módulo o fallback por rol) */
  get effectiveTitleKey(): string {
    if (this.hideLayoutHeader) {
      return '';
    }
    return this.panelTitleKey ?? this.fallbackTitleKeyByRole();
  }

  get shouldShowTrialBanner(): boolean {
    return (
      this.currentUser?.type === 'client' &&
      Boolean(this.billingState?.isTrial) &&
      (this.billingState?.trialDaysLeft ?? 0) > 0
    );
  }

  private fallbackTitleKeyByRole(): string {
    const t = this.currentUser?.type;
    if (t === 'admin') return 'PANEL.layout.admin_panel';
    if (t === 'user') return 'PANEL.layout.user_panel';
    if (t === 'partner') return 'PANEL.layout.partner_panel';
    return 'PANEL.layout.my_panel';
  }

  private updateHeaderFromRoute(): void {
    let r: ActivatedRoute | null = this.route;
    while (r.firstChild) {
      r = r.firstChild;
    }
    const data = (r?.snapshot.data ?? {}) as Record<string, unknown>;
    if (data['hideLayoutHeader'] === true) {
      this.hideLayoutHeader = true;
      this.panelTitleKey = null;
      this.panelSubtitleKey = null;
      return;
    }
    this.hideLayoutHeader = false;
    const title = data['panelTitleKey'];
    const sub = data['panelSubtitleKey'];
    this.panelTitleKey = typeof title === 'string' ? title : null;
    this.panelSubtitleKey = typeof sub === 'string' ? sub : null;
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
        { label: 'PANEL.menu.contenido', route: '/panel/contenido', icon: 'bi-collection-play', roles: ['admin'] },
        { label: 'PANEL.menu.documentos', route: '/panel/documentos', icon: 'bi-folder2-open', roles: ['admin'] },
        { label: 'PANEL.menu.clients', route: '/panel/clients', icon: 'bi-people', roles: ['admin'] },
        { label: 'PANEL.menu.partners', route: '/panel/partners', icon: 'bi-briefcase', roles: ['admin'] },
        { label: 'PANEL.menu.settings', route: '/panel/settings', icon: 'bi-gear', roles: ['admin'] },
      ];
    } else if (user?.type === 'user') {
      this.menuItems = [
        { label: 'PANEL.menu.dashboard', route: '/panel/dashboard', icon: 'bi-speedometer2', roles: ['user'] },
        { label: 'PANEL.menu.requests', route: '/panel/requests', icon: 'bi-file-earmark-text', roles: ['user'] },
        { label: 'PANEL.menu.contenido', route: '/panel/contenido', icon: 'bi-collection-play', roles: ['user'] },
        { label: 'PANEL.menu.documentos', route: '/panel/documentos', icon: 'bi-folder2-open', roles: ['user'] },
        { label: 'PANEL.menu.partners', route: '/panel/partners', icon: 'bi-briefcase', roles: ['user'] },
        { label: 'PANEL.menu.settings', route: '/panel/settings', icon: 'bi-gear', roles: ['user'] },
      ];
    } else if (user?.type === 'partner') {
      this.menuItems = [
        { label: 'PANEL.menu.dashboard', route: '/panel/client-dashboard', icon: 'bi-speedometer2', roles: ['partner', 'client'] },
        { label: 'PANEL.menu.my_requests', route: '/panel/my-requests', icon: 'bi-file-earmark-text', roles: ['partner', 'client'] },
        { label: 'PANEL.menu.my_clients', route: '/panel/my-clients', icon: 'bi-people', roles: ['partner'] },
        { label: 'PANEL.menu.documentos', route: '/panel/documentos', icon: 'bi-folder2-open', roles: ['partner'] },
        { label: 'PANEL.menu.settings', route: '/panel/settings', icon: 'bi-gear', roles: ['partner'] },
      ];
    } else {
      // Cliente final
      this.menuItems = [
        { label: 'PANEL.menu.dashboard', route: '/panel/client-dashboard', icon: 'bi-speedometer2', roles: ['partner', 'client'] },
        { label: 'PANEL.menu.my_requests', route: '/panel/my-requests', icon: 'bi-file-earmark-text', roles: ['partner', 'client'] },
        { label: 'PANEL.menu.facturacion', route: '/panel/facturacion', icon: 'bi-receipt', roles: ['client'] },
        { label: 'PANEL.menu.contabilidad', route: '/panel/contabilidad', icon: 'bi-calculator', roles: ['client'] },
        { label: 'PANEL.menu.documentos', route: '/panel/documentos', icon: 'bi-folder2-open', roles: ['client'] },
        { label: 'PANEL.menu.videos', route: '/panel/videos', icon: 'bi-play-btn', roles: ['client'] },
        { label: 'PANEL.menu.guias', route: '/panel/guias', icon: 'bi-journal-text', roles: ['client'] },
        { label: 'PANEL.menu.lili_request', route: '/panel/lili-request', icon: 'bi-bank', roles: ['client'] },
        { label: 'PANEL.menu.settings', route: '/panel/settings', icon: 'bi-gear', roles: ['client'] },
      ];
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  goToPublicHome(event: Event): void {
    event.preventDefault();
    window.location.assign(`${environment.baseUrl}/`);
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
