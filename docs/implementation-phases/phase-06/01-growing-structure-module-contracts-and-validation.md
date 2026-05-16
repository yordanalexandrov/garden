# Implementation Task - Phase 6 Step 1: Growing Structure Module Contracts and Validation

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
Prepare the backend module contracts, DTO conventions, validation schemas, status enums, and route wiring needed for the Phase 6 growing structure APIs.
```

## Branch

Use branch:

```text
feature/backend-growing-structure
```

---

# Scope

Implement only:

- [ ] Inspect existing backend app, route registration, auth plugin, database client, transaction handle, envelope helpers, validation helper, places module, plants module, and test helper patterns.
- [ ] Create the growing structure module layout for perennials, beds, persistent bed plants, and yearly bed plantings.
- [ ] Define TypeScript domain/input/filter/DTO types for all Phase 6 entities using existing `UUID`, `DbHandle`, and database table types where appropriate.
- [ ] Define canonical status enum values:
  - perennials: `active`, `removed`, `dead`, `archived`
  - beds: `active`, `removed`, `archived`
  - persistent bed plants: `active`, `removed`, `archived`
  - yearly bed plantings: `planned`, `planted`, `removed`, `harvested`, `archived`
- [ ] Define validation schemas for common params, pagination, status filters, `year`, create/update payloads, positive bed dimensions, non-negative quantities, and sane years.
- [ ] Use the schema year range from migrations unless an existing shared helper already defines the documented range: `1900` through `3000`.
- [ ] Define DTO mapping helpers that convert database snake_case fields to API camelCase fields and include plant display names where required.
- [ ] Add narrow dependency wiring so Phase 6 routes can be registered without opening database connections at import time.
- [ ] Preserve Phase 5 places/plants behavior and `GET /api/v1/health`.
- [ ] Add focused tests for validation schemas and DTO mapping if the existing test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/perennials/
backend/src/modules/beds/
backend/src/modules/plantings/
backend/src/modules/perennials/perennials.types.ts
backend/src/modules/perennials/perennials.validation.ts
backend/src/modules/perennials/perennials.dto.ts
backend/src/modules/beds/beds.types.ts
backend/src/modules/beds/beds.validation.ts
backend/src/modules/beds/beds.dto.ts
backend/src/modules/plantings/persistent-bed-plants.types.ts
backend/src/modules/plantings/persistent-bed-plants.validation.ts
backend/src/modules/plantings/persistent-bed-plants.dto.ts
backend/src/modules/plantings/yearly-bed-plantings.types.ts
backend/src/modules/plantings/yearly-bed-plantings.validation.ts
backend/src/modules/plantings/yearly-bed-plantings.dto.ts
backend/src/app/routes.ts
backend/test/growing-structure/
```

---

# Out of Scope

Do not implement:

- [ ] Repository queries or writes.
- [ ] Service business workflows.
- [ ] Public growing structure route handlers beyond no-op-safe registration needed for later steps.
- [ ] Activity or task target resolver.
- [ ] Activities, inventory, products, product rules, problems, tasks, weather forecasts, AI, push, storage, frontend code, or MCP tools.
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
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing Phase 5 places/plants modules and tests
- [ ] `backend/src/app/routes.ts`
- [ ] `backend/src/app/create-app.ts`
- [ ] `backend/src/db/db.ts`
- [ ] `backend/src/db/transaction.ts`
- [ ] `backend/src/db/database.types.ts`
- [ ] `backend/src/modules/auth/request-actor.ts`
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
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
All business records belong to an account.
Cross-account access is forbidden.
Account consistency is mandatory.
Perennials are individually tracked growing units.
Beds are physical growing areas.
Persistent bed plants stay until explicitly removed or archived.
Yearly bed plantings are year-based and use calendar year only.
Historical bed occupancy must remain readable.
Archive historical business records instead of hard-deleting them.
The Fastify API remains the application data API under /api/v1.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

This step creates contracts and validation only. It must not implement business endpoints yet.

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 6. Future MCP growing-structure tools must use backend services/API rather than direct database writes.
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
No public growing structure endpoints should be behaviorally implemented in this step.
```

The contracts prepared in this step must support:

```text
GET /api/v1/places/:placeId/perennials
POST /api/v1/places/:placeId/perennials
GET /api/v1/perennials/:perennialId
PATCH /api/v1/perennials/:perennialId
POST /api/v1/perennials/:perennialId/archive
GET /api/v1/places/:placeId/beds
POST /api/v1/places/:placeId/beds
GET /api/v1/beds/:bedId
PATCH /api/v1/beds/:bedId
POST /api/v1/beds/:bedId/archive
GET /api/v1/beds/:bedId/persistent-plants
POST /api/v1/beds/:bedId/persistent-plants
PATCH /api/v1/persistent-bed-plants/:id
POST /api/v1/persistent-bed-plants/:id/archive
GET /api/v1/beds/:bedId/plantings
POST /api/v1/beds/:bedId/plantings
PATCH /api/v1/plantings/:plantingId
POST /api/v1/plantings/:plantingId/archive
```

DTOs must use camelCase API fields and never return raw snake_case database rows.

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] API response shape helpers if new DTO helpers are tested
- [ ] dependency wiring edge cases

Specific test cases:

1. Perennial validation accepts canonical status values and rejects invalid statuses.
2. Bed validation accepts positive dimensions and rejects zero/negative `widthM`, `lengthM`, and `areaM2`.
3. Persistent bed plant validation accepts non-negative quantity and rejects negative quantity.
4. Yearly bed planting validation accepts canonical status values and rejects invalid statuses.
5. Year validation rejects values outside `1900` through `3000`.
6. Common pagination parsing produces predictable defaults and honors max page size.
7. DTO helpers map snake_case rows to camelCase API fields.
8. Route wiring keeps `/api/v1/health` unauthenticated.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 6 module directories and core type/validation/DTO files exist.
- [ ] Validation schemas cover all Phase 6 request/query/param shapes.
- [ ] Status enum values exactly match the canonical API contract and migrations.
- [ ] DTO helpers map database rows to canonical camelCase shapes.
- [ ] Route/dependency wiring can support authenticated growing structure routes without opening DB connections at import time.
- [ ] No repositories, services, public endpoint behavior, schema changes, frontend code, provider calls, or MCP tools are introduced.
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

If database-backed tests are added in this step, also run:

```bash
npm run test:db
```

If any command does not exist or cannot run, report it clearly.

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

