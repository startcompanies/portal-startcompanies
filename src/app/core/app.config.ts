import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
  APP_INITIALIZER,
  importProvidersFrom,
} from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
// provideClientHydration se agrega solo en main.ts (browser), no aquí para evitar conflictos SSR
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../features/panel/interceptors/auth.interceptor';
import { TranslocoHttpLoader } from '../transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
/**
 * NOTA: provideTranslocoPersistLang está deshabilitado temporalmente.
 * Razón: Se usa localStorage directamente en LanguageService para persistir el idioma.
 * TODO: Evaluar migrar a transloco-persist-lang en una futura versión.
 */
/*import {
  cookiesStorage,
  provideTranslocoPersistLang,
} from '@jsverse/transloco-persist-lang';*/
import { provideAnimations } from '@angular/platform-browser/animations';
import { initializeBootstrapComponents } from '../shared/bootstrap-imports';
import { LanguageService } from '../shared/services/language.service';
import { AuthService } from '../features/panel/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(MatSnackBarModule),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // provideClientHydration() se agrega solo en main.ts (browser) con withEventReplay()
    // withFetch() habilita el uso de la API Fetch nativa del navegador para mejor rendimiento
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    // provideAnimations() y provideServiceWorker() se agregan solo en main.ts (browser)
    // para evitar problemas con SSR donde document/window no existen
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
    {
      provide: APP_INITIALIZER,
      useFactory: (ls: LanguageService) => () => ls.init(),
      deps: [LanguageService],
      multi: true,
    },
    // Cargar sesión antes de la primera navegación (evita carrera con authGuard → flash login)
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.loadUser(),
      deps: [AuthService],
      multi: true,
    },
    // NOTA: provideAnimations() y provideServiceWorker() se mueven a main.ts (browser)
    // para evitar problemas con SSR
  ],
};
