import { SeoData } from '../services/seo.service';

export const SEO_CONFIG: { [key: string]: SeoData } = {
  // Página principal
  'home': {
    title: 'Start Companies LLC - Apertura de Cuentas Bancarias en EE.UU.',
    description: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía. Acompañamiento paso a paso.',
    keywords: 'LLC Estados Unidos, cuenta bancaria USA, apertura cuenta bancaria, Relay, Start Companies, servicios financieros',
    ogTitle: 'Start Companies LLC - Cuentas Bancarias para LLC en EE.UU.',
    ogDescription: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Start Companies LLC - Cuentas Bancarias para LLC en EE.UU.',
    twitterDescription: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.'
  },

  // Página de planes
  'planes': {
    title: 'Planes y Precios - Start Companies LLC | Servicios para LLC en EE.UU.',
    description: 'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos. Precios transparentes y servicios completos.',
    keywords: 'planes LLC Estados Unidos, precios cuenta bancaria, servicios Start Companies, apertura LLC USA',
    ogTitle: 'Planes y Precios - Start Companies LLC',
    ogDescription: 'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Planes y Precios - Start Companies LLC',
    twitterDescription: 'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos.'
  },

  // Página de nosotros
  'nosotros': {
    title: 'Nosotros - Start Companies LLC | Experiencia en Servicios Financieros',
    description: 'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos. Más de 200 emprendedores confían en nosotros.',
    keywords: 'Start Companies equipo, experiencia servicios financieros, sobre nosotros, confianza emprendedores',
    ogTitle: 'Nosotros - Start Companies LLC',
    ogDescription: 'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Nosotros - Start Companies LLC',
    twitterDescription: 'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos.'
  },

  // Página de blog
  'blog': {
    title: 'Blog - Start Companies LLC | Noticias y Consejos para LLC en EE.UU.',
    description: 'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos. Consejos y noticias del sector.',
    keywords: 'blog LLC Estados Unidos, consejos cuenta bancaria, noticias financieras, Start Companies blog',
    ogTitle: 'Blog - Start Companies LLC',
    ogDescription: 'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Blog - Start Companies LLC',
    twitterDescription: 'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.'
  },

  // Página de contacto
  'contacto': {
    title: 'Contacto - Start Companies LLC | Habla con Nuestros Expertos',
    description: 'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos. Soporte personalizado y respuesta rápida.',
    keywords: 'contacto Start Companies, soporte LLC, expertos servicios financieros, ayuda cuenta bancaria',
    ogTitle: 'Contacto - Start Companies LLC',
    ogDescription: 'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Contacto - Start Companies LLC',
    twitterDescription: 'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos.'
  },

  // Página de apertura LLC
  'apertura-llc': {
    title: 'Apertura de LLC en Estados Unidos - Start Companies LLC',
    description: 'Abrimos tu LLC en Estados Unidos de forma rápida y segura. Servicio completo con acompañamiento paso a paso.',
    keywords: 'apertura LLC Estados Unidos, crear LLC USA, constitución empresa USA, Start Companies',
    ogTitle: 'Apertura de LLC en Estados Unidos - Start Companies LLC',
    ogDescription: 'Abrimos tu LLC en Estados Unidos de forma rápida y segura.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Apertura de LLC en Estados Unidos - Start Companies LLC',
    twitterDescription: 'Abrimos tu LLC en Estados Unidos de forma rápida y segura.'
  },

  // Página de renovación LLC
  'renovar-llc': {
    title: 'Renovación de LLC en Estados Unidos - Start Companies LLC',
    description: 'Renovamos tu LLC en Estados Unidos antes de que expire. Evita multas y mantén tu empresa activa.',
    keywords: 'renovación LLC Estados Unidos, renovar LLC USA, mantener LLC activa, Start Companies',
    ogTitle: 'Renovación de LLC en Estados Unidos - Start Companies LLC',
    ogDescription: 'Renovamos tu LLC en Estados Unidos antes de que expire.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Renovación de LLC en Estados Unidos - Start Companies LLC',
    twitterDescription: 'Renovamos tu LLC en Estados Unidos antes de que expire.'
  },

  // Página de apertura Relay
  'form-apertura-relay': {
    title: 'Apertura de Cuenta Bancaria Relay - Start Companies LLC',
    description: 'Abrimos tu cuenta bancaria Relay para LLC en Estados Unidos. Formulario simple y proceso 100% online.',
    keywords: 'cuenta bancaria Relay, apertura cuenta Relay, banco Relay USA, Start Companies',
    ogTitle: 'Apertura de Cuenta Bancaria Relay - Start Companies LLC',
    ogDescription: 'Abrimos tu cuenta bancaria Relay para LLC en Estados Unidos.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Apertura de Cuenta Bancaria Relay - Start Companies LLC',
    twitterDescription: 'Abrimos tu cuenta bancaria Relay para LLC en Estados Unidos.'
  }
};

/**
 * Obtiene la configuración SEO para una ruta específica
 */
export function getSeoConfig(route: string): SeoData | null {
  return SEO_CONFIG[route] || null;
}

/**
 * Obtiene la configuración SEO para la página principal
 */
export function getHomeSeoConfig(): SeoData {
  return SEO_CONFIG['home'];
}
