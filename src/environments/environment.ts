import { DOMAIN, LILI } from './environment.base';

export const environment = {
  production: false,
  staging: false,
  apiUrl: 'http://localhost:3000',
  baseUrl: 'http://localhost:4200',
  wizardAndPanelEnabled: true,
  billing: {
    trialMonthsExisting: 6,
    trialMonthsNew: 3,
    accountExistingCutoff: '2026-04-29',
    monthlyPriceUsd: 25,
  },
  stripe: {
    publishableKey:
      'pk_test_51RxouuE99FVBtLePDq9TO4CeTnbeDLwYbVtCI9WoygjwdSvtxQ4Gzgif8nty1tQPB0MhmesI77JdoCEFaIc2qD9V00vbVxj5P4',
  },
  liliEnv: 'Prod' as const,
  liliCreateApplicationUrl: LILI.createApplicationUrl,
};
