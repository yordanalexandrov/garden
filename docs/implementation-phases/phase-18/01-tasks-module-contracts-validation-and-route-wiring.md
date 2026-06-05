# Implementation Task - Phase 18 Step 1: Tasks Module Contracts, Validation, and Route Wiring

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. Keep backend business logic in services, repositories data-only, and controllers thin.

---

# Task

## Goal

Create the backend tasks module foundation for Phase 18:

```text
Contracts, validation schemas, DTO mappers, dependency wiring, and route registration for task lifecycle APIs.
```

## Branch

Use branch:

```text
feature/backend-tasks-reminders
```

---

# Scope

Implement only:

- [ ] Inspect existing backend app, route registration, auth actor context, database client, transaction abstraction, envelope helpers, validation helpers, target resolver, activities suggested-task output, audit helper, and backend test helper patterns.
- [ ] Confirm Phase 11 target resolver and Phase 12 suggested-task generation exist before implementing task lifecycle behavior; if either is absent, stop and document the prerequisite gap.
- [ ] Create `backend/src/modules/tasks/` structure following existing backend module conventions.
- [ ] Define task domain/input/filter/DTO types for list, create, detail, patch, confirm, dismiss, complete, skip, targets, reminders, weather event summaries, and pagination.
- [ ] Define canonical enum constants for `TaskType`, `TaskStatus`, `TaskSourceType`, `ReminderType`, and `ReminderStatus`.
- [ ] Define validation schemas for UUID params, list query filters, create payloads, patch payloads, and status-transition route inputs.
- [ ] Ensure manual task create accepts canonical `placeId`, `type`, `dueDate`, `notes`, `status`, `targetScopeType`, and `targetSelection`; backend must set `sourceType = manual`.
- [ ] Reject trusted `accountId`, reminder rows for suggested task payloads, activity auto-creation fields, push delivery fields, and frontend-owned reminder scheduling inputs.
- [ ] Define DTO mapping helpers that convert database snake_case fields to canonical API camelCase fields.
- [ ] Add route registration and dependency wiring for the tasks route module without opening database connections at import time.
- [ ] Preserve `GET /api/v1/health` as unauthenticated and keep test-only routes isolated.
- [ ] Add focused validation/schema/DTO tests where existing test style supports them.

---

# Out of Scope

Do not implement:

- [ ] Repository queries or writes beyond interface stubs needed for wiring.
- [ ] Service workflows beyond interface stubs needed for later steps.
- [ ] Public endpoint behavior beyond route registration returning existing not-implemented behavior if that is the local pattern.
- [ ] Reminder scheduler logic; that belongs to Step 3.
- [ ] Status transition workflows; those belong to Step 3 and Step 4.
- [ ] Push sending, calendar/dashboard reads, frontend task pages, weather checks, or reminder delivery worker.
- [ ] Auto-created activities from task completion.
- [ ] Schema changes or migrations.
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
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` task lifecycle and reminder cases
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` `TasksRepository`, `TasksService`, and reminder scheduler sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing `backend/src/app/`, `backend/src/db/`, `backend/src/shared/`, `backend/src/modules/auth/`, `backend/src/modules/activities/`, target resolver, audit helper, and backend test helper files touched by the task.

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
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Task targets must resolve to concrete target rows.
All-beds/all-perennials are scoped to one place.
Cross-place mixed targeting is not allowed in v1.
Task completion does not automatically create an activity in v1.
Frontend must not submit trusted accountId or own reminder scheduling decisions.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP read/mutation tools may expose GET /tasks and POST /tasks/:taskId/confirm or dismiss through backend services/API.
No MCP tool implementation is part of Phase 18.
```

Required MCP documentation updates:

```text
None unless the canonical task API behavior changes, which this task should avoid.
```

---

# Required Implementation Details

Implement:

- [ ] backend route registration
- [ ] backend validation schema
- [ ] backend module/domain types
- [ ] DTO mapping helpers
- [ ] route dependency wiring
- [ ] authenticated actor/dependency access conventions
- [ ] tests
- [ ] docs/update notes only if backend startup or dependency injection commands change

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
- [ ] Supabase Auth used only for auth/session flows
- [ ] no push delivery worker or `PushPort` usage in Phase 18
- [ ] no weather provider or `WeatherPort` usage in Phase 18

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
```

Preserve:

```text
Canonical success and error envelopes.
Canonical pagination fields.
Canonical task, reminder, source, and status enum values.
Canonical target scope fields.
No trusted accountId accepted as user input for normal flows.
No push, calendar, dashboard, weather, or frontend behavior in Phase 18.
```

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] API response shape
- [ ] route registration
- [ ] DTO mapping

Specific test cases:

1. Validation accepts canonical task list filters and rejects invalid pagination/date/status/type/source values.
2. Validation accepts manual task create payloads with canonical target scope fields.
3. Validation rejects trusted `accountId`, reminder scheduling inputs, and push/weather/delivery fields.
4. DTO mapping returns camelCase task, target, reminder, and weather-event summary fields.
5. Route registration exposes only canonical Phase 18 endpoints under `/api/v1/tasks`.

---

# Acceptance Criteria

The task is complete when:

- [ ] Tasks module contracts and validation exist.
- [ ] Tasks routes are registered according to local backend conventions.
- [ ] Controllers/handlers remain thin.
- [ ] Suggested/planned/reminder boundaries are represented in validation and DTO types.
- [ ] Focused validation/DTO tests pass where configured.
- [ ] No workflow, repository write, frontend, push, weather, calendar, dashboard, MCP, or schema scope slipped in.

---

# Commands to Run

Run relevant backend commands:

```bash
npm run typecheck
npm run lint
npm test
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
