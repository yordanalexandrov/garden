# Implementation Task - Phase 9 Step 5: Movement History and Manual Adjustment Service/Routes

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
Implement product movement history reads and transactional manual inventory adjustments that preserve ledger history and prevent negative lot quantities.
```

## Branch

Use branch:

```text
feature/backend-inventory-ledger
```

---

# Scope

Implement only:

- [ ] Inspect Phase 9 Steps 1-4 inventory repository, service, route, DTO, transaction, and tests.
- [ ] Implement repository read method for product movement history with account scope, canonical filters, ordering, and pagination.
- [ ] Implement `GET /api/v1/products/:productId/inventory-movements`.
- [ ] Implement `InventoryService.adjustStock` or equivalent manual adjustment workflow.
- [ ] Validate product exists and belongs to the authenticated actor account.
- [ ] Validate optional `inventoryLotId` exists, belongs to the same account, and belongs to the same product.
- [ ] For lot-bound adjustments, create a movement and update lot `quantity_remaining` in the same transaction.
- [ ] For `direction = increase`, add quantity to lot remaining quantity.
- [ ] For `direction = decrease`, subtract quantity only if the resulting lot remaining quantity is not negative.
- [ ] Reject decreases that would make a lot negative before creating any movement.
- [ ] Allow only `manual_adjustment` or `correction` movement types for this endpoint unless a higher-priority contract says otherwise.
- [ ] Return canonical movement/adjustment response according to existing project response conventions; document any precise response shape chosen if section 16 does not define a body.
- [ ] Add API/integration tests for movement history, increase, decrease, negative-lot rejection, product/lot mismatch, account scope, envelopes, and rollback.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/inventory/inventory.repository.ts
backend/src/modules/inventory/inventory.service.ts
backend/src/modules/inventory/inventory.routes.ts
backend/src/modules/inventory/inventory.dto.ts
backend/test/inventory/inventory-movements.api.test.ts
backend/test/inventory/inventory-adjustments.api.test.ts
backend/test/inventory/inventory-ledger-transaction.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Activity product consumption or `consumption` movement creation.
- [ ] Deleting or rewriting movement history.
- [ ] Hidden database triggers that create movements.
- [ ] Adjustments that mutate product-level stock outside lots.
- [ ] Complex unit conversions.
- [ ] Frontend, AI, weather, storage, push, worker, deployment, or MCP tools.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.

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
Manual changes must create manual_adjustment or correction movements.
They must not directly update remaining quantity without movement history.
No negative lot quantity in v1.
Current lot quantity is derived/convenience state.
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
None in Phase 9. Future MCP inventory mutation tools must call this adjustment service/API workflow and must preserve confirmation, auditability, and account scope.
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
GET /api/v1/products/:productId/inventory-movements
POST /api/v1/inventory/adjustments
GET /api/v1/products/:productId/inventory-lots
GET /api/v1/inventory
```

Request/response behavior must follow:

```text
Movement history query supports from, to, movementType, and pagination.
Adjustment body uses productId, inventoryLotId, quantity, unit, movementType, direction, notes.
quantity must be greater than 0.
direction must be increase or decrease.
inventoryLotId, when provided, must belong to productId and actor account.
Adjustment must create movement history.
Decrease must not make lot quantity_remaining negative.
Errors use { error: { code, message, details } }.
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

1. Movement history lists purchase movements for account-owned product.
2. Movement history lists manual adjustment movements after adjustments.
3. Movement history filters by `movementType`.
4. Movement history filters by `from` and `to` if implemented.
5. Movement history excludes account B movements from account A results and totals.
6. Account A cannot read movement history for account B product.
7. Increase adjustment creates movement and increases lot `quantity_remaining`.
8. Decrease adjustment creates movement and decreases lot `quantity_remaining`.
9. Decrease adjustment that would make lot negative is rejected.
10. Negative-lot rejection creates no movement and leaves lot unchanged.
11. Adjustment rejects lot/product mismatch.
12. Adjustment rejects account B lot for account A product.
13. Unsupported unit conversion is rejected.
14. If lot update fails after movement insert, the movement rolls back.
15. API responses and errors use canonical envelopes.

---

# Acceptance Criteria

The task is complete when:

- [ ] Movement history endpoint is implemented and account-scoped.
- [ ] Manual adjustment endpoint is implemented and transactional.
- [ ] Increase and decrease adjustments create movement history.
- [ ] Decrease adjustments cannot make lots negative.
- [ ] Product/lot/account consistency is enforced before writes.
- [ ] Rollback tests prove movement and lot update commit or rollback together.
- [ ] No activity consumption, frontend, provider, MCP, or unrelated schema work is included.
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
Manual adjustment ledger correctness, movement history account scope, product/lot consistency, no negative stock, and rollback behavior.
```
