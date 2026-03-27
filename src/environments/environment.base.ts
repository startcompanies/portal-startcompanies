/**
 * Configuración compartida (dominio y contacto).
 * Única fuente de verdad: edita aquí para cambiar URLs o datos de contacto en toda la app.
 * El server (SSR) usa domain para resolver baseUrl/apiUrl según el Host de la petición.
 */

const DOMAIN = {
  /** Portal producción (.us ya no existe; solo la API sigue en .us) */
  production: 'https://startcompanies.io',
  staging: 'https://staging.startcompanies.io',
  api: {
    production: 'https://api.startcompanies.io',
    staging: 'https://api-staging.startcompanies.io',
  },
  /** Nombre del dominio (sin protocolo) por entorno, para environment.domain */
  domainName: {
    production: 'startcompanies.io',
    staging: 'staging.startcompanies.io',
  },
} as const;

const CONTACT = {
  phone: '+17869354213',
  phoneDisplay: '+1 (786) 935-4213',
  email: 'administracion@startcompanies.io',
  whatsapp: {
    number: '+17869354213',
    message: 'Hola, vengo de Start Companies. Tengo algunas consultas para hacerles.',
  },
} as const;

export { DOMAIN, CONTACT };
