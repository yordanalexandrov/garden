# Implementation Task - Phase 8 Step 1: Products/Rules Module Contracts, Validation, and Route Wiring

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
Prepare the backend products module contracts, canonical validation schemas, DTO mapping helpers, and route wiring needed for Phase 8 Products and Product Usage Rules APIs.
```

## Branch

Use branch:

```text
feature/backend-products-rules
```

---

# Scope

Implement only:

- [ ] Inspect existing backend app, route registration, auth plugin, database client, transaction handle, envelope helpers, validation helper, plants module, and test helper patterns.
- [ ] Create the `backend/src/modules/products/` module structure, unless an equivalent module already exists.
- [ ] Define TypeScript domain/input/filter/DTO types for products and product usage rules using existing `UUID`, `DbHandle`, transaction, and database table types where appropriate.
- [ ] Define canonical `ProductCategory` values:
  - `insecticide`
  - `fungicide`
  - `pesticide`
  - `fertilizer`
  - `foliar_fertilizer`
  - `biostimulant`
  - `soil_amendment`
  - `other_preparation`
- [ ] Reuse or define canonical simple unit validation for `ml`, `l`, `g`, and `kg`.
- [ ] Define validation schemas for UUID params, pagination, `includeArchived`, product list filters, product create/update payloads, rule create/update payloads, positive `doseValue`, and nullable non-negative interval fields.
- [ ] Define DTO mapping helpers that convert database snake_case fields to API camelCase fields.
- [ ] Define product detail DTO support for `usageRules`, `inventorySummary`, and `recentMovements` while keeping inventory data empty/zero/null until Phase 9 implements inventory.
- [ ] Add narrow route dependency wiring so products/rules routes can be registered without opening database connections at import time.
- [ ] Preserve existing health, auth, places, plants, and growing-structure routes.
- [ ] Add focused tests for validation schemas and DTO mapping if the existing test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/products/
backend/src/modules/products/products.types.ts
backend/src/modules/products/products.validation.ts
backend/src/modules/products/products.dto.ts
backend/src/modules/products/products.routes.ts
backend/src/app/routes.ts
backend/test/products/
```

---

# Out of Scope

Do not implement:

- [ ] Repository queries or writes.
- [ ] Service business workflows beyond contracts needed by later steps.
- [ ] Public Products or Product Usage Rules route handlers beyond no-op-safe registration needed for later steps.
- [ ] Inventory lots, inventory movements, stock summaries backed by inventory, stock allocation, or stock mutation.
- [ ] Activity product usage, quarantine generation, suggested task generation, task planning, reminders, target resolver, problems, weather, AI, push, storage, frontend code, or MCP tools.
- [ ] Schema changes or migrations.
- [ ] Direct Supabase SDK usage in domain services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 5.1, 5.7, 14, and 15
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` product repository/service sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` products/rules sections
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing Phase 5 plants module and tests
- [ ] `backend/src/app/routes.ts`
- [ ] `backend/src/app/create-app.ts`
- [ ] `backend/src/db/db.ts`
- [ ] `backend/src/db/transaction.ts`
- [ ] `backend/src/db/database.types.ts`
- [ ] `backend/src/modules/auth/request-actor.ts`
- [ ] `backend/src/shared/api/envelope.ts`
- [ ] `backend/src/shared/validation/request-validation.ts`
- [ ] Existing backend tests and helpers under `backend/test/`

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] product usage rules
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Products are user-owned definitions.
Product default unit must be simple: ml, l, g, or kg.
Product category must be controlled.
Products may exist without inventory.
Usage rules are plant-specific product instructions.
One active product+plant rule is allowed in v1.
Archived rules do not count as active.
Rule changes do not rewrite history.
Archive historical business records instead of hard-deleting them.
The Fastify API remains the application data API under /api/v1.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

This step creates contracts, validation, DTO helpers, and wiring only. It must not implement business endpoints yet.

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 8. Future MCP product/rule tools must use backend services/API rather than direct database writes.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend validation schema
- [ ] backend module/domain types
- [ ] DTO mapping helpers
- [ ] route dependency wiring
- [ ] authenticated actor/dependency access conventions
- [ ] tests
- [ ] docs/update notes only if backend startup or dependency injection commands change

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
No public Products or Product Usage Rules endpoints should be behaviorally implemented in this step.
```

The contracts prepared in this step must support:

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

DTOs must use camelCase API fields and never return raw snake_case database rows.

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] API response shape helpers if new DTO helpers are tested
- [ ] dependency wiring edge cases

Specific test cases:

1. Product validation accepts only canonical category values.
2. Product validation accepts only canonical simple units for `defaultUnit`.
3. Product update validation accepts partial fields and rejects empty patches if that is the existing project convention.
4. Product rule validation rejects `doseValue <= 0`.
5. Product rule validation accepts `reapplicationIntervalDays` and `quarantinePeriodDays` when null or non-negative.
6. Product rule validation rejects negative interval values.
7. DTO helpers map snake_case product and rule rows to camelCase API fields.
8. Product detail DTO includes `usageRules`, `inventorySummary`, and `recentMovements` without requiring Phase 9 inventory tables to be queried.
9. Route wiring keeps `/api/v1/health` unauthenticated and preserves existing Phase 5-7 routes.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 8 products module contracts, validation schemas, DTO helpers, and route wiring exist.
- [ ] Canonical product category and unit values are centralized or reused from existing shared validators.
- [ ] Product/rule DTOs are contract-compatible and camelCase.
- [ ] Product detail DTO can represent empty inventory state before Phase 9.
- [ ] No repository, service workflow, inventory, activity, AI, frontend, schema, or MCP behavior is implemented.
- [ ] Tests cover validation/DTO/wiring behavior where project patterns support them.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

From the backend package root, run relevant commands:

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
