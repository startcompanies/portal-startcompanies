import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig } from '@angular/core';
import { appConfig } from './app/core/app.config';
import { AppComponent } from './app/core/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode, mergeApplicationConfig } from '@angular/core';

const browserConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

const config = mergeApplicationConfig(appConfig, browserConfig);

bootstrapApplication(AppComponent, config)
  .catch((err) => console.error(err));
