# Phase 25 Task Set - Backend Push Notifications and Worker Scheduler

These files convert `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-push-worker
```

## Task Order

1. `01-notifications-module-contracts-validation-and-route-wiring.md`
2. `02-push-subscriptions-repository-and-service.md`
3. `03-push-port-config-and-adapters.md`
4. `04-reminder-delivery-worker-and-status-workflows.md`
5. `05-push-worker-regression-security-and-boundary-tests.md`
6. `06-worker-ownership-docs-and-operational-hooks.md`
7. `07-phase-25-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend push notification and reminder-delivery worker surface:

- `PushPort` and raw Web Push/VAPID adapter boundary.
- Deterministic test/dev push adapter behind the same port.
- Account-scoped push subscription register/list/deactivate APIs.
- Backend-owned due reminder delivery worker or explicit job module.
- Reminder status transitions from `scheduled` to `sent` or `failed`, preserving `canceled`.
- Failure handling that records send failures but never changes task status.
- Worker ownership docs/scripts needed by later deployment work.
- Regression coverage for account scoping, provider boundary, due reminder selection, idempotency, failure handling, and secret boundaries.

Do not implement:

- Browser push registration UI, service worker subscription code, or frontend notification settings.
- Frontend timers or client-owned reminder scheduling.
- Creating reminder rows for suggested tasks.
- Creating planned tasks from suggestions or AI output.
- Weather-check scheduler behavior unless a small shared runner interface is unavoidable and documented.
- Task status changes from notification delivery.
- Direct Web Push calls from services without `PushPort`.
- Schema redesign or new migrations unless a blocking mismatch is documented.
- Public PostgreSQL or unprotected Supabase Studio deployment changes.

## Common Required Documents

Every task in this folder requires the Implementation Agent to read:

- `AGENTS.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- `docs/gardening-helper-canonical-api-contract-v1.md`
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-backend-application-design-pack-v1.md`
- `docs/gardening-helper-technical-requirements-and-erd.md`
- `docs/001_initial_schema_gardening_helper.sql`
- `docs/004_guards_and_triggers_gardening_helper.sql`
- `docs/env.example`
- `docs/gardening-helper-production-checklist.md`
- `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, config, db, transaction, validation, error, tasks/reminders, audit/logging, integration adapter, route, worker, repository, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If provider or repository tests require external services, use deterministic local/test adapters and a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration. Do not require real Web Push provider network access or real VAPID credentials for normal automated tests. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
