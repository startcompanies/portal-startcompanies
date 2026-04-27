import { DOMAIN, LILI } from './environment.base';

export const environment = {
  production: true,
  staging: true,
  noIndex: true,
  apiUrl: DOMAIN.api.staging,
  facebookPixel: {
    llcPixelId: '',
    relayPixelId: '',
    debug: true,
  },
  baseUrl: DOMAIN.staging,
  domain: DOMAIN.domainName.staging,
  wizardAndPanelEnabled: true,
  stripe: {
    publishableKey:
      'pk_test_51RxouuE99FVBtLePDq9TO4CeTnbeDLwYbVtCI9WoygjwdSvtxQ4Gzgif8nty1tQPB0MhmesI77JdoCEFaIc2qD9V00vbVxj5P4',
  },
  liliEnv: 'Sandbox' as const,
  liliCreateApplicationUrl: LILI.createApplicationUrl,
};
