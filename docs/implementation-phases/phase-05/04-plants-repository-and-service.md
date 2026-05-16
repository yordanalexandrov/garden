# Implementation Task - Phase 5 Step 4: Plants Repository and Service

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
Add the account-scoped Plants repository and Plants service, including plant filters, enum validation, archive behavior, pagination support, and DTO-safe data access.
```

## Branch

Use branch:

```text
feature/backend-places-plants
```

---

# Scope

Implement only:

- [ ] Implement `PlantsRepository` and `KyselyPlantsRepository`.
- [ ] Implement `PlantsService`.
- [ ] Support account-scoped list, detail lookup, create, update, and archive.
- [ ] Support `q`, `lifecycleType`, `growingStyle`, `includeArchived`, `page`, and `pageSize` list behavior needed by the canonical API.
- [ ] Exclude archived plants by default and include them only when `includeArchived` is explicit.
- [ ] Derive `accountId` from `AuthenticatedActor`; never accept account scope from request bodies.
- [ ] Validate `commonName` is required.
- [ ] Validate `lifecycleType` and `growingStyle` against the canonical enum values.
- [ ] Do not over-enforce plant uniqueness beyond schema constraints.
- [ ] Archive by setting `archived_at`; never hard delete.
- [ ] Return `NOT_FOUND` or the existing consistent inaccessible-resource policy when the requested plant is missing, archived when excluded, or belongs to another account.
- [ ] Add repository/service tests, including account scoping and transaction-handle compatibility.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/plants/plants.repository.ts
backend/src/modules/plants/plants.service.ts
backend/src/modules/plants/plants.types.ts
backend/src/modules/plants/plants.dto.ts
backend/test/plants/plants.repository.test.ts
backend/test/plants/plants.service.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Fastify Plants routes or public endpoint handlers; those are Step 5.
- [ ] Product usage rules that reference plants.
- [ ] Perennials, beds, persistent plants, yearly plantings, target resolver, activities, problems, tasks, weather, AI, push, storage, or MCP tools.
- [ ] Frontend code.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.
- [ ] Hard deletes.
- [ ] Application-level uniqueness rules for plant varieties/local names beyond what the schema already defines.

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
- [ ] `docs/implementation-phases/phase-05/02-places-repository-and-service.md`
- [ ] `docs/implementation-phases/phase-05/03-places-routes-and-api-contract.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] `backend/src/db/transaction.ts`
- [ ] `backend/src/db/database.types.ts`
- [ ] `backend/src/modules/auth/auth.types.ts`
- [ ] `backend/src/shared/errors/app-error.ts`
- [ ] Existing Plants module files from prior steps

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] product usage rules
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Frontend must not submit accountId for normal flows.
Plants are reusable user-maintained references.
Plant records should not be duplicated unnecessarily, but database should not over-enforce uniqueness for varieties/local names.
Plant records with history should be archived instead of deleted.
Backend validation is authoritative.
Repositories only access data.
Services own validation and archive policy.
```

Product usage rules are affected only because future product rules will reference plants. Do not implement product rules in this step.

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 5. Future MCP plant tools must call backend services/API and preserve account scoping.
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
- [ ] plant enum validation
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
GET /api/v1/plants
POST /api/v1/plants
GET /api/v1/plants/:plantId
PATCH /api/v1/plants/:plantId
POST /api/v1/plants/:plantId/archive
```

Plants use these API fields:

```text
id
commonName
variety
plantCategory
lifecycleType
growingStyle
notes
createdAt
updatedAt
archivedAt
```

Allowed `lifecycleType` values:

```text
annual
biennial
perennial
```

Allowed `growingStyle` values:

```text
tree
shrub
vine
herb
vegetable
berry
flower
other
```

List responses must be backed by `{ items, page, pageSize, total }`.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] archive behavior
- [ ] filter behavior
- [ ] API DTO shape support
- [ ] edge cases

Specific test cases:

1. Repository lists only account A active plants by default.
2. Repository includes archived account A plants only when `includeArchived` is true.
3. Repository never returns account B plants to account A.
4. Repository create/update/archive use `account_id = actor.accountId`.
5. Archive sets `archived_at` and does not delete the row.
6. Service rejects missing `commonName`.
7. Service rejects invalid `lifecycleType`.
8. Service rejects invalid `growingStyle`.
9. Service does not reject two plants with the same common name when schema allows it.
10. `q`, `lifecycleType`, and `growingStyle` filters apply within the actor account only.
11. Repository/service methods work with a `DbTransaction` handle.

---

# Acceptance Criteria

The task is complete when:

- [ ] `PlantsRepository` and `PlantsService` exist.
- [ ] All plant reads/writes are account-scoped.
- [ ] Enum validation matches the canonical API contract.
- [ ] Archive uses `archived_at` only.
- [ ] Plant uniqueness is not over-enforced beyond schema constraints.
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

Avoid making plant names globally or account-unique in application code unless a higher-priority spec or schema constraint requires it.

Do not claim tests passed unless they were actually run.

