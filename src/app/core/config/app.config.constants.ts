import { CONTACT, DOMAIN } from '../../../environments/environment.base';

function buildWhatsAppUrl(phone: string, message: string): string {
  const phoneParam = phone.replace(/^\+/, '');
  return `https://api.whatsapp.com/send/?phone=${phoneParam}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
}

/**
 * Configuración expuesta a la app (footer, schema SEO, WhatsApp, server).
 * Dominio y contacto vienen de environment.base para gestionarlos en un solo lugar.
 */
export const APP_CONFIG = {
  domain: DOMAIN,
  contact: {
    ...CONTACT,
    whatsapp: {
      ...CONTACT.whatsapp,
      url: buildWhatsAppUrl(CONTACT.whatsapp.number, CONTACT.whatsapp.message),
    },
  },
} as const;
