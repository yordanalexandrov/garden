# Implementation Task - Phase 9 Step 4: Inventory Lot Creation with Purchase Movement Transaction

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
Implement transactional inventory lot creation that creates the lot and its purchase movement together through the backend service layer.
```

## Branch

Use branch:

```text
feature/backend-inventory-ledger
```

---

# Scope

Implement only:

- [ ] Inspect Phase 9 Steps 1-3 inventory validation, repository, service, route, and test helper files.
- [ ] Implement repository write methods for `inventory_lots` creation and `inventory_movements` creation using an explicit transaction handle.
- [ ] Implement `InventoryService.createLot` or equivalent service workflow.
- [ ] Validate the product exists, is active unless existing product policy permits archived access, and belongs to the authenticated actor account.
- [ ] Create an `inventory_lots` row with `quantity_initial = quantityInitial` and `quantity_remaining = quantityInitial`.
- [ ] Create a `purchase` inventory movement for the same account, product, lot, quantity, unit, and occurred-at date.
- [ ] Use purchase date for `occurred_at` when present, otherwise use the existing server-time/test-clock convention if the codebase has one.
- [ ] Wrap lot insert and movement insert in one transaction.
- [ ] Return both `lot.id` and `movement.id` in the canonical response.
- [ ] Ensure the service is the only layer that combines lot creation and movement creation.
- [ ] Add API/integration tests for successful creation, validation errors, account scope, API envelope, and rollback when movement creation fails.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/inventory/inventory.repository.ts
backend/src/modules/inventory/inventory.service.ts
backend/src/modules/inventory/inventory.routes.ts
backend/src/modules/inventory/inventory.dto.ts
backend/test/inventory/inventory-lot-create.api.test.ts
backend/test/inventory/inventory-ledger-transaction.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Manual adjustment behavior.
- [ ] Movement history endpoint behavior beyond any helper required to assert tests.
- [ ] Activity product consumption or `consumption` movement creation.
- [ ] FEFO allocation changes unless Step 2 has a defect directly blocking this task.
- [ ] Product/rule implementation beyond using existing Phase 8 behavior.
- [ ] Frontend, AI, weather, storage, push, worker, deployment, or MCP tools.
- [ ] Schema redesign or new migrations unless a blocking mismatch is documented.
- [ ] Direct stock update without movement history.

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
- [ ] Existing products, inventory, db transaction, route, error, validation, and test helper files touched by the task.

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
Creating a new inventory lot must also create a purchase movement in the same transaction.
Inventory lots must not have negative quantity_remaining.
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
None in Phase 9. Future MCP inventory mutation tools must call this backend/API workflow and must not insert lots or movements directly.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend service method
- [ ] repository methods
- [ ] transaction handling
- [ ] DTO mapping helpers
- [ ] tests
- [ ] docs/update notes only if backend run commands or setup change

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
POST /api/v1/products/:productId/inventory-lots
GET /api/v1/products/:productId/inventory-lots
GET /api/v1/inventory
```

Request/response behavior must follow:

```text
POST body uses quantityInitial, unit, purchaseDate, expiryDate, batchNumber, notes.
quantityInitial must be greater than 0.
unit must be one of ml, l, g, kg.
Response returns { data: { lot: { id }, movement: { id } } }.
Errors use { error: { code, message, details } }.
The created lot must appear in lot list and overview reads after commit.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. `POST /products/:productId/inventory-lots` creates an inventory lot for account A product.
2. Lot creation creates a `purchase` movement in the same transaction.
3. Movement quantity and unit match the lot initial quantity and unit.
4. Lot `quantity_remaining` equals `quantity_initial` after creation.
5. Response returns both `lot.id` and `movement.id`.
6. Account A cannot create a lot for account B product.
7. Invalid unit returns canonical validation error.
8. Zero or negative quantity returns canonical validation error.
9. If movement creation fails after lot insert, the lot is rolled back.
10. Database guard rejects lot/product account mismatch in a DB-backed test.
11. Inventory overview and lot listing reflect the committed lot after creation.

---

# Acceptance Criteria

The task is complete when:

- [ ] Lot creation endpoint is implemented and transactional.
- [ ] Every lot creation creates exactly one purchase movement.
- [ ] Rollback tests prove no orphan lot remains when movement creation fails.
- [ ] Account scoping is enforced for product lookup and lot creation.
- [ ] No service updates lot quantity without a movement in the same workflow.
- [ ] API response shape matches the canonical contract.
- [ ] No manual adjustment, activity consumption, frontend, provider, MCP, or unrelated schema work is included.
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
Purchase ledger correctness, transaction boundaries, account scoping, rollback behavior, and no direct stock mutation outside the service workflow.
```
