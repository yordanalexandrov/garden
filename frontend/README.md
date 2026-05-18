# Gardening Helper Frontend

Angular frontend package for the Gardening Helper PWA.

This package is intentionally limited to the Phase 4 frontend foundation. It includes Angular Material, a static-asset PWA baseline, responsive shell navigation, route placeholders, Supabase Auth session bootstrap, typed `/api/v1` client infrastructure, auth/error HTTP interceptors, and frontend-safe environment placeholders.

## Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
npm run check:pwa-boundaries
```

For local development:

```bash
npm start
```

## Boundaries

- Application data access must go through the Fastify API under `/api/v1`.
- PWA support caches static app assets only; it does not add offline business write synchronization.
- Roboto and Material Icons are bundled from frontend dependencies as same-origin static assets, not loaded from third-party font CDNs.
- Frontend-safe environment values are the API base URL, Supabase Auth URL, and Supabase anon key for Auth session handling.
- Supabase may be used by the frontend only for Auth session handling, session refresh, and access-token reads for Fastify API calls.
- Do not add direct application table access, Supabase Storage bucket access, or backend-only secrets to this package.

## Environment

`src/environments/environment.ts` and `src/environments/environment.production.ts` expose only frontend-safe values:

- `apiBaseUrl`, defaulting to `/api/v1`.
- `supabaseAuthUrl`, used only for Supabase Auth.
- `supabaseAnonKey`, used only for Supabase Auth.

Do not add database credentials, Supabase service role keys, JWT secrets, storage service credentials, AI keys, weather provider keys, or VAPID private keys to frontend environment files.

## Integration Status

- Auth: Supabase Auth session bootstrap only.
- API: typed Fastify API client foundation with `GET /api/v1/health` smoke support.
- Storage: no frontend storage integration.
- Weather: not touched.
- AI: not touched.
- Push: PWA baseline only; no push subscription flow.
- Domain workflows: placeholders only; no business feature pages or forms in this phase.
