# Implementation Task - Phase 5 Step 2: Places Repository and Service

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
Add the account-scoped Places repository and Places service, including weather metadata validation, archive behavior, pagination support, and DTO-safe data access.
```

## Branch

Use branch:

```text
feature/backend-places-plants
```

---

# Scope

Implement only:

- [ ] Implement `PlacesRepository` and `KyselyPlacesRepository`.
- [ ] Implement `PlacesService`.
- [ ] Support account-scoped list, detail lookup, create, update, archive, and detail count queries.
- [ ] Support `q`, `includeArchived`, `page`, and `pageSize` list behavior needed by the canonical API.
- [ ] Exclude archived places by default and include them only when `includeArchived` is explicit.
- [ ] Derive `accountId` from `AuthenticatedActor`; never accept account scope from request bodies.
- [ ] Validate weather metadata in the service: when `weatherEnabled` is true, require `weatherLocationLabel` or both `latitude` and `longitude`.
- [ ] Store weather fields only as place metadata; do not call `WeatherPort` or Open-Meteo.
- [ ] Archive by setting `archived_at`; never hard delete.
- [ ] Map duplicate active place-name unique constraint failures to a canonical `CONFLICT` application error.
- [ ] Return `NOT_FOUND` or the existing consistent inaccessible-resource policy when the requested place is missing, archived when excluded, or belongs to another account.
- [ ] Add repository/service tests, including account scoping and transaction-handle compatibility.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/places/places.repository.ts
backend/src/modules/places/places.service.ts
backend/src/modules/places/places.types.ts
backend/src/modules/places/places.dto.ts
backend/test/places/places.repository.test.ts
backend/test/places/places.service.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Fastify Places routes or public endpoint handlers; those are Step 3.
- [ ] Plants repository, service, or routes; those are later Phase 5 steps.
- [ ] Perennials, beds, place target resolution, activities, problems, tasks, weather forecast, rain confirmation, AI, push, or MCP tools.
- [ ] Frontend code.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.
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
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- [ ] `docs/implementation-phases/phase-05/01-module-contracts-and-dependency-wiring.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] `backend/src/db/transaction.ts`
- [ ] `backend/src/db/database.types.ts`
- [ ] `backend/src/modules/auth/auth.types.ts`
- [ ] `backend/src/shared/errors/app-error.ts`
- [ ] `backend/test/accounts/accounts.repository.test.ts`
- [ ] Existing Phase 5 files from prior steps

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] weather/rain confirmation
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Frontend must not submit accountId for normal flows.
Places are top-level garden locations.
Weather is optional per place.
Weather location must be explicit.
Weather is advisory and must not auto-fail treatments.
Places should be archived instead of hard-deleted.
Backend validation is authoritative.
Repositories only access data.
Services own cross-field validation and archive policy.
```

Weather/rain confirmation is affected only as place metadata. Do not implement weather provider calls or rain confirmation here.

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 5. Future MCP place tools must call backend services/API and preserve account scoping.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] repository methods
- [ ] backend service method
- [ ] transaction-compatible repository handles
- [ ] weather metadata validation
- [ ] archive behavior
- [ ] database-to-DTO mapping
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
No public route handlers are implemented in this step.
```

Repository/service behavior must support the later route contract:

```text
GET /api/v1/places
POST /api/v1/places
GET /api/v1/places/:placeId
PATCH /api/v1/places/:placeId
POST /api/v1/places/:placeId/archive
```

Places use these API fields:

```text
id
name
description
notes
weatherEnabled
weatherLocationLabel
latitude
longitude
timezone
counts
createdAt
updatedAt
archivedAt
```

List responses must be backed by `{ items, page, pageSize, total }`. Detail counts must be account-scoped and may count existing rows in `perennials`, `beds`, `problems`, and `tasks` without implementing those workflows.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] archive behavior
- [ ] duplicate active name conflict
- [ ] API DTO shape support
- [ ] edge cases

Specific test cases:

1. Repository lists only account A active places by default.
2. Repository includes archived account A places only when `includeArchived` is true.
3. Repository never returns account B places to account A.
4. Repository create/update/archive use `account_id = actor.accountId`.
5. Archive sets `archived_at` and does not delete the row.
6. Service allows disabled weather without location fields.
7. Service rejects enabled weather without label or complete coordinates.
8. Service maps duplicate active place names to `CONFLICT`.
9. Repository/service methods work with a `DbTransaction` handle.
10. Place detail counts do not include cross-account records.

---

# Acceptance Criteria

The task is complete when:

- [ ] `PlacesRepository` and `PlacesService` exist.
- [ ] All place reads/writes are account-scoped.
- [ ] Weather-enabled validation is enforced in the service layer.
- [ ] Archive uses `archived_at` only.
- [ ] Duplicate active place name conflicts are mapped to the canonical conflict error.
- [ ] DTOs are camelCase and do not leak database snake_case rows.
- [ ] No public routes, frontend code, provider calls, schema changes, or unrelated modules are introduced.
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

Do not hide weather validation in route code or database triggers. The service owns the cross-field rule.

Do not claim tests passed unless they were actually run.

