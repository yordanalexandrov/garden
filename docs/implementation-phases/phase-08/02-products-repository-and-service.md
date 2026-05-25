# Implementation Task - Phase 8 Step 2: Products Repository and Service

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
Implement account-scoped ProductsRepository methods and ProductsService workflows for product definitions, including list, create, detail, update, and archive behavior.
```

## Branch

Use branch:

```text
feature/backend-products-rules
```

---

# Scope

Implement only:

- [ ] Inspect Phase 8 Step 1 contracts/validation/DTOs plus existing repository/service patterns from places, plants, and growing-structure modules.
- [ ] Implement product repository methods for account-scoped list, find by id, create, update, and archive.
- [ ] Support product list filters for `q`, `category`, `includeArchived`, pagination, and any existing standard total-count pattern.
- [ ] Exclude archived products by default.
- [ ] Include archived products only when `includeArchived` is explicitly requested and consistent with existing module behavior.
- [ ] Implement product detail reads that can include usage rules from the same account if the Step 1/Step 4 module shape already supports it; otherwise leave route-level detail assembly for later steps without violating the API contract.
- [ ] Implement product service methods that derive `accountId` from authenticated actor context and never trust client-submitted account scope.
- [ ] Validate canonical product category and default unit before repository writes.
- [ ] Map active product name uniqueness conflicts to canonical `CONFLICT`.
- [ ] Archive products by setting `archived_at` rather than hard-deleting.
- [ ] Keep inventory summary data empty/zero/null and `recentMovements` empty until Phase 9 implements inventory.
- [ ] Add repository/service tests for product happy paths, validation, account scoping, conflict, and archive behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/products/products.repository.ts
backend/src/modules/products/products.service.ts
backend/src/modules/products/products.errors.ts
backend/test/products/products.repository.test.ts
backend/test/products/products.service.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Product usage rule repository/service workflows except minimal type references required by product detail shape.
- [ ] Product routes/controllers; those belong to Step 3.
- [ ] Inventory lots, inventory movements, quantity calculations, stock allocation, or stock mutation.
- [ ] Activity product usage, quarantine generation, suggested task generation, task planning, reminders, or target resolver behavior.
- [ ] AI product ingestion, AI suggestion acceptance, frontend pages/API services, storage, weather, push, or MCP tools.
- [ ] Schema changes, migration edits, or hard deletes.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 14
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` product CRUD and account-scope tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` `ProductsRepository`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` `products`
- [ ] `docs/001_initial_schema_gardening_helper.sql` `products` table and indexes
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing Phase 5 places/plants repository, service, errors, and tests
- [ ] Existing database transaction and fixture helpers

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
Services orchestrate workflows and transactions.
Repositories only access data.
All product reads and writes are account-scoped.
Products are user-owned definitions, not a global catalog in v1.
Product default unit must be simple: ml, l, g, or kg.
Product category must be controlled.
Products may exist without inventory.
Products with usage history should be archived, not hard-deleted.
Inventory is ledger-based and must not be mutated in this phase.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 8. Future product MCP tools must use these backend services/API rather than direct database writes.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend service method
- [ ] repository methods
- [ ] account-scoped filters
- [ ] archive behavior
- [ ] duplicate active product name conflict handling
- [ ] tests

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
No route handlers are implemented in this step.
```

The service/repository behavior must support:

```text
GET /api/v1/products
POST /api/v1/products
GET /api/v1/products/:productId
PATCH /api/v1/products/:productId
POST /api/v1/products/:productId/archive
```

Request/response shapes must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape at service/DTO boundary if applicable
- [ ] edge cases

Specific test cases:

1. Account A can create a product with canonical category and default unit.
2. Product list returns only Account A products.
3. Product list excludes archived products by default.
4. Product list includes archived products when `includeArchived` is true.
5. Product list supports `q`, `category`, and pagination consistently with existing module patterns.
6. Account A cannot find/update/archive Account B product.
7. Updating a product preserves account scope and validates canonical category/unit when supplied.
8. Creating or updating a duplicate active product name in the same account returns canonical `CONFLICT`.
9. The same active product name in different accounts is allowed.
10. Archiving a product sets `archivedAt`/`archived_at` and does not hard-delete the row.
11. Product detail before Phase 9 returns inventory-compatible fields without querying or mutating inventory.

---

# Acceptance Criteria

The task is complete when:

- [ ] Product repository methods are account-scoped and covered by tests.
- [ ] Product service methods derive account scope from actor context.
- [ ] Active product name conflicts are mapped to canonical conflict errors.
- [ ] Archive behavior uses `archived_at`, not hard delete.
- [ ] Product detail remains contract-compatible before inventory implementation.
- [ ] No rule workflow, inventory ledger, activity, AI, frontend, schema, or MCP work is introduced.
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
