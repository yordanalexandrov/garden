# Implementation Task - Phase 8 Step 6: Product/Rule Account Consistency and Regression Tests

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
Harden Phase 8 with focused account consistency, duplicate active rule, archive, API contract, database guard, and regression tests for products and product usage rules.
```

## Branch

Use branch:

```text
feature/backend-products-rules
```

---

# Scope

Implement only:

- [ ] Inspect all Phase 8 implementation from Steps 1-5 and existing backend test helper patterns.
- [ ] Add missing product/rule fixture helpers for account A/account B, plants, products, and rules.
- [ ] Add or strengthen service/repository tests for product account scoping.
- [ ] Add or strengthen route tests for product API canonical envelopes and error shapes.
- [ ] Add or strengthen service/repository tests for product/rule/plant account consistency.
- [ ] Add or strengthen route tests for usage rule API canonical envelopes and error shapes.
- [ ] Add database guard tests for `trg_product_usage_rules_validate_accounts` if the project has DB guard test infrastructure.
- [ ] Add database uniqueness tests for `uq_product_usage_rules_product_plant_active` if the project has DB guard test infrastructure.
- [ ] Verify archived products/rules are excluded by default where applicable and archived rules allow replacement active rules.
- [ ] Verify Phase 8 did not introduce inventory, activity, AI, frontend, storage, weather, push, or MCP behavior.
- [ ] Keep tests deterministic and isolated using the existing safe test database reset/fixture approach.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/test/products/
backend/test/products/products.routes.test.ts
backend/test/products/product-usage-rules.routes.test.ts
backend/test/products/products.repository.test.ts
backend/test/products/product-usage-rules.repository.test.ts
backend/test/products/products.service.test.ts
backend/test/products/product-usage-rules.service.test.ts
backend/test/db/product-usage-rules.guards.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] New product or rule features beyond test-driven fixes needed to satisfy Phase 8.
- [ ] Inventory lot/movement tests except assertions that Phase 8 does not mutate inventory.
- [ ] Activity product usage, quarantine, suggested tasks, planned tasks, reminders, target resolver, AI, frontend, storage, weather, push, or MCP tests.
- [ ] Schema redesign or migration changes unless a blocking mismatch is documented.
- [ ] Broad refactors unrelated to Phase 8 behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 10 and 11
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 14 and 15
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` product/rule, account-scoping, and database guard tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` product repository/service sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` products/rules sections
- [ ] `docs/001_initial_schema_gardening_helper.sql` product/rule tables and unique indexes
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql` product/rule account consistency trigger
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing Phase 8 product module files from Steps 1-5
- [ ] Existing backend test helpers, database reset helpers, and account auth fixtures

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] product usage rules
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Services orchestrate workflows and transactions.
Repositories only access data.
All product and rule access is account-scoped.
Product/rule/plant account consistency is mandatory.
Product category and unit values are controlled.
One active product+plant rule is allowed in v1.
Archived rules do not count as active.
Products and rules are archived, not hard-deleted.
Rule changes do not rewrite history.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Inventory is ledger-based and must not be mutated in this phase.
MCP mutation tools must preserve account scoping, confirmation rules, auditability, and domain invariants.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 8. This task may document test evidence that future MCP tools must preserve the same service/API boundaries.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] fixture helpers
- [ ] regression fixes only if tests expose Phase 8 defects
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
GET /api/v1/products
POST /api/v1/products
GET /api/v1/products/:productId
PATCH /api/v1/products/:productId
POST /api/v1/products/:productId/archive
GET /api/v1/products/:productId/rules
POST /api/v1/products/:productId/rules
GET /api/v1/product-rules/:ruleId
PATCH /api/v1/product-rules/:ruleId
POST /api/v1/product-rules/:ruleId/archive
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` sections 14 and 15

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback where service transactions are used
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Account A product list/detail/update/archive never exposes Account B products.
2. Account A usage rule list/detail/update/archive never exposes Account B rules.
3. Product creation rejects invalid category and invalid unit.
4. Usage rule creation rejects invalid dose, unit, and interval values.
5. Usage rule creation rejects Account B plant for Account A product.
6. Usage rule creation rejects Account B product for Account A actor.
7. Duplicate active product+plant rule returns canonical `CONFLICT`.
8. Archived rule allows replacement active rule for the same product+plant.
9. Product/rule account consistency database trigger rejects mismatched account references.
10. Unique active rule index rejects duplicate unarchived product+plant rows.
11. Product detail response shape includes `usageRules`, `inventorySummary`, and `recentMovements`.
12. Phase 8 create/update/archive operations do not create inventory lots, inventory movements, activities, tasks, AI suggestions, or MCP records.
13. Protected routes reject unauthenticated requests.
14. Error envelopes match existing canonical validation/not-found/conflict shape.

---

# Acceptance Criteria

The task is complete when:

- [ ] Product/rule account consistency is covered at service/API and database guard levels where infrastructure supports it.
- [ ] Duplicate active rule behavior and archived replacement behavior are covered by tests.
- [ ] Product/rule API response shapes are covered by tests.
- [ ] No cross-account data leak is possible through Phase 8 endpoints.
- [ ] No inventory, activity, AI, frontend, schema, or MCP behavior is introduced except regression assertions that those remain untouched.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

From the backend package root, run relevant commands:

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
