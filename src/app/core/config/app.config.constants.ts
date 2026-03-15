/**
 * Constantes de configuración globales de la aplicación.
 * Centraliza valores como URLs, datos de contacto y configuración de dominio
 * para evitar duplicación a través del codebase.
 */
export const APP_CONFIG = {
  domain: {
    production: 'https://startcompanies.us',
    staging: 'https://staging.startcompanies.io',
    api: {
      production: 'https://api-web.startcompanies.us',
      staging: 'https://api-web.startcompanies.io',
    },
  },
  contact: {
    phone: '+17869354213',
    phoneDisplay: '+1 (786) 935-4213',
    email: 'administracion@startcompanies.us',
    whatsapp: {
      number: '+17869354213',
      message: 'Hola, vengo de Start Companies. Tengo algunas consultas para hacerles.',
      url: 'https://api.whatsapp.com/send/?phone=17869354213&text=Hola%2C+vengo+de+Start+Companies.+Tengo+algunas+consultas+para+hacerles.&type=phone_number&app_absent=0',
    },
  },
} as const;
