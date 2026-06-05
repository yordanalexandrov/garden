# Implementation Task - Phase 18 Step 5: Task Status Transition and Reminder Regression Tests

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. This step closes Phase 18 test gaps and fixes only defects found inside Phase 18 scope.

---

# Task

## Goal

Add focused regression coverage for Phase 18 invariants:

```text
Suggested/planned task boundaries, transactional reminders, target resolution, status transitions, account scoping, and API response shapes.
```

## Branch

Use branch:

```text
feature/backend-tasks-reminders
```

---

# Scope

Implement only:

- [ ] Inspect existing Phase 18 code, tests, fixtures, transaction failure injection helpers, account A/account B fixtures, target fixtures, and route test patterns.
- [ ] Add or complete service/API/repository tests for status transitions, reminders, targets, account scoping, and rollback.
- [ ] Add fixture helpers for suggested tasks, planned tasks, task targets, reminders, and cross-account task records only where existing helper patterns need them.
- [ ] Verify database guards align with service behavior for task target consistency and planned-task-only reminders.
- [ ] Confirm duplicate confirm attempts do not create duplicate reminders.
- [ ] Confirm reminder creation failure rolls back task status and `confirmedAt`.
- [ ] Confirm task completion does not create activity rows.
- [ ] Confirm manual task creation uses target resolver and rejects cross-place mixed targeting.
- [ ] Fix only Phase 18 implementation defects exposed by these tests.

---

# Out of Scope

Do not implement:

- [ ] New task features beyond canonical Phase 18 behavior.
- [ ] Push sending, push subscription APIs, or reminder delivery workers.
- [ ] Calendar/dashboard read APIs.
- [ ] Frontend task/calendar/dashboard pages.
- [ ] Weather checks or rain confirmation.
- [ ] Auto-created activities from completed tasks.
- [ ] AI suggestion acceptance behavior.
- [ ] Schema redesign or new migrations unless a blocking mismatch is documented.
- [ ] Broad refactors unrelated to Phase 18 test failures.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` task/reminder rules
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 19 and sections 25-28
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` task lifecycle and account-scope cases
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] Existing backend task, route, service, repository, transaction, fixture, and database test helper files touched by the task.

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

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Task targets must resolve to concrete target rows.
Suggested tasks are not planned tasks.
Suggested tasks never have reminders.
Planned tasks can have reminders.
Confirming a task is transactional.
Manual planned task creation creates reminders transactionally.
Completing a task does not automatically create an activity in v1.
Reminder delivery is not part of Phase 18.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP task tools depend on these backend invariants.
No MCP tool implementation is part of Phase 18.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] fixtures/test helpers
- [ ] small verification fixes only if tests expose Phase 18 defects

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no push delivery or `PushPort` usage in Phase 18
- [ ] no weather provider or `WeatherPort` usage in Phase 18

---

# API Contract

Endpoints under regression:

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

Confirm these endpoints preserve:

```text
Canonical success and error envelopes.
Canonical pagination fields.
Canonical task/reminder/status/source/type enum values.
Confirm response returns id, status, confirmedAt, and reminders.
Manual planned create creates reminders.
Suggested task create and suggested activity tasks have no reminders.
No trusted accountId accepted as user input for normal flows.
No push, weather, calendar, dashboard, frontend, or activity auto-create behavior.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] target resolution
- [ ] transaction rollback
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Confirm suggested task creates two reminders transactionally.
2. Reminder creation failure rolls back confirm.
3. Confirm already planned task is rejected without duplicate reminders.
4. Suggested task has no reminders.
5. Manual planned task creates reminders transactionally.
6. Manual suggested task creates no reminders.
7. Dismiss suggested task sets canceled.
8. Complete planned task sets done and completed timestamp.
9. Complete does not create activity.
10. Skip planned task sets skipped.
11. Cross-account task access is rejected for every endpoint.
12. Target resolver is reused for manual task create/update.
13. Cross-place mixed targeting is rejected.
14. API response envelopes match contract.
15. DB guard rejects reminder rows for non-planned tasks if repository/service bug attempts one.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 18 has focused regression coverage for task lifecycle routes/services/repositories.
- [ ] Suggested/planned/reminder boundaries are covered.
- [ ] Account/place/target invariants are covered.
- [ ] Reminder rollback and duplicate-confirm behavior are covered.
- [ ] Task completion no-activity behavior is covered.
- [ ] Canonical response and error envelopes are covered.
- [ ] Tests pass where configured.
- [ ] No unrelated implementation scope slipped in.

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
