# Implementation Task - Phase 18 Step 4: Tasks Routes and API Contract

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. Controllers must stay thin and delegate workflow decisions to `TasksService`.

---

# Task

## Goal

Expose Phase 18 task lifecycle workflows through the canonical Fastify API:

```text
GET/POST/PATCH task endpoints plus confirm, dismiss, complete, and skip routes under /api/v1/tasks.
```

## Branch

Use branch:

```text
feature/backend-tasks-reminders
```

---

# Scope

Implement only:

- [ ] Inspect existing route/controller conventions, authenticated route context, validation middleware, error mapping, pagination envelopes, service dependency injection, and API tests from earlier backend modules.
- [ ] Implement `GET /api/v1/tasks` with canonical filters, account scoping from auth context, and pagination envelope.
- [ ] Implement `POST /api/v1/tasks` for manual task creation by delegating all target resolution, status/reminder decisions, and transactions to `TasksService`.
- [ ] Implement `GET /api/v1/tasks/:taskId` with canonical detail fields: task data, `targets`, `reminders`, and `weatherEvents`.
- [ ] Implement `PATCH /api/v1/tasks/:taskId` by delegating service-owned update workflow.
- [ ] Implement `POST /api/v1/tasks/:taskId/confirm` and return `id`, `status`, `confirmedAt`, and created `reminders`.
- [ ] Implement `POST /api/v1/tasks/:taskId/dismiss`.
- [ ] Implement `POST /api/v1/tasks/:taskId/complete`.
- [ ] Implement `POST /api/v1/tasks/:taskId/skip`.
- [ ] Ensure route handlers do not accept trusted `accountId` or client-scheduled reminders.
- [ ] Ensure canonical success/error envelopes and status codes follow existing project conventions and API contract.
- [ ] Add route/API tests for happy paths, validation errors, response shapes, and account boundary errors.

---

# Out of Scope

Do not implement:

- [ ] Business rules in controllers/handlers.
- [ ] Repository or service behavior beyond small fixes required to expose Step 3 workflows.
- [ ] Push notification sending or reminder delivery workers.
- [ ] Calendar/dashboard read APIs.
- [ ] Frontend task/calendar/dashboard pages.
- [ ] Weather checks or rain confirmation.
- [ ] Auto-created activities from completed tasks.
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
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] Existing backend route, auth, validation, error, envelope, service, repository, and API test files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] tasks/reminders
- [ ] API contract
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Frontend never talks directly to the database.
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Confirming a task is transactional.
Task completion does not automatically create activity in v1.
Task targets use resolved target rows.
Frontend must not submit trusted accountId or client-owned reminder rows.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP tools may expose GET /tasks and controlled POST /tasks/:taskId/confirm or dismiss behavior.
No MCP tool implementation is part of Phase 18.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema integration
- [ ] backend service method integration
- [ ] API envelope mapping
- [ ] authenticated actor context usage
- [ ] tests
- [ ] docs/update notes only if route behavior requires documenting a contract gap

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

Request/response must follow:

```text
List responses use canonical pagination envelope.
Manual create uses placeId, type, dueDate, notes, status, targetScopeType, and targetSelection.
Backend sets sourceType = manual for manual task create.
Confirm response returns id, status, confirmedAt, and reminders.
Detail response includes targets, reminders, and weatherEvents.
Errors use canonical error envelope.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback surfaced through API
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. `GET /api/v1/tasks` returns paginated account-scoped tasks.
2. `POST /api/v1/tasks` creates a manual planned task and returns canonical task/reminder fields.
3. `POST /api/v1/tasks` creates a manual suggested task without reminders.
4. `GET /api/v1/tasks/:taskId` returns `targets`, `reminders`, and `weatherEvents`.
5. `PATCH /api/v1/tasks/:taskId` updates canonical editable fields and target scope according to service rules.
6. `POST /api/v1/tasks/:taskId/confirm` returns `id`, `status`, `confirmedAt`, and reminders.
7. `dismiss`, `complete`, and `skip` routes return canonical updated task/status data.
8. Account A cannot list/get/update/confirm/dismiss/complete/skip account B tasks.
9. Invalid UUID, enum, target scope, and date inputs return canonical validation errors.
10. Client-submitted `accountId` or reminder rows are rejected or ignored according to project validation conventions.

---

# Acceptance Criteria

The task is complete when:

- [ ] All canonical Phase 18 task endpoints are implemented.
- [ ] Controllers remain thin and delegate business decisions to `TasksService`.
- [ ] API response and error envelopes match the canonical contract.
- [ ] Account scope is enforced from backend auth context.
- [ ] Route/API tests pass where configured.
- [ ] No frontend, push, weather, calendar, dashboard, MCP, or schema scope slipped in.

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
