# Implementation Task - Phase 16 Step 6: Verification and PR Readiness

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
Verify Phase 16 backend problem photo storage end to end, update implementation status, and prepare a focused PR for review without marking frontend or later phases complete.
```

## Branch

Use branch:

```text
feature/backend-problem-photos
```

---

# Scope

Implement only:

- [ ] Review all Phase 16 task acceptance criteria from Steps 1-5.
- [ ] Inspect the final diff for unrelated frontend uploader, AI, weather, push, task/calendar, activity, inventory, deployment, schema, or MCP changes.
- [ ] Verify `StoragePort` exists and is the only business storage boundary.
- [ ] Verify deterministic test/dev storage adapter exists and automated tests do not require real Supabase Storage credentials.
- [ ] Verify Supabase Storage adapter exists or production adapter status is documented.
- [ ] Verify `POST /api/v1/problems/:problemId/photos` accepts valid image multipart uploads and rejects invalid inputs.
- [ ] Verify photo upload is rejected for observations.
- [ ] Verify account scoping is enforced before storage upload and metadata creation.
- [ ] Verify photo metadata is persisted in `problem_photos` and image binary is not stored in Postgres.
- [ ] Verify problem detail returns controlled signed/protected photo URLs through `StoragePort` or a protected backend URL helper.
- [ ] Verify cleanup behavior is implemented or documented for upload success followed by metadata failure.
- [ ] Verify no service role key or signed URL secret appears in frontend code, public config, logs, snapshots, or client-visible errors.
- [ ] Verify no public bucket listing or direct public bucket URL construction was introduced.
- [ ] Run required checks and record exact results.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 16 implemented only after implementation tasks are complete and checks are recorded.
- [ ] Prepare a focused PR description with Summary, Scope, Domain rules preserved, Tests/checks run, Deferred work, and Review focus.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
docs/gardening-helper-implementation-status-handoff.md
backend/src/modules/problems/
backend/src/modules/files/
backend/src/config/
backend/test/problems/
backend/test/files/
backend/test/security/
```

---

# Out of Scope

Do not implement:

- [ ] New Phase 16 behavior beyond small verification fixes.
- [ ] Frontend uploader, frontend problem pages, or frontend photo display.
- [ ] Observation photos.
- [ ] AI image analysis or problem-assist behavior.
- [ ] Activity, inventory, task/calendar, weather, push, deployment, or MCP behavior.
- [ ] Public bucket listing or direct browser storage access.
- [ ] Broad refactors unrelated to Phase 16.
- [ ] Status changes for Phase 15, Phase 17, or later phases unless they are directly true in the current branch and required by project status rules.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 13 and 20
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 18.3, 18.4, 28.3, and 28.4
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` sections 6.11, 7.1, and 9.3
- [ ] `docs/gardening-helper-implementation-status-handoff.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- [ ] All prior files in `docs/implementation-phases/phase-16/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All backend files changed in Phase 16.

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
Database stores metadata, not image binary.
Supabase service role key is backend-only.
Orphaned uploads should be cleanable.
Frontend must not use direct storage access for business file flows.
MCP tools are not a privileged bypass channel.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 16. Future MCP problem/photo tools must call backend services/API and must not bypass StoragePort, account scoping, or auditability.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] docs/update notes
- [ ] verification fixes only if needed
- [ ] PR readiness review

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

Final verification must confirm:

```text
Multipart upload uses field file.
Upload success returns canonical data envelope with id and storageKey.
Problem detail photo items include id, url, and mimeType.
Errors use canonical envelopes.
Problem-only photo rule is enforced.
Account scoping is enforced before upload and URL generation.
Storage provider failures map to EXTERNAL_SERVICE_ERROR.
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

1. Valid problem photo upload works through backend API.
2. Observation photo upload is rejected.
3. Non-image and oversized files are rejected.
4. Storage failure creates no metadata.
5. Metadata failure cleanup behavior is covered or documented.
6. Problem detail returns controlled photo URLs.
7. Account A cannot upload to or read photo URLs for Account B problem.
8. Service role key and direct storage access boundaries are covered by tests/static checks.

---

# Acceptance Criteria

The task is complete when:

- [ ] All Phase 16 steps are complete according to their acceptance criteria.
- [ ] Backend checks and focused tests have been run and recorded.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` accurately marks Phase 16 implemented only if implementation is actually complete.
- [ ] PR description identifies storage boundary, file validation, account scoping, metadata transaction, cleanup behavior, checks run, and deferred work.
- [ ] No frontend uploader, observation photos, AI image behavior, public bucket listing, direct frontend storage access, or unrelated workflow changes are included.

---

# Commands to Run

From the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

From the frontend package root, run:

```bash
npm run check:frontend-boundaries
```

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.

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
