# Phase 13 Task Set - Backend Activity Correction and Audit Trail

These files convert `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/activity-correction-audit
```

## Task Order

1. `01-audit-module-contracts-repository-and-helper.md`
2. `02-critical-operation-audit-integration.md`
3. `03-activity-correction-contract-validation-and-route.md`
4. `04-activity-correction-transaction-and-compensating-effects.md`
5. `05-correction-audit-account-scope-rollback-and-guards.md`
6. `06-phase-13-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend activity correction and audit trail foundation:

- `AuditLogsRepository` and audit logging service/helper.
- Append-only audit rows for representative critical operations already implemented before this phase.
- Canonical `POST /api/v1/activities/:activityId/correct` route.
- Documented v1 correction payload shapes and explicit rejection of unsupported shapes.
- Hybrid correction workflow for supported side-effecting activity corrections.
- Correction inventory movements that append reverse/adjust history instead of mutating prior movement rows.
- Transaction, account-scope, append-only audit, and rollback tests.

Do not implement:

- Correction UI or frontend activity pages.
- Full arbitrary history rewrite.
- Hard deletion of historical activities, movements, quarantine periods, tasks, or audit rows.
- Weather, AI, push, storage, provider, deployment, or MCP tool audit events.
- Direct database/table access outside repositories.
- Business workflow orchestration in controllers, repositories, database triggers, or frontend code.
- New schema/migrations unless a blocking support gap is documented and a forward migration is the smallest safe fix.

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
- `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- `docs/implementation-phases/phase-11-backend-target-resolver.md`
- `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend activity, inventory, products/rules, places, audit if present, transaction, auth, validation, error, route, and test helper files touched by the task.

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

- no direct frontend access to application tables was added
- no bypass of the Fastify API for application data was added
- no business logic moved into controllers, repositories, database triggers, or frontend code
- no Supabase service role key is exposed to frontend code/env/build output/logs
- audit rows are append-only in normal application flows
- activity correction appends compensating domain records where supported instead of mutating prior side-effect history

If route or repository tests require a database, run them against a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
