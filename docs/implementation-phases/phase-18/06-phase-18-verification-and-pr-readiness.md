# Implementation Task - Phase 18 Step 6: Phase 18 Verification and PR Readiness

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. This step verifies the completed Phase 18 implementation and prepares a reviewable PR.

---

# Task

## Goal

Verify Phase 18 end to end and prepare the implementation PR:

```text
Task lifecycle APIs, service-owned reminder workflows, account/target scoping, regression tests, status handoff update, commit, and PR.
```

## Branch

Use branch:

```text
feature/backend-tasks-reminders
```

---

# Scope

Implement only:

- [ ] Review the full Phase 18 diff against source documents and prior step docs.
- [ ] Confirm all Phase 18 endpoints exist and follow canonical request/response/error envelopes.
- [ ] Confirm controllers are thin and all business decisions live in `TasksService`.
- [ ] Confirm repositories remain data-access-only.
- [ ] Confirm manual task create/update uses `TargetResolver` and concrete task target rows.
- [ ] Confirm suggested task confirmation is transactional and creates exactly day-before and same-day reminders.
- [ ] Confirm suggested tasks have no reminders.
- [ ] Confirm manual planned task creation creates reminders transactionally.
- [ ] Confirm complete sets done/completed timestamp and does not create an activity.
- [ ] Confirm dismiss/skip behavior preserves historical task records.
- [ ] Confirm account scoping and cross-place target rules are tested.
- [ ] Confirm no push delivery, calendar/dashboard, frontend, weather, AI, MCP mutation tool, or schema scope slipped in.
- [ ] Run the required backend verification commands and any obvious focused docs/static checks.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` only after implementation is complete, marking Phase 18 implemented and setting the next phase/step.
- [ ] Commit focused Phase 18 implementation changes.
- [ ] Open a PR with a clear description.

---

# Out of Scope

Do not implement:

- [ ] Any new feature work beyond fixing Phase 18 verification failures.
- [ ] Push notification sending or reminder delivery workers.
- [ ] Calendar/dashboard read APIs.
- [ ] Frontend task/calendar/dashboard pages.
- [ ] Weather checks or rain confirmation.
- [ ] Auto-created activities from completed tasks.
- [ ] AI suggestion workflows.
- [ ] MCP tools.
- [ ] Schema redesign or unrelated refactors.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 19 and sections 25-28
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] All Phase 18 step docs in `docs/implementation-phases/phase-18/`
- [ ] Existing backend task, route, service, repository, transaction, fixture, and test files touched by the phase.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] worker/scheduler responsibility
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Confirming a task is transactional.
Manual planned task creation creates reminders transactionally.
Task completion does not automatically create activity in v1.
Task targets use resolved target rows.
All-beds/all-perennials are scoped to one place.
Cross-place mixed targeting is not allowed in v1.
Reminder delivery is deferred to Phase 25.
Calendar/dashboard reads are deferred to Phase 19.
Frontend task UI is deferred to Phase 20.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future task read/mutation tools may call backend task APIs/services.
No MCP tool implementation is part of Phase 18.
```

Required MCP documentation updates:

```text
None unless the final implementation changes canonical API behavior; document any such gap before merging.
```

---

# Required Implementation Details

Implement:

- [ ] verification review
- [ ] tests/checks
- [ ] status handoff update
- [ ] commit
- [ ] PR

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
- [ ] no push delivery or `PushPort` usage in Phase 18
- [ ] no weather provider or `WeatherPort` usage in Phase 18
- [ ] no frontend direct database or Supabase app-table access

---

# API Contract

Endpoints verified:

```text
GET /api/v1/tasks
POST /api/v1/tasks
GET /api/v1/tasks/:taskId
PATCH /api/v1/tasks/:taskId
POST /api/v1/tasks/:taskId/confirm
POST /api/v1/tasks/:taskId/dismiss
POST /api/v1/tasks/:taskId/complete
POST /api/v1/tasks/:taskId/skip
```

Verify:

```text
Canonical success and error envelopes.
Canonical pagination fields.
Canonical task detail includes targets, reminders, and weatherEvents.
Confirm response includes id, status, confirmedAt, and reminders.
No trusted accountId accepted as user input.
No non-contract endpoints added.
```

---

# Tests Required

Run tests/checks for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] target resolution
- [ ] transaction rollback
- [ ] API response shape
- [ ] edge cases

Required verification commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Also run any focused tests touched by Phase 18 if the project exposes narrower commands.

---

# Acceptance Criteria

The task is complete when:

- [ ] Task list/create/detail/update endpoints are implemented.
- [ ] Confirm/dismiss/complete/skip endpoints are implemented.
- [ ] Confirm suggested task transaction creates two reminders.
- [ ] Manual planned task creates reminders.
- [ ] Suggested tasks have no reminders.
- [ ] Reminder creation rollback is tested.
- [ ] Completing task does not create activity.
- [ ] Target resolver is reused.
- [ ] Account scoping and target scoping are tested.
- [ ] Backend tests/typecheck/lint/build pass where configured or failures are explicitly documented.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` is updated after implementation completion.
- [ ] PR description is complete.

---

# Commands to Run

Run relevant backend commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If any command does not exist or fails due to pre-existing setup, report it clearly.

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
- Deferred work
