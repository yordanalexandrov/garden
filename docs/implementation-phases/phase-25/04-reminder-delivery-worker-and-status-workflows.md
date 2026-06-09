# Implementation Task - Phase 25 Step 4: Reminder Delivery Worker and Status Workflows

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. The backend owns reminder delivery; notification sending must not change task business state.

---

# Task

## Goal

Implement backend-owned due reminder delivery:

```text
Worker/job module scans due scheduled reminders, sends through PushPort, and updates reminder status idempotently.
```

## Branch

Use branch:

```text
feature/backend-push-worker
```

---

# Scope

Implement only:

- [ ] Inspect existing task reminder persistence, worker/scheduler conventions, transaction runner, logger/audit pattern, retry/error handling, and test fixtures.
- [ ] Implement repository methods to select due `task_reminders` where `status = scheduled` and `scheduled_for <= now`.
- [ ] Join task/account/place data needed to prove the related task is still `planned` and to build the notification payload.
- [ ] Skip or fail safely for any bad-data reminder whose task is not `planned`; do not send it.
- [ ] Select active push subscriptions for the reminder's account.
- [ ] Send reminders through `PushPort.sendReminder` only.
- [ ] Mark send success as `sent` with `sent_at`.
- [ ] Mark send failure as `failed` and record/log provider failure metadata according to existing logging/audit conventions.
- [ ] Preserve `canceled` reminders and never send them.
- [ ] Make the job idempotent enough that a repeated run does not resend reminders already marked `sent`, `failed`, or `canceled`.
- [ ] Handle no active subscriptions without changing task status; choose and document whether the reminder becomes `failed` or remains `scheduled` based on source docs and local retry policy.
- [ ] Deactivate invalid/permanently gone subscriptions only if the behavior is documented and tested.
- [ ] Ensure notification delivery never changes `tasks.status`, `tasks.completed_at`, activity records, inventory, AI suggestions, or weather events.
- [ ] Add focused worker/service tests for due selection, success, failure, idempotency, planned-only safety, and no task-status changes.

---

# Out of Scope

Do not implement:

- [ ] Creating reminder rows; Phase 18 owns reminder creation for planned tasks.
- [ ] Confirming suggested tasks or creating planned tasks.
- [ ] Frontend timers, browser subscription UI, or service worker code.
- [ ] Weather-check scheduler behavior.
- [ ] AI suggestion acceptance or automated business decisions.
- [ ] Task completion, cancellation, or activity creation from notifications.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` section 19
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 19 and 23
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` task reminder and push tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` task reminder and notification service sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` `tasks`, `task_reminders`, and `push_subscriptions`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] Existing backend task/reminder, transaction, repository, integration port, logger, worker, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility

Important rules to preserve:

```text
Backend owns business logic.
Services orchestrate workflows and transactions.
Repositories only access data.
Reminder rows drive notification sending.
Notifications only for planned tasks.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Notification failure must not break task state.
Raw Web Push is behind PushPort.
Worker/scheduler ownership is explicit.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP tools must not bypass backend reminder/notification services or use push delivery as a privileged channel.
No MCP tool implementation is part of Phase 25.
```

Required MCP documentation updates:

```text
None unless worker behavior changes documented backend semantics.
```

---

# Required Implementation Details

Implement:

- [ ] backend service/job method
- [ ] repository methods
- [ ] transaction handling where needed for status transitions
- [ ] provider adapter invocation through `PushPort`
- [ ] worker/scheduler behavior
- [ ] idempotency/retry handling
- [ ] logging/audit where appropriate
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct provider calls inside domain services except through `PushPort`
- [ ] account scoping enforced backend-side
- [ ] raw Web Push used through `PushPort`
- [ ] worker/scheduler ownership is explicit for reminder delivery

---

# API Contract

Public endpoints involved:

```text
None directly in this step.
```

Database/status values involved:

```text
task_reminders.status: scheduled, sent, failed, canceled
tasks.status: suggested, planned, done, skipped, canceled
```

Preserve:

```text
Only due scheduled reminders are candidates.
Only reminders for planned tasks can send.
Send success/failure updates reminder state only.
Task state is unchanged by notification delivery.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] account scoping
- [ ] transaction/status safety
- [ ] provider failure edge cases
- [ ] idempotency

Specific test cases:

1. Worker selects only due reminders with `status = scheduled`.
2. Worker ignores future reminders.
3. Worker ignores `sent`, `failed`, and `canceled` reminders.
4. Worker sends due planned-task reminders through `PushPort`.
5. Successful send marks reminder `sent` and sets `sent_at`.
6. Provider failure marks reminder `failed` and leaves task status unchanged.
7. Worker does not send for non-planned task data if encountered.
8. Worker does not create reminders for suggested tasks.
9. Re-running the worker does not resend reminders already marked terminal.
10. Invalid subscription deactivation behavior is covered if implemented.
11. No active subscription behavior is documented and tested.

---

# Acceptance Criteria

The task is complete when:

- [ ] Due reminder delivery is backend-owned.
- [ ] Worker uses `PushPort` and active account subscriptions.
- [ ] Reminder success/failure status transitions are implemented and tested.
- [ ] Notification failures do not change task state.
- [ ] Suggested/non-planned task safety is enforced beyond DB guard assumptions.
- [ ] No frontend, weather scheduler, AI, activity creation, task status mutation, or schema scope slipped in.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
```

If any command does not exist or fails due to pre-existing setup, report it clearly.
