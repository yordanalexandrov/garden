import { EnvironmentProviders, Provider, inject, provideAppInitializer } from '@angular/core';

import { FRONTEND_ENVIRONMENT } from '../config/frontend-environment';
import { AUTH_PORT, AuthPort } from './auth.port';
import { AuthSessionService } from './auth-session.service';
import {
  FrontendAuthConfigurationError,
  createSupabaseAuthPort,
  createUnavailableAuthPort,
} from './supabase-auth.adapter';

export const provideAuthSession = (): (Provider | EnvironmentProviders)[] => [
  {
    provide: AUTH_PORT,
    useFactory: (): AuthPort => {
      const environment = inject(FRONTEND_ENVIRONMENT);

      try {
        return createSupabaseAuthPort(environment);
      } catch (error) {
        const message =
          error instanceof FrontendAuthConfigurationError
            ? error.message
            : 'Supabase Auth configuration is invalid.';

        return createUnavailableAuthPort(message);
      }
    },
  },
  provideAppInitializer(() => inject(AuthSessionService).bootstrap()),
];
