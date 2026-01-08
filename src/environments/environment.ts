export const environment = {
  production: false,
  apiUrl: 'http://0.0.0.0:3000',
  //apiUrl: 'https://api-web.startcompanies.io',
  postsEndpoint: '/posts/get-sandbox-posts',
  categoriesEndpoint: '/categories/whith-sandbox-posts-count',
  facebookPixel: {
    llcPixelId: '',
    relayPixelId: '',
    debug: true // Modo debug activado en desarrollo
  },
  baseUrl: 'https://startcompanies.us',
  domain: 'startcompanies.us',
  stripe: {
    // TODO: Reemplazar con tu clave pública de Stripe
    // Puedes obtenerla de: https://dashboard.stripe.com/apikeys
    publishableKey: 'pk_test_51RxouuE99FVBtLePDq9TO4CeTnbeDLwYbVtCI9WoygjwdSvtxQ4Gzgif8nty1tQPB0MhmesI77JdoCEFaIc2qD9V00vbVxj5P4' // Clave de prueba o producción
  }
};
