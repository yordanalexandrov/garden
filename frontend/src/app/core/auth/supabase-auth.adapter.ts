import type { Session, SupabaseClient } from '@supabase/supabase-js';

import {
  AuthPort,
  AuthSession,
  AuthStateSubscription,
  SignInWithPasswordRequest,
} from './auth.port';

export interface SupabaseAuthConfig {
  readonly supabaseAuthUrl: string;
  readonly supabaseAnonKey: string;
}

type SupabaseAuthClient = Pick<SupabaseClient, 'auth'>;
type SupabaseAuthClientLoader = () => Promise<SupabaseAuthClient>;

const MISSING_CONFIG_MESSAGE =
  'Supabase Auth configuration is missing. Configure the frontend-safe Supabase Auth URL and anon key.';

export class FrontendAuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FrontendAuthConfigurationError';
  }
}

export class SupabaseAuthAdapter implements AuthPort {
  private clientPromise: Promise<SupabaseAuthClient> | null = null;

  constructor(private readonly loadClient: SupabaseAuthClientLoader) {}

  async getSession(): Promise<AuthSession | null> {
    const client = await this.getClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return mapSupabaseSession(data.session);
  }

  onSessionChange(handler: (session: AuthSession | null) => void): AuthStateSubscription {
    let unsubscribeInner: (() => void) | null = null;
    let unsubscribed = false;

    void this.getClient()
      .then((client) => {
        if (unsubscribed) {
          return;
        }

        const { data } = client.auth.onAuthStateChange((_event, session) => {
          handler(mapSupabaseSession(session));
        });

        unsubscribeInner = () => data.subscription.unsubscribe();
      })
      .catch(() => undefined);

    return {
      unsubscribe: () => {
        unsubscribed = true;
        unsubscribeInner?.();
      },
    };
  }

  async signInWithPassword(request: SignInWithPasswordRequest): Promise<AuthSession> {
    const client = await this.getClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: request.email,
      password: request.password,
    });

    if (error) {
      throw error;
    }

    const session = mapSupabaseSession(data.session);

    if (session === null) {
      throw new Error('Supabase Auth did not return a session.');
    }

    return session;
  }

  async signOut(): Promise<void> {
    const client = await this.getClient();
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  }

  private getClient(): Promise<SupabaseAuthClient> {
    this.clientPromise ??= this.loadClient();

    return this.clientPromise;
  }
}

export const createSupabaseAuthPort = (config: SupabaseAuthConfig): AuthPort => {
  const normalizedConfig = validateSupabaseAuthConfig(config);

  return new SupabaseAuthAdapter(async () => {
    const { createClient } = await import('@supabase/supabase-js');

    return createClient(normalizedConfig.supabaseAuthUrl, normalizedConfig.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  });
};

export const createUnavailableAuthPort = (message: string): AuthPort => ({
  getSession: async () => {
    throw new FrontendAuthConfigurationError(message);
  },
  onSessionChange: () => ({
    unsubscribe: () => undefined,
  }),
  signInWithPassword: async () => {
    throw new FrontendAuthConfigurationError(message);
  },
  signOut: async () => {
    throw new FrontendAuthConfigurationError(message);
  },
});

export const validateSupabaseAuthConfig = (
  config: SupabaseAuthConfig,
): SupabaseAuthConfig => {
  const supabaseAuthUrl = config.supabaseAuthUrl.trim();
  const supabaseAnonKey = config.supabaseAnonKey.trim();
  const missingFields = [
    supabaseAuthUrl ? null : 'supabaseAuthUrl',
    supabaseAnonKey ? null : 'supabaseAnonKey',
  ].filter((field): field is string => field !== null);

  if (missingFields.length > 0) {
    throw new FrontendAuthConfigurationError(
      `${MISSING_CONFIG_MESSAGE} Missing: ${missingFields.join(', ')}.`,
    );
  }

  try {
    new URL(supabaseAuthUrl);
  } catch {
    throw new FrontendAuthConfigurationError(
      'Supabase Auth URL must be a valid absolute URL.',
    );
  }

  return {
    supabaseAuthUrl,
    supabaseAnonKey,
  };
};

const mapSupabaseSession = (session: Session | null): AuthSession | null => {
  if (!session?.access_token) {
    return null;
  }

  return {
    accessToken: session.access_token,
    expiresAt: session.expires_at ?? null,
    userId: session.user?.id ?? null,
  };
};
