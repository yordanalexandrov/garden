# Phase 8 Task Set - Backend Products and Usage Rules API

These files convert `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-products-rules
```

## Task Order

1. `01-products-rules-module-contracts-validation-and-route-wiring.md`
2. `02-products-repository-and-service.md`
3. `03-products-routes-and-api-contract.md`
4. `04-product-usage-rules-repository-and-service.md`
5. `05-product-usage-rules-routes-and-api-contract.md`
6. `06-product-rule-account-consistency-and-regression-tests.md`
7. `07-phase-08-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend Products and Product Usage Rules APIs:

- Account-scoped product module contracts, validation, DTO mapping, routes, repository, service, and tests.
- Account-scoped plant-specific product usage rule module contracts, validation, DTO mapping, routes, repository, service, and tests.
- Canonical `/api/v1/products` and `/api/v1/product-rules` endpoints from API contract sections 14 and 15.
- Product category and unit validation using canonical enum values only.
- Product/rule archive behavior using `archived_at`, with default exclusion of archived records where applicable.
- One active product+plant rule in v1, with archived rules excluded from active uniqueness.
- Product/plant/account consistency enforced in service logic and backed by database guards.
- Product detail response that remains contract-compatible before Phase 9 inventory exists by returning empty/zero/null inventory summary fields consistently with the existing project pattern.

Do not implement:

- Inventory lots, inventory movements, stock allocation, stock mutation, or inventory ledger behavior.
- Activity product usage, quarantine generation, suggested task generation, task planning, reminders, or target resolver behavior.
- AI product ingestion, AI suggestion acceptance, label/photo parsing, or AI-created business records.
- Frontend product or inventory pages, frontend API services, or direct frontend database access.
- Direct Supabase SDK usage inside domain services.
- Hard delete behavior for products or product usage rules.
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
- `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, db, validation, error, route, plants, products if present, and test helper files touched by the task.

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
