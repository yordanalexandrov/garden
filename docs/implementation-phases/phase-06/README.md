# Phase 6 Task Set - Backend Growing Structure API

These files convert `docs/implementation-phases/phase-06-backend-growing-structure-api.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-growing-structure
```

## Task Order

1. `01-growing-structure-module-contracts-and-validation.md`
2. `02-perennials-repository-and-service.md`
3. `03-perennials-routes-and-api-contract.md`
4. `04-beds-repository-service-and-current-contents.md`
5. `05-beds-routes-and-api-contract.md`
6. `06-persistent-bed-plants-repository-and-service.md`
7. `07-persistent-bed-plants-routes-and-api-contract.md`
8. `08-yearly-bed-plantings-repository-and-service.md`
9. `09-yearly-bed-plantings-routes-and-api-contract.md`
10. `10-phase-06-account-consistency-and-regression-tests.md`
11. `11-phase-06-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend growing structure APIs:

- Account-scoped perennials repository, service, validation, routes, DTO mapping, and tests.
- Account-scoped beds repository, service, validation, routes, DTO mapping, selected-year contents, and tests.
- Account-scoped persistent bed plants repository, service, validation, routes, DTO mapping, and tests.
- Account-scoped yearly bed plantings repository, service, validation, routes, DTO mapping, duplicate-row allowance, and tests.
- Canonical `/api/v1` endpoints from API contract sections 10-13.
- Parent/child account consistency across places, plants, beds, perennials, persistent bed plants, and yearly bed plantings.
- Archive/status behavior that preserves historical rows.
- Repository methods needed later by the Phase 11 target resolver.

Do not implement:

- Activity or task target resolver.
- Activities, inventory, product usage rules, problems, tasks, calendar, weather, AI, notifications, storage, push, or MCP tools.
- Frontend pages or frontend API services.
- Direct frontend database access.
- Hard delete behavior for historical growing records.
- Schema redesign or uniqueness constraints that block duplicate same bed/plant/year yearly planting rows.

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
- `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, db, validation, error, route, places, plants, and test helper files touched by the task.

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

