# Implementation Task - Phase 9 Step 6: Inventory Ledger Account Scope, Rollback, and Guard Regression Tests

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
Complete Phase 9 cross-cutting tests and regression checks proving inventory ledger account scope, transactional rollback, database guards, no negative stock, and forbidden-scope boundaries.
```

## Branch

Use branch:

```text
feature/backend-inventory-ledger
```

---

# Scope

Implement only:

- [ ] Review Phase 9 code from Steps 1-5 for missing tests and behavior gaps.
- [ ] Add or strengthen account A/account B fixtures for products, inventory lots, and inventory movements.
- [ ] Prove inventory overview, lot list, lot creation, movement history, and adjustments never leak cross-account rows or totals.
- [ ] Prove create/adjust endpoints reject cross-account product and lot references.
- [ ] Prove purchase lot creation rolls back the lot when movement creation fails.
- [ ] Prove manual adjustment rolls back the movement when lot update fails.
- [ ] Prove negative lot checks work at validation/service level and database constraint level.
- [ ] Add database guard smoke tests for inventory lot/product account mismatch, movement/product account mismatch, movement/lot account mismatch, and movement lot/product mismatch.
- [ ] Prove movement history remains append-only for normal Phase 9 flows.
- [ ] Add regression checks that no activity product consumption, frontend code, provider calls, MCP tools, schema redesign, or direct database bypass drift was introduced by Phase 9.
- [ ] Keep database-backed tests safely skipped or clearly reported when no local/private test database is configured, following existing project patterns.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/test/inventory/
backend/test/db/inventory-guards.test.ts
backend/test/helpers/
backend/test/db/helpers/fixtures.ts
backend/test/phase-09/
```

---

# Out of Scope

Do not implement:

- [ ] New application behavior beyond filling Phase 9 test gaps.
- [ ] Activity product consumption, activity target resolver, quarantine, suggested tasks, or activity transaction flow.
- [ ] Product/rule features beyond fixture setup required by inventory tests.
- [ ] Frontend pages or frontend API services.
- [ ] AI, weather, storage, push, worker, deployment, or MCP tools.
- [ ] Schema redesign.
- [ ] Test shortcuts that bypass the Fastify API when testing API behavior.

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
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] All prior files in `docs/implementation-phases/phase-09/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All backend files changed in Phase 9 Steps 1-5
- [ ] Existing backend test helpers, database reset helpers, and fixtures

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Inventory movement ledger is mandatory.
Every stock change must have an inventory movement.
Current lot quantity is derived/convenience state.
Purchase lot creation creates purchase movement in the same transaction.
Manual changes create manual_adjustment or correction movements.
No negative lot quantity in v1.
Unit conversion is limited.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 9. Regression checks must prove no MCP tools were added and future tools cannot be a privileged bypass of the ledger service/API.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] test fixtures
- [ ] database guard smoke tests
- [ ] static/scope regression checks
- [ ] docs/update notes only if test commands or setup changed

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
GET /api/v1/inventory
GET /api/v1/products/:productId/inventory-lots
POST /api/v1/products/:productId/inventory-lots
GET /api/v1/products/:productId/inventory-movements
POST /api/v1/inventory/adjustments
```

Regression tests must verify:

```text
Success envelopes use { data: ... }.
List envelopes use { data: { items, page, pageSize, total } } when endpoint is paginated.
Errors use { error: { code, message, details } }.
Auth failures use UNAUTHORIZED.
Missing/inaccessible records use the implementation's documented NOT_FOUND/FORBIDDEN policy consistently.
Cross-account product/lot references are rejected.
Manual decrease that would make stock negative is rejected without creating movement history.
```

---

# Tests Required

Add or update tests for:

- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shapes
- [ ] validation errors
- [ ] database guard triggers
- [ ] static/scope regressions

Specific test cases:

1. Account A inventory overview excludes account B products, lots, quantities, and totals.
2. Account A lot list excludes account B lots.
3. Account A movement history excludes account B movements.
4. Account A cannot create a lot for account B product.
5. Account A cannot adjust account B lot.
6. Account A cannot adjust account A product with account B lot.
7. Lot creation rollback leaves no lot when movement creation fails.
8. Adjustment rollback leaves no movement when lot update fails.
9. Decrease below zero is rejected, creates no movement, and leaves lot unchanged.
10. Direct DB insert/update rejects negative `inventory_lots.quantity_remaining`.
11. DB guard rejects `inventory_lots.account_id` that differs from product account.
12. DB guard rejects `inventory_movements.account_id` that differs from product account.
13. DB guard rejects movement lot/account mismatch.
14. DB guard rejects movement lot/product mismatch.
15. Static/scope regression proves no activity consumption code was added.
16. Static/scope regression proves no frontend inventory pages or frontend API services were added in Phase 9.
17. Static/scope regression proves no provider, storage, push, weather, AI, or MCP tools were added.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 9 has cross-cutting account-scope tests for all inventory endpoints.
- [ ] Transaction rollback is explicitly tested for lot purchase and manual adjustment flows.
- [ ] Database guard and negative-lot constraints are covered by DB-backed tests.
- [ ] Static/scope checks show Phase 9 did not implement out-of-scope frontend, activity, provider, MCP, or schema work.
- [ ] Tests use the Fastify API for API behavior and repositories/database only for repository or guard tests.
- [ ] Relevant checks pass or failures are clearly documented.

---

# Commands to Run

Run relevant commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
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

Review focus for this step:

```text
Ledger invariants, account scoping across every inventory endpoint, rollback proof, database guard coverage, and forbidden-scope regression checks.
```
