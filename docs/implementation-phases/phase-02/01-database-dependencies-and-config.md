# Implementation Task - Phase 2 Step 1: Database Dependencies and Config

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
Add the backend database package dependencies, database config validation, and Phase 2 database folder conventions without opening connections or running migrations yet.
```

## Branch

Use branch:

```text
feature/database-foundation
```

---

# Scope

Implement only:

- [ ] Inspect the existing backend package, scripts, config loader, tests, and TypeScript settings.
- [ ] Select and add the typed SQL/query-builder stack, preferably Kysely with a PostgreSQL driver.
- [ ] Add only the dependencies needed for database connectivity, typed queries, migrations, and database tests.
- [ ] Extend backend config types and validation for `DATABASE_URL`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` if current config is insufficient.
- [ ] Keep database secrets backend-only and covered by existing redaction/static checks.
- [ ] Create the Phase 2 database source/test folder structure expected by later steps.
- [ ] Add or update package scripts only for database migration/test commands that later Phase 2 steps will use.
- [ ] Update backend README notes only for local/test database env expectations, if needed.

Suggested backend structure:

```text
backend/src/db/
  db.ts
  transaction.ts
  database.types.ts
  migrations/

backend/test/db/
  helpers/
```

---

# Out of Scope

Do not implement:

- [ ] Database connection creation.
- [ ] Migration runner logic.
- [ ] Transaction wrapper behavior.
- [ ] Domain repositories or repository contracts beyond generic database abstractions.
- [ ] Domain services or API endpoints.
- [ ] Auth/JWT validation or account context.
- [ ] Frontend code.
- [ ] Provider adapters.
- [ ] Schema changes.

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
- [ ] `docs/implementation-phases/phase-02-database-migration-and-transaction-foundation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend `package.json`, config, logger, README, source, and test files

---

# Domain Rules Affected

This task touches:

- [ ] database/migrations
- [ ] deployment/security docs

Important rules to preserve:

```text
Database is the persistence source of truth.
Backend service layer is the business logic source of truth.
Repository + transaction abstraction is mandatory.
No hidden business side-effect triggers.
Supabase service role key is backend-only.
PostgreSQL must not be publicly exposed.
Frontend never talks directly to the database.
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

- [ ] database dependency setup
- [ ] database env/config validation
- [ ] backend database folder conventions
- [ ] package scripts for later database commands, if needed
- [ ] README/update notes for local/test database env, if needed
- [ ] config and redaction tests for new database config behavior

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

- [ ] validation errors
- [ ] edge cases

Specific test cases:

1. Backend config accepts valid database env values without exposing them as frontend-safe config.
2. Empty optional database env values continue to parse as undefined in local/dev defaults.
3. Secret redaction/static checks cover `DATABASE_URL`, `POSTGRES_PASSWORD`, and any new database credential fields.

---

# Acceptance Criteria

The task is complete when:

- [ ] Database dependencies are added intentionally and minimally.
- [ ] Database env config is typed and backend-only.
- [ ] Database source/test folder conventions exist or are documented for later steps.
- [ ] No database connection is opened at module import time.
- [ ] No migration execution is implemented yet.
- [ ] No domain repositories, services, or endpoints are introduced.
- [ ] PostgreSQL public exposure is not introduced in config or docs.
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

If any command does not exist or fails due to pre-existing setup, report it clearly.

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

Do not redesign the project layout beyond what Phase 2 needs.

Do not initialize Supabase Auth, Storage, Weather, AI, or Push providers in this task.

Do not claim tests passed unless they were actually run.
