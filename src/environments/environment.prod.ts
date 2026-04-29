import { DOMAIN, LILI } from './environment.base';

export const environment = {
  production: true,
  staging: false,
  apiUrl: DOMAIN.api.production,
  baseUrl: DOMAIN.production,
  wizardAndPanelEnabled: true,
  billing: {
    trialMonthsExisting: 6,
    trialMonthsNew: 3,
    accountExistingCutoff: '2026-04-29',
    monthlyPriceUsd: 25,
  },
  stripe: {
    publishableKey:
      'pk_live_51RxougCXN5dWfp7VoKSk5fllYIm8UFcj46VNTNUs8mFq3YsGaMWycVkcX2SQsyG4vYLW99yzypRoWmlw0F5vO8vi00ks79Ixbc',
  },
  liliEnv: 'Prod' as const,
  liliCreateApplicationUrl: LILI.createApplicationUrl,
};
