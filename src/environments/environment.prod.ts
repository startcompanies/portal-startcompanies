import { DOMAIN, LILI } from './environment.base';

export const environment = {
  production: true,
  staging: false,
  apiUrl: DOMAIN.api.production,
  baseUrl: DOMAIN.production,
  wizardAndPanelEnabled: true,
  stripe: {
    publishableKey:
      'pk_live_51RxougCXN5dWfp7VoKSk5fllYIm8UFcj46VNTNUs8mFq3YsGaMWycVkcX2SQsyG4vYLW99yzypRoWmlw0F5vO8vi00ks79Ixbc',
  },
  liliEnv: 'Prod' as const,
  liliCreateApplicationUrl: LILI.createApplicationUrl,
};
