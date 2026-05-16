# Implementation Task - Phase 6 Step 4: Beds Repository, Service, and Current Contents

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
Add the account-scoped Beds repository and service, including parent place validation, archive behavior, selected-year current contents reads, pagination/filter support, and target-resolver-ready lookup methods.
```

## Branch

Use branch:

```text
feature/backend-growing-structure
```

---

# Scope

Implement only:

- [ ] Implement `BedsRepository` and `KyselyBedsRepository`.
- [ ] Implement `BedsService`.
- [ ] Support account-scoped list by place, detail lookup, create, update, archive, `findManyByIds`, and active list methods.
- [ ] Support `year`, `q`, `page`, and `pageSize` list behavior needed by the canonical API.
- [ ] Exclude archived rows by default from active/list methods.
- [ ] Derive `accountId` from `AuthenticatedActor`; never accept account scope from request bodies.
- [ ] Before create, validate that the parent place belongs to the actor account.
- [ ] Validate positive dimensions when supplied.
- [ ] Store or derive `areaM2` consistently according to existing project patterns; document the chosen behavior if not already established.
- [ ] Return current contents for a selected year: active persistent bed plants plus yearly bed plantings for that selected calendar year.
- [ ] Do not rely solely on `bed_current_contents` for non-current-year responses because that view is current-calendar-year based.
- [ ] Preserve historical occupancy; changing a bed or viewing a different year must not mutate plantings.
- [ ] Archive by setting `archived_at` and status `archived` or the existing project-standard archive convention for status-bearing rows; never hard delete.
- [ ] Return `NOT_FOUND` or the existing consistent inaccessible-resource policy when a requested bed/place is missing or belongs to another account.
- [ ] Add repository/service tests, including account scoping, current contents, and transaction-handle compatibility.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/beds/beds.repository.ts
backend/src/modules/beds/beds.service.ts
backend/src/modules/beds/beds.types.ts
backend/src/modules/beds/beds.dto.ts
backend/test/beds/beds.repository.test.ts
backend/test/beds/beds.service.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Fastify Beds routes or public endpoint handlers; those are Step 5.
- [ ] Persistent bed plant or yearly bed planting mutations; those are later steps.
- [ ] Activity or task target resolver.
- [ ] Activities, inventory, products, problems, tasks, weather, AI, storage, push, frontend code, or MCP tools.
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
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-06/01-growing-structure-module-contracts-and-validation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing places repository/service from Phase 5
- [ ] Existing backend test helpers and fixtures

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
All business records belong to an account.
Cross-account access is forbidden.
Account consistency is mandatory.
Beds are physical growing areas.
Bed.account_id must match place.account_id.
A bed can contain persistent bed plants and yearly bed plantings.
Historical bed occupancy must remain readable.
Archive historical business records instead of hard-deleting them.
Repositories only access data.
Services own parent/account consistency validation.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 6. Future bed tools must call backend services/API and preserve account scoping.
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
- [ ] parent place validation
- [ ] selected-year current contents read behavior
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
GET /api/v1/places/:placeId/beds
POST /api/v1/places/:placeId/beds
GET /api/v1/beds/:bedId
PATCH /api/v1/beds/:bedId
POST /api/v1/beds/:bedId/archive
```

Beds use these API fields:

```text
id
placeId
name
description
notes
widthM
lengthM
areaM2
status
currentContents
persistentPlants
yearlyPlantings
recentActivities
openProblems
createdAt
updatedAt
archivedAt
```

`recentActivities` and `openProblems` preserve the canonical bed detail response shape. In Phase 6 they must be returned as empty arrays/placeholders; do not introduce activity or problem module dependencies in this step.

List responses must be backed by `{ items, page, pageSize, total }`.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] archive behavior
- [ ] selected-year current contents
- [ ] API DTO shape support
- [ ] edge cases

Specific test cases:

1. Repository lists only account A beds for account A place.
2. Repository never returns account B beds to account A.
3. Service create rejects a place from another account.
4. Service create stores `account_id` from the authenticated actor.
5. Service rejects zero or negative dimensions.
6. Service consistently computes or stores `areaM2` when dimensions are provided.
7. Bed list/detail contents include active persistent bed plants.
8. Bed list/detail contents include yearly plantings only for the selected year.
9. Selected-year contents do not mutate or hide historical yearly planting rows.
10. Archive preserves the row and excludes it from active list methods.
11. `findManyByIds` returns only matching account-owned rows.
12. Repository/service methods work with a `DbTransaction` handle.

---

# Acceptance Criteria

The task is complete when:

- [ ] `BedsRepository` and `BedsService` exist.
- [ ] All bed reads/writes are account-scoped.
- [ ] Parent place account consistency is enforced in the service layer.
- [ ] Bed dimension validation is enforced.
- [ ] Selected-year current contents work without destroying historical records.
- [ ] Archive uses historical-preserving metadata/status, not hard delete.
- [ ] Repository methods needed by Phase 11 target resolution exist.
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

Do not redesign the product.
