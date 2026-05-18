import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAuthSession } from './core/auth/auth.providers';
import { provideFrontendEnvironment } from './core/config/frontend-environment';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideFrontendEnvironment(),
    provideHttpClient(withInterceptors([authTokenInterceptor, apiErrorInterceptor])),
    provideAnimationsAsync(),
    provideRouter(routes),
    ...provideAuthSession(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
