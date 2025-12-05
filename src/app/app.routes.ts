import { Routes } from '@angular/router';
import { title } from 'process';
import { languageGuard } from './shared/guards/language.guard';
import { CampaignRedirectGuard } from './shared/guards/campaign-redirect.guard';
import { environment } from '../environments/environment';

// Helper function para generar URLs canónicas dinámicamente
const getCanonicalUrl = (path: string): string => {
  return `${environment.baseUrl}${path}`;
};

// Helper function para generar URLs de imágenes
const getImageUrl = (path: string): string => {
  return `${environment.baseUrl}${path}`;
};

export const routes: Routes = [
  // ===== RUTAS ESPAÑOLAS SIN PREFIJO (RAÍZ) =====
  {
    path: '',
    canActivate: [languageGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '/inicio'
      },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./sc-content/sc-content.component').then(
            (m) => m.ScContentComponent
          ),
        data: {
          seo: {
            title: 'Start Companies LLC - Apertura de Cuentas Bancarias en EE.UU.',
            description: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía. Acompañamiento paso a paso.',
            keywords: 'LLC Estados Unidos, cuenta bancaria USA, apertura cuenta bancaria, Relay, Start Companies, servicios financieros',
            ogTitle: 'Start Companies LLC - Cuentas Bancarias para LLC en EE.UU.',
            ogDescription: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/inicio'),
          },
        },
      },
      {
        path: 'nosotros',
        loadComponent: () =>
          import('./us/us-page/us-page.component').then(
            (m) => m.UsPageComponent
          ),
        data: {
          seo: {
            title: 'Nosotros - Start Companies LLC | Experiencia en Servicios Financieros',
            description: 'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos. Más de 200 emprendedores confían en nosotros.',
            keywords: 'Start Companies equipo, experiencia servicios financieros, sobre nosotros, confianza emprendedores',
            ogTitle: 'Nosotros - Start Companies LLC',
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
          import('./contact/contact-page/contact-page.component').then(
            (m) => m.ContactPageComponent
          ),
        data: {
          seo: {
            title: 'Contacto - Start Companies LLC | Habla con Nuestros Expertos',
            description: 'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos. Soporte personalizado y respuesta rápida.',
            keywords: 'contacto Start Companies, soporte LLC, expertos servicios financieros, ayuda cuenta bancaria',
            ogTitle: 'Contacto - Start Companies LLC',
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
          import('./plans/pricing-planes/pricing-planes.component').then(
            (m) => m.PricingPlanesComponent
          ),
        data: {
          seo: {
            title: 'Planes y Precios - Start Companies LLC | Servicios para LLC en EE.UU.',
            description: 'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos. Precios transparentes y servicios completos.',
            keywords: 'planes LLC Estados Unidos, precios cuenta bancaria, servicios Start Companies, apertura LLC USA',
            ogTitle: 'Planes y Precios - Start Companies LLC',
            ogDescription: 'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/planes'),
          },
        },
      },
      {
        path: 'blog',
        loadComponent: () =>
          import('./blog/blog-home/blog-home.component').then(
            (m) => m.BlogHomeComponent
          ),
        data: {
          seo: {
            title: 'Blog - Start Companies LLC | Noticias y Consejos para LLC en EE.UU.',
            description: 'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos. Consejos y noticias del sector.',
            keywords: 'blog LLC Estados Unidos, consejos cuenta bancaria, noticias financieras, Start Companies blog',
            ogTitle: 'Blog - Start Companies LLC',
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
          import('./blog/blog-home/blog-home.component').then(
            (m) => m.BlogHomeComponent
          ),
        data: {
          seo: {
            title: 'Categoría de Blog - Start Companies LLC',
            description: 'Explora nuestras categorías de blog sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
            keywords: 'categoría blog LLC, blog Start Companies, noticias financieras, consejos LLC',
            ogTitle: 'Categoría de Blog - Start Companies LLC',
            ogDescription: 'Explora nuestras categorías de blog sobre LLC y servicios financieros en Estados Unidos.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/category/:slug'),
          },
        },
      },
      {
        path: 'post/:slug',
        /*loadComponent: () =>
          import('./blog/blog-post/blog-post.component').then(
            (m) => m.BlogPostComponent
          ),*/
        loadComponent: () => import('./blogV2/blog-post-v2/blog-post-v2.component').then(m => m.BlogPostV2Component),
        data: {
          seo: {
            title: 'Artículo de Blog - Start Companies LLC',
            description: 'Lee nuestros artículos sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
            keywords: 'artículo blog LLC, blog Start Companies, noticias financieras, consejos LLC',
            ogTitle: 'Artículo de Blog - Start Companies LLC',
            ogDescription: 'Lee nuestros artículos sobre LLC y servicios financieros en Estados Unidos.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/post/:slug'),
          },
        },
      },
      {
        path: 'aviso-de-privacidad',
        loadComponent: () => import('./legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
        data: {
          seo: {
            canonical: getCanonicalUrl('/aviso-de-privacidad'),
            title: 'Aviso de Privacidad - Start Companies LLC',
            description: 'Conoce cómo Start Companies LLC recopila y usa tus datos.'
          }
        }
      },
      {
        path: 'terminos-y-condiciones',
        loadComponent: () => import('./legal/terms-and-conditions/terms-and-conditions.component').then(m => m.TermsAndConditionsComponent),
        data: {
          seo: {
            canonical: getCanonicalUrl('/terminos-y-condiciones'),
            title: 'Términos y Condiciones - Start Companies LLC',
            description: 'Términos y condiciones del sitio de Start Companies LLC.'
          }
        }
      },
      // Ruta de registro de cliente para wizard
      {
        path: 'registro-cliente',
        loadComponent: () => import('./sections/register-client/register-client.component').then(m => m.RegisterClientComponent),
      },
      // ===== RUTAS DE CAMPAÑAS (SIN GUARD) =====
      {
        path: 'abre-tu-llc',
        loadComponent: () => import('./landings/landing-abre-tu-llc/landing-abre-tu-llc.component').then(m => m.LandingAbreTuLlcComponent)
      },
      {
        path: 'presentacion',
        loadComponent: () => import('./landings/landing-presentacion/landing-presentacion.component').then(m => m.LandingPresentacionComponent)
      },
      {
        path: 'apertura-banco-relay',
        loadComponent: () => import('./landings/landing-apertura-relay/landing-apertura-relay.component').then(m => m.LandingAperturaRelayComponent)
      },
      {
        path: 'agenda',
        loadComponent: () => import('./landings/landing-agendar/landing-agendar.component').then(m => m.LandingAgendarComponent)
      },
      {
        path: 'agendar',
        loadComponent: () => import('./landings/landing-agendar/landing-agendar.component').then(m => m.LandingAgendarComponent)
      },
      {
        path: 'apertura-llc',
        loadComponent: () => import('./manejo-llc/apertura-llc/apertura-llc.component').then(m => m.AperturaLlcComponent)
      },
      {
        path: 'renovar-llc',
        loadComponent: () => import('./manejo-llc/renovar-llc/renovar-llc.component').then(m => m.RenovarLlcComponent)
      },
      {
        path: 'form-apertura-relay',
        //loadComponent: () => import('./manejo-llc/form-apertura-relay/form-apertura-relay.component').then(m => m.FormAperturaRelayComponent)
        loadComponent: () => import('./manejo-llc/create-bank-account/create-bank-account.component').then(m => m.CreateBankAccountComponent)
      },
      {
        path: 'fixcal',
        loadComponent: () => import('./manejo-llc/form-apertura-fixcal/form-apertura-fixcal.component').then(m => m.FormAperturaFixcalComponent)
      },
      {
        path: 'abotax',
        loadComponent: () => import('./manejo-llc/form-apertura-abotax/form-apertura-abotax.component').then(m => m.FormAperturaAbotaxComponent)
      },
      {
        path: 'rescate-relay',
        loadComponent: () => import('./landings/landing-rescate-relay/landing-rescate-relay.component').then(m => m.LandingRescateRelayComponent)
      },
      {
        path: 'error-404',
        loadComponent: () =>
          import('./shared/error-404/error-404.component').then(
            (m) => m.Error404Component
          ),
        data: {
          seo: {
            title: 'Error 404 - Página No Encontrada | Start Companies LLC',
            description: 'La página que buscas no existe. Regresa al inicio y descubre nuestros servicios para LLC en Estados Unidos.',
            keywords: 'error 404, página no encontrada, Start Companies, servicios LLC',
            ogTitle: 'Error 404 - Página No Encontrada | Start Companies LLC',
            ogDescription: 'La página que buscas no existe. Regresa al inicio y descubre nuestros servicios para LLC en Estados Unidos.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/error-404'),
          },
        },
      },
      // Solo capturar rutas que NO empiecen con /en/
      {
        matcher: (segments) => {
          // Si la ruta empieza con 'en', no capturar aquí
          if (segments.length > 0 && segments[0].path === 'en') {
            return null;
          }
          return { consumed: segments };
        }, redirectTo: 'error-404'
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
          import('./sc-content/sc-content.component').then(
            (m) => m.ScContentComponent
          ),
        data: {
          seo: {
            title: 'Start Companies LLC - US Bank Account Opening Services',
            description: 'We open bank accounts for LLCs in the United States. 100% online service, no fees and with guarantee. Step-by-step support.',
            keywords: 'LLC United States, US bank account, bank account opening, Relay, Start Companies, financial services',
            ogTitle: 'Start Companies LLC - US Bank Account Services',
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
          import('./us/us-page/us-page.component').then(
            (m) => m.UsPageComponent
          ),
        data: {
          seo: {
            title: 'About Us - Start Companies LLC | Financial Services Experience',
            description: 'Meet our team and experience in financial services for LLCs in the United States. More than 200 entrepreneurs trust us.',
            keywords: 'Start Companies team, financial services experience, about us, entrepreneur trust',
            ogTitle: 'About Us - Start Companies LLC',
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
          import('./contact/contact-page/contact-page.component').then(
            (m) => m.ContactPageComponent
          ),
        data: {
          seo: {
            title: 'Contact - Start Companies LLC | Talk to Our Experts',
            description: 'Contact our experts in financial services for LLCs in the United States. Personalized support and quick response.',
            keywords: 'Start Companies contact, LLC support, financial services experts, bank account help',
            ogTitle: 'Contact - Start Companies LLC',
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
          import('./plans/pricing-planes/pricing-planes.component').then(
            (m) => m.PricingPlanesComponent
          ),
        data: {
          seo: {
            title: 'Plans and Pricing - Start Companies LLC | US LLC Services',
            description: 'Discover our plans for LLC formation and bank accounts in the United States. Transparent pricing and complete services.',
            keywords: 'US LLC plans, bank account pricing, Start Companies services, LLC formation USA',
            ogTitle: 'Plans and Pricing - Start Companies LLC',
            ogDescription: 'Discover our plans for LLC formation and bank accounts in the United States.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/plans'),
          },
        },
      },
      {
        path: 'privacy-policy',
        loadComponent: () => import('./legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
        data: { seo: { canonical: getCanonicalUrl('/en/privacy-policy'), title: 'Privacy Policy - Start Companies LLC', description: 'Learn how Start Companies LLC collects and uses your data.' } }
      },
      {
        path: 'terms-and-conditions',
        loadComponent: () => import('./legal/terms-and-conditions/terms-and-conditions.component').then(m => m.TermsAndConditionsComponent),
        data: { seo: { canonical: getCanonicalUrl('/en/terms-and-conditions'), title: 'Terms and Conditions - Start Companies LLC', description: 'Terms and conditions of Start Companies LLC website.' } }
      },
      {
        path: 'blog',
        redirectTo: '/blog',
        pathMatch: 'full'
      },
      {
        path: 'category/:slug',
        redirectTo: '/category/:slug',
        pathMatch: 'full'
      },
      {
        path: 'post/:slug',
        redirectTo: '/post/:slug',
        pathMatch: 'full'
      },
      /** Ruta registro clientes en ingles */
      {
        path: 'client-register',
        loadComponent: () => import('./sections/register-client/register-client.component').then(m => m.RegisterClientComponent),
      },
      /**Landings en inglés */
      {
        path: 'llc-formation',
        loadComponent: () =>
          import(
            './landings/landing-abre-tu-llc/landing-abre-tu-llc.component'
          ).then((m) => m.LandingAbreTuLlcComponent),
        data: {
          seo: {
            title: 'Open your LLC in the United States - Start Companies LLC',
            description: 'We open your LLC in the United States quickly and safely. Complete service with step-by-step support.',
            keywords: 'LLC formation United States, create LLC USA, business formation USA, Start Companies',
            ogTitle: 'Open your LLC in the United States - Start Companies LLC',
            ogDescription: 'We open your LLC in the United States quickly and safely.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/llc-formation'),
          },
        },
      },
      {
        path: 'presentation',
        loadComponent: () =>
          import(
            './landings/landing-presentacion/landing-presentacion.component'
          ).then((m) => m.LandingPresentacionComponent),
        data: {
          seo: {
            title: 'LLC Services Presentation - Start Companies LLC',
            description: 'Discover our LLC services in the United States. Complete presentation of business formation and bank accounts.',
            keywords: 'LLC services presentation United States, LLC USA services, Start Companies presentation, US business formation',
            ogTitle: 'LLC Services Presentation - Start Companies LLC',
            ogDescription: 'Discover our LLC services in the United States. Complete presentation of business formation.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/presentation'),
          },
        },
      },
      {
        path: 'relay-account-opening',
        loadComponent: () =>
          import(
            './landings/landing-apertura-relay/landing-apertura-relay.component'
          ).then((m) => m.LandingAperturaRelayComponent),
        data: {
          seo: {
            title: 'Relay Bank Opening - Start Companies LLC',
            description: 'We open your Relay bank account for LLCs in the United States. Simple process and 100% online.',
            keywords: 'Relay bank account, Relay account opening, Relay bank USA, Start Companies',
            ogTitle: 'Relay Bank Opening - Start Companies LLC',
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
          import('./landings/landing-agendar/landing-agendar.component').then(
            (m) => m.LandingAgendarComponent
          ),
        data: {
          seo: {
            title: 'Schedule - Start Companies LLC',
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
      /** Forms en inglés */
      {
        path: 'llc-opening',
        loadComponent: () =>
          import('./manejo-llc/apertura-llc/apertura-llc.component').then(
            (m) => m.AperturaLlcComponent
          ),
        data: {
          seo: {
            title: 'LLC Opening in the United States - Start Companies LLC',
            description: 'We open your LLC in the United States quickly and safely. Complete service with step-by-step support.',
            keywords: 'LLC opening United States, create LLC USA, business formation USA, Start Companies',
            ogTitle: 'LLC Opening in the United States - Start Companies LLC',
            ogDescription: 'We open your LLC in the United States quickly and safely.',
            ogImage: getImageUrl('/assets/logo.png'),
            twitterSite: '@startcompaniess',
            canonical: getCanonicalUrl('/en/llc-opening'),
          },
        },
      },
      {
        path: 'llc-renewal',
        loadComponent: () =>
          import('./manejo-llc/renovar-llc/renovar-llc.component').then(
            (m) => m.RenovarLlcComponent
          ),
        data: {
          seo: {
            title: 'LLC Renewal in the United States - Start Companies LLC',
            description: 'We renew your LLC in the United States before it expires. Avoid penalties and keep your business active.',
            keywords: 'LLC renewal United States, renew LLC USA, keep LLC active, Start Companies',
            ogTitle: 'LLC Renewal in the United States - Start Companies LLC',
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
            './manejo-llc/form-apertura-relay/form-apertura-relay.component'
          ).then((m) => m.FormAperturaRelayComponent),
        data: {
          seo: {
            title: 'Relay Bank Account Opening - Start Companies LLC',
            description: 'We open your Relay bank account for LLCs in the United States. Simple form and 100% online process.',
            keywords: 'Relay bank account, Relay account opening, Relay bank USA, Start Companies',
            ogTitle: 'Relay Bank Account Opening - Start Companies LLC',
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
          import('./shared/error-404/error-404.component').then(
            (m) => m.Error404Component
          ),
        data: {
          seo: {
            title: 'Error 404 - Page Not Found | Start Companies LLC',
            description: 'The page you are looking for does not exist. Return to the homepage and discover our services for LLCs in the United States.',
            keywords: 'error 404, page not found, Start Companies, LLC services',
            ogTitle: 'Error 404 - Page Not Found | Start Companies LLC',
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