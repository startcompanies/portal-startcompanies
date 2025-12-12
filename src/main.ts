import { bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig, ApplicationConfig, isDevMode } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { appConfig } from './app/core/app.config';
import { AppComponent } from './app/core/app.component';

// Agregar provideClientHydration solo para browser (no para SSR)
// withEventReplay() captura eventos del usuario antes de que complete la hidratación
// Esto mejora la experiencia del usuario al evitar pérdida de interacciones
// En desarrollo, usar configuración básica para evitar problemas con SSR
const browserConfig: ApplicationConfig = {
  providers: [
    isDevMode()
      ? provideClientHydration() // En desarrollo, sin withEventReplay para evitar problemas
      : provideClientHydration(
          withEventReplay() // En producción, con event replay para mejor UX
        )
  ]
};

const config = mergeApplicationConfig(appConfig, browserConfig);

bootstrapApplication(AppComponent, config)
  .catch((err) => console.error(err));
