# Implementation Task - Phase 25 Step 7: Phase 25 Verification and PR Readiness

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. This step verifies the completed Phase 25 implementation and prepares a reviewable PR.

---

# Task

## Goal

Verify Phase 25 end to end and prepare the implementation PR:

```text
Push subscription APIs, PushPort/Web Push adapter boundary, reminder delivery worker, regression tests, status handoff update, commit, and PR.
```

## Branch

Use branch:

```text
feature/backend-push-worker
```

---

# Scope

Implement only:

- [ ] Review the full Phase 25 diff against source documents and prior step docs.
- [ ] Confirm push subscription register/list/deactivate endpoints exist and follow canonical request/response/error envelopes.
- [ ] Confirm controllers are thin and all subscription workflow decisions live in services.
- [ ] Confirm repositories remain data-access-only and account-scoped.
- [ ] Confirm `PushPort` exists and raw Web Push/VAPID provider code is isolated behind the adapter.
- [ ] Confirm deterministic test/dev push adapter exists and tests do not require network or real VAPID credentials.
- [ ] Confirm `VAPID_PRIVATE_KEY` is backend-only and not referenced from frontend/public config.
- [ ] Confirm worker/job selects due scheduled reminders only.
- [ ] Confirm worker/job sends only reminders for planned tasks.
- [ ] Confirm worker/job preserves `canceled` reminders and does not resend terminal reminders.
- [ ] Confirm send success marks reminders `sent` with `sent_at`.
- [ ] Confirm send failure marks reminders `failed`, records/logs failure safely, and does not change task status.
- [ ] Confirm no reminder creation for suggested tasks, frontend timers, weather scheduler, AI acceptance, MCP tool, full deployment, or schema scope slipped in.
- [ ] Confirm PostgreSQL is not publicly exposed and Supabase Studio protection is not weakened if any deployment/admin config was touched.
- [ ] Run the required backend verification commands and any focused docs/static checks.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` only after implementation is complete, marking Phase 25 implemented and setting the next phase/step.
- [ ] Commit focused Phase 25 implementation changes.
- [ ] Open a PR with a clear description.

---

# Out of Scope

Do not implement:

- [ ] Any new feature work beyond fixing Phase 25 verification failures.
- [ ] Frontend notification registration, browser subscription UI, or service worker UX.
- [ ] Weather-check scheduler behavior.
- [ ] AI suggestion workflows.
- [ ] MCP tools.
- [ ] Full production deployment wiring.
- [ ] Schema redesign or unrelated refactors.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 19 and 23
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/gardening-helper-production-checklist.md`
- [ ] `docs/env.example`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] All Phase 25 step docs in `docs/implementation-phases/phase-25/`
- [ ] Existing backend notification, push, worker, task/reminder, route, service, repository, config, transaction, fixture, and test files touched by the phase.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Push subscription belongs to account.
Reminder rows drive notification sending.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Notifications only for planned tasks.
Notification failure must not break task state.
Raw Web Push is behind PushPort.
VAPID private key is backend-only.
Frontend never talks directly to application tables.
PostgreSQL must not be publicly exposed.
Supabase Studio must be protected.
MCP tools are not a privileged bypass channel.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP task/notification tools must call backend services/API and must not bypass account scoping or notification confirmation boundaries.
No MCP tool implementation is part of Phase 25.
```

Required MCP documentation updates:

```text
None unless final implementation changes documented backend behavior; document any such gap before merging.
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
- [ ] raw Web Push used through `PushPort`
- [ ] VAPID private key backend-only
- [ ] worker/scheduler ownership is explicit for reminders
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] no frontend direct database or Supabase app-table access

---

# API Contract

Endpoints verified:

```text
POST /api/v1/push/subscriptions
GET /api/v1/push/subscriptions
POST /api/v1/push/subscriptions/:subscriptionId/deactivate
```

Verify:

```text
Canonical success and error envelopes.
Register response returns registered: true.
List response includes active subscription items.
Deactivate response uses canonical success envelope.
No trusted accountId accepted as user input.
No non-contract endpoints added.
```

---

# Tests Required

Run tests/checks for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction/status safety
- [ ] API response shape
- [ ] provider adapter boundary
- [ ] worker/scheduler behavior
- [ ] security/static checks
- [ ] edge cases

Required verification commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Also run any focused tests touched by Phase 25 if the project exposes narrower commands.

---

# Acceptance Criteria

The task is complete when:

- [ ] Push subscription register/list/deactivate APIs are implemented.
- [ ] Push subscriptions are account-scoped.
- [ ] `PushPort` and deterministic test adapter exist.
- [ ] Raw Web Push/VAPID adapter exists or production status is documented.
- [ ] VAPID private key is backend-only.
- [ ] Reminder delivery worker/job sends due planned-task reminders.
- [ ] Send success/failure updates reminder status only.
- [ ] Notification failure does not change task status.
- [ ] Worker idempotency and planned-only boundaries are tested.
- [ ] Worker ownership and commands are documented.
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

Open a PR with:

```md
## Summary
Implemented backend Push Notifications and Worker Scheduler.

## Scope
- Added PushPort and Web Push/VAPID adapter boundary.
- Added account-scoped push subscription APIs.
- Added due reminder delivery worker/job.
- Added deterministic push adapter and regression/security tests.

## Domain rules preserved
- Notifications remain optional.
- Push subscriptions are account-scoped.
- Reminder rows drive notification delivery.
- Notifications are only for planned tasks.
- Notification failure does not change task state.
- VAPID private key remains backend-only.

## API/DB changes
- API: POST/GET/deactivate push subscription endpoints.
- DB: uses existing push_subscriptions and task_reminders tables; note any new migration only if unavoidable.

## Tests
- <commands run and results>

## Deferred work
- Browser subscription UI and service worker registration remain deferred to Phase 26.
- Production deployment wiring remains deferred to Phase 27 unless a minimal local worker command was added here.

## Review focus
- Account scoping.
- PushPort boundary.
- Worker idempotency and reminder/task status boundaries.
- Secret handling.
- Security/deployment boundaries.
```
