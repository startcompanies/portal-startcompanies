import { Routes } from '@angular/router';

export const routes: Routes = [
  // Redirecciones 301 para mantener SEO (solo URLs que no existen)
  {
    path: 'servicios',
    redirectTo: '/',
    pathMatch: 'full',
  },
  /*{
        path: 'blog',
        redirectTo: '/',
        pathMatch: 'full'
    },*/
  {
    path: 'agenda-tu-consulta-gratis',
    redirectTo: '/contacto',
    pathMatch: 'full',
  },
  {
    path: 'abrir-llc',
    redirectTo: '/abre-tu-llc',
    pathMatch: 'full',
  },

  // Rutas existentes con SEO completo
  {
    path: '',
    loadComponent: () =>
      import('./sc-content/sc-content.component').then(
        (m) => m.ScContentComponent
      ),
    data: {
      seo: {
        title: 'Start Companies LLC - Apertura de Cuentas Bancarias en EE.UU.',
        description:
          'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía. Acompañamiento paso a paso.',
        keywords:
          'LLC Estados Unidos, cuenta bancaria USA, apertura cuenta bancaria, Relay, Start Companies, servicios financieros',
        ogTitle: 'Start Companies LLC - Cuentas Bancarias para LLC en EE.UU.',
        ogDescription:
          'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.',
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us',
      },
    },
  },
  {
    path: 'nosotros',
    loadComponent: () =>
      import('./us/us-page/us-page.component').then((m) => m.UsPageComponent),
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
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/nosotros',
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
        description:
          'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos. Soporte personalizado y respuesta rápida.',
        keywords:
          'contacto Start Companies, soporte LLC, expertos servicios financieros, ayuda cuenta bancaria',
        ogTitle: 'Contacto - Start Companies LLC',
        ogDescription:
          'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos.',
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/contacto',
      },
    },
  },
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
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/abre-tu-llc',
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
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/apertura-banco-relay',
      },
    },
  },
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
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/apertura-llc',
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
        ogTitle: 'Renovación de LLC en Estados Unidos - Start Companies LLC',
        ogDescription:
          'Renovamos tu LLC en Estados Unidos antes de que expire.',
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/renovar-llc',
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
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/form-apertura-relay',
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
        title:
          'Planes y Precios - Start Companies LLC | Servicios para LLC en EE.UU.',
        description:
          'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos. Precios transparentes y servicios completos.',
        keywords:
          'planes LLC Estados Unidos, precios cuenta bancaria, servicios Start Companies, apertura LLC USA',
        ogTitle: 'Planes y Precios - Start Companies LLC',
        ogDescription:
          'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos.',
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/planes',
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
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/blog',
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
        ogImage: 'https://dev.startcompanies.us/assets/logo.png',
        twitterSite: '@startcompaniess',
        canonical: 'https://dev.startcompanies.us/error-404',
      },
    },
  },

  // Catch-all para URLs de blog y contenido no implementado
  {
    path: '**',
    redirectTo: '/error-404',
    pathMatch: 'full',
  },
];
