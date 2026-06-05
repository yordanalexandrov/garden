# Implementation Task - Phase 18 Step 2: Tasks Repository Read and Write Models

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. Repositories access data only; keep business decisions in `TasksService`.

---

# Task

## Goal

Implement task repository methods and read models needed by Phase 18:

```text
Account-scoped task, target, and reminder data access for list/detail/create/update/status workflows.
```

## Branch

Use branch:

```text
feature/backend-tasks-reminders
```

---

# Scope

Implement only:

- [ ] Inspect existing repository conventions, transaction client patterns, pagination helpers, snake_case/camelCase mapping helpers, target repository helpers, and activities suggested-task persistence patterns.
- [ ] Implement `TasksRepository` methods for account-scoped task list, detail lookup, create, patch/update metadata, status updates, target row replacement/insertion, reminder insertion, reminder list, and duplicate-reminder-safe lookup where needed.
- [ ] Ensure every read/write is scoped by authenticated account and, where applicable, place.
- [ ] Ensure detail reads include task targets, reminder rows, and placeholder-compatible weather event summaries required by the canonical detail response.
- [ ] Support filters from the canonical list endpoint, including `placeId`, status, type/source where defined, and date range fields.
- [ ] Preserve canonical pagination behavior used by earlier backend modules.
- [ ] Keep repository methods transaction-compatible by accepting the existing transaction/client abstraction.
- [ ] Do not decide status-transition validity or reminder-generation timing in repository methods; return enough data for service-layer decisions.
- [ ] Add focused repository tests where existing test infrastructure supports database-backed repository coverage.

---

# Out of Scope

Do not implement:

- [ ] Service workflow decisions or transaction orchestration beyond repository test setup.
- [ ] Route handlers or API response behavior beyond data methods required by Step 4.
- [ ] Reminder scheduler calculations; that belongs to Step 3.
- [ ] Target resolution logic; call existing resolver from service in later steps.
- [ ] Push sending, calendar/dashboard reads, frontend task pages, weather checks, or reminder delivery worker.
- [ ] Auto-created activities from task completion.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.
- [ ] Direct Supabase SDK usage inside domain services or repositories.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` task/reminder and account-scope rules
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 19 and sections 25-28
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` `TasksRepository` sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] Existing backend db, transaction, pagination, repository, target, activity, and test fixture files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Task targets must resolve to concrete target rows.
Task reminders belong only to planned tasks.
Suggested tasks must not have reminders.
Repositories only access data and do not own business workflow decisions.
Historical task records remain visible according to status instead of being hard-deleted.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future task read/mutation tools depend on account-scoped repository behavior through backend services/API.
No MCP tool implementation is part of Phase 18.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] repository methods
- [ ] transaction-compatible data access
- [ ] DTO/read-model support for service and route layers
- [ ] tests
- [ ] docs/update notes only if repository/test database setup changes

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

---

# API Contract

Repository methods must support these endpoints without defining alternate behavior:

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

Confirm repository data can represent:

```text
Task targets.
Task reminders.
List pagination.
Canonical status/source/type enums.
Account-scoped task lookup for status mutations.
No reminders for suggested tasks except DB guard rejection if a bug attempts it.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors at database guard boundaries where applicable
- [ ] account scoping
- [ ] API response shape support
- [ ] edge cases

Specific test cases:

1. Account A task list/detail does not return account B tasks.
2. Task detail includes targets and reminders for planned tasks.
3. Suggested task fixture has no reminders.
4. Repository creates task rows and task target rows in a transaction-compatible way.
5. Repository inserts reminder rows with unique type/task behavior and exposes duplicate failures or idempotent lookup according to local patterns.
6. Repository status update refuses or reports missing rows across account boundaries.
7. Date/status/type filters return scoped, paginated results.

---

# Acceptance Criteria

The task is complete when:

- [ ] `TasksRepository` can support all Phase 18 service workflows.
- [ ] Account scoping is enforced by repository queries and mutations.
- [ ] Repository methods are transaction-compatible.
- [ ] Repository methods do not own business decisions about status transitions or reminder scheduling.
- [ ] Focused repository tests pass where configured.
- [ ] No route workflow, frontend, push, weather, calendar, dashboard, MCP, or schema scope slipped in.

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
