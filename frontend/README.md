# Gardening Helper Frontend

Angular frontend package for the Gardening Helper PWA.

This package is intentionally minimal in Phase 4. The current foundation includes Angular Material, a static-asset PWA baseline, and frontend-safe environment placeholders. Later steps add app shell navigation, Supabase Auth session handling, and typed API infrastructure.

## Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
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
- Supabase may be used by the frontend only for Auth session handling in a later step.
- Do not add direct application table access, Supabase Storage bucket access, or backend-only secrets to this package.
