# Implementation Task - Phase 19 Step 5: Calendar/Dashboard Account Scope, Read-Only, and Response Tests

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
Add focused Phase 19 regression coverage for calendar/dashboard response shapes, filters, account scoping, read-only behavior, and moderate-data aggregation.
```

## Branch

Use branch:

```text
feature/backend-calendar-dashboard
```

---

# Scope

Implement only:

- [ ] Inspect existing backend route, integration, repository, fixture, and database reset test patterns.
- [ ] Seed or reuse deterministic fixtures for account A, account B, places, activities, suggested tasks, planned tasks, quarantine periods, problems, products/inventory, and optional weather events.
- [ ] Test calendar response shape and canonical success envelope.
- [ ] Test calendar required `from`/`to` validation and canonical error envelope.
- [ ] Test calendar date-range filtering, including quarantine overlap behavior.
- [ ] Test calendar optional `placeId` filtering.
- [ ] Test calendar account scoping so Account A cannot see Account B activities, tasks, quarantine periods, or weather events.
- [ ] Test that suggested and planned tasks remain distinguishable in calendar output.
- [ ] Test dashboard response shape and canonical success envelope with every required bucket.
- [ ] Test dashboard optional `placeId` filtering.
- [ ] Test dashboard account scoping so Account A cannot see Account B tasks, quarantine, activities, problems, low-stock products, or places.
- [ ] Test dashboard read-only behavior against relevant row counts or timestamps.
- [ ] Add a moderate seeded data test if local test infrastructure supports it without making tests brittle.
- [ ] Add or update static/boundary tests only if the project already has an obvious pattern for backend read API boundaries.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/test/calendar/
backend/test/dashboard/
backend/test/fixtures/
```

---

# Out of Scope

Do not implement:

- [ ] New application behavior beyond tests and small fixes needed to satisfy Phase 19 contract.
- [ ] Frontend tests.
- [ ] Task lifecycle mutation tests except verifying no mutation happened from reads.
- [ ] Weather provider, push, worker, AI, storage, deployment, or MCP tests.
- [ ] Schema changes or migrations.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 14, 15, and 16
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 20.1 and 24.1
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` calendar/dashboard, account scoping, API contract, and performance sections
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend test helper, fixture, db reset, auth test actor, route, and repository test files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] activities
- [ ] inventory
- [ ] quarantine
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] weather/rain confirmation
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary

Important rules to preserve:

```text
Cross-account access is forbidden.
Calendar and dashboard are read models only.
Calendar filters must not change business data.
Dashboard reads must not mutate inventory, tasks, activities, problems, quarantine, or places.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Weather is advisory and must not be generated or confirmed by read APIs.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 19.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] fixtures
- [ ] docs/update notes only if test setup commands change

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no provider calls from Phase 19 read tests

---

# API Contract

Endpoints involved:

```text
GET /api/v1/calendar
GET /api/v1/dashboard
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`
- Canonical success and error envelopes

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Calendar returns separate sections for activities, tasks, quarantine periods, and weather events.
2. Calendar includes suggested and planned tasks with status.
3. Calendar date and place filters work and are account-scoped.
4. Missing calendar `from`/`to` returns canonical `VALIDATION_ERROR`.
5. Dashboard returns upcoming tasks, suggested tasks, active quarantine, recent activities, open problems, low-stock products, and places.
6. Dashboard optional `placeId` filter works and is account-scoped.
7. Account A cannot see Account B calendar/dashboard data.
8. Calendar/dashboard reads do not mutate database state.
9. Moderate seeded data can be aggregated within reasonable local test time if local performance tests are established.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 19 read APIs have focused regression coverage.
- [ ] Account scope, filters, response shape, and read-only behavior are tested.
- [ ] Tests use deterministic local fixtures and do not depend on real external providers.
- [ ] No unrelated changes are included.

---

# Commands to Run

Run relevant commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
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
