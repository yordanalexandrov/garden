# Implementation Task - Phase 3 Step 4: Fastify Auth Plugin and Protected Route Context

## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

Final infrastructure/provider decisions:
- Deployment: Hetzner VPS + Docker Compose
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Wire Fastify authentication infrastructure so protected route groups can derive authenticated actor/account context server-side.
```

## Branch

Use branch:

```text
feature/auth-account-boundary
```

---

# Scope

Implement only:

- [ ] Inspect existing Fastify app factory, route registration, error handling, test route pattern, and health route.
- [ ] Add a Fastify auth plugin or hook that:
  - [ ] extracts `Authorization: Bearer <token>`
  - [ ] calls `AuthPort.verifyAccessToken`
  - [ ] performs active account lookup from Step 3 if the auth adapter did not already compose that lookup
  - [ ] attaches authenticated actor context to the request in a typed way
- [ ] Add a helper such as `requireActor(request)` for controllers/services to access actor context safely.
- [ ] Ensure all future business route groups can opt into this auth hook consistently.
- [ ] Keep `/api/v1/health` unauthenticated.
- [ ] Add a temporary protected test route only under the existing test-only route prefix, if needed for auth hook tests.
- [ ] Ensure missing, malformed, invalid, expired, and account lookup failure cases use canonical error envelopes.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/shared/plugins/auth.ts
backend/src/modules/auth/request-actor.ts
backend/src/app/routes.ts
backend/src/app/test-routes.ts
backend/test/auth/auth-plugin.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Public canonical business endpoints.
- [ ] Frontend login/session handling.
- [ ] Domain repositories beyond `AccountsRepository`.
- [ ] Places/plants/products/activity/task/problem workflows.
- [ ] Role/permission system beyond authenticated account context.
- [ ] Provider adapters other than auth.
- [ ] Schema changes.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/implementation-phases/phase-03-auth-and-account-boundary.md`
- [ ] Prior files in `docs/implementation-phases/phase-03/`
- [ ] Existing backend app factory, routes, test routes, error handler, and tests

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] auth/session boundary
- [ ] API contract
- [ ] provider adapter boundary

Important rules to preserve:

```text
All endpoints except health/auth bootstrap endpoints require authentication.
Expected request header is Authorization: Bearer <access_token>.
Backend resolves the authenticated account/user and applies account scoping server-side.
Frontend must not send accountId for normal business operations.
Controllers stay thin.
Services receive actor/account context from backend request context, not request bodies.
```

This step wires route authentication only. It must not add business authorization rules for endpoints that do not exist yet.

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 3. Future MCP tools must authenticate through backend/API behavior established here.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] Fastify auth plugin/hook
- [ ] authenticated actor request decoration/types
- [ ] `requireActor` or equivalent safe accessor
- [ ] canonical auth error responses
- [ ] unauthenticated health-route preservation
- [ ] protected test-only route for hook tests if needed
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
GET /api/v1/health remains unauthenticated.
GET /api/v1/__test/protected-auth or equivalent test-only route may be added for tests only.
```

No temporary protected test route may become part of the public canonical API.

Auth errors must follow:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized",
    "details": {}
  }
}
```

Use the existing canonical error-envelope helpers rather than hand-rolled response shapes.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. `/api/v1/health` remains accessible without `Authorization`.
2. Protected route without token returns 401 and canonical error envelope.
3. Protected route with malformed bearer header returns 401 and canonical error envelope.
4. Protected route with invalid token returns 401 and canonical error envelope.
5. Protected route with valid account A token exposes account A actor context to the handler.
6. Protected route with valid account B token exposes account B actor context to the handler.
7. Active account lookup failure maps to the documented 401 or 403 policy with canonical envelope.

---

# Acceptance Criteria

The task is complete when:

- [ ] Protected route infrastructure exists.
- [ ] Actor/account context is attached server-side and typed.
- [ ] Health remains unauthenticated.
- [ ] Auth failures return canonical envelopes.
- [ ] No public domain endpoints, frontend code, or schema changes are introduced.
- [ ] Future route modules have a clear way to require authentication.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

If database-backed account lookup is required by these tests, run against a dedicated local/test PostgreSQL-compatible database. If unavailable, report it exactly.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules affected
- API changes
- Database changes
- Tests run
- Integration/provider status
- Review focus

---

# Notes for Implementation Agent

Auth context should be boring and explicit. Do not let individual controllers manually parse tokens once this plugin exists.
