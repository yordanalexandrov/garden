# Implementation Task - Phase 2 Step 7: Verification and PR Readiness

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
Complete Phase 2 verification, confirm scope boundaries, run checks, and prepare the PR description for database migration and transaction foundation.
```

## Branch

Use branch:

```text
feature/database-foundation
```

---

# Scope

Implement only:

- [ ] Review all Phase 2 implementation files for consistency with the phase spec.
- [ ] Confirm migration command applies `001` through `004` in deterministic order.
- [ ] Confirm test database reset/apply flow is documented and guarded.
- [ ] Confirm `DbClient` and `DbTransaction` abstractions exist.
- [ ] Confirm transaction rollback smoke test proves rollback behavior.
- [ ] Confirm representative check constraints and guard triggers are tested.
- [ ] Confirm no domain repositories, services, endpoints, frontend code, provider adapters, or business side-effect triggers were added.
- [ ] Run all required backend checks.
- [ ] Run database integration tests against a dedicated local/test PostgreSQL-compatible database.
- [ ] Run static/scope checks for database exposure, provider SDK usage, and out-of-scope code.
- [ ] Prepare a PR description using the Phase 2 expected PR summary.

---

# Out of Scope

Do not implement:

- [ ] New domain features.
- [ ] Domain repositories or services.
- [ ] Domain API endpoints.
- [ ] Auth/JWT/account context.
- [ ] Frontend project or pages.
- [ ] Provider adapters.
- [ ] Deployment files beyond minimal docs required for database command/test expectations.
- [ ] Extra refactors unrelated to Phase 2.
- [ ] Schema redesign unless a blocking executable mismatch was already documented in a forward migration.

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
- [ ] All prior files in `docs/implementation-phases/phase-02/`
- [ ] All backend source, test, config, package, migration, and docs files changed in Phase 2

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
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
Database is the persistence source of truth.
Backend service layer is the business logic source of truth.
Repository + transaction abstraction is mandatory.
Database constraints are final safety net.
No hidden business side-effect triggers.
Check constraints enforce enums.
Foreign keys enforce structural relationships.
Polymorphic targets require service/trigger guards.
PostgreSQL must not be publicly exposed.
No domain APIs or workflows are implemented in Phase 2.
```

Many domain areas are touched only by database guardrails. Do not implement their service workflows in this phase.

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

- [ ] tests
- [ ] docs/update notes
- [ ] PR description
- [ ] verification checklist

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
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] account scoping enforced backend-side where business endpoints exist
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`
- [ ] worker/scheduler ownership is explicit for reminders/weather checks

---

# API Contract

Endpoints involved:

```text
None in this phase.
```

If Phase 1 health behavior remains present, it must continue to follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] edge cases

Specific test cases:

1. Migration command applies `001` through `004` in order.
2. Test database reset/apply strategy works deterministically.
3. Transaction helper commits successful callback results.
4. Transaction helper rolls back failed callback work.
5. Representative check constraints reject invalid data.
6. Representative guard triggers reject invalid cross-entity data.
7. Static/scope checks show no domain APIs, provider adapters, frontend direct DB access, or public PostgreSQL exposure were added.

---

# Acceptance Criteria

The task is complete when:

- [ ] All baseline migrations are executable.
- [ ] Database transaction abstraction is available for later services.
- [ ] Test database reset/apply flow is documented and tested.
- [ ] Representative constraints, guards, and rollback behavior are verified.
- [ ] No domain APIs or workflows have been implemented.
- [ ] No schema changes were made unless documented in a new forward migration.
- [ ] PostgreSQL public exposure is not introduced in config or docs.
- [ ] Backend typecheck/lint/test/build commands pass where configured.
- [ ] PR description is complete.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run any added database commands/tests, for example:

```bash
npm run db:migrate
npm run test:db
```

Adjust command names to the implementation. If any command does not exist, no local/test database is available, or a command fails due to pre-existing setup, report the exact command, exit state, and reason.

Optional static/scope checks:

```bash
rg -n "SUPABASE_SERVICE_ROLE_KEY|VAPID_PRIVATE_KEY|AI_API_KEY|POSTGRES_PASSWORD|DATABASE_URL" backend
rg -n "from '@supabase|createClient|open-meteo|web-push|OpenAI" backend/src
rg -n "app\\.(get|post|patch|delete|put)\\(" backend/src/modules backend/src/app
```

If expected references exist in config, redaction tests, or database setup, explain them in the PR.

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

Suggested PR description:

```md
## Summary
Implemented database migration and transaction foundation.

## Scope
- Added database client and transaction abstraction.
- Wired baseline SQL migrations.
- Added migration and transaction smoke tests.
- Added representative database constraint and guard tests.

## Domain Rules Preserved
- Database remains persistence truth.
- Services will own business workflows.
- No hidden business side-effect triggers were introduced.
- PostgreSQL remains private and backend-only.

## API Changes
- None.

## Database Changes
- Registered baseline migrations `001` through `004`.
- <List any forward migration only if one was required, with the reason.>

## Tests
- <commands run and results>

## Integration/Provider Status
- PostgreSQL connectivity only.
- Auth, Storage, Weather, Push, AI, workers, and frontend remain deferred.

## Deferred Work
- Auth/account scoping, repositories, services, API endpoints, and frontend remain deferred.

## Review Focus
- Migration integrity.
- Transaction wrapper behavior.
- Test DB reset strategy.
- Guard trigger and constraint coverage.
- Public database exposure and secret handling.
```

---

# Notes for Implementation Agent

Do not optimize for speed by weakening migration, transaction, or database guard coverage.

Do not claim database tests passed unless they ran against an actual PostgreSQL-compatible database.

If a baseline migration has an executable mismatch, document why and prefer a forward migration over silently changing history.
