export interface FrontendEnvironment {
  production: boolean;
  apiBaseUrl: string;
  supabaseAuthUrl: string;
  supabaseAnonKey: string;
}

export const environment: FrontendEnvironment = {
  production: true,
  apiBaseUrl: '/api/v1',
  supabaseAuthUrl: '',
  supabaseAnonKey: '',
};
