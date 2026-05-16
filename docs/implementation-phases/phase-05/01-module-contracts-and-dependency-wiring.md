# Implementation Task - Phase 5 Step 1: Module Contracts and Dependency Wiring

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
Prepare the backend module contracts, DTO conventions, validation foundations, and narrow dependency wiring needed for the Phase 5 Places and Plants APIs.
```

## Branch

Use branch:

```text
feature/backend-places-plants
```

---

# Scope

Implement only:

- [ ] Inspect the existing backend app, route registration, auth plugin, database client, transaction handle, envelope helpers, validation helper, and test helper patterns.
- [ ] Create the `backend/src/modules/places/` and `backend/src/modules/plants/` module structure.
- [ ] Define TypeScript domain/input/filter/DTO types for places and plants using existing `UUID`, `DbHandle`, and database table types where appropriate.
- [ ] Define allowed plant enum values for `lifecycleType` and `growingStyle` from the canonical API contract.
- [ ] Define validation schemas for common params, pagination, `includeArchived`, place create/update, and plant create/update/filter payloads.
- [ ] Define DTO mapping helpers that convert database snake_case fields to API camelCase fields.
- [ ] Add narrow dependency wiring so Phase 5 routes can receive/use `DbClient` and authenticated actor context without opening database connections at import time.
- [ ] Preserve `GET /api/v1/health` as unauthenticated and keep test-only routes isolated.
- [ ] Add focused tests for validation schemas and dependency wiring if the existing test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/places/places.types.ts
backend/src/modules/places/places.validation.ts
backend/src/modules/places/places.dto.ts
backend/src/modules/plants/plants.types.ts
backend/src/modules/plants/plants.validation.ts
backend/src/modules/plants/plants.dto.ts
backend/src/app/routes.ts
backend/src/app/create-app.ts
backend/src/server.ts
backend/test/places/
backend/test/plants/
```

---

# Out of Scope

Do not implement:

- [ ] Public Places or Plants route handlers beyond no-op-safe registration needed for later steps.
- [ ] Repository queries or writes.
- [ ] Service business workflows.
- [ ] Perennials, beds, persistent plants, yearly plantings, products, product rules, inventory, activities, problems, tasks, weather forecasts, AI, push, storage, or MCP tools.
- [ ] Frontend code.
- [ ] Schema changes or migrations.
- [ ] Direct Supabase SDK usage in domain services.

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
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] `backend/src/app/routes.ts`
- [ ] `backend/src/app/create-app.ts`
- [ ] `backend/src/server.ts`
- [ ] `backend/src/db/db.ts`
- [ ] `backend/src/db/transaction.ts`
- [ ] `backend/src/db/database.types.ts`
- [ ] `backend/src/modules/auth/request-actor.ts`
- [ ] `backend/src/shared/plugins/auth.ts`
- [ ] `backend/src/shared/api/envelope.ts`
- [ ] `backend/src/shared/validation/request-validation.ts`
- [ ] Existing backend tests and helpers under `backend/test/`

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows.
Repositories only access data.
All business records belong to an account.
Cross-account access is forbidden.
Frontend must not submit accountId for normal flows.
Backend validates Supabase Auth JWTs through AuthPort.
The Fastify API remains the application data API under /api/v1.
Weather configuration stored on places must not call Open-Meteo in Phase 5.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

This step creates contracts and wiring only. It must not implement business endpoints yet.

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 5. Future MCP read/mutation tools must use the backend services/API created in this phase rather than direct database writes.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend validation schema
- [ ] backend module/domain types
- [ ] DTO mapping helpers
- [ ] route dependency wiring
- [ ] authenticated actor/dependency access conventions
- [ ] tests
- [ ] docs/update notes only if backend startup or dependency injection commands change

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
No public Places or Plants endpoints should be behaviorally implemented in this step.
```

The contracts prepared in this step must support:

```text
GET /api/v1/places
POST /api/v1/places
GET /api/v1/places/:placeId
PATCH /api/v1/places/:placeId
POST /api/v1/places/:placeId/archive
GET /api/v1/plants
POST /api/v1/plants
GET /api/v1/plants/:plantId
PATCH /api/v1/plants/:plantId
POST /api/v1/plants/:plantId/archive
```

DTOs must use camelCase API fields and never return raw snake_case database rows.

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] API response shape helpers if new DTO helpers are tested
- [ ] dependency wiring edge cases

Specific test cases:

1. Place create validation accepts `weatherEnabled: false` without weather location fields.
2. Place create validation accepts `weatherEnabled: true` with `weatherLocationLabel`.
3. Place create validation accepts `weatherEnabled: true` with both `latitude` and `longitude`.
4. Place create validation rejects `weatherEnabled: true` without label or complete coordinates.
5. Plant validation accepts only canonical `lifecycleType` and `growingStyle` values.
6. Common pagination/includeArchived parsing produces predictable defaults.
7. Route wiring keeps `/api/v1/health` unauthenticated.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 5 module directories and core type/validation/DTO files exist.
- [ ] DTO helpers map snake_case database fields to camelCase API fields.
- [ ] Validation schemas cover the Phase 5 request/query/param shapes.
- [ ] Plant enum values exactly match the canonical API contract.
- [ ] Route/dependency wiring can support authenticated Places and Plants routes without opening DB connections at import time.
- [ ] No public Places/Plants behavior, schema changes, frontend code, provider calls, or MCP tools are introduced.
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

If any command does not exist or fails due to pre-existing setup, report it clearly.

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

Keep this step boring. It should establish explicit module contracts and dependency seams so later Phase 5 steps can add behavior without scattering database, auth, or DTO decisions across controllers.

Do not claim tests passed unless they were actually run.

