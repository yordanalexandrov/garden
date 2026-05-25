# Implementation Task - Phase 11 Step 6: Phase 11 Verification and PR Readiness

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
Complete Phase 11 verification, confirm target resolver boundaries, run backend checks, update required docs, and prepare the PR description for the backend Target Resolver.
```

## Branch

Use branch:

```text
feature/backend-target-resolver
```

---

# Scope

Implement only:

- [ ] Inspect all Phase 11 implementation files for consistency with the phase spec and task files.
- [ ] Confirm `TargetResolver` supports every canonical `TargetScopeType`.
- [ ] Confirm resolver returns concrete canonical target refs and optional summaries only as read models.
- [ ] Confirm empty resolved target sets are rejected.
- [ ] Confirm all selected IDs are validated as a complete set with no partial success.
- [ ] Confirm all-beds and all-perennials resolution is scoped to one place.
- [ ] Confirm cross-account targets are rejected.
- [ ] Confirm cross-place mixed targeting is rejected.
- [ ] Confirm archived targets are excluded or rejected for new workflows.
- [ ] Confirm selected yearly plantings and persistent bed plants derive place through bed.
- [ ] Confirm resolver can run inside an existing transaction.
- [ ] Confirm controllers do not contain target resolution business logic.
- [ ] Confirm no activity creation, task creation, target persistence, frontend selector, schema change, provider integration, deployment work, or MCP tool slipped in.
- [ ] Run all required backend checks.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` only if Phase 11 implementation progress changes; do not mark complete until this phase is fully implemented and verified.
- [ ] Prepare the PR description using the Phase 11 expected PR summary.

Expected paths to review:

```text
backend/src/modules/targets/
backend/src/modules/activities/
backend/src/modules/tasks/
backend/src/modules/places/
backend/src/modules/perennials/
backend/src/modules/beds/
backend/src/modules/plantings/
backend/src/db/
backend/src/shared/
backend/test/targets/
backend/test/helpers/
docs/implementation-phases/phase-11-backend-target-resolver.md
docs/implementation-phases/phase-11/
docs/gardening-helper-implementation-status-handoff.md
```

---

# Out of Scope

Do not implement:

- [ ] New domain features beyond fixing Phase 11 verification gaps.
- [ ] Activity creation, activity target persistence, product usage, inventory consumption, quarantine, suggested task generation, task creation, task target persistence, reminders, correction flow, or activity/task APIs.
- [ ] Frontend work.
- [ ] AI, weather, storage, push, worker, deployment, notifications, or MCP tools.
- [ ] Schema redesign.
- [ ] Broad refactors unrelated to Phase 11.

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
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] All prior files in `docs/implementation-phases/phase-11/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All backend source, test, config, package, and docs files changed in Phase 11.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] tasks/reminders
- [ ] API contract
- [ ] auth/session boundary
- [ ] database/migrations
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Activity/task targets must resolve to concrete target rows.
All-beds/all-perennials are scoped to one place.
Cross-place mixed targeting is not allowed in v1.
Resolved targets must not be empty.
All target ownership is validated backend-side.
Target labels are read models.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 11.
```

Required MCP documentation updates:

```text
None, unless implementation notes explicitly document future MCP usage of the backend resolver. Do not add target MCP tools in Phase 11.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] docs/update notes if needed
- [ ] PR description
- [ ] verification checklist
- [ ] static/scope checks

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

---

# API Contract

Endpoints involved:

```text
None.
```

Final verification must confirm:

```text
TargetType values match the canonical API contract.
TargetScopeType values match the canonical API contract.
TargetSelection fields match the canonical API contract.
Resolved target refs use targetType and targetId.
Optional target summaries use targetType, targetId, label, and placeId.
Future activity/task APIs can reuse the resolver without duplicating target logic.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction behavior
- [ ] edge cases
- [ ] static/scope regression

Specific test cases:

1. Validation/DTO tests from Step 1 pass.
2. Repository lookup tests from Step 2 pass.
3. Whole-place and whole-group resolver tests from Step 3 pass.
4. Selected-scope resolver tests from Step 4 pass.
5. Regression tests from Step 5 pass.
6. No Phase 11 tests require activity/task target persistence.

---

# Acceptance Criteria

The task is complete when:

- [ ] `TargetResolver` exists and supports every canonical target scope.
- [ ] Resolver returns concrete target refs and optional read summaries.
- [ ] Empty, missing, archived, cross-account, cross-place, and scope/selection mismatch paths are covered by tests.
- [ ] Resolver can run inside a transaction.
- [ ] Controllers do not own target resolution.
- [ ] No activity/task persistence, frontend selector, schema, provider, deployment, or MCP work is included.
- [ ] Required checks pass or exact blockers are documented.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` is updated only for actual Phase 11 implementation progress.
- [ ] PR description is complete.

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

If any command does not exist or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
