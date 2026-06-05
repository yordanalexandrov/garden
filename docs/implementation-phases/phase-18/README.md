# Phase 18 Task Set - Backend Task Lifecycle and Reminders

These files convert `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-tasks-reminders
```

## Task Order

1. `01-tasks-module-contracts-validation-and-route-wiring.md`
2. `02-tasks-repository-read-and-write-models.md`
3. `03-reminder-scheduler-and-service-transaction-workflows.md`
4. `04-tasks-routes-and-api-contract.md`
5. `05-task-status-transition-and-reminder-regression-tests.md`
6. `06-phase-18-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend task lifecycle and reminder-row APIs:

- Account-scoped task contracts, validation schemas, DTO mapping, route registration, service methods, repository methods, and tests.
- Canonical `/api/v1/tasks` endpoints from API contract section 19.
- Manual task creation/update with backend target resolution through the existing `TargetResolver`.
- Transactional suggested-task confirmation that changes status to `planned`, sets `confirmedAt`, and creates day-before and same-day reminder rows.
- Manual planned task creation that creates reminder rows transactionally.
- Dismiss, complete, and skip status transitions with explicit account-scoped access checks.
- Regression coverage for suggested/planned boundaries, reminders, rollback, target resolution, account scoping, and response envelopes.

Do not implement:

- Push notification sending or reminder delivery workers.
- Calendar feed or dashboard read APIs.
- Frontend task, calendar, or dashboard pages.
- Weather checks or rain confirmation.
- Auto-created activities from completed tasks.
- Frontend timers or client-owned reminder decisions.
- Schema redesign or new migrations unless a blocking mismatch is documented.
- Direct Supabase SDK usage inside domain services.

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
- `docs/implementation-phases/phase-11-backend-target-resolver.md`
- `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md`
- `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, db, transaction, validation, error, activities/suggested-task, target resolver, audit, route, repository, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If route, repository, reminder, or transaction tests require a database, run them against a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
