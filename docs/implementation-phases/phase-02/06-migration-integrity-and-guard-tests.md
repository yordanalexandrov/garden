# Implementation Task - Phase 2 Step 6: Migration Integrity and Guard Tests

## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

Final infrastructure/provider decisions:
- Deployment: Hetzner VPS + Docker Compose
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Add Phase 2 database integration tests proving the baseline migrations, representative constraints, guard triggers, and transaction rollback behavior.
```

## Branch

Use branch:

```text
feature/database-foundation
```

---

# Scope

Implement only:

- [ ] Add migration apply/reset smoke tests against an empty PostgreSQL-compatible test database.
- [ ] Add deterministic seed migration smoke coverage.
- [ ] Add representative `updated_at` trigger coverage.
- [ ] Add representative enum/check constraint coverage.
- [ ] Add representative unique constraint coverage.
- [ ] Add representative guard trigger coverage from `004_guards_and_triggers_gardening_helper.sql`.
- [ ] Add database transaction rollback smoke coverage if not already fully covered in Step 4.
- [ ] Ensure tests use the Phase 2 test database helpers and never production URLs.
- [ ] Keep test names explicit about the invariant being proven.

---

# Out of Scope

Do not implement:

- [ ] Domain repositories.
- [ ] Domain services.
- [ ] Domain API endpoints.
- [ ] Auth/JWT/account context.
- [ ] Frontend code.
- [ ] Provider adapters.
- [ ] Business workflow tests for activity creation, inventory allocation, task confirmation, AI acceptance, or weather confirmation.
- [ ] Schema redesign.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/003_seed_reference_data_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-02-database-migration-and-transaction-foundation.md`
- [ ] Prior files in `docs/implementation-phases/phase-02/`
- [ ] Existing backend database source, migration runner, and test helpers from prior Phase 2 steps

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] weather/rain confirmation
- [ ] database/migrations

Important rules to preserve:

```text
Database constraints are the final safety net.
Check constraints enforce enums.
Foreign keys enforce structural relationships.
Polymorphic targets require service/trigger guards.
No hidden business side-effect triggers.
Activity/task targets must resolve to concrete target rows.
Inventory is ledger-based.
Never mutate stock without an inventory movement.
Reminders are created only for planned tasks.
Problem photos are supported only for problems in v1.
Weather is advisory and must not auto-fail treatments.
```

This task verifies structural database guardrails only. It must not move service-layer workflow decisions into triggers.

---

# MCP Impact

This task:

- [ ] has no MCP impact

MCP tools affected:

```text
None.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] migration smoke tests
- [ ] seed migration smoke tests
- [ ] transaction rollback smoke tests
- [ ] representative check/unique constraint tests
- [ ] representative guard trigger tests
- [ ] docs/update notes if local database prerequisites change

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] account scoping enforced backend-side when business endpoints exist
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
None in this step.
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] account scoping
- [ ] transaction rollback
- [ ] edge cases

Specific test cases:

1. All four baseline SQL migrations apply cleanly to an empty database in order.
2. Seed migration applies deterministically in the documented local/dev/test context.
3. `updated_at` trigger updates a representative mutable record.
4. Invalid enum/check values are rejected for representative tables.
5. Duplicate active `product_usage_rules` for the same product+plant is rejected.
6. `inventory_lots.quantity_remaining < 0` is rejected.
7. Duplicate `activity_targets` for the same activity target row is rejected.
8. Duplicate `task_targets` for the same task target row is rejected.
9. Reminder rows for non-planned tasks are rejected by guards.
10. Problem photo metadata for an observation is rejected.
11. Representative cross-account/place/product mismatch guards reject invalid rows.
12. Transaction rollback smoke test proves writes are rolled back after failure.

---

# Acceptance Criteria

The task is complete when:

- [ ] Migration apply/reset smoke tests pass against a dedicated test database.
- [ ] Representative check constraints are tested.
- [ ] Representative guard triggers are tested.
- [ ] Transaction rollback behavior is proven.
- [ ] Tests do not require or mutate production/shared databases.
- [ ] No domain repositories, services, endpoints, or frontend work are introduced.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run the database integration tests against a dedicated local/test PostgreSQL-compatible database. If no database is available, report the exact missing prerequisite and list which tests were not run.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules affected
- API changes
- Database changes
- Tests run
- Integration/provider status
- Review focus

---

# Notes for Implementation Agent

Guard triggers are structural safety nets, not the place for hidden business workflows.

When a test needs cross-account rows, keep the fixture data minimal and explain the mismatch being tested.

Do not claim database integrity tests passed unless they ran against an actual PostgreSQL-compatible database.
