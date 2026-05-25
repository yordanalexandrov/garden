# Phase 9 Task Set - Backend Inventory Ledger API

These files convert `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-inventory-ledger
```

## Task Order

1. `01-inventory-module-contracts-validation-and-route-wiring.md`
2. `02-fefo-allocator-and-shortage-policy-helper.md`
3. `03-inventory-repository-and-overview-reads.md`
4. `04-inventory-lot-creation-purchase-movement-transaction.md`
5. `05-movement-history-and-manual-adjustment-routes.md`
6. `06-inventory-ledger-account-scope-rollback-and-guards.md`
7. `07-phase-09-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend Inventory Ledger API:

- Account-scoped inventory module contracts, validation schemas, DTO mapping, routes, service methods, repository methods, and tests.
- Canonical `/api/v1` inventory endpoints from API contract section 16.
- Inventory overview backed by lots/view data, not mutable product balance state.
- Lot listing and movement history for products owned by the authenticated account.
- Inventory lot creation that inserts the lot and `purchase` movement in one transaction.
- Manual stock adjustment that inserts a `manual_adjustment` or `correction` movement and updates lot quantity in one transaction.
- FEFO allocation helper for later Phase 12 activity consumption.
- Unit/shortage policy helpers that reject unsupported conversions and never create fake stock.
- Account-scope, rollback, ledger, and database guard regression tests.

Do not implement:

- Activity product consumption or activity-side `consumption` movement creation.
- Frontend product or inventory pages.
- AI, weather, storage, push, worker, deployment, or MCP tools.
- Direct stock mutation without an inventory movement.
- Negative lot quantities.
- Complex unit conversions.
- Schema redesign or new migrations unless a blocking mismatch is documented.

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
- `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, db, transaction, validation, error, products, route, and test helper files touched by the task.

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
