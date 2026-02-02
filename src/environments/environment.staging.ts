export const environment = {
  production: true,
  staging: true,
  apiUrl: 'https://api-web.startcompanies.io',
  postsEndpoint: '/blog/posts/get-sandbox-posts',
  categoriesEndpoint: '/blog/categories/whith-sandbox-posts-count',
  sandboxPostsEndpoint: '/blog/posts/get-sandbox-posts/category',
  facebookPixel: {
    llcPixelId: '',
    relayPixelId: '',
    debug: true // Modo debug activado en staging
  },
  baseUrl: 'https://staging.startcompanies.io',
  domain: 'staging.startcompanies.io',
  stripe: {
    // TODO: Reemplazar con tu clave pública de Stripe para staging
    publishableKey: 'pk_test_51RxouuE99FVBtLePDq9TO4CeTnbeDLwYbVtCI9WoygjwdSvtxQ4Gzgif8nty1tQPB0MhmesI77JdoCEFaIc2qD9V00vbVxj5P4' // Clave de prueba
  }
};
