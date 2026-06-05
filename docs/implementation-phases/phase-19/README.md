# Phase 19 Task Set - Backend Calendar and Dashboard Read APIs

These files convert `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-calendar-dashboard
```

## Task Order

1. `01-calendar-dashboard-module-contracts-validation-and-route-wiring.md`
2. `02-calendar-read-repository-and-service.md`
3. `03-dashboard-read-repository-and-service.md`
4. `04-calendar-dashboard-routes-and-api-contract.md`
5. `05-calendar-dashboard-account-scope-readonly-and-response-tests.md`
6. `06-phase-19-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend calendar and dashboard read APIs:

- `CalendarService` and read-model support for `GET /api/v1/calendar`.
- Dashboard read service support for `GET /api/v1/dashboard`.
- Account-scoped date range and optional place filtering.
- Separate calendar response sections for `activities`, `tasks`, `quarantinePeriods`, and `weatherEvents`.
- Dashboard summary buckets for `upcomingTasks`, `suggestedTasks`, `activeQuarantinePeriods`, `recentActivities`, `openProblems`, `lowStockProducts`, and `places`.
- Canonical success/error envelopes and camelCase DTOs.
- Tests for response shape, filters, account scoping, read-only behavior, and moderate seeded data.

Do not implement:

- Calendar item mutations or writable calendar records.
- Task lifecycle mutations, confirmation, dismissal, completion, or reminder generation.
- Frontend calendar/dashboard pages.
- Weather event generation or calls to `WeatherPort`.
- Push notifications, worker/scheduler behavior, AI behavior, or MCP tools.
- Schema changes or migrations unless a blocking mismatch is documented.
- Direct frontend access to application tables or raw database row exposure.

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
- `docs/002_views_gardening_helper.sql`
- `docs/004_guards_and_triggers_gardening_helper.sql`
- `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, database, transaction, validation, error, route, activity, task, problem, inventory, place, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If route or repository tests require a database, run them against a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
