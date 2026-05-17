# Gardening Helper Frontend

Angular frontend package for the Gardening Helper PWA.

This package is intentionally minimal in Phase 4 Step 1. Later steps add Angular Material, PWA support, app shell navigation, Supabase Auth session handling, and typed API infrastructure.

## Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

For local development:

```bash
npm start
```

## Boundaries

- Application data access must go through the Fastify API under `/api/v1`.
- Supabase may be used by the frontend only for Auth session handling in a later step.
- Do not add direct application table access, Supabase Storage bucket access, or backend-only secrets to this package.
