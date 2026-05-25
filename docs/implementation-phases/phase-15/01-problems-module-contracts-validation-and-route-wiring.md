# Implementation Task - Phase 15 Step 1: Problems Module Contracts, Validation, and Route Wiring

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
Prepare the backend problems module contracts, validation schemas, DTO mapping, and narrow route wiring needed for Phase 15 Problems and Observations metadata APIs.
```

## Branch

Use branch:

```text
feature/backend-problems
```

---

# Scope

Implement only:

- [ ] Inspect existing backend app, route registration, auth actor context, database client, transaction abstraction, envelope helpers, validation helpers, activities read patterns, target lookup/resolver helpers, and test helper patterns.
- [ ] Confirm Phase 6 growing-structure APIs and Phase 11 target lookup/resolver behavior exist before implementing problem target validation; if Phase 11 is absent, stop and document the prerequisite gap.
- [ ] Create `backend/src/modules/problems/` structure following existing backend module conventions.
- [ ] Define problem domain/input/filter/DTO types for list, create, detail, update, linked activity summary, target label summary, and pagination.
- [ ] Define canonical enum constants for `ProblemType`, `ProblemStatus`, `ProblemCategory`, and supported `TargetType` values.
- [ ] Define validation schemas for UUID params, list query filters, create payloads, and patch payloads.
- [ ] Reject any photo, file, storage key, signed URL, or `problem_photos` metadata fields in Phase 15 create/update payloads.
- [ ] Define DTO mapping helpers that convert database snake_case fields to canonical API camelCase fields.
- [ ] Add route registration and dependency wiring for the problems route module without opening database connections at import time.
- [ ] Preserve `GET /api/v1/health` as unauthenticated and keep test-only routes isolated.
- [ ] Add focused validation/schema/DTO tests where existing test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/problems/problems.types.ts
backend/src/modules/problems/problems.validation.ts
backend/src/modules/problems/problems.dto.ts
backend/src/modules/problems/problems.routes.ts
backend/src/modules/problems/problems.service.ts
backend/src/modules/problems/problems.repository.ts
backend/src/app/routes.ts
backend/test/problems/
```

---

# Out of Scope

Do not implement:

- [ ] Repository queries or writes beyond interface stubs needed for wiring.
- [ ] Service workflows beyond interface stubs needed for later steps.
- [ ] Public endpoint behavior beyond route registration returning existing not-implemented behavior if that is the local pattern.
- [ ] `POST /api/v1/problems/:problemId/photos`.
- [ ] Problem photo metadata creation, storage upload, signed URL generation, or `StoragePort` changes.
- [ ] Frontend pages, frontend API services, AI problem assist, weather, push, worker, deployment, or MCP tools.
- [ ] Activity correction or treatment linking workflows beyond optional linked activity field typing.
- [ ] Schema changes or migrations.
- [ ] Direct Supabase SDK usage inside domain services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` section 13
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 18
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` ProblemsRepository and create problem sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing `backend/src/app/`, `backend/src/db/`, `backend/src/shared/`, `backend/src/modules/auth/`, `backend/src/modules/activities/`, target helper modules, and backend test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] problems/photos
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Problems and observations are historical records.
Problems and observations require place context.
Problem/observation target must belong to the same place and account.
Linked treatment/activity is optional and must be account/place-safe when supplied.
Photos are supported only for problems in v1, but photo upload and metadata are deferred to Phase 16.
The Fastify API remains the application data API under /api/v1.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 15. Future problem MCP tools must use backend services/API and must not insert problem rows directly.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend route registration
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
- [ ] no storage upload or signed URL behavior in Phase 15

---

# API Contract

Endpoints involved:

```text
GET /api/v1/problems
POST /api/v1/problems
GET /api/v1/problems/:problemId
PATCH /api/v1/problems/:problemId
```

DTOs must support:

```text
Problem list item: id, type, placeId, targetType, targetId, targetLabel, title, category, severity, status, observedAt, photosCount.
Problem create request: type, placeId, targetType, targetId, title, description, category, severity, status, observedAt, linkedActivityId.
Problem detail: id, type, placeId, targetType, targetId, title, description, category, severity, status, observedAt, photos, linkedActivity.
Problem patch request: editable metadata/status fields only.
```

Phase 15 must not expose or implement `POST /api/v1/problems/:problemId/photos`.

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] API response shape
- [ ] route registration
- [ ] DTO mapping

Specific test cases:

1. Create payload rejects missing `type`, `placeId`, `targetType`, `targetId`, `title`, `description`, or `observedAt` where required by local validation conventions.
2. Create payload rejects invalid problem type/status/category/target type.
3. Create/update payload rejects photo/storage fields in Phase 15.
4. List query supports canonical filters and pagination defaults/limits.
5. DTO mapping emits canonical camelCase fields and never leaks raw database column names.

---

# Acceptance Criteria

The task is complete when:

- [ ] Problems module contracts and validation exist.
- [ ] Problems routes are registered according to local backend conventions.
- [ ] Controllers/handlers remain thin.
- [ ] Photo/storage scope is explicitly rejected or absent.
- [ ] Focused validation/DTO tests pass where configured.
- [ ] No backend workflow, repository write, frontend, storage, AI, or schema scope slipped in.
