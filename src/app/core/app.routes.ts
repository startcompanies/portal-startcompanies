import { Routes } from '@angular/router';
import { environment } from '../../environments/environment';
import { authGuard } from '../features/panel/guards/auth.guard';
import { roleGuard } from '../features/panel/guards/role.guard';
import { liliAuthGuard } from '../features/lili/guards/lili-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'panel/login',
    pathMatch: 'full',
  },

  // ===== LILI BANKING =====
  {
    path: 'banking',
    canActivate: [liliAuthGuard],
    loadComponent: () =>
      import('../features/lili/components/lili-onboarding/lili-onboarding.component').then(
        (m) => m.LiliOnboardingComponent
      ),
  },
  {
    path: 'generate-lili-link-form',
    loadComponent: () =>
      import('../features/lili/components/lili-link-generator/lili-link-generator.component').then(
        (m) => m.LiliLinkGeneratorComponent
      ),
  },

  // ===== WIZARD — redirects legacy =====
  {
    path: 'wizard/llc-apertura',
    redirectTo: 'apertura-llc',
    pathMatch: 'full',
  },
  {
    path: 'wizard/llc-renovacion',
    redirectTo: 'renovar-llc',
    pathMatch: 'full',
  },

  // ===== WIZARD — flujos =====
  {
    path: 'wizard/cuenta-bancaria',
    loadComponent: () =>
      import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(
        (m) => m.CuentaBancariaComponent
      ),
  },
  {
    path: 'wizard/cuenta-bancaria-con-pago',
    loadComponent: () =>
      import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(
        (m) => m.CuentaBancariaComponent
      ),
    data: { withPayment: true },
  },
  {
    path: 'wizard/flow/:serviceType',
    loadComponent: () =>
      import('../features/wizard/pages/request-flow/wizard-request-flow-page.component').then(
        (m) => m.WizardRequestFlowPageComponent
      ),
  },
  {
    path: 'wizard/verify-email',
    loadComponent: () =>
      import('../features/wizard/components/email-verification/email-verification.component').then(
        (m) => m.WizardEmailVerificationComponent
      ),
  },

  // ===== FORMULARIOS / WIZARD ENTRIES =====
  {
    path: 'apertura-llc',
    loadComponent: environment.wizardAndPanelEnabled
      ? () =>
          import('../features/wizard/pages/request-flow/wizard-request-flow-page.component').then(
            (m) => m.WizardRequestFlowPageComponent
          )
      : () =>
          import('../features/public/forms/apertura-llc/apertura-llc.component').then(
            (m) => m.AperturaLlcComponent
          ),
    data: {
      ...(environment.wizardAndPanelEnabled && {
        serviceType: 'apertura-llc',
        source: 'wizard',
      }),
    },
  },
  {
    path: 'apertura/lead',
    loadComponent: () =>
      import('../features/wizard/pages/request-flow/wizard-request-flow-page.component').then(
        (m) => m.WizardRequestFlowPageComponent
      ),
    data: {
      serviceType: 'apertura-llc',
      source: 'crm-lead',
    },
  },
  {
    path: 'renovar-llc',
    loadComponent: environment.wizardAndPanelEnabled
      ? () =>
          import('../features/wizard/pages/request-flow/wizard-request-flow-page.component').then(
            (m) => m.WizardRequestFlowPageComponent
          )
      : () =>
          import('../features/public/forms/renovar-llc/renovar-llc.component').then(
            (m) => m.RenovarLlcComponent
          ),
    data: {
      ...(environment.wizardAndPanelEnabled && { serviceType: 'renovacion-llc' }),
    },
  },
  // ===== ERROR =====
  {
    path: 'error-404',
    loadComponent: () =>
      import('../shared/error-404/error-404.component').then(
        (m) => m.Error404Component
      ),
  },

  // ===== ENGLISH ROUTES (minimal) =====
  {
    path: 'en',
    children: [
      {
        path: 'llc-opening',
        loadComponent: environment.wizardAndPanelEnabled
          ? () =>
              import('../features/wizard/pages/request-flow/wizard-request-flow-page.component').then(
                (m) => m.WizardRequestFlowPageComponent
              )
          : () =>
              import('../features/public/forms/apertura-llc/apertura-llc.component').then(
                (m) => m.AperturaLlcComponent
              ),
        data: {
          ...(environment.wizardAndPanelEnabled && {
            serviceType: 'apertura-llc',
            source: 'wizard',
          }),
        },
      },
      {
        path: 'llc-renewal',
        loadComponent: environment.wizardAndPanelEnabled
          ? () =>
              import('../features/wizard/pages/request-flow/wizard-request-flow-page.component').then(
                (m) => m.WizardRequestFlowPageComponent
              )
          : () =>
              import('../features/public/forms/renovar-llc/renovar-llc.component').then(
                (m) => m.RenovarLlcComponent
              ),
        data: {
          ...(environment.wizardAndPanelEnabled && { serviceType: 'renovacion-llc' }),
        },
      },
      {
        path: 'wizard/bank-account',
        loadComponent: () =>
          import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(
            (m) => m.CuentaBancariaComponent
          ),
      },
      {
        path: 'wizard/bank-account-with-payment',
        loadComponent: () =>
          import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(
            (m) => m.CuentaBancariaComponent
          ),
        data: { withPayment: true },
      },
      {
        path: 'wizard/flow/:serviceType',
        loadComponent: () =>
          import('../features/wizard/pages/request-flow/wizard-request-flow-page.component').then(
            (m) => m.WizardRequestFlowPageComponent
          ),
      },
      {
        path: 'error-404',
        loadComponent: () =>
          import('../shared/error-404/error-404.component').then(
            (m) => m.Error404Component
          ),
      },
      { path: '**', redirectTo: 'error-404' },
    ],
  },

  // ===== PANEL =====
  {
    path: 'panel',
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/panel-home-redirect/panel-home-redirect.component').then(
                (m) => m.PanelHomeRedirectComponent
              ),
          },
        ],
      },
      {
        path: 'login',
        loadComponent: () =>
          import('../features/panel/layout/auth-layout/auth-layout.component').then(
            (m) => m.AuthLayoutComponent
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('../features/panel/layout/auth-layout/auth-layout.component').then(
            (m) => m.AuthLayoutComponent
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('../features/panel/layout/auth-layout/auth-layout.component').then(
            (m) => m.AuthLayoutComponent
          ),
      },
      {
        path: 'set-password',
        loadComponent: () =>
          import('../features/panel/layout/auth-layout/auth-layout.component').then(
            (m) => m.AuthLayoutComponent
          ),
      },
      {
        path: 'dashboard',
        canActivate: [authGuard, roleGuard(['admin', 'user'])],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/dashboard/dashboard.component').then(
                (m) => m.DashboardComponent
              ),
            data: {
              panelTitleKey: 'PANEL.admin_dashboard.title',
              panelSubtitleKey: 'PANEL.admin_dashboard.subtitle',
            },
          },
        ],
      },
      {
        path: 'requests',
        canActivate: [authGuard, roleGuard(['admin', 'user'])],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/admin-requests/admin-requests.component').then(
                (m) => m.AdminRequestsComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.admin_requests.title',
              panelSubtitleKey: 'PANEL.route_meta.admin_requests.subtitle',
            },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('../features/panel/pages/request-detail/request-detail.component').then(
                (m) => m.RequestDetailComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.request_detail.title',
              panelSubtitleKey: 'PANEL.route_meta.request_detail.subtitle',
            },
          },
        ],
      },
      {
        path: 'clients',
        canActivate: [authGuard, roleGuard(['admin'])],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/clients/clients.component').then(
                (m) => m.ClientsComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.clients.title',
              panelSubtitleKey: 'PANEL.route_meta.clients.subtitle',
            },
          },
        ],
      },
      {
        path: 'partners',
        canActivate: [authGuard, roleGuard(['admin', 'user'])],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/partners/partners.component').then(
                (m) => m.PartnersComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.partners.title',
              panelSubtitleKey: 'PANEL.route_meta.partners.subtitle',
            },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('../features/panel/pages/partner-detail/partner-detail.component').then(
                (m) => m.PartnerDetailComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.partner_detail.title',
              panelSubtitleKey: 'PANEL.route_meta.partner_detail.subtitle',
            },
          },
        ],
      },
      {
        path: 'my-requests',
        canActivate: [authGuard, roleGuard(['client', 'partner'])],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/my-requests/my-requests.component').then(
                (m) => m.MyRequestsComponent
              ),
            data: {
              panelTitleKey: 'PANEL.my_requests_page.title',
              panelSubtitleKey: 'PANEL.my_requests_page.subtitle',
            },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('../features/panel/pages/request-detail/request-detail.component').then(
                (m) => m.RequestDetailComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.request_detail.title',
              panelSubtitleKey: 'PANEL.route_meta.request_detail.subtitle',
            },
          },
        ],
      },
      {
        path: 'service-history',
        pathMatch: 'full',
        redirectTo: 'client-dashboard',
      },
      {
        path: 'lili-request',
        canActivate: [authGuard, roleGuard(['client'])],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/lili-request/lili-request.component').then(
                (m) => m.LiliRequestComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.lili_request.title',
              panelSubtitleKey: 'PANEL.route_meta.lili_request.subtitle',
            },
          },
        ],
      },
      {
        path: 'client-dashboard',
        canActivate: [authGuard, roleGuard(['client', 'partner'])],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/client-dashboard/client-dashboard.component').then(
                (m) => m.ClientDashboardComponent
              ),
            data: { hideLayoutHeader: true },
          },
        ],
      },
      {
        path: 'new-request',
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            canActivate: [authGuard, roleGuard(['partner'])],
            loadComponent: () =>
              import('../features/panel/pages/new-request/new-request.component').then(
                (m) => m.NewRequestComponent
              ),
            data: {
              panelTitleKey: 'PANEL.new_request.title',
              panelSubtitleKey: 'PANEL.new_request.subtitle',
            },
          },
          {
            path: ':uuid',
            canActivate: [authGuard, roleGuard(['partner', 'client', 'admin', 'user'])],
            loadComponent: () =>
              import('../features/panel/pages/new-request/new-request.component').then(
                (m) => m.NewRequestComponent
              ),
            data: {
              panelTitleKey: 'PANEL.new_request.title',
              panelSubtitleKey: 'PANEL.route_meta.new_request_draft.subtitle',
            },
          },
        ],
      },
      {
        path: 'request-flow',
        canActivate: [authGuard],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: 'select-service',
            canActivate: [authGuard, roleGuard(['client', 'partner'])],
            loadComponent: () =>
              import('../features/panel/pages/request-flow/select-service-type-page.component').then(
                (m) => m.SelectServiceTypePageComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.select_service.title',
              panelSubtitleKey: 'PANEL.route_meta.select_service.subtitle',
            },
          },
          {
            path: 'client/:serviceType',
            canActivate: [authGuard, roleGuard(['client'])],
            loadComponent: () =>
              import('../features/panel/pages/request-flow/request-flow-redirect.component').then(
                (m) => m.RequestFlowRedirectComponent
              ),
          },
          {
            path: 'partner/:serviceType',
            canActivate: [authGuard, roleGuard(['partner'])],
            loadComponent: () =>
              import('../features/panel/pages/request-flow/request-flow-redirect.component').then(
                (m) => m.RequestFlowRedirectComponent
              ),
          },
        ],
      },
      {
        path: 'my-clients',
        canActivate: [authGuard, roleGuard(['partner'])],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/my-clients/my-clients.component').then(
                (m) => m.MyClientsComponent
              ),
            data: {
              panelTitleKey: 'PANEL.my_clients.title',
              panelSubtitleKey: 'PANEL.my_clients.subtitle',
            },
          },
        ],
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/notifications/notifications-page.component').then(
                (m) => m.NotificationsPageComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.notifications.title',
              panelSubtitleKey: 'PANEL.route_meta.notifications.subtitle',
            },
          },
        ],
      },
      {
        path: 'partner-reports',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/settings/settings.component').then(
                (m) => m.SettingsComponent
              ),
            data: {
              panelTitleKey: 'PANEL.settings_page.title',
              panelSubtitleKey: 'PANEL.settings_page.subtitle',
            },
          },
        ],
      },
      {
        path: 'zoho-sync',
        canActivate: [authGuard, roleGuard(['admin'])],
        loadComponent: () =>
          import('../features/panel/layout/panel-layout/panel-layout.component').then(
            (m) => m.PanelLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/zoho-sync/zoho-sync.component').then(
                (m) => m.ZohoSyncComponent
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.zoho_sync.title',
              panelSubtitleKey: 'PANEL.route_meta.zoho_sync.subtitle',
            },
          },
        ],
      },
    ],
  },

  { path: '**', redirectTo: 'panel/login' },
];
