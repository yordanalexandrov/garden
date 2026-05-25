# Implementation Task - Phase 15 Step 6: Verification and PR Readiness

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
Verify Phase 15 backend problems and observations metadata API end-to-end, update implementation status, and prepare a focused PR for review without marking Phase 16 or later complete.
```

## Branch

Use branch:

```text
feature/backend-problems
```

---

# Scope

Implement only:

- [ ] Review all Phase 15 task acceptance criteria from Steps 1-5.
- [ ] Inspect the final diff for unrelated frontend, storage, photo upload, AI, weather, push, task/calendar, inventory, product, deployment, provider, MCP, or schema changes.
- [ ] Verify `GET /api/v1/problems` supports canonical filters, pagination envelope, target labels where available, and `photosCount`.
- [ ] Verify `POST /api/v1/problems` creates metadata-only problems and observations without photo/storage side effects.
- [ ] Verify `GET /api/v1/problems/:problemId` returns account-scoped detail with contract-compatible empty photo behavior until Phase 16.
- [ ] Verify `PATCH /api/v1/problems/:problemId` updates only allowed metadata/status fields.
- [ ] Verify target/place/account validation is service-owned and enforced for every create/update path.
- [ ] Verify optional linked activity validation is account/place-safe.
- [ ] Verify no route or code path implements `POST /api/v1/problems/:problemId/photos`.
- [ ] Verify no direct Supabase Storage or service-role credential usage was introduced.
- [ ] Run required checks and record exact results.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 15 implemented only after the implementation tasks are complete and checks are recorded.
- [ ] Prepare a focused PR description with Summary, Scope, Domain rules preserved, Tests/checks run, Deferred work, and Review focus.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
docs/gardening-helper-implementation-status-handoff.md
backend/src/modules/problems/
backend/src/app/routes.ts
backend/test/problems/
```

---

# Out of Scope

Do not implement:

- [ ] New Phase 15 behavior beyond small verification fixes.
- [ ] `POST /api/v1/problems/:problemId/photos`.
- [ ] Problem photo metadata creation, storage uploads, signed URLs, or `StoragePort` changes.
- [ ] Frontend problem/photo UI or API services.
- [ ] AI problem assist.
- [ ] Activity correction, treatment-linking workflows beyond optional linked activity validation, task creation, inventory, weather, push, worker, deployment, or MCP behavior.
- [ ] Status changes for Phase 16 or later phases unless they are directly true in the current branch and required by project status rules.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 18
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-implementation-status-handoff.md`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] All prior files in `docs/implementation-phases/phase-15/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All backend files changed in Phase 15

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
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Frontend never talks directly to the database.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Problems and observations are historical records.
Problems and observations require place context.
Targets must belong to the same place/account.
Linked treatment/activity is optional and account/place validated.
Problem creation works without photos.
Observation photo upload is not supported in v1.
Photo upload/storage remains deferred to Phase 16.
AI problem assist remains deferred.
MCP tools are not a privileged bypass channel.
```

---

# MCP Impact

This task:

- [ ] has no direct MCP tool impact

MCP tools affected:

```text
None.
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

Final verification must confirm:

```text
Request and response shapes match canonical section 18.
List responses use canonical pagination envelopes.
Mutation/detail responses use canonical data envelopes.
Backend error envelopes are canonical.
No request body accepts trusted accountId.
No Phase 15 endpoint handles multipart upload or storage.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Re-run or review all Phase 15 Step 1-5 tests.
2. Verify account A/account B isolation across list/detail/update.
3. Verify target/place and linked activity rejection paths.
4. Verify problem and observation happy paths.
5. Verify no photo/storage behavior was introduced.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 15 implementation is complete according to the top-level spec and Step 1-5 task docs.
- [ ] API contract, domain rules, and account scoping are preserved.
- [ ] Required backend checks are run and results are recorded.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` is updated only for true Phase 15 implementation progress.
- [ ] PR description clearly states deferred Phase 16 photo/storage work.
- [ ] No unrelated phase is marked complete.

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
