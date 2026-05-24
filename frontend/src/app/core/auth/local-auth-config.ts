import type { FrontendEnvironment } from '../../../environments/environment.model';
import type { SupabaseAuthConfig } from './supabase-auth.adapter';

export const DEFAULT_LOCAL_SUPABASE_AUTH_URL = 'http://localhost:8000';

const LOCAL_AUTH_URL_KEY = 'gardening-helper.localSupabaseAuthUrl';
const LOCAL_ANON_KEY_KEY = 'gardening-helper.localSupabaseAnonKey';

export type LocalAuthConfig = Partial<SupabaseAuthConfig>;

export const resolveSupabaseAuthConfig = (
  environment: FrontendEnvironment,
): SupabaseAuthConfig => {
  const localConfig = environment.production ? {} : readLocalAuthConfig();

  return {
    supabaseAuthUrl:
      firstNonEmpty(environment.supabaseAuthUrl, localConfig.supabaseAuthUrl) ??
      (environment.production ? '' : DEFAULT_LOCAL_SUPABASE_AUTH_URL),
    supabaseAnonKey: firstNonEmpty(environment.supabaseAnonKey, localConfig.supabaseAnonKey) ?? '',
  };
};

export const readLocalAuthConfig = (): LocalAuthConfig => {
  const storage = getLocalStorage();

  if (storage === null) {
    return {};
  }

  return {
    supabaseAuthUrl: storage.getItem(LOCAL_AUTH_URL_KEY) ?? undefined,
    supabaseAnonKey: storage.getItem(LOCAL_ANON_KEY_KEY) ?? undefined,
  };
};

export const saveLocalAuthConfig = (config: SupabaseAuthConfig): void => {
  const storage = getLocalStorage();

  if (storage === null) {
    return;
  }

  storage.setItem(LOCAL_AUTH_URL_KEY, config.supabaseAuthUrl);
  storage.setItem(LOCAL_ANON_KEY_KEY, config.supabaseAnonKey);
};

const firstNonEmpty = (...values: (string | null | undefined)[]): string | undefined =>
  values.map((value) => value?.trim() ?? '').find((value) => value.length > 0);

const getLocalStorage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};
