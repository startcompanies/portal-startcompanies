import { APP_CONFIG } from './app.config.constants';

export const whatsappConfig = {
  phoneNumber: APP_CONFIG.contact.whatsapp.number,
  defaultMessage: APP_CONFIG.contact.whatsapp.message,
  tooltipText: '¡Chatea con nosotros!',
  excludedRoutes: [
    '/apertura-llc',
    '/renovar-llc',
    '/en/llc-opening',
    '/en/llc-renewal',
    '/apertura/lead'
  ]
};
