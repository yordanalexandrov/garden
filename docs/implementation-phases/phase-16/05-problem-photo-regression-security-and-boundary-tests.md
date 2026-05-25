# Implementation Task - Phase 16 Step 5: Problem Photo Regression, Security, and Boundary Tests

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
Add focused regression, security, static boundary, and database guard tests for the completed Phase 16 problem photo storage behavior.
```

## Branch

Use branch:

```text
feature/backend-problem-photos
```

---

# Scope

Implement only:

- [ ] Review Phase 16 Steps 1-4 acceptance criteria and fill any missing high-risk test gaps.
- [ ] Add account A/account B multipart upload tests using deterministic storage adapter.
- [ ] Add problem vs observation upload rejection tests.
- [ ] Add storage failure and metadata failure rollback/cleanup tests.
- [ ] Add problem detail URL mapping tests with photos and without photos.
- [ ] Add database guard or repository tests for `problem_photos` consistency if the project has guard-test patterns.
- [ ] Add static/security boundary checks if existing project has a static-check pattern.
- [ ] Verify no service role key appears in frontend files, public env files, logs, snapshots, or client-visible test fixtures.
- [ ] Verify Supabase Storage SDK usage is confined to the adapter and not used in domain services/controllers.
- [ ] Verify no direct bucket URL construction in domain services, DTO mappers, or frontend code.
- [ ] Verify no direct frontend Supabase Storage calls or business storage config were introduced.
- [ ] Verify no image binary is stored in Postgres.
- [ ] Keep tests deterministic and independent of real Supabase Storage credentials.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/test/problems/
backend/test/files/
backend/test/security/
backend/test/db/
scripts/
```

---

# Out of Scope

Do not implement:

- [ ] New product behavior beyond small fixes required to make Phase 16 tests pass.
- [ ] Frontend uploader or problem pages.
- [ ] Observation photos.
- [ ] AI image analysis or problem-assist behavior.
- [ ] Public bucket URLs or bucket listing.
- [ ] Advanced image processing.
- [ ] Schema redesign.
- [ ] Broad refactors unrelated to testability of Phase 16.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 13 and 20
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 18.3, 18.4, 28.3, and 28.4
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` problem photo, multipart, account scoping, and security sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` sections 6.11, 7.1, and 9.3
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- [ ] All prior files in `docs/implementation-phases/phase-16/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend test helper, fixture, static check, route test, storage test, and database guard files touched by the task.

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
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Photos are supported only for problems in v1.
Problem photo metadata is database truth.
Object storage is behind backend abstraction.
File access must be controlled.
Supabase service role key is backend-only.
Frontend never talks directly to the database or storage for business flows.
Account scoping is mandatory.
Orphaned uploads should be cleanable.
MCP tools are not a privileged bypass channel.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 16. Boundary tests should preserve the rule that future MCP tools call backend services/API rather than storage/database directly.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] static/boundary checks if the project has an existing pattern
- [ ] docs/update notes only if a cleanup or provider status note is required

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
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Storage used through `StoragePort`
- [ ] no public bucket listing
- [ ] no direct frontend storage business calls

---

# API Contract

Endpoints involved:

```text
POST /api/v1/problems/:problemId/photos
GET /api/v1/problems/:problemId
```

Regression tests must confirm:

```text
Multipart upload uses file field.
Mutation response includes photo id and storageKey.
Detail response photo item includes id, url, and mimeType.
Canonical success/error envelopes are preserved.
Non-image, oversized, observation, inaccessible, storage failure, and metadata failure cases use canonical errors.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] security/static boundaries
- [ ] edge cases

Specific test cases:

1. Account A valid image upload to Account A problem succeeds and creates metadata.
2. Account A upload to Account B problem is rejected before metadata creation.
3. Upload to observation is rejected and does not call storage.
4. Non-image and oversized files are rejected.
5. Storage upload failure creates no metadata.
6. Metadata failure after upload triggers cleanup or records the documented cleanup path.
7. Problem detail returns controlled URLs and never direct bucket listing data.
8. Supabase service role key is absent from frontend code/env/build config and client-visible errors.
9. Supabase Storage SDK usage is confined to adapter files.
10. No direct public bucket URL construction exists in domain service/DTO/frontend code.
11. Guard/repository tests prevent photo metadata for observations where database guard coverage exists.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 16 high-risk behavior is covered by focused tests.
- [ ] Tests do not require real Supabase Storage credentials.
- [ ] Account scoping, observation rejection, file validation, cleanup behavior, URL access control, and secret boundaries are covered.
- [ ] No frontend feature work, observation photos, AI, public URLs, or schema redesign is introduced.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test -- problems
npm test -- files
npm run test:db -- problems
npm run check:frontend-boundaries
```

If these commands differ in the existing project, use the nearest existing backend typecheck, lint, focused test, database test, and boundary-check commands. Record exact commands and results.
