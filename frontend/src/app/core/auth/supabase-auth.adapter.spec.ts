import {
  createUnavailableAuthPort,
  validateSupabaseAuthConfig,
} from './supabase-auth.adapter';

describe('Supabase Auth adapter configuration', () => {
  it('accepts trimmed frontend-safe Supabase Auth configuration', () => {
    expect(
      validateSupabaseAuthConfig({
        supabaseAuthUrl: ' http://localhost:54321 ',
        supabaseAnonKey: ' anon-key ',
      }),
    ).toEqual({
      supabaseAuthUrl: 'http://localhost:54321',
      supabaseAnonKey: 'anon-key',
    });
  });

  it('rejects missing frontend auth configuration with a safe message', () => {
    expect(() =>
      validateSupabaseAuthConfig({
        supabaseAuthUrl: '',
        supabaseAnonKey: '',
      }),
    ).toThrow(/Supabase Auth configuration is missing/);
  });

  it('rejects invalid Supabase Auth URLs', () => {
    expect(() =>
      validateSupabaseAuthConfig({
        supabaseAuthUrl: '/relative-url',
        supabaseAnonKey: 'anon-key',
      }),
    ).toThrow(/valid absolute URL/);
  });

  it('keeps unavailable auth port failures clear and frontend-safe', async () => {
    const unavailableAuthPort = createUnavailableAuthPort(
      'Supabase Auth configuration is missing. Missing: supabaseAuthUrl.',
    );

    await expect(unavailableAuthPort.getSession()).rejects.toThrow(
      'Supabase Auth configuration is missing. Missing: supabaseAuthUrl.',
    );
    await expect(
      unavailableAuthPort.signInWithPassword({
        email: 'demo@example.com',
        password: 'password',
      }),
    ).rejects.toThrow('Supabase Auth configuration is missing. Missing: supabaseAuthUrl.');
  });
});
