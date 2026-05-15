# Implementation Task - Phase 3 Step 5: Authenticated Route Test Helpers and Fixtures

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
Create deterministic auth adapters, tokens, account fixtures, and request helpers for future account-scoping tests.
```

## Branch

Use branch:

```text
feature/auth-account-boundary
```

---

# Scope

Implement only:

- [ ] Inspect existing backend test helper patterns and Phase 2 test database helpers.
- [ ] Add a deterministic test auth adapter behind `AuthPort`.
- [ ] Add stable account A and account B fixture builders using the existing `accounts` table.
- [ ] Add test tokens or symbolic token helpers for:
  - [ ] account A
  - [ ] account B
  - [ ] invalid token
  - [ ] missing token requests
- [ ] Add request helper functions that attach `Authorization: Bearer <token>` consistently.
- [ ] Ensure helpers support API tests for future cross-account read/write rejection.
- [ ] Ensure fixture helpers never depend on production secrets or production databases.
- [ ] Keep fixtures minimal: accounts only unless a test explicitly needs more rows.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/test/helpers/auth.ts
backend/test/helpers/accounts.ts
backend/src/modules/auth/test-auth.adapter.ts
```

---

# Out of Scope

Do not implement:

- [ ] Domain fixtures for places, plants, beds, products, inventory, tasks, problems, weather, AI, or push.
- [ ] Frontend auth tests.
- [ ] Full E2E login flows.
- [ ] Supabase Auth user-management features.
- [ ] Role/permission fixtures beyond account A/account B.
- [ ] Public API endpoints.
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
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-03-auth-and-account-boundary.md`
- [ ] Prior files in `docs/implementation-phases/phase-03/`
- [ ] Existing backend test helpers, app factory, auth plugin, accounts repository, and database test helpers

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] auth/session boundary
- [ ] API contract
- [ ] database/migrations

Important rules to preserve:

```text
Cross-account fixtures are mandatory.
No endpoint or service should accidentally access account B data while authenticated as account A.
Frontend must not submit accountId for normal flows.
Backend derives authenticated user/account context server-side.
Seed data is local/dev/test convenience only and must not become authorization truth.
```

This step creates reusable test scaffolding, not business data access behavior.

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

- [ ] deterministic test auth adapter
- [ ] account A/account B fixtures
- [ ] authenticated request helpers
- [ ] invalid and missing token helpers
- [ ] test database safety integration if account rows are inserted
- [ ] docs/update notes for future endpoint test usage

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
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
None in this step, except existing test-only protected routes if introduced in Step 4.
```

Request helpers must use:

```http
Authorization: Bearer <access_token>
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] account scoping
- [ ] edge cases

Specific test cases:

1. Test helper creates account A and account B with stable identifiers or stable returned references.
2. Account A request helper attaches a valid account A authorization header.
3. Account B request helper attaches a valid account B authorization header.
4. Invalid-token helper triggers the same unauthorized path as provider verification failure.
5. Helpers can be reused without leaking state between tests.
6. Helpers refuse to reset or seed accounts against unsafe database targets when database helpers provide that guard.

---

# Acceptance Criteria

The task is complete when:

- [ ] Future API tests can issue account A and account B authenticated requests.
- [ ] Cross-account fixture pattern is documented and deterministic.
- [ ] Test auth adapter uses the same `AuthPort` contract as production auth.
- [ ] No production secrets or live Supabase Auth dependency are required for tests.
- [ ] No domain fixtures, frontend code, public endpoints, or schema changes are introduced.
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

Run database-backed account fixture tests against a dedicated local/test PostgreSQL-compatible database if required. If unavailable, report the exact missing prerequisite.

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

These helpers are part of the security foundation for later phases. Keep them easy to use so future endpoint tests naturally include account A/account B coverage.
