import { bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig, ApplicationConfig, isDevMode } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { appConfig } from './app/core/app.config';
import { AppComponent } from './app/core/app.component';

// Agregar providers solo para browser (no para SSR)
// Estos providers requieren APIs del navegador (document, window) que no existen en el servidor
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

const browserConfig: ApplicationConfig = {
  providers: [
    // provideClientHydration solo para browser (no para SSR)
    // withEventReplay() captura eventos del usuario antes de que complete la hidratación
    // Esto mejora la experiencia del usuario al evitar pérdida de interacciones
    isDevMode()
      ? provideClientHydration() // En desarrollo, sin withEventReplay para evitar problemas
      : provideClientHydration(
          withEventReplay() // En producción, con event replay para mejor UX
        ),
    // provideAnimations() solo en browser - requiere APIs del navegador
    provideAnimations(),
    // provideServiceWorker() solo en browser - requiere APIs del navegador
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ]
};

const config = mergeApplicationConfig(appConfig, browserConfig);

bootstrapApplication(AppComponent, config)
  .catch((err) => console.error(err));
