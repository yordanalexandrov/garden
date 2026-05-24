import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';

import { provideFrontendEnvironment } from '../../core/config/frontend-environment';
import {
  DEFAULT_LOCAL_SUPABASE_AUTH_URL,
  resolveSupabaseAuthConfig,
  saveLocalAuthConfig,
} from '../../core/auth/local-auth-config';
import { LoginPage } from './pages/login-page/login-page';

const environment = {
  production: false,
  apiBaseUrl: '/api/v1',
  supabaseAuthUrl: '',
  supabaseAnonKey: '',
};

describe('LoginPage', () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    globalThis.localStorage?.clear();
  });

  const configure = () => {
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideFrontendEnvironment(environment),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    });

    return TestBed.createComponent(LoginPage);
  };

  it('renders a local Supabase login form with the default auth URL', () => {
    const fixture = configure();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Sign in');
    expect(fixture.componentInstance.form.controls.supabaseAuthUrl.value).toBe(
      DEFAULT_LOCAL_SUPABASE_AUTH_URL,
    );
    expect(compiled.textContent).toContain('Local Supabase');
  });

  it('requires credentials and local anon key before attempting sign in', async () => {
    const fixture = configure();

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.form.controls.email.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.password.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.supabaseAnonKey.hasError('required')).toBe(true);
  });

  it('uses local frontend-safe auth config only in development', () => {
    saveLocalAuthConfig({
      supabaseAuthUrl: 'http://localhost:8000',
      supabaseAnonKey: 'local-anon-key',
    });

    expect(resolveSupabaseAuthConfig(environment)).toEqual({
      supabaseAuthUrl: 'http://localhost:8000',
      supabaseAnonKey: 'local-anon-key',
    });
    expect(resolveSupabaseAuthConfig({ ...environment, production: true })).toEqual({
      supabaseAuthUrl: '',
      supabaseAnonKey: '',
    });
  });
});
