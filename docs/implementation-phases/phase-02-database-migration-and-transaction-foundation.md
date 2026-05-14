# Phase 2 — Database Migration and Transaction Foundation

## 1. Purpose

This phase makes the provided SQL migration pack executable and establishes the backend database and transaction abstraction. It exists so later services can use a consistent repository and transaction model instead of ad hoc queries.

## 2. Position in the sequence

Phase 1 must already provide the backend app, config, errors, tests, and scripts. Later backend phases depend on this phase for PostgreSQL connectivity, baseline schema, typed database access, transaction wrappers, and integration test fixtures.

This phase must not be merged with Phase 1 because database behavior and migration integrity deserve a separate review. It must not be merged with Phase 3 because account/auth behavior should be layered on top of a proven database foundation. It must not include domain repositories because those depend on the transaction abstraction being stable first.

## 3. Source documents

- `docs/001_initial_schema_gardening_helper.sql` - defines baseline tables, constraints, indexes, uniqueness guards, and `updated_at` triggers.
- `docs/002_views_gardening_helper.sql` - defines read-oriented views including `inventory_product_balances`, `bed_current_contents`, `activity_detail_view`, `task_detail_view`, and `calendar_items_view`.
- `docs/003_seed_reference_data_gardening_helper.sql` - defines deterministic demo/reference seed data for local smoke tests.
- `docs/004_guards_and_triggers_gardening_helper.sql` - defines account/place consistency guards and reminder/photo/target integrity guards.
- `docs/gardening-helper-technical-requirements-and-erd.md` - defines entity relationships, PostgreSQL domain model, and transaction-critical tables.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `DbClient`, `DbTransaction`, repository rules, and transaction design.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines database as persistence truth, service-layer business truth, and no hidden business side-effect triggers.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines migration, trigger, rollback, and database integrity tests.
- `docs/env.example` - defines database and Supabase Postgres environment variables and private-network requirements.

## 4. Scope

### Backend scope

- Add database client setup for self-hosted Supabase Postgres.
- Add typed SQL/query-builder setup, preferably Kysely or equivalent.
- Add `DbClient` and `DbTransaction` abstractions.
- Add explicit transaction wrapper.
- Add migration runner or documented migration command.
- Add database connection lifecycle handling for app/tests.
- Add deterministic repository/service test database helper strategy.

### Database scope

- Register and execute the four provided migration files as baseline:
  - `docs/001_initial_schema_gardening_helper.sql`
  - `docs/002_views_gardening_helper.sql`
  - `docs/003_seed_reference_data_gardening_helper.sql`
  - `docs/004_guards_and_triggers_gardening_helper.sql`
- Add migration smoke test against an empty PostgreSQL-compatible database.
- Document how the seed file is used in local/dev/test contexts.

### Testing scope

- Add migration apply/reset smoke tests.
- Add database transaction rollback smoke test.
- Add representative constraint and guard trigger tests.

## 5. Out of scope

- Domain repositories and services.
- Domain API endpoints.
- Auth/JWT validation.
- Frontend work.
- Schema redesign.
- Business side-effect triggers.
- AI, weather, storage, or push integrations.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 1.
- Existing files expected: the four SQL migrations in `docs/`.
- Expected backend paths after implementation: `src/db/db.ts`, `src/db/transaction.ts`, `src/db/database.types.ts`, `src/db/migrations/` or equivalent migration wiring.
- Database requirements: local/test PostgreSQL-compatible database, ideally matching self-hosted Supabase Postgres behavior.
- Environment variables: `DATABASE_URL`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
- Test infrastructure requirements: test database reset/apply strategy and ability to run migration smoke tests without production secrets.

## 7. Domain rules and invariants affected

- Database is the persistence source of truth.
- Backend service layer is the business logic source of truth.
- Repository + transaction abstraction is mandatory.
- Database constraints are final safety net.
- No hidden business side-effect triggers.
- Check constraints enforce enums.
- Foreign keys enforce structural relationships.
- Polymorphic targets require service/trigger guards.
- PostgreSQL must not be publicly exposed.

## 8. API contract impact

This phase does not introduce or change API endpoints.

If Phase 1 added health diagnostics, this phase may add internal database health helpers, but no new public API contract endpoint is required.

## 9. Database impact

Tables involved:

- `accounts`, `places`, `plants`, `perennials`, `beds`, `persistent_bed_plants`, `yearly_bed_plantings`
- `products`, `product_usage_rules`, `inventory_lots`, `inventory_movements`
- `activities`, `activity_targets`, `activity_product_usages`
- `problems`, `problem_photos`
- `tasks`, `task_targets`, `task_reminders`, `quarantine_periods`
- `weather_events`, `ai_sessions`, `ai_suggestions`, `push_subscriptions`, `audit_logs`

Views involved:

- `inventory_product_balances`
- `bed_current_contents`
- `active_quarantine_periods`
- `activity_detail_view`
- `task_detail_view`
- `calendar_items_view`

Functions/triggers involved:

- `set_updated_at`
- account/place/product/target consistency trigger functions in `004_guards_and_triggers_gardening_helper.sql`
- reminder, photo, quarantine, weather, and target uniqueness guards.

Schema changes are not expected. New migrations are allowed only if the migration pack has a blocking executable mismatch, and the reason must be documented as a forward migration.

## 10. Backend design notes

- `DbClient.transaction<T>(fn)` should be the only service-facing transaction entrypoint.
- Repositories in later phases should accept either the normal DB handle or `DbTransaction`.
- Transaction wrapper must not let repositories silently open unmanaged nested transactions for critical flows.
- Migration execution should be deterministic and ordered.
- Seed data is local/dev/test convenience only and must not become authorization truth.
- Database errors should map into canonical API/domain errors in later service/controller layers.
- Forbidden shortcuts: raw SQL scattered across controllers, direct business workflow in DB triggers, editing historical migrations after implementation has started without documenting why.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

PostgreSQL connectivity is infrastructure, not an external business integration. PostgreSQL must be reachable privately in production deployment and must not be exposed publicly.

## 13. Testing requirements

### Unit tests

- Transaction helper commits successful callback results.
- Transaction helper rolls back failed callback work.

### Integration tests

- All four baseline SQL migrations apply cleanly to an empty database.
- Seed migration can be applied deterministically.
- `updated_at` trigger updates mutable records.
- Invalid enum/check values are rejected for representative tables.
- Product usage rule duplicate active product+plant is rejected.
- Inventory lot `quantity_remaining < 0` is rejected.
- Activity target duplicate row is rejected.
- Task target duplicate row is rejected.
- Reminder rows for non-planned tasks are rejected by guards.
- Problem photo metadata for `type = observation` is rejected.
- Account mismatch guards reject representative cross-account rows.

### Static/security checks

- Database config does not document or expose public PostgreSQL access.
- Test config does not use production database URLs.

## 14. Verification checklist

- [ ] Migration command applies `001` through `004` in order.
- [ ] Test database can be reset deterministically.
- [ ] `DbClient` and `DbTransaction` abstractions exist.
- [ ] Transaction rollback smoke test proves rollback behavior.
- [ ] Representative check constraints are tested.
- [ ] Representative guard triggers are tested.
- [ ] No domain repositories/services/endpoints were added.
- [ ] No schema changes were made unless documented in a new forward migration.
- [ ] PostgreSQL public exposure is not introduced in config or docs.
- [ ] Backend typecheck/lint/test/build commands pass where configured.

## 15. Review checklist

- [ ] Provided migrations are used as baseline.
- [ ] Migration order is deterministic.
- [ ] Transaction abstraction is explicit and reusable.
- [ ] Tests use a real PostgreSQL-compatible database where practical.
- [ ] DB guards are treated as structural safety nets, not service workflow replacements.
- [ ] No hidden business side-effect triggers were added.
- [ ] No domain CRUD/workflows slipped into this phase.
- [ ] No frontend code or provider adapters were added.
- [ ] Config keeps PostgreSQL private and secrets backend-only.

## 16. Suggested branch name

```text
feature/database-foundation
```

## 17. Expected PR summary

```md
## Summary
Implemented database migration and transaction foundation.

## Scope
- Added database client and transaction abstraction.
- Wired baseline SQL migrations.
- Added migration and transaction smoke tests.

## Domain rules preserved
- Database remains persistence truth.
- Services will own business workflows.
- No hidden business side-effect triggers were introduced.

## Tests
- <commands run and results>

## Deferred work
- Auth/account scoping, repositories, services, API endpoints, and frontend remain deferred.

## Review focus
- Migration integrity.
- Transaction wrapper behavior.
- Test DB reset strategy.
- Public database exposure and secret handling.
```

## 18. Risks and pitfalls

- Editing baseline migrations casually instead of adding documented forward fixes.
- Treating guard triggers as the place for business workflow orchestration.
- Using a database library that makes transactions hard to pass through repositories.
- Running tests against a developer or production database by accident.
- Skipping guard trigger smoke tests.
- Documenting a deployment shape that exposes PostgreSQL publicly.

## 19. Exit criteria

- All baseline migrations are executable.
- Database transaction abstraction is available for later services.
- Test database reset/apply flow is documented and tested.
- Representative constraints, guards, and rollback behavior are verified.
- No domain APIs or workflows have been implemented.
