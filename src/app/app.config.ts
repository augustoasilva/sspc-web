import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { isSecureOrigin } from './core/secure-context';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // The worker runs only outside development and only in a secure context (SEC-001).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && isSecureOrigin(),
      registrationStrategy: 'registerWhenStable:5000',
    }),
  ],
};
