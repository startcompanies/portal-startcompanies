import { DOMAIN, LILI } from './environment.base';
import type { BlogPublicAudience } from './environment.types';

export const environment = {
  production: true,
  staging: false,
  noIndex: false,
  apiUrl: DOMAIN.api.production,
  blogPublicAudience: 'published' satisfies BlogPublicAudience,
  facebookPixel: {
    llcPixelId: '703523572287021',
    relayPixelId: '1055049486479771',
    debug: false,
  },
  baseUrl: DOMAIN.production,
  domain: DOMAIN.domainName.production,
  wizardAndPanelEnabled: true,
  stripe: {
    publishableKey:
      'pk_live_51RxougCXN5dWfp7VoKSk5fllYIm8UFcj46VNTNUs8mFq3YsGaMWycVkcX2SQsyG4vYLW99yzypRoWmlw0F5vO8vi00ks79Ixbc',
  },
  liliEnv: 'Prod' as const,
  liliCreateApplicationUrl: LILI.createApplicationUrl,
};
