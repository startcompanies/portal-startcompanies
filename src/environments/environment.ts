import { DOMAIN, LILI } from './environment.base';

export const environment = {
  production: false,
  staging: false,
  apiUrl: 'http://localhost:3000',
  baseUrl: 'http://localhost:4200',
  wizardAndPanelEnabled: true,
  stripe: {
    publishableKey:
      'pk_test_51RxouuE99FVBtLePDq9TO4CeTnbeDLwYbVtCI9WoygjwdSvtxQ4Gzgif8nty1tQPB0MhmesI77JdoCEFaIc2qD9V00vbVxj5P4',
  },
  liliEnv: 'Prod' as const,
  liliCreateApplicationUrl: LILI.createApplicationUrl,
};
