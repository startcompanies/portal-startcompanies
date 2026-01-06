export const environment = {
  production: true,
  //apiUrl: 'http://localhost:5000',
  apiUrl: 'https://api-web.startcompanies.us',
  postsEndpoint: '/posts/get-from-portal',
  categoriesEndpoint: '/categories/whith-posts-count',
  sandboxPostsEndpoint: '/posts/get-sandbox-posts/category',
  facebookPixel: {
    llcPixelId: '703523572287021',
    relayPixelId: '1055049486479771',
    debug: false // Modo debug desactivado en producción
  },
  baseUrl: 'https://startcompanies.us',
  domain: 'startcompanies.us'
};
