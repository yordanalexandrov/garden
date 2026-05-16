# Phase 5 Task Set - Backend Places and Plants API

These files convert `docs/implementation-phases/phase-05-backend-places-and-plants-api.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-places-plants
```

## Task Order

1. `01-module-contracts-and-dependency-wiring.md`
2. `02-places-repository-and-service.md`
3. `03-places-routes-and-api-contract.md`
4. `04-plants-repository-and-service.md`
5. `05-plants-routes-and-api-contract.md`
6. `06-phase-05-account-scope-and-regression-tests.md`
7. `07-phase-05-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend Places and Plants APIs:

- Account-scoped Places repository, service, validation, routes, DTO mapping, and tests.
- Account-scoped Plants repository, service, validation, routes, DTO mapping, and tests.
- Canonical `/api/v1/places` and `/api/v1/plants` endpoints.
- `includeArchived` behavior, archive via `archived_at`, and default exclusion of archived records.
- Weather metadata validation for places only; no Open-Meteo calls.
- Plant enum validation and no plant uniqueness rules beyond the schema.
- API response envelopes, pagination envelopes, and canonical error envelopes.

Do not implement:

- Perennials, beds, persistent plants, or yearly plantings.
- Target resolver, activities, inventory, product usage rules, problems, tasks, AI, notifications, weather forecast, or weather confirmation workflows.
- Frontend pages or frontend API services.
- Direct frontend database access.
- Hard delete behavior.
- Schema redesign or new migrations unless a blocking mismatch is documented.
- MCP tools.

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
- `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, db, validation, error, route, and test helper files touched by the task.

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

