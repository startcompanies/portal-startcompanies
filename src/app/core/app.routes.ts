import { Routes } from '@angular/router';
import { languageGuard } from '../shared/guards/language.guard';
import { environment } from '../../environments/environment';
import { authGuard } from '../features/panel/guards/auth.guard';
import { roleGuard } from '../features/panel/guards/role.guard';
import { liliAuthGuard } from '../features/lili/guards/lili-auth.guard';

// Helper function para generar URLs canónicas dinámicamente
const getCanonicalUrl = (path: string): string => {
  return `${environment.baseUrl}${path}`;
};

// Helper function para generar URLs de imágenes
const getImageUrl = (path: string): string => {
  return `${environment.baseUrl}${path}`;
};

export const routes: Routes = [
  // ===== RUTA LILI BANKING =====
  {
    path: 'banking',
    canActivate: [liliAuthGuard],
    loadComponent: () =>
      import('../features/lili/components/lili-onboarding/lili-onboarding.component').then(
        (m) => m.LiliOnboardingComponent
      ),
  },

  // ===== RUTA LILI LINK GENERATOR (internal, noindex) =====
  {
    path: 'generate-lili-link-form',
    loadComponent: () =>
      import('../features/lili/components/lili-link-generator/lili-link-generator.component').then(
        (m) => m.LiliLinkGeneratorComponent
      ),
  },

  // ===== RUTAS ESPAÑOLAS SIN PREFIJO (RAÍZ) =====
  {
    path: '',
    canActivate: [languageGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('../features/public/home/home.component').then(
            (m) => m.HomeComponent
          ),
        data: {
          seo: {
            title: 'Start Companies - Apertura de Cuentas Bancarias en EE.UU.',
            description: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía. Acompañamiento paso a paso.',
            keywords: 'LLC Estados Unidos, cuenta bancaria USA, apertura cuenta bancaria, Relay, Start Companies, servicios financieros',
            ogTitle: 'Start Companies - Cuentas Bancarias para LLC en EE.UU.',
            ogDescription: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/'),
          },
        },
      },
      {
        path: 'inicio',
        redirectTo: '',
        pathMatch: 'full'
      },
      {
        path: 'nosotros',
        loadComponent: () =>
          import('../features/public/pages/about-us/us-page/us-page.component').then(
            (m) => m.UsPageComponent
          ),
        data: {
          seo: {
            title: 'Nosotros - Start Companies | Experiencia en Servicios Financieros',
            description: 'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos. Más de 200 emprendedores confían en nosotros.',
            keywords: 'Start Companies equipo, experiencia servicios financieros, sobre nosotros, confianza emprendedores',
            ogTitle: 'Nosotros - Start Companies',
            ogDescription: 'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/nosotros'),
          },
        },
      },
      {
        path: 'contacto',
        loadComponent: () =>
          import('../features/public/pages/contact/contact-page/contact-page.component').then(
            (m) => m.ContactPageComponent
          ),
        data: {
          seo: {
            title: 'Contacto - Start Companies | Habla con Nuestros Expertos',
            description: 'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos. Soporte personalizado y respuesta rápida.',
            keywords: 'contacto Start Companies, soporte LLC, expertos servicios financieros, ayuda cuenta bancaria',
            ogTitle: 'Contacto - Start Companies',
            ogDescription: 'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/contacto'),
          },
        },
      },
      {
        path: 'planes',
        loadComponent: () =>
          import('../features/public/pages/plans/pricing-planes/pricing-planes.component').then(
            (m) => m.PricingPlanesComponent
          ),
        data: {
          seo: {
            title: 'Planes y Precios - Start Companies | Servicios para LLC en EE.UU.',
            description: 'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos. Precios transparentes y servicios completos.',
            keywords: 'planes LLC Estados Unidos, precios cuenta bancaria, servicios Start Companies, apertura LLC USA',
            ogTitle: 'Planes y Precios - Start Companies',
            ogDescription: 'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/planes'),
          },
        },
      },
      {
        path: 'blog',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('../features/public/blog/blog-home/blog-home.component').then(
                (m) => m.BlogHomeComponent
              ),
            data: {
              seo: {
                title: 'Blog - Start Companies | Noticias y Consejos para LLC en EE.UU.',
                description: 'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos. Consejos y noticias del sector.',
                keywords: 'blog LLC Estados Unidos, consejos cuenta bancaria, noticias financieras, Start Companies blog',
                ogTitle: 'Blog - Start Companies',
                ogDescription: 'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
                ogImage: getImageUrl('/assets/logo.png'),
                twitterSite: '@startcompaniess',
                canonical: getCanonicalUrl('/blog'),
              },
            },
          },
          {
            path: 'category/:slug',
            loadComponent: () =>
              import('../features/public/blog/blog-home/blog-home.component').then(
                (m) => m.BlogHomeComponent
              ),
            data: {
              seo: {
                title: 'Categoría de Blog - Start Companies',
                description: 'Explora nuestras categorías de blog sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
                keywords: 'categoría blog LLC, blog Start Companies, noticias financieras, consejos LLC',
                ogTitle: 'Categoría de Blog - Start Companies',
                ogDescription: 'Explora nuestras categorías de blog sobre LLC y servicios financieros en Estados Unidos.',
                ogImage: getImageUrl('/assets/logo.png'),
                twitterSite: '@startcompaniess',
                canonical: getCanonicalUrl('/blog/category/:slug'),
              },
            },
          },
          {
            path: ':slug',
            loadComponent: () => import('../features/public/blog/blog-post-v2/blog-post-v2.component').then(m => m.BlogPostV2Component),
            data: {
              seo: {
                title: 'Artículo de Blog - Start Companies',
                description: 'Lee nuestros artículos sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
                keywords: 'artículo blog LLC, blog Start Companies, noticias financieras, consejos LLC',
                ogTitle: 'Artículo de Blog - Start Companies',
                ogDescription: 'Lee nuestros artículos sobre LLC y servicios financieros en Estados Unidos.',
                ogImage: getImageUrl('/assets/logo.png'),
                twitterSite: '@startcompaniess',
                // canonical se establece dinámicamente en el componente blog-post-v2
              },
            },
          },
        ]
      },
      // Redirects para mantener compatibilidad con rutas antiguas
      {
        path: 'category/:slug',
        redirectTo: '/blog/category/:slug',
        pathMatch: 'full'
      },
      {
        path: 'post/:slug',
        redirectTo: '/blog/:slug',
        pathMatch: 'full'
      },
      {
        path: 'aviso-de-privacidad',
        loadComponent: () => import('../features/public/pages/legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
        data: {
          seo: {
            canonical: getCanonicalUrl('/aviso-de-privacidad'),
            title: 'Aviso de Privacidad - Start Companies',
            description: 'Conoce cómo Start Companies recopila y usa tus datos.'
          }
        }
      },
      {
        path: 'terminos-y-condiciones',
        loadComponent: () => import('../features/public/pages/legal/terms-and-conditions/terms-and-conditions.component').then(m => m.TermsAndConditionsComponent),
        data: {
          seo: {
            canonical: getCanonicalUrl('/terminos-y-condiciones'),
            title: 'Términos y Condiciones - Start Companies',
            description: 'Términos y condiciones del sitio de Start Companies.'
          }
        }
      },
      // Redirigir wizard LLC a formularios unificados (apertura-llc / renovar-llc)
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
      // Rutas de wizard - Otros flujos
      {
        path: 'wizard/cuenta-bancaria',
        loadComponent: () => import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(m => m.CuentaBancariaComponent),
      },
      {
        path: 'wizard/cuenta-bancaria-con-pago',
        loadComponent: () => import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(m => m.CuentaBancariaComponent),
        data: { withPayment: true }
      },
      // Wizard unificado (nuevo) - para pruebas/migración incremental
      {
        path: 'wizard/flow/:serviceType',
        loadComponent: () =>
          import('../features/wizard/pages/request-flow/wizard-request-flow-page.component').then(
            (m) => m.WizardRequestFlowPageComponent
          ),
      },
      // ===== RUTAS DE CAMPAÑAS (SIN GUARD) =====
      {
        path: 'abre-tu-llc',
        loadComponent: () => import('../features/public/landings/landing-abre-tu-llc/landing-abre-tu-llc.component').then(m => m.LandingAbreTuLlcComponent)
      },
      {
        path: 'abrir-llc-estados-unidos',
        loadComponent: () => import('../features/public/landings/landing-abre-tu-llc-google/landing-abre-tu-llc-google.component').then(m => m.LandingAbreTuLlcGoogleComponent)
      },
      {
        path: 'presentacion',
        loadComponent: () => import('../features/public/landings/landing-presentacion/landing-presentacion.component').then(m => m.LandingPresentacionComponent)
      },
      {
        path: 'crear-llc-usa',
        loadComponent: () => import('../features/public/landings/landing-presentacion-youtube/landing-presentacion-youtube.component').then(m => m.LandingPresentacionYoutubeComponent)
      },
      // Controlado por environment.wizardAndPanelEnabled: true → wizard cuenta bancaria, false → landing relay
      {
        path: 'evaluar-caso',
        loadComponent: () => import('../features/public/landings/landing-evaluar-caso/landing-evaluar-caso.component').then(m => m.LandingEvaluarCasoComponent)
      },
      {
        path: 'asesoria-llc',
        loadComponent: () => import('../features/public/landings/landing-asesoria-llc/landing-asesoria-llc.component').then(m => m.LandingAsesoriaLlcComponent)
      },
      {
        path: 'llc-7-dias',
        loadComponent: () => import('../features/public/landings/landing-llc-7-dias/landing-llc-7-dias.component').then(m => m.LandingLlc7DiasComponent)
      },
      {
        path: 'apertura-banco-relay',
        loadComponent: environment.wizardAndPanelEnabled
          ? () =>
              import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(
                (m) => m.CuentaBancariaComponent
              )
          : () =>
              import('../features/public/landings/landing-apertura-relay/landing-apertura-relay.component').then(
                (m) => m.LandingAperturaRelayComponent
              ),
      },
      {
        path: 'agenda',
        loadComponent: () => import('../features/public/landings/landing-agendar/landing-agendar.component').then(m => m.LandingAgendarComponent),
        data: {
          agendaCal: {
            containerId: 'my-cal-inline-agendaorganica',
            namespace: 'agendaorganica',
            calLink: 'startcompanies-businessenusa/agenda-organica',
          },
        },
      },
      {
        path: 'agendar',
        loadComponent: () => import('../features/public/landings/landing-agendar/landing-agendar.component').then(m => m.LandingAgendarComponent),
        data: {
          agendaCal: {
            containerId: 'my-cal-inline-agendaorganica',
            namespace: 'agendaorganica',
            calLink: 'startcompanies-businessenusa/agenda-organica',
          },
        },
      },
      {
        path: 'quiero-mi-llc',
        loadComponent: () => import('../features/public/landings/landing-agendar/landing-agendar.component').then(m => m.LandingAgendarComponent),
        data: {
          agendaCal: {
            containerId: 'my-cal-inline-agendaformmeta',
            namespace: 'agendaformmeta',
            calLink: 'startcompanies-businessenusa/agendaformmeta',
          },
        },
      },
      // Wizard unificado: misma página (`WizardRequestFlowPageComponent`), perfiles distintos en `RequestFlowConfigService`.
      // - /apertura-llc + source wizard: registro con JWT, pago, confirmación; verificación de correo en login del panel (2FA).
      // - /apertura/lead + crm-lead: sin pago, finalize sin cobro; sin paso de código en el wizard.
      // Controlado por environment.wizardAndPanelEnabled: true → wizard, false → formulario público
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
      {
        path: 'form-apertura-relay',
        loadComponent: () => import('../features/public/forms/form-apertura-relay/form-apertura-relay.component').then(m => m.FormAperturaRelayComponent)
      },
      {
        path: 'fixcal',
        loadComponent: () => import('../features/public/forms/form-apertura-fixcal/form-apertura-fixcal.component').then(m => m.FormAperturaFixcalComponent)
      },
      {
        path: 'abotax',
        loadComponent: () => import('../features/public/forms/form-apertura-abotax/form-apertura-abotax.component').then(m => m.FormAperturaAbotaxComponent)
      },
      {
        path: 'rescate-relay',
        loadComponent: () => import('../features/public/landings/landing-rescate-relay/landing-rescate-relay.component').then(m => m.LandingRescateRelayComponent)
      },
      {
        path: 'error-404',
        loadComponent: () =>
          import('../shared/error-404/error-404.component').then(
            (m) => m.Error404Component
          ),
        data: {
          seo: {
            title: 'Error 404 - Página No Encontrada | Start Companies',
            description: 'La página que buscas no existe. Regresa al inicio y descubre nuestros servicios para LLC en Estados Unidos.',
            keywords: 'error 404, página no encontrada, Start Companies, servicios LLC',
            ogTitle: 'Error 404 - Página No Encontrada | Start Companies',
            ogDescription: 'La página que buscas no existe. Regresa al inicio y descubre nuestros servicios para LLC en Estados Unidos.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/error-404'),
          },
        },
      },
      // Solo capturar rutas que NO empiecen con /en/ o /panel/
      {
        matcher: (segments) => {
          // Si la ruta empieza con 'en' o 'panel', no capturar aquí
          if (segments.length > 0 && (segments[0].path === 'en' || segments[0].path === 'panel')) {
            return null;
          }
          return { consumed: segments };
        }, redirectTo: 'error-404'
      }
    ]
  },
  // ===== RUTAS DEL PANEL =====
  {
    path: 'panel',
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/panel-home-redirect/panel-home-redirect.component').then(
                (m) => m.PanelHomeRedirectComponent,
              ),
          },
        ],
      },
      // Rutas de autenticación con layout de auth
      {
        path: 'login',
        loadComponent: () => import('../features/panel/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
        data: {
          seo: {
            title: 'Iniciar Sesión - Panel Start Companies',
            description: 'Accede al panel administrativo de Start Companies'
          }
        }
      },
      {
        path: 'register',
        loadComponent: () => import('../features/panel/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
        data: {
          seo: {
            title: 'Registro - Panel Start Companies',
            description: 'Crea una cuenta en el panel de Start Companies'
          }
        }
      },
      {
        path: 'reset-password',
        loadComponent: () => import('../features/panel/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
        data: {
          seo: {
            title: 'Restablecer Contraseña - Panel Start Companies',
            description: 'Restablece tu contraseña del panel de Start Companies'
          }
        }
      },
      {
        path: 'set-password',
        loadComponent: () => import('../features/panel/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
        data: {
          seo: {
            title: 'Establecer Contraseña - Panel Start Companies',
            description: 'Establece tu contraseña para acceder al panel de Start Companies'
          }
        }
      },
      // Rutas del panel con layout principal (requieren autenticación)
      {
        path: 'dashboard',
        canActivate: [authGuard, roleGuard(['admin', 'user'])],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
            data: {
              panelTitleKey: 'PANEL.admin_dashboard.title',
              panelSubtitleKey: 'PANEL.admin_dashboard.subtitle',
            },
          }
        ],
        data: {
          seo: {
            title: 'Dashboard - Panel Start Companies',
            description: 'Panel administrativo de Start Companies'
          }
        }
      },
      {
        path: 'requests',
        canActivate: [authGuard, roleGuard(['admin', 'user'])],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/admin-requests/admin-requests.component').then(m => m.AdminRequestsComponent),
            data: {
              panelTitleKey: 'PANEL.route_meta.admin_requests.title',
              panelSubtitleKey: 'PANEL.route_meta.admin_requests.subtitle',
            },
          },
          {
            path: ':id',
            loadComponent: () => import('../features/panel/pages/request-detail/request-detail.component').then(m => m.RequestDetailComponent),
            data: {
              panelTitleKey: 'PANEL.route_meta.request_detail.title',
              panelSubtitleKey: 'PANEL.route_meta.request_detail.subtitle',
            },
          }
        ],
        data: {
          seo: {
            title: 'Gestión de Solicitudes - Panel Start Companies',
            description: 'Administra todas las solicitudes del sistema'
          }
        }
      },
      {
        path: 'clients',
        canActivate: [authGuard, roleGuard(['admin'])],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/clients/clients.component').then(m => m.ClientsComponent),
            data: {
              panelTitleKey: 'PANEL.route_meta.clients.title',
              panelSubtitleKey: 'PANEL.route_meta.clients.subtitle',
            },
          }
        ],
        data: {
          seo: {
            title: 'Clientes - Panel Start Companies',
            description: 'Gestión de clientes'
          }
        }
      },
      {
        // Partners (lista + detalle): admin y staff user. /panel/clients sigue siendo solo admin.
        path: 'partners',
        canActivate: [authGuard, roleGuard(['admin', 'user'])],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/partners/partners.component').then(m => m.PartnersComponent),
            data: {
              panelTitleKey: 'PANEL.route_meta.partners.title',
              panelSubtitleKey: 'PANEL.route_meta.partners.subtitle',
            },
          },
          {
            path: ':id',
            loadComponent: () => import('../features/panel/pages/partner-detail/partner-detail.component').then(m => m.PartnerDetailComponent),
            data: {
              panelTitleKey: 'PANEL.route_meta.partner_detail.title',
              panelSubtitleKey: 'PANEL.route_meta.partner_detail.subtitle',
            },
          }
        ],
        data: {
          seo: {
            title: 'Gestión de Partners - Panel Start Companies',
            description: 'Administra los partners y sus clientes'
          }
        }
      },
      {
        path: 'my-requests',
        canActivate: [authGuard, roleGuard(['client', 'partner'])],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/my-requests/my-requests.component').then(m => m.MyRequestsComponent),
            data: {
              panelTitleKey: 'PANEL.my_requests_page.title',
              panelSubtitleKey: 'PANEL.my_requests_page.subtitle',
            },
          },
          {
            path: ':id',
            loadComponent: () => import('../features/panel/pages/request-detail/request-detail.component').then(m => m.RequestDetailComponent),
            data: {
              panelTitleKey: 'PANEL.route_meta.request_detail.title',
              panelSubtitleKey: 'PANEL.route_meta.request_detail.subtitle',
            },
          }
        ],
        data: {
          seo: {
            title: 'Mis Solicitudes - Panel Start Companies',
            description: 'Seguimiento de tus solicitudes'
          }
        }
      },
      // Historial de servicios oculto temporalmente: redirige al dashboard (componente conservado por si se reactiva).
      {
        path: 'service-history',
        pathMatch: 'full',
        redirectTo: 'client-dashboard',
      },
      {
        path: 'lili-request',
        canActivate: [authGuard, roleGuard(['client'])],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../features/panel/pages/lili-request/lili-request.component').then(
                (m) => m.LiliRequestComponent,
              ),
            data: {
              panelTitleKey: 'PANEL.route_meta.lili_request.title',
              panelSubtitleKey: 'PANEL.route_meta.lili_request.subtitle',
            },
          },
        ],
        data: {
          seo: {
            title: 'Solicitar cuenta Lili - Panel Start Companies',
            description: 'Completa la solicitud de cuenta bancaria Lili desde tu panel',
          },
        },
      },
      {
        path: 'client-dashboard',
        canActivate: [authGuard, roleGuard(['client', 'partner'])],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent),
            data: {
              hideLayoutHeader: true,
            },
          }
        ],
        data: {
          seo: {
            title: 'Dashboard - Panel Start Companies',
            description: 'Resumen de tus procesos'
          }
        }
      },
      {
        path: 'new-request',
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            canActivate: [authGuard, roleGuard(['partner'])],
            loadComponent: () => import('../features/panel/pages/new-request/new-request.component').then(m => m.NewRequestComponent),
            data: {
              seo: {
                title: 'Nueva Solicitud - Panel Start Companies',
                description: 'Crea una nueva solicitud para un cliente'
              },
              panelTitleKey: 'PANEL.new_request.title',
              panelSubtitleKey: 'PANEL.new_request.subtitle',
            }
          },
          {
            path: ':uuid',
            canActivate: [authGuard, roleGuard(['partner', 'client'])],
            loadComponent: () => import('../features/panel/pages/new-request/new-request.component').then(m => m.NewRequestComponent),
            data: {
              seo: {
                title: 'Continuar Solicitud - Panel Start Companies',
                description: 'Continúa completando tu solicitud'
              },
              panelTitleKey: 'PANEL.new_request.title',
              panelSubtitleKey: 'PANEL.route_meta.new_request_draft.subtitle',
            }
          }
        ]
      },
      // request-flow: solo select-service (elección de tipo). El flujo real vive en new-request.
      // client/:serviceType y partner/:serviceType redirigen a new-request para una sola entrada canónica.
      {
        path: 'request-flow',
        canActivate: [authGuard],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
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
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/my-clients/my-clients.component').then(m => m.MyClientsComponent),
            data: {
              panelTitleKey: 'PANEL.my_clients.title',
              panelSubtitleKey: 'PANEL.my_clients.subtitle',
            },
          }
        ],
        data: {
          seo: {
            title: 'Mis Clientes - Panel Start Companies',
            description: 'Gestiona los clientes asociados a tu cuenta'
          }
        }
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/notifications/notifications-page.component').then(m => m.NotificationsPageComponent),
            data: {
              panelTitleKey: 'PANEL.route_meta.notifications.title',
              panelSubtitleKey: 'PANEL.route_meta.notifications.subtitle',
            },
          }
        ],
        data: {
          seo: {
            title: 'Notificaciones - Panel Start Companies',
            description: 'Tus notificaciones y actualizaciones'
          }
        }
      },
      // Reportes de partners oculto temporalmente (volver a cargar PartnerReportsComponent y entrada en menú admin)
      {
        path: 'partner-reports',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/settings/settings.component').then(m => m.SettingsComponent),
            data: {
              panelTitleKey: 'PANEL.settings_page.title',
              panelSubtitleKey: 'PANEL.settings_page.subtitle',
            },
          }
        ],
        data: {
          seo: {
            title: 'Configuración - Panel Start Companies',
            description: 'Gestiona tu perfil, preferencias y configuraciones'
          }
        }
      },
      {
        path: 'zoho-sync',
        canActivate: [authGuard, roleGuard(['admin'])],
        data: {
          seo: {
            title: 'Sincronización Zoho - Panel Start Companies',
            description: 'Gestiona la sincronización de datos entre el panel y Zoho CRM'
          }
        },
        loadComponent: () => import('../features/panel/layout/panel-layout/panel-layout.component').then(m => m.PanelLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('../features/panel/pages/zoho-sync/zoho-sync.component').then(m => m.ZohoSyncComponent),
            data: {
              panelTitleKey: 'PANEL.route_meta.zoho_sync.title',
              panelSubtitleKey: 'PANEL.route_meta.zoho_sync.subtitle',
            },
          }
        ]
      }
    ]
  },
  // ===== RUTAS INGLESAS CON PREFIJO /en =====
  {
    path: 'en',
    children: [
      // ===== RUTAS EXISTENTES CON SEO COMPLETO =====
      {
        path: 'home',
        loadComponent: () =>
          import('../features/public/home/home.component').then(
            (m) => m.HomeComponent
          ),
        data: {
          seo: {
            title: 'Start Companies - US Bank Account Opening Services',
            description: 'We open bank accounts for LLCs in the United States. 100% online service, no fees and with guarantee. Step-by-step support.',
            keywords: 'LLC United States, US bank account, bank account opening, Relay, Start Companies, financial services',
            ogTitle: 'Start Companies - US Bank Account Services',
            ogDescription: 'We open bank accounts for LLCs in the United States. 100% online service with no fees.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/home'),
          },
        },
      },
      // Redirección desde la raíz de inglés
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'about-us',
        loadComponent: () =>
          import('../features/public/pages/about-us/us-page/us-page.component').then(
            (m) => m.UsPageComponent
          ),
        data: {
          seo: {
            title: 'About Us - Start Companies | Financial Services Experience',
            description: 'Meet our team and experience in financial services for LLCs in the United States. More than 200 entrepreneurs trust us.',
            keywords: 'Start Companies team, financial services experience, about us, entrepreneur trust',
            ogTitle: 'About Us - Start Companies',
            ogDescription: 'Meet our team and experience in financial services for LLCs in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/about-us'),
          },
        },
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('../features/public/pages/contact/contact-page/contact-page.component').then(
            (m) => m.ContactPageComponent
          ),
        data: {
          seo: {
            title: 'Contact - Start Companies | Talk to Our Experts',
            description: 'Contact our experts in financial services for LLCs in the United States. Personalized support and quick response.',
            keywords: 'Start Companies contact, LLC support, financial services experts, bank account help',
            ogTitle: 'Contact - Start Companies',
            ogDescription: 'Contact our experts in financial services for LLCs in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/contact'),
          },
        },
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('../features/public/pages/plans/pricing-planes/pricing-planes.component').then(
            (m) => m.PricingPlanesComponent
          ),
        data: {
          seo: {
            title: 'Plans and Pricing - Start Companies | US LLC Services',
            description: 'Discover our plans for LLC formation and bank accounts in the United States. Transparent pricing and complete services.',
            keywords: 'US LLC plans, bank account pricing, Start Companies services, LLC formation USA',
            ogTitle: 'Plans and Pricing - Start Companies',
            ogDescription: 'Discover our plans for LLC formation and bank accounts in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/plans'),
          },
        },
      },
      {
        path: 'privacy-policy',
        loadComponent: () => import('../features/public/pages/legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
        data: { seo: { canonical: getCanonicalUrl('/en/privacy-policy'), title: 'Privacy Policy - Start Companies', description: 'Learn how Start Companies collects and uses your data.' } }
      },
      {
        path: 'terms-and-conditions',
        loadComponent: () => import('../features/public/pages/legal/terms-and-conditions/terms-and-conditions.component').then(m => m.TermsAndConditionsComponent),
        data: { seo: { canonical: getCanonicalUrl('/en/terms-and-conditions'), title: 'Terms and Conditions - Start Companies', description: 'Terms and conditions of Start Companies website.' } }
      },
      {
        path: 'blog',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('../features/public/blog/blog-home/blog-home.component').then(
                (m) => m.BlogHomeComponent
              ),
            data: {
              seo: {
                title: 'Blog - Start Companies | News and Tips for LLCs in the U.S.',
                description: 'Stay informed about LLCs, bank accounts and financial services in the United States. Tips and industry news.',
                keywords: 'blog LLC United States, bank account tips, financial news, Start Companies blog',
                ogTitle: 'Blog - Start Companies',
                ogDescription: 'Stay informed about LLCs, bank accounts and financial services in the United States.',
                ogImage: getImageUrl('/assets/logo.png'),
                twitterSite: '@startcompaniess',
                canonical: getCanonicalUrl('/en/blog'),
              },
            },
          },
          {
            path: 'category/:slug',
            loadComponent: () =>
              import('../features/public/blog/blog-home/blog-home.component').then(
                (m) => m.BlogHomeComponent
              ),
            data: {
              seo: {
                title: 'Blog Category - Start Companies',
                description: 'Explore our blog categories about LLCs, bank accounts and financial services in the United States.',
                keywords: 'blog category LLC, Start Companies blog, financial news, LLC tips',
                ogTitle: 'Blog Category - Start Companies',
                ogDescription: 'Explore our blog categories about LLCs and financial services in the United States.',
                ogImage: getImageUrl('/assets/logo.png'),
                twitterSite: '@startcompaniess',
                canonical: getCanonicalUrl('/en/blog/category/:slug'),
              },
            },
          },
          {
            path: ':slug',
            loadComponent: () => import('../features/public/blog/blog-post-v2/blog-post-v2.component').then(m => m.BlogPostV2Component),
            data: {
              seo: {
                title: 'Blog Article - Start Companies',
                description: 'Read our articles about LLCs, bank accounts and financial services in the United States.',
                keywords: 'blog article LLC, Start Companies blog, financial news, LLC tips',
                ogTitle: 'Blog Article - Start Companies',
                ogDescription: 'Read our articles about LLCs and financial services in the United States.',
                ogImage: getImageUrl('/assets/logo.png'),
                twitterSite: '@startcompaniess',
                // canonical se establece dinámicamente en el componente blog-post-v2
              },
            },
          },
        ]
      },
      // Redirects para mantener compatibilidad con rutas antiguas (inglés)
      {
        path: 'category/:slug',
        redirectTo: '/en/blog/category/:slug',
        pathMatch: 'full'
      },
      {
        path: 'post/:slug',
        redirectTo: '/en/blog/:slug',
        pathMatch: 'full'
      },
      // Wizard routes - English (redirect LLC a forms)
      {
        path: 'wizard/verify-email',
        loadComponent: () => import('../features/wizard/components/email-verification/email-verification.component').then(m => m.WizardEmailVerificationComponent),
      },
      {
        path: 'wizard/llc-opening',
        redirectTo: '/en/llc-opening',
        pathMatch: 'full',
      },
      {
        path: 'wizard/llc-renewal',
        redirectTo: '/en/llc-renewal',
        pathMatch: 'full',
      },
      {
        path: 'wizard/bank-account',
        loadComponent: () => import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(m => m.CuentaBancariaComponent),
      },
      {
        path: 'wizard/bank-account-with-payment',
        loadComponent: () => import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(m => m.CuentaBancariaComponent),
        data: { withPayment: true }
      },
      // Wizard unificado (nuevo) - EN
      {
        path: 'wizard/flow/:serviceType',
        loadComponent: () =>
          import('../features/wizard/pages/request-flow/wizard-request-flow-page.component').then(
            (m) => m.WizardRequestFlowPageComponent
          ),
      },
      /**Landings en inglés */
      {
        path: 'llc-formation',
        loadComponent: () =>
          import(
            '../features/public/landings/landing-abre-tu-llc/landing-abre-tu-llc.component'
          ).then((m) => m.LandingAbreTuLlcComponent),
        data: {
          seo: {
            title: 'Open your LLC in the United States - Start Companies',
            description: 'We open your LLC in the United States quickly and safely. Complete service with step-by-step support.',
            keywords: 'LLC formation United States, create LLC USA, business formation USA, Start Companies',
            ogTitle: 'Open your LLC in the United States - Start Companies',
            ogDescription: 'We open your LLC in the United States quickly and safely.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/llc-formation'),
          },
        },
      },
      {
        path: 'llc-formation-google',
        loadComponent: () =>
          import(
            '../features/public/landings/landing-abre-tu-llc-google/landing-abre-tu-llc-google.component'
          ).then((m) => m.LandingAbreTuLlcGoogleComponent),
        data: {
          seo: {
            title: 'Open your LLC in the United States (Google) - Start Companies',
            description: 'We open your LLC in the United States quickly and safely. Complete service with step-by-step support.',
            keywords: 'LLC formation United States, create LLC USA, business formation USA, Start Companies',
            ogTitle: 'Open your LLC in the United States - Start Companies',
            ogDescription: 'We open your LLC in the United States quickly and safely.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/llc-formation-google'),
          },
        },
      },
      {
        path: 'presentation',
        loadComponent: () =>
          import(
            '../features/public/landings/landing-presentacion/landing-presentacion.component'
          ).then((m) => m.LandingPresentacionComponent),
        data: {
          seo: {
            title: 'LLC Services Presentation - Start Companies',
            description: 'Discover our LLC services in the United States. Complete presentation of business formation and bank accounts.',
            keywords: 'LLC services presentation United States, LLC USA services, Start Companies presentation, US business formation',
            ogTitle: 'LLC Services Presentation - Start Companies',
            ogDescription: 'Discover our LLC services in the United States. Complete presentation of business formation.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/presentation'),
          },
        },
      },
      {
        path: 'presentation-youtube',
        loadComponent: () =>
          import(
            '../features/public/landings/landing-presentacion-youtube/landing-presentacion-youtube.component'
          ).then((m) => m.LandingPresentacionYoutubeComponent),
        data: {
          seo: {
            title: 'LLC Services Presentation (YouTube) - Start Companies',
            description: 'Discover our LLC services in the United States.',
            keywords: 'LLC services presentation United States, LLC USA services, Start Companies',
            ogTitle: 'LLC Services Presentation - Start Companies',
            ogDescription: 'Discover our LLC services in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/presentation-youtube'),
          },
        },
      },
      // Controlado por environment.wizardAndPanelEnabled: true → wizard cuenta bancaria, false → landing relay
      {
        path: 'evaluate-case',
        loadComponent: () =>
          import(
            '../features/public/landings/landing-evaluar-caso/landing-evaluar-caso.component'
          ).then((m) => m.LandingEvaluarCasoComponent),
        data: {
          seo: {
            title: 'Evaluate Your Case - LLC in the U.S. | Start Companies',
            description: 'Get a free evaluation for your LLC in the United States. More than 1,000 entrepreneurs trust us.',
            keywords: 'evaluate case LLC USA, free consultation LLC, Start Companies',
            ogTitle: 'Evaluate Your Case - Start Companies',
            ogDescription: 'Get a free evaluation for your LLC in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/evaluate-case'),
          },
        },
      },
      {
        path: 'llc-consultation',
        loadComponent: () =>
          import(
            '../features/public/landings/landing-asesoria-llc/landing-asesoria-llc.component'
          ).then((m) => m.LandingAsesoriaLlcComponent),
        data: {
          seo: {
            title: 'Free LLC Consultation - Start Companies',
            description: 'Free consultation for your LLC in the United States. We guide you through the entire process.',
            keywords: 'LLC consultation USA, free advice LLC, Start Companies',
            ogTitle: 'Free LLC Consultation - Start Companies',
            ogDescription: 'Free consultation for your LLC in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/llc-consultation'),
          },
        },
      },
      {
        path: 'llc-7-days',
        loadComponent: () =>
          import(
            '../features/public/landings/landing-llc-7-dias/landing-llc-7-dias.component'
          ).then((m) => m.LandingLlc7DiasComponent),
        data: {
          seo: {
            title: 'Your LLC in 7 Days - 100% Online | Start Companies',
            description: 'Form your LLC in the U.S. in 7 days, 100% online. No advance payments.',
            keywords: 'LLC 7 days USA, online LLC formation, Start Companies',
            ogTitle: 'Your LLC in 7 Days - Start Companies',
            ogDescription: 'Form your LLC in the U.S. in 7 days, 100% online.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/llc-7-days'),
          },
        },
      },
      {
        path: 'relay-account-opening',
        loadComponent: environment.wizardAndPanelEnabled
          ? () =>
              import('../features/wizard/flow-cuenta-bancaria/cuenta-bancaria.component').then(
                (m) => m.CuentaBancariaComponent
              )
          : () =>
              import(
                '../features/public/landings/landing-apertura-relay/landing-apertura-relay.component'
              ).then((m) => m.LandingAperturaRelayComponent),
        data: {
          seo: {
            title: 'Relay Bank Opening - Start Companies',
            description: 'We open your Relay bank account for LLCs in the United States. Simple process and 100% online.',
            keywords: 'Relay bank account, Relay account opening, Relay bank USA, Start Companies',
            ogTitle: 'Relay Bank Opening - Start Companies',
            ogDescription: 'We open your Relay bank account for LLCs in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/relay-account-opening'),
          },
        },
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('../features/public/landings/landing-agendar/landing-agendar.component').then(
            (m) => m.LandingAgendarComponent
          ),
        data: {
          agendaCal: {
            containerId: 'my-cal-inline-agendaorganica',
            namespace: 'agendaorganica',
            calLink: 'startcompanies-businessenusa/agenda-organica',
          },
          seo: {
            title: 'Schedule - Start Companies',
            description: 'Schedule a consultation with our experts.',
            keywords: 'schedule consultation, Start Companies, expert advice',
            ogTitle: 'Schedule',
            ogDescription: 'Schedule a consultation with our experts.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/schedule'),
          },
        },
      },
      {
        path: 'want-my-llc',
        loadComponent: () =>
          import('../features/public/landings/landing-agendar/landing-agendar.component').then(
            (m) => m.LandingAgendarComponent
          ),
        data: {
          agendaCal: {
            containerId: 'my-cal-inline-agendaformmeta',
            namespace: 'agendaformmeta',
            calLink: 'startcompanies-businessenusa/agendaformmeta',
          },
          seo: {
            title: 'Want my LLC - Schedule - Start Companies',
            description: 'Schedule a consultation with our experts.',
            keywords: 'schedule consultation, LLC, Start Companies',
            ogTitle: 'Want my LLC - Start Companies',
            ogDescription: 'Schedule a consultation with our experts.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/want-my-llc'),
          },
        },
      },
      /** Wizard unificado EN (llc-opening, llc-renewal) */
      // Controlado por environment.wizardAndPanelEnabled: true → wizard, false → formulario público
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
          seo: {
            title: 'LLC Opening in the United States - Start Companies',
            description: 'We open your LLC in the United States quickly and safely. Complete service with step-by-step support.',
            keywords: 'LLC opening United States, create LLC USA, business formation USA, Start Companies',
            ogTitle: 'LLC Opening in the United States - Start Companies',
            ogDescription: 'We open your LLC in the United States quickly and safely.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/llc-opening'),
          },
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
          seo: {
            title: 'LLC Renewal in the United States - Start Companies',
            description: 'We renew your LLC in the United States before it expires. Avoid penalties and keep your business active.',
            keywords: 'LLC renewal United States, renew LLC USA, keep LLC active, Start Companies',
            ogTitle: 'LLC Renewal in the United States - Start Companies',
            ogDescription: 'We renew your LLC in the United States before it expires.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/llc-renewal'),
          },
        },
      },
      {
        path: 'relay-opening-form',
        loadComponent: () =>
          import(
            '../features/public/forms/form-apertura-relay/form-apertura-relay.component'
          ).then((m) => m.FormAperturaRelayComponent),
        data: {
          seo: {
            title: 'Relay Bank Account Opening - Start Companies',
            description: 'We open your Relay bank account for LLCs in the United States. Simple form and 100% online process.',
            keywords: 'Relay bank account, Relay account opening, Relay bank USA, Start Companies',
            ogTitle: 'Relay Bank Account Opening - Start Companies',
            ogDescription: 'We open your Relay bank account for LLCs in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/relay-opening-form'),
          },
        },
      },
      {
        path: 'error-404',
        loadComponent: () =>
          import('../shared/error-404/error-404.component').then(
            (m) => m.Error404Component
          ),
        data: {
          seo: {
            title: 'Error 404 - Page Not Found | Start Companies',
            description: 'The page you are looking for does not exist. Return to the homepage and discover our services for LLCs in the United States.',
            keywords: 'error 404, page not found, Start Companies, LLC services',
            ogTitle: 'Error 404 - Page Not Found | Start Companies',
            ogDescription: 'The page you are looking for does not exist. Return to the homepage and discover our services for LLCs in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/error-404'),
          },
        },
      },
      { path: '**', redirectTo: 'error-404' }, // 👈 relativo al en
    ]
  },
];