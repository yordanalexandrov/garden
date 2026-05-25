# Implementation Task - Phase 14 Step 8: Phase 14 Verification and PR Readiness

## Role

You are the **Implementation Agent**.

Use:

- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Perform final Phase 14 verification, update implementation status, commit focused changes, and open the Phase 14 frontend create activity PR.
```

## Branch

Use branch:

```text
feature/frontend-create-activity
```

---

# Scope

Implement only:

- [ ] Review the full Phase 14 diff against `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`.
- [ ] Confirm `/activities`, `/activities/new`, and `/activities/:activityId` are wired and render as expected.
- [ ] Confirm create activity supports all canonical target scopes.
- [ ] Confirm product usage rows use canonical request fields.
- [ ] Confirm frontend displays backend-returned `inventoryEffects`, `quarantinePeriods`, `suggestedTasks`, and `warnings`.
- [ ] Confirm backend errors do not clear user input.
- [ ] Confirm no activity correction, weather rain prompt, task confirmation, AI, problem/photo, provider, deployment, or MCP scope slipped in.
- [ ] Confirm no frontend target-resolution truth, inventory allocation, quarantine generation, suggested-task generation, reminder creation, direct table access, or trusted `accountId` exists.
- [ ] Run configured frontend verification commands and static/boundary checks.
- [ ] Perform manual smoke for watering and treatment create flows if the backend/dev environment is available; otherwise document the exact blocker.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 14 implemented only after implementation is complete and checks have been run.
- [ ] Commit focused changes.
- [ ] Open a PR with the summary, tests, deferred work, and review focus below.

---

# Out of Scope

Do not implement:

- [ ] New feature work beyond fixes required to satisfy Phase 14 acceptance.
- [ ] Backend transaction behavior or schema changes unless a tiny compatibility fix is documented.
- [ ] Future phase scope.
- [ ] Hidden direct database/storage access or provider integrations.

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
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- [ ] `docs/implementation-phases/phase-14/README.md`
- [ ] All Phase 14 step files
- [ ] `docs/gardening-helper-implementation-status-handoff.md`

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Frontend submits user intent, not resolved business truth.
Backend remains responsible for target resolution, inventory allocation, quarantine, suggested tasks, account scoping, and business validation.
Activity creation with product usage is transactional backend-side.
Suggested tasks are not planned tasks.
Warnings returned by backend must be shown.
Frontend must not access application tables directly or expose backend-only secrets.
```

---

# MCP Impact

This task:

- [ ] has no MCP impact

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
- [ ] final verification
- [ ] implementation status handoff update
- [ ] commit
- [ ] pull request

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] no trusted `accountId` in request body
- [ ] no target resolution truth, FEFO allocation, stock mutation, quarantine generation, suggested-task generation, or reminder creation in frontend code

---

# API Contract

Endpoints verified:

```text
GET /api/v1/activities
POST /api/v1/activities
GET /api/v1/activities/:activityId
Supporting selector/list endpoints consumed by Phase 14 components
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Run, from the frontend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also run configured frontend boundary/static checks, including any project scripts for:

```text
no direct Supabase application-table/storage business access
no backend-only frontend secrets
no component-level raw HttpClient API bypass
no trusted accountId in Phase 14 requests
no frontend inventory allocation, target-resolution truth, quarantine generation, suggested-task generation, or reminder creation
```

If any command cannot be run, record the exact command and reason in the PR description.

---

# Acceptance Criteria

The task is complete when:

- [ ] Activities list, detail, and create routes work according to Phase 14.
- [ ] Create activity submits canonical user intent and displays backend side effects.
- [ ] Frontend/backend business boundary is preserved.
- [ ] Tests and configured checks have been run or exact blockers are documented.
- [ ] Implementation status handoff is updated accurately.
- [ ] A focused PR is open.

---

# Expected PR Summary

```md
## Summary
Implemented frontend Activities and Create Activity flow.

## Scope
- Added activities list/detail/create pages.
- Added bulk target selector and product usage form array.
- Added side-effect and warning display after activity creation.

## Domain rules preserved
- Frontend submits user intent, not resolved business truth.
- Backend remains responsible for inventory, quarantine, and suggested tasks.
- Missing rule and warning states are visible.

## Tests
- <commands run and results>

## Deferred work
- Activity correction UI, weather prompts, task confirmation UI, problems/photos, AI, push, storage, provider, deployment, and MCP tools remain deferred.

## Review focus
- Request shape.
- Business logic boundary.
- Mobile create activity usability.
- Side-effect display.
```
