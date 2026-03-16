export const environment = {
  production: false,
  staging: false,
  noIndex: true, // Desarrollo local: noindex y sin PageSense (usa index.staging.html)
  apiUrl: 'http://localhost:3002',
  //apiUrl: 'https://api-web.startcompanies.io',
  postsEndpoint: '/blog/posts/get-sandbox-posts',
  categoriesEndpoint: '/blog/categories/whith-sandbox-posts-count',
  sandboxPostsEndpoint: '/blog/posts/get-sandbox-posts/category',
  facebookPixel: {
    llcPixelId: '',
    relayPixelId: '',
    debug: true, // Modo debug activado en desarrollo
  },
  baseUrl: 'https://startcompanies.us',
  domain: 'startcompanies.us',
  stripe: {
    // TODO: Reemplazar con tu clave pública de Stripe
    // Puedes obtenerla de: https://dashboard.stripe.com/apikeys
    publishableKey:
      'pk_test_51T0zMVH949fSJ0tuCp9YJpU50hjcDkMtMOT3zwwzdnmrrwpIS25wGe7kTdWttGLirDUpYffm5xKNpQlizF3Lufm500Rc3Y3Dq4', // Clave de prueba o producción
  },
};
