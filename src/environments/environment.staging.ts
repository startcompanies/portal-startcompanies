import { DOMAIN, LILI } from './environment.base';

export const environment = {
  production: true,
  staging: true,
  apiUrl: DOMAIN.api.staging,
  baseUrl: DOMAIN.staging,
  wizardAndPanelEnabled: true,
  stripe: {
    publishableKey:
      'pk_test_51RxouuE99FVBtLePDq9TO4CeTnbeDLwYbVtCI9WoygjwdSvtxQ4Gzgif8nty1tQPB0MhmesI77JdoCEFaIc2qD9V00vbVxj5P4',
  },
  liliEnv: 'Sandbox' as const,
  liliCreateApplicationUrl: LILI.createApplicationUrl,
};
