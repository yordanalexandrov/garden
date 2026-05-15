# Implementation Task - Phase 2 Step 5: Test Database Reset and Fixtures

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
Create a deterministic test database reset/apply helper strategy for Phase 2 database integration tests.
```

## Branch

Use branch:

```text
feature/database-foundation
```

---

# Scope

Implement only:

- [ ] Add test database helper modules under the backend test tree.
- [ ] Provide a deterministic reset/apply strategy for an empty PostgreSQL-compatible test database.
- [ ] Apply baseline migrations in order during test setup where required.
- [ ] Decide and document whether seed data is applied by default or only by explicit helper.
- [ ] Add guardrails that prevent tests from resetting production or non-test databases.
- [ ] Add deterministic fixture helpers for Phase 2 database integrity tests only.
- [ ] Keep fixtures minimal and close to the constraints/guards being tested.
- [ ] Ensure test helpers close all database connections.

Suggested path:

```text
backend/test/db/helpers/
```

---

# Out of Scope

Do not implement:

- [ ] Domain repository test fixtures.
- [ ] API-level fixtures.
- [ ] Auth/JWT/account fixtures beyond rows needed to satisfy database constraints.
- [ ] Frontend tests.
- [ ] Provider mocks.
- [ ] Full v1 seed strategy beyond local/dev/test migration seed handling.
- [ ] Domain services or endpoints.

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
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/003_seed_reference_data_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-02-database-migration-and-transaction-foundation.md`
- [ ] Prior files in `docs/implementation-phases/phase-02/`
- [ ] Existing backend database source and tests from prior Phase 2 steps

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] database/migrations
- [ ] deployment/security docs

Important rules to preserve:

```text
Database is the persistence source of truth.
Database constraints are the final safety net.
Seed data is local/dev/test convenience only and must not become authorization truth.
Account scoping is enforced backend-side when business endpoints exist.
PostgreSQL must not be publicly exposed.
Test config must not use production database URLs.
```

Account scoping is touched only at the fixture level: create cross-account rows where needed for guard tests, but do not implement auth or endpoint authorization here.

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

- [ ] deterministic test database reset helper
- [ ] migration apply helper
- [ ] optional seed apply helper
- [ ] minimal fixture builders for database integrity tests
- [ ] test database safety checks
- [ ] docs/update notes for test database prerequisites

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
- [ ] edge cases

Specific test cases:

1. Test reset helper refuses to run without an explicit test database URL or equivalent safe marker.
2. Test reset helper produces an empty schema-ready database after migrations are applied.
3. Optional seed helper can be applied deterministically when enabled.
4. Test helpers close database connections after setup/teardown.

---

# Acceptance Criteria

The task is complete when:

- [ ] Test database can be reset deterministically.
- [ ] Baseline migrations can be applied by test helpers.
- [ ] Seed data behavior is explicit and documented.
- [ ] Test helpers protect production/shared databases.
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

Run database integration tests against a dedicated local/test PostgreSQL-compatible database if available. If unavailable, report the exact missing prerequisite.

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

Do not make tests depend on production secrets.

Do not use seed rows as authorization truth.

Keep fixtures small enough that each guard/constraint test explains what it is proving.
