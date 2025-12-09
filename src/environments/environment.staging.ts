export const environment = {
  production: false,
  //apiUrl: 'http://localhost:5000',
  apiUrl: 'https://api-web.startcompanies.us',
  postsEndpoint: '/posts/get-sandbox-posts',
  categoriesEndpoint: '/categories/whith-sandbox-posts-count',
  facebookPixel: {
    llcPixelId: '703523572287021',
    relayPixelId: '1055049486479771',
    debug: true // Modo debug activado en staging
  },
  baseUrl: 'https://staging.startcompanies.io',
  domain: 'staging.startcompanies.io'
};
