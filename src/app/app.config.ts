import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
  PLATFORM_ID,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
// provideClientHydration se agrega solo en main.ts (browser), no aquí para evitar conflictos SSR
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
/*import {
  cookiesStorage,
  provideTranslocoPersistLang,
} from '@jsverse/transloco-persist-lang';*/
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { initializeBootstrapComponents } from './shared/bootstrap-imports';
import { LanguageService } from './services/language.service';
/*import { isPlatformBrowser } from '@angular/common';*/

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // provideClientHydration() se agrega solo en main.ts (browser) con withEventReplay()
    // withFetch() habilita el uso de la API Fetch nativa del navegador para mejor rendimiento
    provideHttpClient(withFetch()),
    provideAnimations(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'es'],
        defaultLang: 'es',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    // Añadir APP_INITIALIZER al final (o donde quieras en el array)
    {
      provide: APP_INITIALIZER,
      useFactory: (ls: LanguageService) => {
        return () => ls.init();
      },
      deps: [LanguageService],
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
