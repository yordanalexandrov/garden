# Phase 2 Task Set - Database Migration and Transaction Foundation

These files convert `docs/implementation-phases/phase-02-database-migration-and-transaction-foundation.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/database-foundation
```

## Task Order

1. `01-database-dependencies-and-config.md`
2. `02-baseline-migration-runner.md`
3. `03-db-client-lifecycle-and-types.md`
4. `04-transaction-abstraction.md`
5. `05-test-database-reset-and-fixtures.md`
6. `06-migration-integrity-and-guard-tests.md`
7. `07-phase-02-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the database migration and transaction foundation:

- backend database dependencies and config wiring
- ordered baseline migration execution for `001` through `004`
- typed database access setup
- `DbClient` and `DbTransaction` abstractions
- explicit transaction wrapper
- database connection lifecycle handling
- deterministic test database reset/apply strategy
- migration, rollback, constraint, and guard smoke tests

Do not implement:

- domain repositories or services
- domain API endpoints
- auth/JWT/account context
- frontend work
- schema redesign
- provider adapters for Auth, Storage, Weather, Push, or AI
- activity, inventory, task, target, problem, weather, AI, or push workflows
- business side-effect triggers

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
- `docs/env.example`
- `docs/001_initial_schema_gardening_helper.sql`
- `docs/002_views_gardening_helper.sql`
- `docs/003_seed_reference_data_gardening_helper.sql`
- `docs/004_guards_and_triggers_gardening_helper.sql`
- `docs/implementation-phases/phase-02-database-migration-and-transaction-foundation.md`
- `docs/TASK_TEMPLATE.md`

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also run any database migration/reset command added during the phase against a dedicated local/test PostgreSQL-compatible database. Never run migration tests against production or shared developer databases.

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
