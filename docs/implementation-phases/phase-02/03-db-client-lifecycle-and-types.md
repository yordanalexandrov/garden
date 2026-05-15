# Implementation Task - Phase 2 Step 3: DB Client Lifecycle and Types

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
Create the application database client factory, typed database surface, and connection lifecycle hooks needed by later repositories and tests.
```

## Branch

Use branch:

```text
feature/database-foundation
```

---

# Scope

Implement only:

- [ ] Add a database client factory that creates typed PostgreSQL access from backend-only config.
- [ ] Add `DbClient` as the global application database entrypoint.
- [ ] Add `database.types.ts` or equivalent typed table/view surface for the baseline schema.
- [ ] Include baseline tables and views needed by Phase 2 tests.
- [ ] Add connection close/destroy behavior for app shutdown and tests.
- [ ] Add an optional database health helper if it remains internal and does not add a new public API endpoint.
- [ ] Ensure importing database modules does not open a connection automatically.
- [ ] Keep repositories out of this step; later phases will add domain-specific data access.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/db/db.ts
backend/src/db/database.types.ts
```

---

# Out of Scope

Do not implement:

- [ ] Transaction wrapper behavior beyond method placeholders needed for type compatibility.
- [ ] Domain repositories or service methods.
- [ ] Domain API endpoints.
- [ ] Auth/JWT validation or account context.
- [ ] Frontend code.
- [ ] Provider adapters.
- [ ] Public database health route.
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
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/003_seed_reference_data_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-02-database-migration-and-transaction-foundation.md`
- [ ] Prior files in `docs/implementation-phases/phase-02/`
- [ ] Existing backend app/config/source/test files

---

# Domain Rules Affected

This task touches:

- [ ] database/migrations
- [ ] auth/session boundary
- [ ] API contract

Important rules to preserve:

```text
Database is the persistence source of truth.
Backend service layer is the business logic source of truth.
Repository + transaction abstraction is mandatory.
Repositories only access data.
Frontend never talks directly to the database.
PostgreSQL must not be publicly exposed.
Supabase service role key is backend-only.
```

The auth/session boundary is touched only by preserving it: this step must not add JWT validation or account context.

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

- [ ] database client factory
- [ ] typed database access surface
- [ ] connection lifecycle handling
- [ ] internal health helper if useful
- [ ] tests for factory/lifecycle behavior that do not require a production database

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

If an internal database health helper is added, it must not change the public canonical API contract unless a later task explicitly scopes that endpoint.

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] edge cases

Specific test cases:

1. Database client factory requires backend-only database config and does not expose credentials through frontend-safe config.
2. Importing database modules has no connection side effects.
3. Created database client can be closed/destroyed cleanly in tests.
4. Typed database surface compiles against representative baseline tables and views.

---

# Acceptance Criteria

The task is complete when:

- [ ] `DbClient` or equivalent global database entrypoint exists.
- [ ] Typed database table/view definitions exist for baseline schema coverage needed by Phase 2.
- [ ] Database connections are created explicitly and closed deterministically.
- [ ] No public API endpoints are added.
- [ ] No domain repositories, services, or frontend work are introduced.
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

Keep this as infrastructure for later services. Do not add domain CRUD in this step.

Do not initialize provider SDKs or expose database details to the frontend.

Do not claim database connectivity passed unless a real local/test database was used.
