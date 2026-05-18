import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';

import { AUTH_PORT, AuthPort, AuthSession, AuthStateSubscription } from './auth.port';
import { FrontendAuthConfigurationError } from './supabase-auth.adapter';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService implements OnDestroy {
  private readonly authPort: AuthPort = inject(AUTH_PORT);
  private readonly currentSessionState = signal<AuthSession | null>(null);
  private readonly initializedState = signal(false);
  private readonly bootstrapErrorState = signal<string | null>(null);
  private authSubscription: AuthStateSubscription | null = null;

  readonly currentSession = this.currentSessionState.asReadonly();
  readonly initialized = this.initializedState.asReadonly();
  readonly bootstrapError = this.bootstrapErrorState.asReadonly();
  readonly accessToken = computed(() => this.currentSessionState()?.accessToken ?? null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  async bootstrap(): Promise<void> {
    try {
      const session = await this.authPort.getSession();

      this.currentSessionState.set(session);
      this.bootstrapErrorState.set(null);
    } catch (error) {
      this.currentSessionState.set(null);
      this.bootstrapErrorState.set(toAuthBootstrapMessage(error));
    } finally {
      this.ensureAuthStateSubscription();
      this.initializedState.set(true);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  async signOut(): Promise<void> {
    await this.authPort.signOut();
    this.currentSessionState.set(null);
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.authSubscription = null;
  }

  private ensureAuthStateSubscription(): void {
    if (this.authSubscription !== null) {
      return;
    }

    try {
      this.authSubscription = this.authPort.onSessionChange((session) => {
        this.currentSessionState.set(session);
      });
    } catch (error) {
      this.bootstrapErrorState.set(toAuthBootstrapMessage(error));
    }
  }
}

const toAuthBootstrapMessage = (error: unknown): string => {
  if (error instanceof FrontendAuthConfigurationError) {
    return error.message;
  }

  return 'Supabase Auth session bootstrap failed.';
};
