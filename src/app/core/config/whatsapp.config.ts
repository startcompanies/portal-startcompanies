import { APP_CONFIG } from './app.config.constants';

export const whatsappConfig = {
  phoneNumber: APP_CONFIG.contact.whatsapp.number,
  defaultMessage: APP_CONFIG.contact.whatsapp.message,
  tooltipText: '¡Chatea con nosotros!',
  excludedRoutes: [
    '/blog',
    '/en/blog',
    '/abre-tu-llc',
    '/presentacion', 
    '/apertura-banco-relay',
    '/agendar',
    '/apertura-llc',
    '/renovar-llc',
    '/form-apertura-relay',
    '/fixcal',
    '/abotax'
  ]
};
