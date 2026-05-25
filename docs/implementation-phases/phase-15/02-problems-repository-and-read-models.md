# Implementation Task - Phase 15 Step 2: Problems Repository and Read Models

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
Add account-scoped ProblemsRepository methods and read models for Phase 15 problem/observation metadata without photo storage behavior.
```

## Branch

Use branch:

```text
feature/backend-problems
```

---

# Scope

Implement only:

- [ ] Inspect existing repository patterns for pagination, filters, account scoping, insert/update returning rows, and transaction-aware optional database handles.
- [ ] Implement `ProblemsRepository` methods for metadata create, list, detail lookup, update, and linked activity lookup support where this belongs locally.
- [ ] Keep every repository query scoped by authenticated `accountId`.
- [ ] Support filters from the canonical contract: `placeId`, `type`, `status`, `category`, `from`, `to`, pagination, and local sort default.
- [ ] Return target label read-model data where available for place, perennial, bed, yearly bed planting, and persistent bed plant targets.
- [ ] Return `photosCount` as `0` in Phase 15 unless existing `problem_photos` metadata already exists and can be counted without adding upload behavior.
- [ ] Return detail records with `photos: []` or equivalent DTO support that remains compatible with Phase 16.
- [ ] Preserve archived/historical readability: existing problems remain readable even if their target is later archived.
- [ ] Add repository tests for account scope, filters, target label read models, create/update persistence, and not-found behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/problems/problems.repository.ts
backend/src/modules/problems/problems.dto.ts
backend/test/problems/problems.repository.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Service-level target/place validation; that belongs to Step 3.
- [ ] Route handler behavior beyond what is needed to compile with the repository.
- [ ] Photo upload, storage writes, signed URLs, or `StoragePort`.
- [ ] New problem photo metadata creation.
- [ ] AI problem assist.
- [ ] Frontend pages or frontend API services.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.
- [ ] Direct Supabase SDK usage inside domain services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 4 and 13
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 18
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` ProblemsRepository section
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] Existing backend repository, pagination, fixture, database reset, and test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] problems/photos
- [ ] API contract
- [ ] database/migrations

Important rules to preserve:

```text
Repositories only access data.
Services own business validation; repositories must not become workflow orchestrators.
All business records belong to an account.
Cross-account access is forbidden.
Problems and observations are historical records and should remain readable if the target is later archived.
Problem photo metadata is database truth, but Phase 15 must not create photo metadata.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 15.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] repository methods
- [ ] DTO/read-model support
- [ ] pagination/filter handling
- [ ] transaction-aware optional database handle where local patterns require it
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] account scoping enforced backend-side
- [ ] no storage upload or signed URL behavior in Phase 15

---

# API Contract

Endpoints supported by repository data:

```text
GET /api/v1/problems
POST /api/v1/problems
GET /api/v1/problems/:problemId
PATCH /api/v1/problems/:problemId
```

Repository read models must support canonical list/detail response fields without returning raw table-specific target names to controllers.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors where repository-level not-found behavior is locally tested
- [ ] account scoping
- [ ] API response shape through DTO/read-model mapping where local tests support it
- [ ] edge cases

Specific test cases:

1. Account A list does not include account B problem/observation rows.
2. List filters by `placeId`, `type`, `status`, `category`, `from`, and `to`.
3. Detail lookup returns null/not found for another account's problem.
4. Create persists all canonical metadata fields, including nullable `category`, `severity`, and `linkedActivityId`.
5. Update changes only allowed metadata/status fields and remains account-scoped.
6. Target label read model works for supported target types and does not fail historical reads when a target is archived.
7. `photosCount` is contract-compatible and no photo metadata is created by repository create/update methods.

---

# Acceptance Criteria

The task is complete when:

- [ ] ProblemsRepository supports create/list/detail/update metadata operations.
- [ ] Repository reads and writes are account-scoped.
- [ ] List/detail read models support canonical DTO mapping.
- [ ] Historical problem reads tolerate archived targets.
- [ ] Repository tests pass where configured.
- [ ] No service workflow, route behavior, storage, AI, frontend, or schema scope slipped in.
