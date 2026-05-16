# Implementation Task - Phase 6 Step 3: Perennials Routes and API Contract

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
Expose the canonical Perennials API routes with authenticated Fastify handlers, request validation, response envelopes, DTO mapping, and API-level tests.
```

## Branch

Use branch:

```text
feature/backend-growing-structure
```

---

# Scope

Implement only:

- [ ] Register authenticated perennials routes under `/api/v1`.
- [ ] Implement thin route handlers for list, create, detail, update, and archive.
- [ ] Validate route params, query strings, and bodies using schemas from Step 1.
- [ ] Call `PerennialsService`; do not perform parent/account consistency logic in controllers.
- [ ] Return canonical success envelopes for list, detail, mutation, and archive responses.
- [ ] Return canonical error envelopes through existing app error handling.
- [ ] Preserve list pagination envelope with `items`, `page`, `pageSize`, and `total`.
- [ ] Add API route tests for success, validation, auth, account scope, and response shape.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/perennials/perennials.routes.ts
backend/src/app/routes.ts
backend/test/perennials/perennials.routes.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Beds, persistent bed plants, or yearly bed plantings routes.
- [ ] Target resolver, activities, inventory, problems, tasks, AI, weather, storage, push, frontend code, or MCP tools.
- [ ] New repository/service behavior beyond fixing perennials gaps found while wiring routes.
- [ ] Schema changes or migrations.
- [ ] Hard deletes.

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
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-06/01-growing-structure-module-contracts-and-validation.md`
- [ ] `docs/implementation-phases/phase-06/02-perennials-repository-and-service.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing app route registration and auth test helpers
- [ ] Perennials repository/service files from Step 2

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Backend validates Supabase Auth JWTs through AuthPort.
The backend derives authenticated account context server-side.
Controllers stay thin.
Services own parent/account consistency validation.
API responses use canonical success and error envelopes.
Archive historical business records instead of hard-deleting them.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 6.
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
- [ ] API DTO mapping
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

---

# API Contract

Endpoints involved:

```text
GET /api/v1/places/:placeId/perennials
POST /api/v1/places/:placeId/perennials
GET /api/v1/perennials/:perennialId
PATCH /api/v1/perennials/:perennialId
POST /api/v1/perennials/:perennialId/archive
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

Perennial route behavior must include:

```text
List query: q, status, page, pageSize.
Create body: plantId, label, plantedYear, notes.
Update body: only editable perennial fields; reject invalid status and invalid years.
Mutations return { data: { id } } unless existing project convention includes the updated DTO.
Archive preserves the row and returns a canonical mutation/archive envelope.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] auth errors
- [ ] archive behavior
- [ ] edge cases

Specific test cases:

1. Unauthenticated perennials routes return `UNAUTHORIZED`.
2. `GET /places/:placeId/perennials` returns canonical pagination envelope.
3. `POST /places/:placeId/perennials` creates an account-scoped perennial and returns `{ data: { id } }`.
4. Create rejects cross-account `placeId`.
5. Create rejects cross-account `plantId`.
6. Detail returns `NOT_FOUND` or the existing inaccessible-resource policy for account B perennial.
7. Patch rejects invalid status and invalid `plantedYear`.
8. Archive preserves the row and excludes it from default active list behavior.
9. Validation errors use canonical `VALIDATION_ERROR` envelope.

---

# Acceptance Criteria

The task is complete when:

- [ ] All canonical Perennials API endpoints are registered and authenticated.
- [ ] Handlers are thin and call `PerennialsService`.
- [ ] Request validation and DTO mapping match the canonical API contract.
- [ ] List responses use canonical pagination envelope.
- [ ] Errors use canonical error envelope.
- [ ] Account-scope and cross-account tests pass.
- [ ] No beds, plantings, frontend, provider, MCP, or schema work is introduced.
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

If database-backed tests require a dedicated local/private PostgreSQL-compatible database and it is unavailable, report that exactly.

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

Do not redesign the product.

