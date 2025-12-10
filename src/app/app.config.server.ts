import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering()
    // IMPORTANTE: No incluir provideClientHydration() aquí - solo es para browser
    // provideClientHydration() requiere document/window que no existe en el servidor
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
