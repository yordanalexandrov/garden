# Implementation Task - Phase 2 Step 2: Baseline Migration Runner

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
Wire deterministic execution of the provided Phase 2 SQL migration pack in order, with a safe backend command for local/test databases.
```

## Branch

Use branch:

```text
feature/database-foundation
```

---

# Scope

Implement only:

- [ ] Inspect the four provided SQL files and confirm their required execution order.
- [ ] Add migration runner wiring under the backend database layer.
- [ ] Ensure migration execution is deterministic and ordered as `001`, `002`, `003`, `004`.
- [ ] Register the provided baseline migration files without casually editing them.
- [ ] Add a backend migration command or documented migration command that targets a configured local/test database.
- [ ] Make the seed file usage explicit: local/dev/test convenience only, never authorization truth.
- [ ] Add safety checks that discourage or reject production/shared database URLs for test/reset commands.
- [ ] Document any unavoidable executable mismatch as a new forward migration instead of silently rewriting historical migrations.

Baseline migration files:

```text
docs/001_initial_schema_gardening_helper.sql
docs/002_views_gardening_helper.sql
docs/003_seed_reference_data_gardening_helper.sql
docs/004_guards_and_triggers_gardening_helper.sql
```

---

# Out of Scope

Do not implement:

- [ ] Schema redesign.
- [ ] Domain repositories or services.
- [ ] Domain API endpoints.
- [ ] Auth/JWT validation or account context.
- [ ] Frontend code.
- [ ] Provider adapters.
- [ ] Business side-effect triggers.
- [ ] Test helper reset strategy beyond the minimum needed to smoke-test migration command wiring.

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
- [ ] `docs/env.example`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/003_seed_reference_data_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-02-database-migration-and-transaction-foundation.md`
- [ ] `docs/implementation-phases/phase-02/01-database-dependencies-and-config.md`
- [ ] Existing backend database/config/package files from Step 1

---

# Domain Rules Affected

This task touches:

- [ ] database/migrations
- [ ] deployment/security docs

Important rules to preserve:

```text
Use the provided migrations as the schema baseline.
Database constraints are the final safety net.
No hidden business side-effect triggers.
Check constraints enforce enums.
Foreign keys enforce structural relationships.
Polymorphic targets require service/trigger guards.
PostgreSQL must not be publicly exposed.
Seed data is local/dev/test convenience only and not authorization truth.
```

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

- [ ] migration runner or documented migration command
- [ ] deterministic baseline migration registration
- [ ] seed file handling documentation
- [ ] database safety checks for test/reset commands
- [ ] migration command smoke test or script-level test where practical

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
- [ ] validation errors
- [ ] edge cases

Specific test cases:

1. Migration runner discovers or registers exactly the `001` through `004` baseline files in deterministic order.
2. Migration command refuses unsafe database targets according to the implemented local/test guard.
3. Seed migration usage is documented as dev/test-only and not required for production authorization behavior.

---

# Acceptance Criteria

The task is complete when:

- [ ] Migration command applies or is ready to apply `001` through `004` in order.
- [ ] Migration ordering is deterministic and reviewed in code/tests.
- [ ] Seed data usage is documented clearly.
- [ ] Historical baseline migrations are not edited unless a blocking executable mismatch is documented and fixed by a forward migration.
- [ ] No domain repositories, services, endpoints, or frontend work are introduced.
- [ ] No config or docs introduce public PostgreSQL exposure.
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

Run the migration command against a dedicated local/test PostgreSQL-compatible database if it is available. If it is not available, report the exact missing prerequisite and do not claim migration execution passed.

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

Do not hide business workflows in database triggers.

Do not run reset/apply commands against production or shared developer databases.

Do not claim migration execution passed unless it ran against an actual PostgreSQL-compatible database.
