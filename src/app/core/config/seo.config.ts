import { SeoData } from '../../shared/services/seo.service';

export const SEO_CONFIG: { [key: string]: SeoData } = {
  // Página principal
  'home': {
    title: 'Start Companies - Apertura de Cuentas Bancarias en EE.UU.',
    description: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía. Acompañamiento paso a paso.',
    keywords: 'LLC Estados Unidos, cuenta bancaria USA, apertura cuenta bancaria, Relay, Start Companies, servicios financieros',
    ogTitle: 'Start Companies - Cuentas Bancarias para LLC en EE.UU.',
    ogDescription: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Start Companies - Cuentas Bancarias para LLC en EE.UU.',
    twitterDescription: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.'
  },


  // Página de apertura LLC
  'apertura-llc': {
    title: 'Apertura de LLC en Estados Unidos - Start Companies',
    description: 'Abrimos tu LLC en Estados Unidos de forma rápida y segura. Servicio completo con acompañamiento paso a paso.',
    keywords: 'apertura LLC Estados Unidos, crear LLC USA, constitución empresa USA, Start Companies',
    ogTitle: 'Apertura de LLC en Estados Unidos - Start Companies',
    ogDescription: 'Abrimos tu LLC en Estados Unidos de forma rápida y segura.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Apertura de LLC en Estados Unidos - Start Companies',
    twitterDescription: 'Abrimos tu LLC en Estados Unidos de forma rápida y segura.'
  },

  // Página de renovación LLC
  'renovar-llc': {
    title: 'Renovación de LLC en Estados Unidos - Start Companies',
    description: 'Renovamos tu LLC en Estados Unidos antes de que expire. Evita multas y mantén tu empresa activa.',
    keywords: 'renovación LLC Estados Unidos, renovar LLC USA, mantener LLC activa, Start Companies',
    ogTitle: 'Renovación de LLC en Estados Unidos - Start Companies',
    ogDescription: 'Renovamos tu LLC en Estados Unidos antes de que expire.',
    ogImage: '/assets/logo.png',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Renovación de LLC en Estados Unidos - Start Companies',
    twitterDescription: 'Renovamos tu LLC en Estados Unidos antes de que expire.'
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
