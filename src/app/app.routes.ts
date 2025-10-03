import { Routes } from '@angular/router';
import { title } from 'process';
import { languageGuard } from './shared/guards/language.guard';
import { CampaignRedirectGuard } from './shared/guards/campaign-redirect.guard';

export const routes: Routes = [
  // ===== REDIRECCIONES PARA CAMPAÑAS (SIN PREFIJO DE IDIOMA) =====
  {
    path: 'abre-tu-llc',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./landings/landing-abre-tu-llc/landing-abre-tu-llc.component').then(m => m.LandingAbreTuLlcComponent)
  },
  {
    path: 'presentacion',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./landings/landing-agendar/landing-agendar.component').then(m => m.LandingAgendarComponent)
  },
  {
    path: 'apertura-banco-relay',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./landings/landing-apertura-relay/landing-apertura-relay.component').then(m => m.LandingAperturaRelayComponent)
  },
  {
    path: 'agenda',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./landings/landing-agendar/landing-agendar.component').then(m => m.LandingAgendarComponent)
  },
  {
    path: 'agendar',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./landings/landing-agendar/landing-agendar.component').then(m => m.LandingAgendarComponent)
  },
  {
    path: 'apertura-llc',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./manejo-llc/apertura-llc/apertura-llc.component').then(m => m.AperturaLlcComponent)
  },
  {
    path: 'renovar-llc',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./manejo-llc/renovar-llc/renovar-llc.component').then(m => m.RenovarLlcComponent)
  },
  {
    path: 'form-apertura-relay',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./manejo-llc/form-apertura-relay/form-apertura-relay.component').then(m => m.FormAperturaRelayComponent)
  },
  {
    path: 'fixcal',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./manejo-llc/form-apertura-fixcal/form-apertura-fixcal.component').then(m => m.FormAperturaFixcalComponent)
  },
  {
    path: 'abotax',
    canActivate: [CampaignRedirectGuard],
    loadComponent: () => import('./manejo-llc/form-apertura-abotax/form-apertura-abotax.component').then(m => m.FormAperturaAbotaxComponent)
  },
  // ===== REDIRECCIONES 301 PARA SEO =====
  {
    path: '',
    canActivate: [languageGuard],
    children: [{
      path:'',
      pathMatch: 'full',
      redirectTo: '/es/inicio'
    },
    // ===== RUTAS ESPAÑOLAS =====
    {path: 'es',
    children: [
      // Redirecciones de servicios (ya implementadas)
      {
        path: 'servicios',
        redirectTo: '/es/inicio',
        pathMatch: 'full',
      },
      {
        path: 'agenda-tu-consulta-gratis',
        redirectTo: '/es/contacto',
        pathMatch: 'full',
      },
      {
        path: 'abrir-llc',
        redirectTo: '/es/abre-tu-llc',
        pathMatch: 'full',
      },
      {
        path: 'apertura-relay',
        redirectTo: '/es/apertura-banco-relay',
        pathMatch: 'full',
      },

      // ===== REDIRECCIONES DE ARTÍCULOS DE BLOG =====

      // ===== REDIRECCIONES DE FORMULARIOS Y THANK YOU =====
      {
        path: 'contrato-oferta',
        redirectTo: '/es/apertura-llc',
        pathMatch: 'full',
      },
      {
        path: 'masterclass-thank-you',
        redirectTo: '/es/inicio',
        pathMatch: 'full',
      },
      {
        path: 'thank-you',
        redirectTo: '/es/inicio',
        pathMatch: 'full',
      },
      {
        path: 'formulario-de-apertura-de-llc-y-cuenta-bancaria',
        redirectTo: '/es/apertura-llc',
        pathMatch: 'full',
      },
      {
        path: 'formulario-renovacion-llc',
        redirectTo: '/es/renovar-llc',
        pathMatch: 'full',
      },
      {
        path: 'masterclass-gratuita',
        redirectTo: '/es/inicio',
        pathMatch: 'full',
      },

      // ===== RUTAS EXISTENTES CON SEO COMPLETO =====
      {
        path: 'inicio',
        loadComponent: () =>
          import('./sc-content/sc-content.component').then(
            (m) => m.ScContentComponent
          ),
        data: {
          seo: {
            title:
              'Start Companies LLC - Apertura de Cuentas Bancarias en EE.UU.',
            description:
              'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía. Acompañamiento paso a paso.',
            keywords:
              'LLC Estados Unidos, cuenta bancaria USA, apertura cuenta bancaria, Relay, Start Companies, servicios financieros',
            ogTitle:
              'Start Companies LLC - Cuentas Bancarias para LLC en EE.UU.',
            ogDescription:
              'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/es/inicio',
          },
        },
      },
      // Redirección desde la raíz de español
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
      {
        path: 'nosotros',
        loadComponent: () =>
          import('./us/us-page/us-page.component').then(
            (m) => m.UsPageComponent
          ),
        data: {
          seo: {
            title:
              'Nosotros - Start Companies LLC | Experiencia en Servicios Financieros',
            description:
              'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos. Más de 200 emprendedores confían en nosotros.',
            keywords:
              'Start Companies equipo, experiencia servicios financieros, sobre nosotros, confianza emprendedores',
            ogTitle: 'Nosotros - Start Companies LLC',
            ogDescription:
              'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/nosotros',
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
            title:
              'Contacto - Start Companies LLC | Habla con Nuestros Expertos',
            description:
              'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos. Soporte personalizado y respuesta rápida.',
            keywords:
              'contacto Start Companies, soporte LLC, expertos servicios financieros, ayuda cuenta bancaria',
            ogTitle: 'Contacto - Start Companies LLC',
            ogDescription:
              'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/contacto',
          },
        },
      },
      /**Landings */
      {
        path: 'abre-tu-llc',
        loadComponent: () =>
          import(
            './landings/landing-abre-tu-llc/landing-abre-tu-llc.component'
          ).then((m) => m.LandingAbreTuLlcComponent),
        data: {
          seo: {
            title: 'Abre tu LLC en Estados Unidos - Start Companies LLC',
            description:
              'Abrimos tu LLC en Estados Unidos de forma rápida y segura. Servicio completo con acompañamiento paso a paso.',
            keywords:
              'apertura LLC Estados Unidos, crear LLC USA, constitución empresa USA, Start Companies',
            ogTitle: 'Abre tu LLC en Estados Unidos - Start Companies LLC',
            ogDescription:
              'Abrimos tu LLC en Estados Unidos de forma rápida y segura.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/abre-tu-llc',
          },
        },
      },
      {
        path: 'presentacion',
        loadComponent: () =>
          import(
            './landings/landing-abre-tu-llc/landing-abre-tu-llc.component'
          ).then((m) => m.LandingAbreTuLlcComponent),
        data: {
          seo: {
            title: 'Abre tu LLC en Estados Unidos - Start Companies LLC',
            description:
              'Abrimos tu LLC en Estados Unidos de forma segura y rápida. Servicio completo con acompañamiento paso a paso.',
            keywords:
              'apertura LLC Estados Unidos, crear LLC USA, constitución empresa USA, Start Companies',
            ogTitle: 'Abre tu LLC en Estados Unidos - Start Companies LLC',
            ogDescription:
              'Abrimos tu LLC en Estados Unidos de forma rápida y segura.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/abre-tu-llc',
          },
        },
      },
      {
        path: 'apertura-banco-relay',
        loadComponent: () =>
          import(
            './landings/landing-apertura-relay/landing-apertura-relay.component'
          ).then((m) => m.LandingAperturaRelayComponent),
        data: {
          seo: {
            title: 'Apertura de Banco Relay - Start Companies LLC',
            description:
              'Abrimos tu cuenta bancaria Relay para LLC en Estados Unidos. Proceso simple y 100% online.',
            keywords:
              'cuenta bancaria Relay, apertura cuenta Relay, banco Relay USA, Start Companies',
            ogTitle: 'Apertura de Banco Relay - Start Companies LLC',
            ogDescription:
              'Abrimos tu cuenta bancaria Relay para LLC en Estados Unidos.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/apertura-banco-relay',
          },
        },
      },
      {
        path: 'agendar',
        loadComponent: () =>
          import('./landings/landing-agendar/landing-agendar.component').then(
            (m) => m.LandingAgendarComponent
          ),
        data: {
          seo: {
            title: '',
            description: '',
            keywords: '',
            ogTitle: 'Agendar',
            ogDescription: '',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/apertura-banco-relay',
          },
        },
      },
      /** Forms */
      {
        path: 'apertura-llc',
        loadComponent: () =>
          import('./manejo-llc/apertura-llc/apertura-llc.component').then(
            (m) => m.AperturaLlcComponent
          ),
        data: {
          seo: {
            title: 'Apertura de LLC en Estados Unidos - Start Companies LLC',
            description:
              'Abrimos tu LLC en Estados Unidos de forma rápida y segura. Servicio completo con acompañamiento paso a paso.',
            keywords:
              'apertura LLC Estados Unidos, crear LLC USA, constitución empresa USA, Start Companies',
            ogTitle: 'Apertura de LLC en Estados Unidos - Start Companies LLC',
            ogDescription:
              'Abrimos tu LLC en Estados Unidos de forma rápida y segura.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/apertura-llc',
          },
        },
      },
      {
        path: 'renovar-llc',
        loadComponent: () =>
          import('./manejo-llc/renovar-llc/renovar-llc.component').then(
            (m) => m.RenovarLlcComponent
          ),
        data: {
          seo: {
            title: 'Renovación de LLC en Estados Unidos - Start Companies LLC',
            description:
              'Renovamos tu LLC en Estados Unidos antes de que expire. Evita multas y mantén tu empresa activa.',
            keywords:
              'renovación LLC Estados Unidos, renovar LLC USA, mantener LLC activa, Start Companies',
            ogTitle:
              'Renovación de LLC en Estados Unidos - Start Companies LLC',
            ogDescription:
              'Renovamos tu LLC en Estados Unidos antes de que expire.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/renovar-llc',
          },
        },
      },
      {
        path: 'form-apertura-relay',
        loadComponent: () =>
          import(
            './manejo-llc/form-apertura-relay/form-apertura-relay.component'
          ).then((m) => m.FormAperturaRelayComponent),
        data: {
          seo: {
            title: 'Apertura de Cuenta Bancaria Relay - Start Companies LLC',
            description:
              'Abrimos tu cuenta bancaria Relay para LLC en Estados Unidos. Formulario simple y proceso 100% online.',
            keywords:
              'cuenta bancaria Relay, apertura cuenta Relay, banco Relay USA, Start Companies',
            ogTitle: 'Apertura de Cuenta Bancaria Relay - Start Companies LLC',
            ogDescription:
              'Abrimos tu cuenta bancaria Relay para LLC en Estados Unidos.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/form-apertura-relay',
          },
        },
      },
      {
        path: 'fixcal',
        loadComponent: () =>
          import(
            './manejo-llc/form-apertura-fixcal/form-apertura-fixcal.component'
          ).then((m) => m.FormAperturaFixcalComponent),
        data: {
          seo: {
            title:
              'Apertura de Cuenta Bancaria Relay Fixcal - Start Companies LLC',
            description:
              'Abrimos tu cuenta bancaria Relay Fixcal para LLC en Estados Unidos. Formulario simple y proceso 100% online.',
            keywords:
              'cuenta bancaria Relay Fixcal, apertura cuenta Fixcal, banco Fixcal USA, Start Companies',
            ogTitle:
              'Apertura de Cuenta Bancaria Relay Fixcal - Start Companies LLC',
            ogDescription:
              'Abrimos tu cuenta bancaria Relay Fixcal para LLC en Estados Unidos.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/fixcal',
          },
        },
      },
      {
        path: 'abotax',
        loadComponent: () =>
          import(
            './manejo-llc/form-apertura-abotax/form-apertura-abotax.component'
          ).then((m) => m.FormAperturaAbotaxComponent),
        data: {
          seo: {
            title:
              'Apertura de Cuenta Bancaria Relay Abotax - Start Companies LLC',
            description:
              'Abrimos tu cuenta bancaria Relay Abotax para LLC en Estados Unidos. Formulario simple y proceso 100% online.',
            keywords:
              'cuenta bancaria Relay Abotax, apertura cuenta Abotax, banco Abotax USA, Start Companies',
            ogTitle:
              'Apertura de Cuenta Bancaria Relay Abotax - Start Companies LLC',
            ogDescription:
              'Abrimos tu cuenta bancaria Relay Abotax para LLC en Estados Unidos.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/abotax',
          },
        },
      },
      {
        path: 'aviso-de-privacidad',
        loadComponent: () => import('./legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
        data: { seo: { canonical: 'https://startcompanies.us/es/aviso-de-privacidad', title: 'Aviso de Privacidad - Start Companies LLC', description: 'Conoce cómo Start Companies LLC recopila y usa tus datos.' } }
      },
      {
        path: 'terminos-y-condiciones',
        loadComponent: () => import('./legal/terms-and-conditions/terms-and-conditions.component').then(m => m.TermsAndConditionsComponent),
        data: { seo: { canonical: 'https://startcompanies.us/es/terminos-y-condiciones', title: 'Términos y Condiciones - Start Companies LLC', description: 'Términos y condiciones del sitio de Start Companies LLC.' } }
      },
      {
        path: 'planes',
        loadComponent: () =>
          import('./plans/pricing-planes/pricing-planes.component').then(
            (m) => m.PricingPlanesComponent
          ),
        data: {
          seo: {
            title:
              'Planes y Precios - Start Companies LLC | Servicios para LLC en EE.UU.',
            description:
              'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos. Precios transparentes y servicios completos.',
            keywords:
              'planes LLC Estados Unidos, precios cuenta bancaria, servicios Start Companies, apertura LLC USA',
            ogTitle: 'Planes y Precios - Start Companies LLC',
            ogDescription:
              'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/planes',
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
            title:
              'Blog - Start Companies LLC | Noticias y Consejos para LLC en EE.UU.',
            description:
              'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos. Consejos y noticias del sector.',
            keywords:
              'blog LLC Estados Unidos, consejos cuenta bancaria, noticias financieras, Start Companies blog',
            ogTitle: 'Blog - Start Companies LLC',
            ogDescription:
              'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/blog',
          },
        },
      },
      {
        /*path: 'blog/categoria/:slug',*/
        path: 'category/:slug',
        loadComponent: () =>
          import('./blog/blog-home/blog-home.component').then(
            (m) => m.BlogHomeComponent
          ),
        data: {
          seo: {
            title: 'Categoría de Blog - Start Companies LLC',
            description:
              'Explora nuestras categorías de blog sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
            keywords:
              'categoría blog LLC, blog Start Companies, noticias financieras, consejos LLC',
            ogTitle: 'Categoría de Blog - Start Companies LLC',
            ogDescription:
              'Explora nuestras categorías de blog sobre LLC y servicios financieros en Estados Unidos.',
            ogImage: 'https://dev.startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://dev.startcompanies.us/blog/categoria/:slug',
          },
        },
      },
      {
        path: 'post/:slug',
        loadComponent: () =>
          import('./blog/blog-post/blog-post.component').then(
            (m) => m.BlogPostComponent
          ),
        data: {
          seo: {
            title: 'Categoría de Blog - Start Companies LLC',
            description:
              'Explora nuestras categorías de blog sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
            keywords:
              'categoría blog LLC, blog Start Companies, noticias financieras, consejos LLC',
            ogTitle: 'Categoría de Blog - Start Companies LLC',
            ogDescription:
              'Explora nuestras categorías de blog sobre LLC y servicios financieros en Estados Unidos.',
            ogImage: 'https://dev.startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://dev.startcompanies.us/blog/categoria/:slug',
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
            title: 'Error 404 - Página No Encontrada | Start Companies LLC',
            description:
              'La página que buscas no existe. Regresa al inicio y descubre nuestros servicios para LLC en Estados Unidos.',
            keywords:
              'error 404, página no encontrada, Start Companies, servicios LLC',
            ogTitle: 'Error 404 - Página No Encontrada | Start Companies LLC',
            ogDescription:
              'La página que buscas no existe. Regresa al inicio y descubre nuestros servicios para LLC en Estados Unidos.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/error-404',
          },
        },
      },

      // Catch-all para URLs de blog y contenido no implementado
      /*{
        path: '**',
        redirectTo: '/error-404',
        pathMatch: 'full',
      },*/
      { path: '**', redirectTo: 'error-404' }, // 👈 relativo al es
    ]},
    // ===== RUTAS INGLESAS =====
    {path: 'en',
    children: [
      // ===== RUTAS EXISTENTES CON SEO COMPLETO EN INGLÉS =====
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/home',
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/about-us',
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/contact',
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/plans',
          },
        },
      },
      {
        path: 'privacy-policy',
        loadComponent: () => import('./legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
        data: { seo: { canonical: 'https://startcompanies.us/en/privacy-policy', title: 'Privacy Policy - Start Companies LLC', description: 'Learn how Start Companies LLC collects and uses your data.' } }
      },
      {
        path: 'terms-and-conditions',
        loadComponent: () => import('./legal/terms-and-conditions/terms-and-conditions.component').then(m => m.TermsAndConditionsComponent),
        data: { seo: { canonical: 'https://startcompanies.us/en/terms-and-conditions', title: 'Terms and Conditions - Start Companies LLC', description: 'Terms and conditions of Start Companies LLC website.' } }
      },
      {
        path: 'blog',
        redirectTo: '/es/blog',
        pathMatch: 'full'
      },
      {
        path: 'category/:slug',
        redirectTo: '/es/category/:slug',
        pathMatch: 'full'
      },
      {
        path: 'post/:slug',
        redirectTo: '/es/post/:slug',
        pathMatch: 'full'
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/llc-formation',
          },
        },
      },
      {
        path: 'presentation',
        loadComponent: () =>
          import(
            './landings/landing-abre-tu-llc/landing-abre-tu-llc.component'
          ).then((m) => m.LandingAbreTuLlcComponent),
        data: {
          seo: {
            title: 'Open your LLC in the United States - Start Companies LLC',
            description: 'We open your LLC in the United States safely and quickly. Complete service with step-by-step support.',
            keywords: 'LLC formation United States, create LLC USA, business formation USA, Start Companies',
            ogTitle: 'Open your LLC in the United States - Start Companies LLC',
            ogDescription: 'We open your LLC in the United States quickly and safely.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/llc-formation',
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/relay-account-opening',
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/schedule',
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/llc-opening',
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/llc-renewal',
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/relay-opening-form',
          },
        },
      },
      {
        path: 'fixcal',
        loadComponent: () =>
          import(
            './manejo-llc/form-apertura-fixcal/form-apertura-fixcal.component'
          ).then((m) => m.FormAperturaFixcalComponent),
        data: {
          seo: {
            title: 'Relay Fixcal Bank Account Opening - Start Companies LLC',
            description: 'We open your Relay Fixcal bank account for LLCs in the United States. Simple form and 100% online process.',
            keywords: 'Relay Fixcal bank account, Fixcal account opening, Fixcal bank USA, Start Companies',
            ogTitle: 'Relay Fixcal Bank Account Opening - Start Companies LLC',
            ogDescription: 'We open your Relay Fixcal bank account for LLCs in the United States.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/fixcal',
          },
        },
      },
      {
        path: 'abotax',
        loadComponent: () =>
          import(
            './manejo-llc/form-apertura-abotax/form-apertura-abotax.component'
          ).then((m) => m.FormAperturaAbotaxComponent),
        data: {
          seo: {
            title: 'Relay Abotax Bank Account Opening - Start Companies LLC',
            description: 'We open your Relay Abotax bank account for LLCs in the United States. Simple form and 100% online process.',
            keywords: 'Relay Abotax bank account, Abotax account opening, Abotax bank USA, Start Companies',
            ogTitle: 'Relay Abotax Bank Account Opening - Start Companies LLC',
            ogDescription: 'We open your Relay Abotax bank account for LLCs in the United States.',
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/abotax',
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
            ogImage: 'https://startcompanies.us/assets/logo.png',
            twitterSite: '@startcompaniess',
            canonical: 'https://startcompanies.us/en/error-404',
          },
        },
      },
      { path: '**', redirectTo: 'error-404' }, // 👈 relativo al en
    ]}]
  },
];
