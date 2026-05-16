# Implementation Task - Phase 6 Step 2: Perennials Repository and Service

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
Add the account-scoped Perennials repository and service, including parent place/plant consistency checks, archive behavior, pagination/filter support, and target-resolver-ready lookup methods.
```

## Branch

Use branch:

```text
feature/backend-growing-structure
```

---

# Scope

Implement only:

- [ ] Implement `PerennialsRepository` and `KyselyPerennialsRepository`.
- [ ] Implement `PerennialsService`.
- [ ] Support account-scoped list by place, detail lookup, create, update, archive, `findManyByIds`, and active list methods.
- [ ] Support `q`, `status`, `page`, and `pageSize` list behavior needed by the canonical API.
- [ ] Exclude archived rows by default from active/list methods unless the endpoint-specific filter intentionally includes status `archived`.
- [ ] Derive `accountId` from `AuthenticatedActor`; never accept account scope from request bodies.
- [ ] Before create, validate that the parent place belongs to the actor account.
- [ ] Before create/update where `plantId` is involved, validate that the plant belongs to the actor account.
- [ ] Preserve `perennials.account_id = actor.accountId`; never copy account scope from place/plant request data.
- [ ] Archive by setting `archived_at` and status `archived` or the existing project-standard archive convention for status-bearing rows; never hard delete.
- [ ] Return `NOT_FOUND` or the existing consistent inaccessible-resource policy when a requested perennial, place, or plant is missing or belongs to another account.
- [ ] Add repository/service tests, including account scoping and transaction-handle compatibility.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/perennials/perennials.repository.ts
backend/src/modules/perennials/perennials.service.ts
backend/src/modules/perennials/perennials.types.ts
backend/src/modules/perennials/perennials.dto.ts
backend/test/perennials/perennials.repository.test.ts
backend/test/perennials/perennials.service.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Fastify Perennials routes or public endpoint handlers; those are Step 3.
- [ ] Beds, persistent bed plants, or yearly bed plantings behavior.
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
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing places and plants repositories/services from Phase 5
- [ ] `backend/src/db/transaction.ts`
- [ ] `backend/src/db/database.types.ts`
- [ ] `backend/src/modules/auth/auth.types.ts`
- [ ] `backend/src/shared/errors/app-error.ts`
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
Perennials are individually tracked growing units.
Perennial.account_id must match place.account_id and plant.account_id.
Archive historical business records instead of hard-deleting them.
Backend validation is authoritative.
Repositories only access data.
Services own parent/account consistency validation.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 6. Future perennial tools must call backend services/API and preserve account scoping.
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
GET /api/v1/places/:placeId/perennials
POST /api/v1/places/:placeId/perennials
GET /api/v1/perennials/:perennialId
PATCH /api/v1/perennials/:perennialId
POST /api/v1/perennials/:perennialId/archive
```

Perennials use these API fields:

```text
id
placeId
plantId
plantName
label
plantedYear
status
notes
createdAt
updatedAt
archivedAt
```

List responses must be backed by `{ items, page, pageSize, total }`.

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

1. Repository lists only account A perennials for account A place.
2. Repository never returns account B perennials to account A.
3. Service create rejects a place from another account.
4. Service create rejects a plant from another account.
5. Service create stores `account_id` from the authenticated actor.
6. Service update rejects invalid status and out-of-range `plantedYear`.
7. Archive preserves the row, sets archive metadata/status according to project convention, and excludes the row from active list methods.
8. `findManyByIds` returns only matching account-owned rows.
9. `listActiveByPlace` excludes archived, removed, and dead rows unless the later target resolver explicitly needs a different historical query.
10. Repository/service methods work with a `DbTransaction` handle.

---

# Acceptance Criteria

The task is complete when:

- [ ] `PerennialsRepository` and `PerennialsService` exist.
- [ ] All perennial reads/writes are account-scoped.
- [ ] Parent place and plant account consistency is enforced in the service layer.
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

