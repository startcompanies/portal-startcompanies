import { DOMAIN } from './environment.base';

export const environment = {
  production: false,
  staging: false,
  noIndex: true, // Desarrollo local: noindex y sin PageSense (usa index.staging.html)
  apiUrl: 'http://localhost:3000',
  //apiUrl: DOMAIN.api.staging,
  postsEndpoint: '/blog/posts/get-sandbox-posts',
  categoriesEndpoint: '/blog/categories/whith-sandbox-posts-count',
  sandboxPostsEndpoint: '/blog/posts/get-sandbox-posts/category',
  facebookPixel: {
    llcPixelId: '',
    relayPixelId: '',
    debug: true,
  },
  baseUrl: DOMAIN.production,
  domain: DOMAIN.domainName.production,
  wizardAndPanelEnabled: true,
  paymentEnabled: false, // true = pago en wizard/panel; false = pago en request-detail post-envío
  stripe: {
    publishableKey:
      'pk_test_51RxouuE99FVBtLePDq9TO4CeTnbeDLwYbVtCI9WoygjwdSvtxQ4Gzgif8nty1tQPB0MhmesI77JdoCEFaIc2qD9V00vbVxj5P4',
  },
  liliEnv: 'Sandbox' as const,

};
