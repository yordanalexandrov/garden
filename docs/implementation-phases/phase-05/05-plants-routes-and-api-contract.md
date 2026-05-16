# Implementation Task - Phase 5 Step 5: Plants Routes and API Contract

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
Expose the canonical account-scoped Plants API routes under /api/v1/plants using the Plants service, validation schemas, auth context, and canonical envelopes.
```

## Branch

Use branch:

```text
feature/backend-places-plants
```

---

# Scope

Implement only:

- [ ] Implement the Fastify Plants route plugin.
- [ ] Register Plants routes under `/api/v1/plants`.
- [ ] Protect all Plants endpoints with the existing auth plugin/pre-handler.
- [ ] Use `requireActor` or the established safe accessor to derive actor/account context.
- [ ] Validate params, query, and body with the Phase 5 validation schemas.
- [ ] Call `PlantsService` from thin handlers only.
- [ ] Wrap success responses with the existing `successEnvelope` helper.
- [ ] Return canonical errors through existing `AppError` and error-handler behavior.
- [ ] Preserve canonical pagination shape for list responses.
- [ ] Preserve canonical archive response `{ data: { archived: true } }`.
- [ ] Add route/API tests for Plants endpoints.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/plants/plants.routes.ts
backend/src/app/routes.ts
backend/test/plants/plants.routes.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Product usage rules that reference plants.
- [ ] Perennials, beds, persistent plants, yearly plantings, target resolver, activities, problems, tasks, weather, AI, push, storage, or MCP tools.
- [ ] Frontend pages or frontend API services.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.
- [ ] Direct database queries in controllers.
- [ ] Plant uniqueness rules beyond schema constraints.

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
- [ ] `docs/implementation-phases/phase-05/04-plants-repository-and-service.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] `backend/src/app/routes.ts`
- [ ] `backend/src/modules/auth/request-actor.ts`
- [ ] `backend/src/shared/api/envelope.ts`
- [ ] `backend/src/shared/validation/request-validation.ts`
- [ ] Existing Plants module files from prior steps

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] auth/session boundary
- [ ] product usage rules
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Frontend must not submit accountId for normal flows.
Controllers stay thin.
Services own validation and archive behavior.
Plants are reusable user-maintained references.
Plant records should not be duplicated unnecessarily, but database should not over-enforce uniqueness for varieties/local names.
Plant records with history should be archived instead of deleted.
```

Product usage rules are affected only as future references. Do not implement product rules in this step.

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 5. Future MCP plant tools must use these backend routes/services and preserve auth/account scoping.
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
GET /api/v1/plants
POST /api/v1/plants
GET /api/v1/plants/:plantId
PATCH /api/v1/plants/:plantId
POST /api/v1/plants/:plantId/archive
```

`GET /api/v1/plants` query:

```text
q
lifecycleType
growingStyle
includeArchived
pagination
```

Plants request fields:

```text
commonName
variety
plantCategory
lifecycleType
growingStyle
notes
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

Expected create envelope:

```json
{
  "data": {
    "id": "uuid"
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

The canonical contract does not expand the plant detail response as fully as places. Return a camelCase plant DTO consistent with list/create/update fields and timestamps; do not invent relationships or derived business data.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] archive behavior
- [ ] filter behavior
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Unauthenticated Plants requests return `UNAUTHORIZED`.
2. `POST /api/v1/plants` creates a plant for the authenticated actor account and ignores/rejects any client-supplied `accountId`.
3. `GET /api/v1/plants` returns only active plants for the actor account by default.
4. `GET /api/v1/plants?includeArchived=true` includes archived actor-account plants but not cross-account plants.
5. `GET /api/v1/plants` supports `q`, `lifecycleType`, and `growingStyle` filters.
6. `GET /api/v1/plants/:plantId` returns a camelCase plant DTO.
7. Account A cannot get account B's plant.
8. `PATCH /api/v1/plants/:plantId` updates only account A's plant and preserves canonical envelope shape.
9. `POST /api/v1/plants/:plantId/archive` sets `archived_at` and returns `{ data: { archived: true } }`.
10. Missing `commonName` returns `VALIDATION_ERROR`.
11. Invalid `lifecycleType` or `growingStyle` returns `VALIDATION_ERROR`.
12. Creating two same-name plants for one account is not rejected unless the schema itself rejects it.

---

# Acceptance Criteria

The task is complete when:

- [ ] All canonical Plants API endpoints are implemented.
- [ ] Plants routes are authenticated and account-scoped.
- [ ] Controllers validate and dispatch only; business validation stays in the service.
- [ ] List responses use pagination envelope.
- [ ] DTOs are camelCase and contract-compatible.
- [ ] Archive response is canonical and archive uses `archived_at`.
- [ ] No product rules, frontend code, provider calls, schema changes, or unrelated workflows are introduced.
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

Keep plant controllers thin. If validation or account scoping starts to appear directly in handlers beyond request parsing and actor extraction, move it back to the service/repository boundary.

Do not claim tests passed unless they were actually run.

