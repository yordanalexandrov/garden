# Implementation Task - Phase 18 Step 3: Reminder Scheduler and Service Transaction Workflows

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. Services own task lifecycle decisions, transactions, target resolution, and reminder-row generation.

---

# Task

## Goal

Implement `TasksService` workflows and reminder-row scheduling:

```text
Manual task create/update, suggested-task confirmation, and status transitions with transactional reminder behavior.
```

## Branch

Use branch:

```text
feature/backend-tasks-reminders
```

---

# Scope

Implement only:

- [ ] Inspect existing service orchestration, transaction runner, target resolver invocation, audit helper, problem/activity service error style, and test patterns.
- [ ] Implement a deterministic reminder scheduler/helper that creates day-before and same-day reminder rows for planned tasks.
- [ ] Apply timezone selection in the scheduler using place timezone, then account timezone, then UTC fallback only if necessary and only if those fields exist in current data models.
- [ ] Implement manual task creation in one service-owned transaction: validate place/account context, resolve targets with `TargetResolver`, create task with `sourceType = manual`, create concrete task target rows, and create reminders only when status is `planned`.
- [ ] Ensure manual suggested task creation creates no reminder rows.
- [ ] Implement task patch/update workflow with account-scoped access, service-owned validation, target re-resolution/replacement when target scope changes, and reminder consistency when status/due date changes according to the canonical contract and domain rules.
- [ ] Implement suggested task confirmation in one transaction: require current status `suggested`, set status `planned`, set `confirmedAt`, and create day-before and same-day reminders.
- [ ] Reject confirming already planned/done/skipped/canceled tasks without duplicate reminder creation.
- [ ] Implement dismiss workflow for suggested tasks using canonical canceled status while preserving historical visibility.
- [ ] Implement complete workflow for planned tasks: set `done` and `completedAt`; do not create an activity.
- [ ] Implement skip workflow for planned tasks: set `skipped`; preserve task history.
- [ ] Add audit logs for confirm/dismiss if the audit module exists and the local pattern supports representative critical-operation audit integration.
- [ ] Add focused unit/service tests for scheduler behavior, transaction rollback, status rules, and no activity creation.

---

# Out of Scope

Do not implement:

- [ ] Route/controller response handling beyond service APIs needed by Step 4.
- [ ] Push notification sending or reminder delivery workers.
- [ ] Calendar/dashboard read APIs.
- [ ] Frontend task/calendar/dashboard pages.
- [ ] Weather checks or rain confirmation.
- [ ] Auto-created activity records from completion.
- [ ] AI-created task acceptance behavior.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.
- [ ] Direct Supabase SDK usage inside domain services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` task/reminder rules
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 19 and sections 25-28
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` task confirmation, duplicate confirm, dismiss, complete, manual task, reminder rollback, and account tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` `TasksService` and reminder scheduler sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] Existing backend service, transaction, target resolver, audit, error, repository, and test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] worker/scheduler responsibility
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Services orchestrate workflows and transactions.
Suggested tasks are not planned tasks.
Planned tasks can have reminders.
Reminders are created only for planned tasks.
Confirming a task is transactional.
Task reminders are generated from planned status.
Manual planned task creation creates reminders transactionally.
Reminder creation failure must roll back task status changes.
Task completion does not automatically create an activity in v1.
Dismissing a suggested task is explicit.
Task targets use resolved target rows.
Notifications only for planned tasks later.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP mutation tools may call confirm/dismiss through backend services/API.
No MCP tool implementation is part of Phase 18.
```

Required MCP documentation updates:

```text
None unless service behavior deviates from the canonical API contract, which this task should avoid.
```

---

# Required Implementation Details

Implement:

- [ ] backend service methods
- [ ] transaction handling
- [ ] reminder scheduler/helper
- [ ] target resolver invocation
- [ ] status transition validation
- [ ] audit integration for confirm/dismiss if available
- [ ] tests
- [ ] docs/update notes only if workflow assumptions or audit status need documenting

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] account scoping enforced backend-side
- [ ] no push sending or `PushPort` usage in Phase 18
- [ ] no weather provider or `WeatherPort` usage in Phase 18
- [ ] worker/scheduler ownership is limited to calculating reminder rows, not delivering notifications

---

# API Contract

Service workflows must support:

```text
POST /api/v1/tasks
PATCH /api/v1/tasks/:taskId
POST /api/v1/tasks/:taskId/confirm
POST /api/v1/tasks/:taskId/dismiss
POST /api/v1/tasks/:taskId/complete
POST /api/v1/tasks/:taskId/skip
```

Preserve:

```text
Manual create sets sourceType = manual.
Confirm response can return id, status, confirmedAt, and reminders.
Planned task creation/confirmation creates day_before and same_day reminders.
Suggested tasks never have reminders.
Completion does not create activity.
Errors use canonical envelope through route layer.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] target resolution
- [ ] transaction rollback
- [ ] API response shape support
- [ ] edge cases

Specific test cases:

1. Reminder scheduler creates day-before and same-day reminders.
2. Reminder scheduler applies timezone fallback.
3. Confirm suggested task creates two reminders transactionally.
4. Reminder creation failure rolls back confirm status and `confirmedAt`.
5. Confirm already planned/done/skipped/canceled task is rejected without duplicate reminders.
6. Manual planned task creates reminders transactionally.
7. Manual suggested task creates no reminders.
8. Manual task target scope is resolved through `TargetResolver`.
9. Dismiss suggested task sets canceled and remains account-scoped.
10. Complete planned task sets done and `completedAt`.
11. Complete does not create an activity.
12. Skip planned task sets skipped.

---

# Acceptance Criteria

The task is complete when:

- [ ] `TasksService` owns task lifecycle and reminder workflows.
- [ ] Confirmation and manual planned creation create reminder rows transactionally.
- [ ] Suggested tasks never receive reminders.
- [ ] Reminder rollback is covered by tests.
- [ ] Completion does not create activities.
- [ ] Target resolution is reused and tested.
- [ ] No controller-owned business logic, frontend, push, weather, calendar, dashboard, MCP, or schema scope slipped in.

---

# Commands to Run

Run relevant backend commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
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
