export const environment = {
  production: true,
  staging: false,
  noIndex: false,
  apiUrl: 'https://api-web.startcompanies.us',
  postsEndpoint: '/blog/posts/get-from-portal',
  categoriesEndpoint: '/blog/categories/with-posts-count',
  sandboxPostsEndpoint: '/blog/posts/get-sandbox-posts/category',
  facebookPixel: {
    llcPixelId: '703523572287021',
    relayPixelId: '1055049486479771',
    debug: false // Modo debug desactivado en producción
  },
  baseUrl: 'https://startcompanies.io',
  domain: 'startcompanies.io',
  stripe: {
    publishableKey: '' // Clave de producción
  }
};
