# Implementation Task - Phase 5 Step 3: Places Routes and API Contract

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
Expose the canonical account-scoped Places API routes under /api/v1/places using the Places service, validation schemas, auth context, and canonical envelopes.
```

## Branch

Use branch:

```text
feature/backend-places-plants
```

---

# Scope

Implement only:

- [ ] Implement the Fastify Places route plugin.
- [ ] Register Places routes under `/api/v1/places`.
- [ ] Protect all Places endpoints with the existing auth plugin/pre-handler.
- [ ] Use `requireActor` or the established safe accessor to derive actor/account context.
- [ ] Validate params, query, and body with the Phase 5 validation schemas.
- [ ] Call `PlacesService` from thin handlers only.
- [ ] Wrap success responses with the existing `successEnvelope` helper.
- [ ] Return canonical errors through existing `AppError` and error-handler behavior.
- [ ] Preserve canonical pagination shape for list responses.
- [ ] Preserve canonical archive response `{ data: { archived: true } }`.
- [ ] Add route/API tests for Places endpoints.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/places/places.routes.ts
backend/src/app/routes.ts
backend/test/places/places.routes.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Plants routes or plant behavior.
- [ ] Perennials, beds, persistent plants, yearly plantings, target resolver, activities, problems, tasks, weather forecast, rain confirmation, AI, push, storage, or MCP tools.
- [ ] Frontend pages or frontend API services.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.
- [ ] Direct database queries in controllers.
- [ ] Weather provider calls.

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
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- [ ] `docs/implementation-phases/phase-05/01-module-contracts-and-dependency-wiring.md`
- [ ] `docs/implementation-phases/phase-05/02-places-repository-and-service.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] `backend/src/app/routes.ts`
- [ ] `backend/src/modules/auth/request-actor.ts`
- [ ] `backend/src/shared/api/envelope.ts`
- [ ] `backend/src/shared/validation/request-validation.ts`
- [ ] Existing Places module files from prior steps

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] auth/session boundary
- [ ] weather/rain confirmation
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Frontend must not submit accountId for normal flows.
Controllers stay thin.
Services own cross-field validation and archive behavior.
Places are top-level garden locations.
Weather is optional per place.
Weather location must be explicit.
Weather is advisory and no provider call happens in this phase.
Places should be archived instead of hard-deleted.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 5. Future MCP place tools must use these backend routes/services and preserve auth/account scoping.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema usage
- [ ] backend service method calls
- [ ] route registration
- [ ] canonical response envelopes
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
GET /api/v1/places
POST /api/v1/places
GET /api/v1/places/:placeId
PATCH /api/v1/places/:placeId
POST /api/v1/places/:placeId/archive
```

`GET /api/v1/places` query:

```text
q optional
includeArchived optional boolean
pagination
```

Places request fields:

```text
name
description
notes
weatherEnabled
weatherLocationLabel
latitude
longitude
timezone
```

Expected list envelope:

```json
{
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

Expected archive envelope:

```json
{
  "data": {
    "archived": true
  }
}
```

Errors must use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  }
}
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] archive behavior
- [ ] API response shape
- [ ] duplicate active place-name conflict
- [ ] edge cases

Specific test cases:

1. Unauthenticated Places requests return `UNAUTHORIZED`.
2. `POST /api/v1/places` creates a place for the authenticated actor account and ignores/rejects any client-supplied `accountId`.
3. `GET /api/v1/places` returns only active places for the actor account by default.
4. `GET /api/v1/places?includeArchived=true` includes archived actor-account places but not cross-account places.
5. `GET /api/v1/places/:placeId` returns detail with camelCase fields and counts.
6. Account A cannot get account B's place.
7. `PATCH /api/v1/places/:placeId` updates only account A's place and preserves canonical envelope shape.
8. `POST /api/v1/places/:placeId/archive` sets `archived_at` and returns `{ data: { archived: true } }`.
9. Missing `name` returns `VALIDATION_ERROR`.
10. `weatherEnabled: true` without location data returns `VALIDATION_ERROR` or the service's canonical business validation error.
11. Duplicate active place name returns `CONFLICT` where the unique index applies.

---

# Acceptance Criteria

The task is complete when:

- [ ] All canonical Places API endpoints are implemented.
- [ ] Places routes are authenticated and account-scoped.
- [ ] Controllers validate and dispatch only; business validation stays in the service.
- [ ] List responses use pagination envelope.
- [ ] DTOs are camelCase and contract-compatible.
- [ ] Archive response is canonical and archive uses `archived_at`.
- [ ] No Plants behavior, frontend code, provider calls, schema changes, or unrelated workflows are introduced.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If database-backed route tests require a dedicated local/private PostgreSQL-compatible database and it is unavailable, report that exactly.

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

Do not manually parse auth tokens in these handlers. Use the existing auth plugin and request actor context.

Do not claim tests passed unless they were actually run.

