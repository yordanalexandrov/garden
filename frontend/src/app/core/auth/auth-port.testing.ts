import { Provider } from '@angular/core';

import { AUTH_PORT, AuthPort } from './auth.port';

/** Inert AuthPort for tests that render the app shell but do not exercise auth. */
export const authPortStub: AuthPort = {
  getSession: async () => null,
  onSessionChange: () => ({ unsubscribe: () => undefined }),
  signInWithPassword: async () => ({ accessToken: 'token', expiresAt: null, userId: null }),
  signOut: async () => undefined,
};

export const provideAuthPortStub = (): Provider => ({ provide: AUTH_PORT, useValue: authPortStub });
