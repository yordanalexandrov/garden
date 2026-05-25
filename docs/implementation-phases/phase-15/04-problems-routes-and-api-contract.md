# Implementation Task - Phase 15 Step 4: Problems Routes and API Contract

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
Expose the Phase 15 Problems and Observations metadata API routes with canonical request validation, response envelopes, and error behavior.
```

## Branch

Use branch:

```text
feature/backend-problems
```

---

# Scope

Implement only:

- [ ] Inspect existing route/controller patterns for protected routes, validation, pagination, canonical envelopes, dependency injection, and error mapping.
- [ ] Implement `GET /api/v1/problems` with canonical filters and pagination envelope.
- [ ] Implement `POST /api/v1/problems` for metadata-only problem/observation creation.
- [ ] Implement `GET /api/v1/problems/:problemId` for account-scoped detail.
- [ ] Implement `PATCH /api/v1/problems/:problemId` for allowed metadata/status updates.
- [ ] Ensure all handlers require authenticated actor context through the existing auth boundary.
- [ ] Keep handlers/controllers thin: validate request shape, call service, return canonical envelope.
- [ ] Return list DTOs with `targetLabel` where available and `photosCount`.
- [ ] Return detail DTOs with `photos: []` or equivalent contract-compatible empty photo metadata until Phase 16.
- [ ] Do not register or stub `POST /api/v1/problems/:problemId/photos` in Phase 15 unless the local router needs an explicit 404/default behavior that already exists globally.
- [ ] Add API/route tests for happy paths, canonical envelopes, filter behavior, validation errors, and not-found/account-scope behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/problems/problems.routes.ts
backend/src/modules/problems/problems.validation.ts
backend/src/modules/problems/problems.dto.ts
backend/src/app/routes.ts
backend/test/problems/problems.routes.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] `POST /api/v1/problems/:problemId/photos`.
- [ ] Multipart handling, file upload validation, storage writes, signed URLs, or `StoragePort`.
- [ ] Problem photo metadata creation.
- [ ] Frontend pages or frontend API services.
- [ ] AI problem assist.
- [ ] Activity correction, activity creation from problem, task creation, inventory, weather, push, worker, deployment, or MCP behavior.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 4 and 13
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 2, 3, 4, 5.8-5.10, 18, and 27
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` API contract and problem cases
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` API examples and problem endpoint section
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] Existing route, validation, envelope, error, auth helper, and API test files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] problems/photos
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Frontend never talks directly to the database.
Backend validates Supabase Auth JWTs through AuthPort.
Backend derives authenticated user/account context server-side.
Problems and observations require place context.
Problem/observation targets must belong to the same place and account.
Photos are deferred to Phase 16 and must not be exposed as upload/storage behavior in Phase 15.
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

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend service method calls
- [ ] DTO response mapping
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
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Storage used through `StoragePort` only in later photo phase
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

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` section 18.
- Success responses use `{ "data": ... }`.
- List responses use `{ "data": { "items": [], "page": 1, "pageSize": 20, "total": 0 } }`.
- Errors use the canonical error envelope.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. `POST /api/v1/problems` creates a problem metadata record and returns `{ data: { id } }`.
2. `POST /api/v1/problems` creates an observation metadata record and returns `{ data: { id } }`.
3. `GET /api/v1/problems` returns paginated canonical envelope with filters.
4. `GET /api/v1/problems/:problemId` returns detail with `photos: []` or equivalent Phase 15-compatible empty photo data.
5. `PATCH /api/v1/problems/:problemId` updates allowed fields and returns canonical response.
6. Invalid enum, missing required field, invalid UUID, and photo/storage fields return canonical validation errors.
7. Account A cannot list/get/update account B problem records.
8. Route tests confirm no Phase 15 photo upload route behavior was added.

---

# Acceptance Criteria

The task is complete when:

- [ ] Four Phase 15 problem metadata endpoints are implemented.
- [ ] Routes use authenticated actor context and canonical envelopes.
- [ ] List/detail DTOs are contract-compatible.
- [ ] Photo upload/storage remains absent.
- [ ] API route tests pass where configured.
- [ ] No frontend, storage, AI, activity side-effect, task, inventory, weather, push, deployment, or MCP scope slipped in.
