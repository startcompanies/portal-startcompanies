import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig } from '@angular/core';
import { appConfig } from './app/core/app.config';
import { AppComponent } from './app/core/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { mergeApplicationConfig } from '@angular/core';

const browserConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
  ],
};

const config = mergeApplicationConfig(appConfig, browserConfig);

bootstrapApplication(AppComponent, config)
  .catch((err) => console.error(err));
