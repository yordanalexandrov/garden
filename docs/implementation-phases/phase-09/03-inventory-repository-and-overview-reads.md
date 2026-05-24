# Implementation Task - Phase 9 Step 3: Inventory Repository and Overview Reads

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
Add account-scoped inventory repository read methods and InventoryService overview/lot-list reads for canonical inventory endpoints.
```

## Branch

Use branch:

```text
feature/backend-inventory-ledger
```

---

# Scope

Implement only:

- [ ] Inspect Phase 8 products implementation and Phase 9 Step 1/2 inventory contracts.
- [ ] Implement repository read methods for inventory overview, product lot listing, product balance, product existence/account ownership checks, and consumable lots ordered for allocation.
- [ ] Use `inventory_product_balances` as a convenience read model for overview when available; do not treat it as mutable ledger truth.
- [ ] Ensure overview filters support canonical query fields: `q`, `category`, `lowStockOnly`, `expiringBefore`, and pagination.
- [ ] Define or reuse a clear low-stock threshold policy only if existing specs/code already establish one; otherwise keep `lowStockOnly` behavior documented as not implemented or implement a conservative `quantityRemaining <= 0` interpretation with tests and PR notes.
- [ ] Implement `GET /api/v1/inventory` service and route behavior with canonical pagination envelope.
- [ ] Implement `GET /api/v1/products/:productId/inventory-lots` service and route behavior.
- [ ] Ensure product/lot reads are account-scoped from authenticated actor context.
- [ ] Return canonical DTO fields in camelCase.
- [ ] Add API/repository tests for overview, lot listing, filters, pagination, response envelopes, and account scope.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/inventory/inventory.repository.ts
backend/src/modules/inventory/inventory.service.ts
backend/src/modules/inventory/inventory.routes.ts
backend/src/modules/inventory/inventory.dto.ts
backend/test/inventory/inventory-overview.api.test.ts
backend/test/inventory/inventory-lots.api.test.ts
backend/test/inventory/inventory.repository.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Inventory lot creation writes.
- [ ] Purchase movement writes.
- [ ] Movement history endpoint.
- [ ] Manual adjustment endpoint.
- [ ] Activity product consumption.
- [ ] Lot quantity mutation.
- [ ] Complex low-stock business rules not defined by specs.
- [ ] Frontend, AI, weather, storage, push, worker, deployment, or MCP tools.
- [ ] Schema changes or migrations.

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
- [ ] Existing products module, backend db, route, auth, validation, error, and test helper files touched by the task.

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
Current lot quantity is derived/convenience state.
inventory_product_balances is a convenience read model, not mutable ledger truth.
Products may exist without inventory.
Archive historical business records instead of hard-deleting them.
Backend validation is authoritative.
Controllers stay thin.
Repositories only access data.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 9. Future MCP inventory reads must use these backend/API read paths rather than direct database reads.
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
GET /api/v1/inventory
GET /api/v1/products/:productId/inventory-lots
```

Response behavior must follow:

```text
GET /inventory returns { data: { items, page, pageSize, total } }.
Inventory overview item fields are productId, productName, category, quantityRemaining, unit, lotsCount, nearestExpiryDate.
GET /products/:productId/inventory-lots returns a canonical list envelope using camelCase lot DTO fields.
Missing or cross-account product access is rejected consistently with existing backend NOT_FOUND/FORBIDDEN policy.
Errors use { error: { code, message, details } }.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Inventory overview returns account A products and excludes account B products.
2. Inventory overview includes products with no lots using zero/null inventory summary values.
3. Inventory overview totals match the filtered account-scoped result set.
4. Inventory overview supports pagination envelope fields.
5. Inventory overview `q` filter searches product names according to existing product search conventions.
6. Inventory overview `category` filter uses canonical product category values.
7. Inventory overview `expiringBefore` filters nearest lot expiry where implemented.
8. Inventory overview `lowStockOnly` behavior is tested and documented according to the chosen conservative policy.
9. Product lot list returns only lots for an account-owned product.
10. Product lot list excludes archived lots by default unless the canonical contract or existing query pattern says otherwise.
11. Account A cannot list lots for account B product.
12. API list responses use canonical envelopes and camelCase fields.

---

# Acceptance Criteria

The task is complete when:

- [ ] Inventory overview endpoint is implemented and account-scoped.
- [ ] Product lot list endpoint is implemented and account-scoped.
- [ ] Repository read methods use account filters and do not mutate stock.
- [ ] Read DTOs match canonical API fields.
- [ ] Overview uses lots/view data as a read model and does not create mutable stock truth elsewhere.
- [ ] Tests cover filters, envelopes, and account scope.
- [ ] No write flows, activity consumption, frontend, provider, MCP, schema, or migration work is included.
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
Account-scoped read queries, overview contract shape, treatment of inventory_product_balances as a read model only, and no hidden stock mutation.
```
