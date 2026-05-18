import { InjectionToken } from '@angular/core';

export interface AuthSession {
  readonly accessToken: string;
  readonly expiresAt: number | null;
  readonly userId: string | null;
}

export interface AuthStateSubscription {
  unsubscribe(): void;
}

export interface AuthPort {
  getSession(): Promise<AuthSession | null>;
  onSessionChange(handler: (session: AuthSession | null) => void): AuthStateSubscription;
  signOut(): Promise<void>;
}

export const AUTH_PORT = new InjectionToken<AuthPort>('AuthPort');
