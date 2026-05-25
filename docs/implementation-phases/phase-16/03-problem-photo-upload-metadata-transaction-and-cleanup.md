# Implementation Task - Phase 16 Step 3: Problem Photo Upload, Metadata Transaction, and Cleanup

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
Implement the account-scoped problem photo upload service workflow, problem_photos metadata persistence, and cleanup behavior for upload/metadata failure boundaries.
```

## Branch

Use branch:

```text
feature/backend-problem-photos
```

---

# Scope

Implement only:

- [ ] Inspect existing problems repository/service, transaction abstraction, audit/error helpers, database row mapping, and Phase 15 tests.
- [ ] Add repository method(s) for `problem_photos` metadata creation and photo listing if not already present.
- [ ] Add a service method for uploading a photo to an existing problem.
- [ ] Lookup the problem by authenticated account before any metadata insert.
- [ ] Reject inaccessible problems with the existing account-scope not-found/forbidden convention.
- [ ] Reject photo upload when the record has `type = observation` with `BUSINESS_RULE_VIOLATION`.
- [ ] Upload the validated file through `StoragePort.uploadProblemPhoto`.
- [ ] Persist `problem_photos` metadata in a transaction after successful storage upload.
- [ ] Store metadata only: storage key, original filename, MIME type, file size, and dimensions if already available through the validation/upload result.
- [ ] Return canonical `{ data: { id, storageKey } }` from the route after service success.
- [ ] If storage upload fails, return `EXTERNAL_SERVICE_ERROR` and do not create metadata.
- [ ] If metadata/audit transaction fails after storage succeeds, call `StoragePort.deleteObject` for cleanup or document a precise manual/job cleanup path in code comments/docs following project conventions.
- [ ] Ensure cleanup failure does not hide the original metadata failure, but is logged without secrets if logging exists.
- [ ] Add focused service/repository/API tests for happy path, observation rejection, storage failure, metadata failure, and cleanup behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/problems/problems.service.ts
backend/src/modules/problems/problems.repository.ts
backend/src/modules/problems/problem-photo.dto.ts
backend/src/modules/problems/problems.types.ts
backend/test/problems/
```

---

# Out of Scope

Do not implement:

- [ ] Multipart parser setup or route validation beyond using Step 2 output.
- [ ] Problem detail signed/protected URL mapping; that belongs to Step 4.
- [ ] Observation photos.
- [ ] Frontend uploader or frontend storage calls.
- [ ] Public bucket listing or permanent public URLs.
- [ ] Image processing beyond metadata already available.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.
- [ ] AI image analysis or problem-assist behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 13 and 20
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 18.3, 28.3, and 28.4
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` sections 6.17, 6.18, 8.10, and account-scope sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` sections 6.11, 7.1, and 9.3
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- [ ] `docs/implementation-phases/phase-16/01-storage-port-config-and-adapters.md`
- [ ] `docs/implementation-phases/phase-16/02-multipart-photo-route-and-file-validation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing problem, transaction, repository, audit, error, and storage adapter files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] problems/photos
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
Photos are supported only for problems in v1.
Problem photo metadata is database truth.
Database stores metadata, not image binary.
Object storage is behind backend abstraction.
Account scoping is mandatory before upload/metadata.
Supabase service role key is backend-only.
Orphaned uploads should be cleanable.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 16. Future MCP photo tools must call backend services/API and must preserve account scope, auditability, and storage boundaries.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend service method
- [ ] repository methods
- [ ] transaction handling
- [ ] provider adapter through port
- [ ] tests
- [ ] docs/update notes only if cleanup strategy is documented outside code

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side before upload and metadata insert
- [ ] Supabase Storage used through `StoragePort`
- [ ] no public bucket listing

---

# API Contract

Endpoints involved:

```text
POST /api/v1/problems/:problemId/photos
```

Request/response must follow:

- Upload content type: `multipart/form-data`
- Field: `file`
- Success response: `{ "data": { "id": "uuid", "storageKey": "problems/uuid/photo.jpg" } }` or compatible canonical extension
- Observation upload returns `BUSINESS_RULE_VIOLATION`
- Storage provider failure returns `EXTERNAL_SERVICE_ERROR`
- Inaccessible problem returns the existing canonical `NOT_FOUND` or `FORBIDDEN` convention

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation/business errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Valid image upload to `type = problem` calls `StoragePort.uploadProblemPhoto`, creates exactly one `problem_photos` row, and returns photo ID plus storage key.
2. Upload to `type = observation` is rejected with `BUSINESS_RULE_VIOLATION` and does not call storage.
3. Account A cannot upload a photo to Account B problem.
4. Storage upload failure returns `EXTERNAL_SERVICE_ERROR` and creates no metadata.
5. Metadata transaction failure after upload calls `StoragePort.deleteObject` or records the documented cleanup path.
6. Metadata transaction failure does not leave a committed `problem_photos` row.
7. Repository stores metadata fields and never stores image binary.

---

# Acceptance Criteria

The task is complete when:

- [ ] Upload service workflow is account-scoped before storage/metadata effects.
- [ ] Observation photo upload is rejected and tested.
- [ ] Metadata is persisted in `problem_photos` only after storage succeeds.
- [ ] Metadata finalization is transactional.
- [ ] Upload/metadata failure cleanup behavior is implemented or precisely documented.
- [ ] No problem detail URL mapping, frontend, schema redesign, public URL construction, or AI work is included.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm test -- problems
npm run test:db -- problems
```

If these commands differ in the existing project, use the nearest existing backend typecheck and focused problem/storage test commands. Record exact commands and results.
