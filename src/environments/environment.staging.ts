export const environment = {
  production: true,
  //apiUrl: 'http://localhost:5000',
  apiUrl: 'https://api-web.startcompanies.io',
  postsEndpoint: '/posts/get-sandbox-posts',
  categoriesEndpoint: '/categories/whith-sandbox-posts-count',
  sandboxPostsEndpoint: '/posts/get-sandbox-posts/category',
  facebookPixel: {
    llcPixelId: '',
    relayPixelId: '1055049486479771',
    debug: true // Modo debug activado en staging
  },
  baseUrl: 'https://staging.startcompanies.io',
  //baseUrl: 'http://localhost:4000',
  domain: 'staging.startcompanies.io'
};
