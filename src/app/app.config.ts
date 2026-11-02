import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer, inject, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { isSecureOrigin } from './core/secure-context';
import { StoragePersistence } from './core/storage-persistence';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Asks once for persistent storage at start-up; never blocks the app (SEC-012).
    provideEnvironmentInitializer(() => {
      void inject(StoragePersistence).request();
    }),
    // The worker runs only outside development and only in a secure context (SEC-001).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && isSecureOrigin(),
      registrationStrategy: 'registerWhenStable:5000',
    }),
  ],
};
