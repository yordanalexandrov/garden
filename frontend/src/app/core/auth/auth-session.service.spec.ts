import { TestBed } from '@angular/core/testing';

import { AUTH_PORT, AuthPort, AuthSession, AuthStateSubscription } from './auth.port';
import { AuthSessionService } from './auth-session.service';
import {
  createUnavailableAuthPort,
  validateSupabaseAuthConfig,
} from './supabase-auth.adapter';

class MockAuthPort implements AuthPort {
  private handler: ((session: AuthSession | null) => void) | null = null;

  readonly getSession = vi.fn(async (): Promise<AuthSession | null> => null);
  readonly signInWithPassword = vi.fn(async (): Promise<AuthSession> => session('signed-in-token'));
  readonly signOut = vi.fn(async (): Promise<void> => undefined);
  readonly unsubscribe = vi.fn();
  readonly onSessionChange = vi.fn(
    (handler: (session: AuthSession | null) => void): AuthStateSubscription => {
      this.handler = handler;

      return {
        unsubscribe: this.unsubscribe,
      };
    },
  );

  emitSession(session: AuthSession | null): void {
    this.handler?.(session);
  }
}

const session = (accessToken: string): AuthSession => ({
  accessToken,
  expiresAt: 1_800_000_000,
  userId: 'user-1',
});

const configureService = (authPort: AuthPort): AuthSessionService => {
  TestBed.configureTestingModule({
    providers: [{ provide: AUTH_PORT, useValue: authPort }],
  });

  return TestBed.inject(AuthSessionService);
};

describe('AuthSessionService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('stores and exposes an access token when session bootstrap returns a session', async () => {
    const authPort = new MockAuthPort();
    authPort.getSession.mockResolvedValue(session('access-token-1'));
    const service = configureService(authPort);

    await service.bootstrap();

    expect(service.initialized()).toBe(true);
    expect(service.currentSession()?.accessToken).toBe('access-token-1');
    expect(service.accessToken()).toBe('access-token-1');
    expect(service.getAccessToken()).toBe('access-token-1');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.bootstrapError()).toBeNull();
  });

  it('exposes no token when session bootstrap returns no session', async () => {
    const authPort = new MockAuthPort();
    authPort.getSession.mockResolvedValue(null);
    const service = configureService(authPort);

    await service.bootstrap();

    expect(service.initialized()).toBe(true);
    expect(service.currentSession()).toBeNull();
    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('updates the current token when Supabase Auth state changes', async () => {
    const authPort = new MockAuthPort();
    authPort.getSession.mockResolvedValue(session('initial-token'));
    const service = configureService(authPort);

    await service.bootstrap();
    authPort.emitSession(session('updated-token'));

    expect(service.getAccessToken()).toBe('updated-token');

    authPort.emitSession(null);

    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('records a clear missing-config bootstrap error without exposing backend secret names', async () => {
    let configError: Error | null = null;

    try {
      validateSupabaseAuthConfig({ supabaseAuthUrl: '', supabaseAnonKey: '' });
    } catch (error) {
      configError = error instanceof Error ? error : new Error(String(error));
    }

    expect(configError?.message).toContain('Supabase Auth configuration is missing');

    const service = configureService(
      createUnavailableAuthPort(configError?.message ?? 'Missing auth config'),
    );

    await service.bootstrap();

    const bootstrapError = service.bootstrapError();
    expect(service.initialized()).toBe(true);
    expect(service.getAccessToken()).toBeNull();
    expect(bootstrapError).toContain('Supabase Auth configuration is missing');
    expect(bootstrapError).not.toMatch(/service role|jwt secret|database url|password|private key/i);
  });
});
