# Implementation Task - Phase 20 Step 8: Phase 20 Verification and PR Readiness

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Verify Phase 20 end to end, update implementation status, and prepare a focused PR.
```

## Branch

Use branch:

```text
feature/frontend-tasks-calendar
```

---

# Scope

Implement only:

- [ ] Review all Phase 20 changes against the top-level Phase 20 spec and source-of-truth documents.
- [ ] Confirm no backend code, migrations, infrastructure, push notification registration, weather rain confirmation, AI pages, or MCP behavior slipped into Phase 20.
- [ ] Confirm dashboard widgets, task actions, calendar views, item legend, filters, read-only quarantine overlays, and error states satisfy the phase acceptance criteria.
- [ ] Confirm suggested tasks remain distinct from planned tasks across dashboard, task detail, and calendar.
- [ ] Confirm task confirmation displays backend-created reminders and frontend never creates reminder payloads or timers.
- [ ] Confirm calendar remains a read-only display and does not mutate tasks, quarantine periods, activities, or weather data.
- [ ] Run required frontend verification commands from the frontend package root.
- [ ] Run any configured frontend boundary/static checks.
- [ ] Run `git diff --check` and review the final diff.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 20 implemented only when implementation is genuinely complete.
- [ ] Commit focused Phase 20 changes.
- [ ] Open a PR with a clear description, tests run, domain rules preserved, deferred work, and review focus.

---

# Out of Scope

Do not implement new feature behavior beyond small fixes needed to satisfy Phase 20 acceptance criteria, backend task/calendar/dashboard behavior, Phase 21 weather backend, Phase 22 weather frontend UX, Phase 24 AI pages, Phase 26 push notifications, Phase 27 deployment work, or schema changes unless separately approved.

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
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] All Phase 20 step files
- [ ] `docs/gardening-helper-implementation-status-handoff.md`
- [ ] Existing package scripts, boundary-check scripts, and final diff

---

# Domain Rules Affected

This task touches account scoping, target resolution, quarantine, tasks/reminders, weather/rain confirmation, frontend forms, API contract, and auth/session boundary.

Important rules to preserve:

```text
Backend owns business logic.
Frontend submits user intent and displays backend results/errors.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks through backend workflows.
Calendar is read-only.
Quarantine is read-only and historical/auditable.
Weather is advisory and does not auto-fail treatments.
Frontend never accesses application tables directly.
Frontend must not expose backend-only secrets or submit trusted accountId.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement tests, docs/update notes, final verification, and PR preparation.

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no direct Storage business calls, no frontend reminder scheduler/timer, no frontend-created reminder payloads, no calendar/quarantine mutation path, and no trusted `accountId`.

---

# API Contract

Endpoints involved:

```text
GET /api/v1/tasks
POST /api/v1/tasks
GET /api/v1/tasks/:taskId
PATCH /api/v1/tasks/:taskId
POST /api/v1/tasks/:taskId/confirm
POST /api/v1/tasks/:taskId/dismiss
POST /api/v1/tasks/:taskId/complete
POST /api/v1/tasks/:taskId/skip
GET /api/v1/calendar
GET /api/v1/dashboard
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Run relevant commands:

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
cd ..
git diff --check
```

If any command does not exist or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.

---

# Acceptance Criteria

- [ ] Dashboard page works and links to full modules.
- [ ] Task list/detail UI works.
- [ ] Suggested task confirm/dismiss works through backend endpoints.
- [ ] Planned task done/skip works through backend endpoints.
- [ ] Confirmed suggested task displays backend-created reminders.
- [ ] Calendar month/agenda UI works.
- [ ] Calendar item types are visually distinct.
- [ ] Quarantine renders as read-only overlay/range.
- [ ] Data refreshes after task mutations.
- [ ] Frontend tests/typecheck/lint/build and boundary checks pass where configured, or failures are documented exactly.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` accurately reflects Phase 20 implementation progress.
- [ ] Final diff contains no unrelated changes.
- [ ] PR description is complete.

---

# PR Requirements

PR description must include Summary, Scope, Domain rules preserved, API changes, Database changes, Tests run, Deferred work, and Review focus.

Suggested PR summary:

```md
## Summary
Implemented frontend Tasks, Calendar, and Dashboard.

## Scope
- Added dashboard widgets.
- Added task detail/actions.
- Added calendar month/agenda views and item legend.

## Domain rules preserved
- Suggested tasks are visually distinct from planned tasks.
- Confirmation/reminder behavior goes through backend.
- Calendar remains a read-only display.

## Tests
- <commands run and results>

## Deferred work
- Push notification registration, weather UX, and AI pages remain deferred.

## Review focus
- Task status UI.
- Calendar item distinction.
- Frontend/backend responsibility boundary.
- Mobile usability.
```
