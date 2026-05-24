import { InjectionToken } from '@angular/core';

export interface AuthSession {
  readonly accessToken: string;
  readonly expiresAt: number | null;
  readonly userId: string | null;
}

export interface SignInWithPasswordRequest {
  readonly email: string;
  readonly password: string;
}

export interface AuthStateSubscription {
  unsubscribe(): void;
}

export interface AuthPort {
  getSession(): Promise<AuthSession | null>;
  onSessionChange(handler: (session: AuthSession | null) => void): AuthStateSubscription;
  signInWithPassword(request: SignInWithPasswordRequest): Promise<AuthSession>;
  signOut(): Promise<void>;
}

export const AUTH_PORT = new InjectionToken<AuthPort>('AuthPort');
