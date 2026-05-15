# Gardening Helper Backend

Phase 1 backend foundation for the Gardening Helper Fastify API.

## Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The Phase 1 app exposes only unauthenticated `GET /api/v1/health`.
Database, auth, provider adapters, frontend work, and domain workflows are deferred to later phases.

Provider and database secrets are optional in Phase 1 and must not be logged.
