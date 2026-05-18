import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthSessionService } from '../auth/auth-session.service';
import { API_BASE_URL } from '../config/api-base-url';
import { authTokenInterceptor } from './auth-token.interceptor';

describe('authTokenInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authSession: { readonly getAccessToken: ReturnType<typeof vi.fn> };

  const configure = (accessToken: string | null): void => {
    authSession = {
      getAccessToken: vi.fn(() => accessToken),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: AuthSessionService, useValue: authSession },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  };

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  it('attaches bearer tokens to Fastify API requests when a token exists', () => {
    configure('access-token-1');

    http.get('/api/v1/health').subscribe();

    const request = httpTesting.expectOne('/api/v1/health');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token-1');
    request.flush({ data: { status: 'ok' } });
  });

  it('omits Authorization when no token exists', () => {
    configure(null);

    http.get('/api/v1/health').subscribe();

    const request = httpTesting.expectOne('/api/v1/health');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ data: { status: 'ok' } });
  });

  it('does not attach bearer tokens to non-API or Supabase Auth requests', () => {
    configure('access-token-1');

    http.get('/assets/app-icon.svg').subscribe();
    http.get('https://supabase.example.test/auth/v1/token').subscribe();

    const assetRequest = httpTesting.expectOne('/assets/app-icon.svg');
    const supabaseRequest = httpTesting.expectOne('https://supabase.example.test/auth/v1/token');

    expect(assetRequest.request.headers.has('Authorization')).toBe(false);
    expect(supabaseRequest.request.headers.has('Authorization')).toBe(false);

    assetRequest.flush({});
    supabaseRequest.flush({});
  });
});
