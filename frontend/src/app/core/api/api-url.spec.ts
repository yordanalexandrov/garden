import { isApiRequestUrl, joinApiUrl } from './api-url';

describe('API URL helpers', () => {
  it('joins the configured API base URL and endpoint paths', () => {
    expect(joinApiUrl('/api/v1/', 'health')).toBe('/api/v1/health');
    expect(joinApiUrl('/api/v1', '/health')).toBe('/api/v1/health');
  });

  it('matches relative API request URLs without matching similar prefixes', () => {
    expect(isApiRequestUrl('/api/v1/health', '/api/v1')).toBe(true);
    expect(isApiRequestUrl('/api/v1', '/api/v1')).toBe(true);
    expect(isApiRequestUrl('/api/v10/health', '/api/v1')).toBe(false);
  });

  it('matches only the configured absolute API origin and path', () => {
    expect(
      isApiRequestUrl('https://garden.example.test/api/v1/health', 'https://garden.example.test/api/v1'),
    ).toBe(true);
    expect(
      isApiRequestUrl('https://supabase.example.test/auth/v1/token', 'https://garden.example.test/api/v1'),
    ).toBe(false);
  });
});
