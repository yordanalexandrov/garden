# Implementation Task - Phase 6 Step 6: Persistent Bed Plants Repository and Service

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
Add the account-scoped Persistent Bed Plants repository and service, including bed/plant consistency checks, archive behavior, quantity/year validation, and target-resolver-ready lookup methods.
```

## Branch

Use branch:

```text
feature/backend-growing-structure
```

---

# Scope

Implement only:

- [ ] Implement `PersistentBedPlantsRepository` and `KyselyPersistentBedPlantsRepository`.
- [ ] Implement `PersistentBedPlantsService`.
- [ ] Support account-scoped list by bed, detail lookup if needed internally, create, update, archive, `findManyByIds`, and active list methods.
- [ ] Exclude archived rows by default from active/list methods.
- [ ] Derive `accountId` from `AuthenticatedActor`; never accept account scope from request bodies.
- [ ] Before create, validate that the parent bed belongs to the actor account.
- [ ] Before create/update where `plantId` is involved, validate that the plant belongs to the actor account.
- [ ] Preserve `persistent_bed_plants.account_id = actor.accountId`; never copy account scope from bed/plant request data.
- [ ] Validate `quantity` is non-negative when supplied.
- [ ] Validate `plantedYear` is within the documented sane range when supplied.
- [ ] Do not auto-remove or auto-archive persistent bed plants when year changes.
- [ ] Archive by setting `archived_at` and status `archived` or the existing project-standard archive convention for status-bearing rows; never hard delete.
- [ ] Return `NOT_FOUND` or the existing consistent inaccessible-resource policy when a requested persistent bed plant, bed, or plant is missing or belongs to another account.
- [ ] Add repository/service tests, including account scoping and transaction-handle compatibility.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/plantings/persistent-bed-plants.repository.ts
backend/src/modules/plantings/persistent-bed-plants.service.ts
backend/src/modules/plantings/persistent-bed-plants.types.ts
backend/src/modules/plantings/persistent-bed-plants.dto.ts
backend/test/plantings/persistent-bed-plants.repository.test.ts
backend/test/plantings/persistent-bed-plants.service.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Fastify persistent bed plant routes or public endpoint handlers; those are Step 7.
- [ ] Yearly bed planting behavior.
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
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-06/01-growing-structure-module-contracts-and-validation.md`
- [ ] `docs/implementation-phases/phase-06/04-beds-repository-service-and-current-contents.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing beds repository/service from prior steps
- [ ] Existing plants repository/service from Phase 5
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
Persistent bed plants stay until explicitly removed or archived.
Persistent bed plants must not be automatically removed when year changes.
persistent_bed_plants.account_id must match bed.account_id and plant.account_id.
Historical bed occupancy must remain readable.
Archive historical business records instead of hard-deleting them.
Repositories only access data.
Services own bed/plant account consistency validation.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 6. Future persistent bed plant tools must call backend services/API and preserve account scoping.
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
- [ ] parent bed validation
- [ ] plant account validation
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
GET /api/v1/beds/:bedId/persistent-plants
POST /api/v1/beds/:bedId/persistent-plants
PATCH /api/v1/persistent-bed-plants/:id
POST /api/v1/persistent-bed-plants/:id/archive
```

Persistent bed plants use these API fields:

```text
id
bedId
plantId
plantName
plantedYear
quantity
notes
status
createdAt
updatedAt
archivedAt
```

List responses must be backed by `{ items, page, pageSize, total }` if pagination is implemented consistently for nested lists.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] archive behavior
- [ ] parent consistency
- [ ] API DTO shape support
- [ ] edge cases

Specific test cases:

1. Repository lists only account A persistent plants for account A bed.
2. Repository never returns account B persistent plants to account A.
3. Service create rejects a bed from another account.
4. Service create rejects a plant from another account.
5. Service create stores `account_id` from the authenticated actor.
6. Service rejects negative quantity.
7. Service rejects out-of-range `plantedYear`.
8. Persistent plants remain active across year changes unless explicitly updated/archived.
9. Archive preserves the row and excludes it from active list methods.
10. `findManyByIds` returns only matching account-owned rows.
11. Repository/service methods work with a `DbTransaction` handle.

---

# Acceptance Criteria

The task is complete when:

- [ ] `PersistentBedPlantsRepository` and `PersistentBedPlantsService` exist.
- [ ] All persistent bed plant reads/writes are account-scoped.
- [ ] Parent bed and plant account consistency is enforced in the service layer.
- [ ] Persistent plants are not automatically removed when year changes.
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
