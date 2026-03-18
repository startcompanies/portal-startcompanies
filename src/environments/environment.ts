import { DOMAIN } from './environment.base';

export const environment = {
  production: false,
  staging: false,
  noIndex: true, // Desarrollo local: noindex y sin PageSense (usa index.staging.html)
  apiUrl: 'http://localhost:3002',
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
  stripe: {
    publishableKey:
      'pk_test_51T0zMVH949fSJ0tuCp9YJpU50hjcDkMtMOT3zwwzdnmrrwpIS25wGe7kTdWttGLirDUpYffm5xKNpQlizF3Lufm500Rc3Y3Dq4',
  },
};
