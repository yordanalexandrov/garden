# Phase 12 Task Set - Backend Activity Transaction Flow

These files convert `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-activity-transaction
```

## Task Order

1. `01-activities-module-contracts-validation-and-route-wiring.md`
2. `02-activities-repository-list-and-detail-reads.md`
3. `03-create-activity-transaction-header-targets-and-product-usages.md`
4. `04-inventory-allocation-movements-and-shortage-policy.md`
5. `05-quarantine-and-suggested-task-side-effects.md`
6. `06-activity-transaction-account-scope-rollback-and-response-tests.md`
7. `07-phase-12-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend activity list/detail/create transaction flow:

- Canonical `GET /api/v1/activities`, `GET /api/v1/activities/:activityId`, and `POST /api/v1/activities`.
- Activity contracts, validation, DTO mapping, repository methods, service orchestration, and route wiring.
- Reuse of Phase 11 target resolver for concrete `activity_targets`.
- Product usage validation against account-scoped products and optional usage rules.
- FEFO inventory allocation, `inventory_movements`, lot updates, and explicit shortage policy.
- Rule-derived quarantine periods and suggested follow-up tasks with copied targets.
- Transaction/account-scope/rollback/API-shape tests for the full side-effect workflow.

Do not implement:

- Activity correction, audit expansion, or `POST /activities/:activityId/correct`.
- Frontend activity pages or create activity UI.
- Manual task APIs, task confirmation, reminders, calendar feeds, weather prompts, AI suggestions, push, storage, provider, deployment, or MCP tools.
- Frontend-owned target resolution, inventory allocation, quarantine generation, or suggested-task generation.
- Schema redesign or new migrations unless a blocking mismatch is documented and a forward migration is the smallest safe fix.

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
- `docs/implementation-phases/phase-11-backend-target-resolver.md`
- `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, db, transaction, validation, error, targets, products/rules, inventory, route, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Also run any backend boundary/static checks configured by the project. They must verify at minimum:

- activity creation is service-owned and transaction-wrapped
- controllers remain thin
- target resolver is reused instead of duplicating target truth
- stock changes create inventory movements and never make lots negative
- suggested tasks remain `suggested` and do not create reminders
- no direct frontend access to application tables was added
- no Supabase service role key is exposed to frontend code/env/build output/logs

If route or repository tests require a database, run them against a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
