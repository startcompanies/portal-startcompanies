import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { DOCUMENT } from '@angular/common';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    // Proporcionar DOCUMENT explícitamente para SSR
    // Esto es necesario porque BrowserPlatformLocation intenta acceder a document
    // durante la inicialización antes de que Angular Universal lo configure
    {
      provide: DOCUMENT,
      useFactory: () => {
        // En el servidor, retornamos null y Angular Universal lo manejará
        // durante el proceso de renderizado
        if (typeof document !== 'undefined') {
          return document;
        }
        // Retornar un objeto mínimo compatible para evitar errores de inicialización
        // Angular Universal reemplazará esto durante el renderizado
        return {
          body: { appendChild: () => {}, removeChild: () => {} },
          head: { appendChild: () => {}, removeChild: () => {} },
          createElement: () => ({ setAttribute: () => {}, style: {} }),
          querySelector: () => null,
          querySelectorAll: () => [],
          getElementById: () => null,
        } as any;
      }
    }
    // IMPORTANTE: No incluir provideClientHydration() aquí - solo es para browser
    // provideClientHydration() requiere document/window que no existe en el servidor
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
