# Implementation Task - Phase 9 Step 1: Inventory Module Contracts, Validation, and Route Wiring

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
Prepare the backend inventory module contracts, validation schemas, DTO mapping, and narrow route wiring needed for Phase 9 Inventory Ledger APIs.
```

## Branch

Use branch:

```text
feature/backend-inventory-ledger
```

---

# Scope

Implement only:

- [ ] Inspect existing backend app, route registration, auth actor context, database client, transaction abstraction, envelope helpers, validation helpers, products module, and test helper patterns.
- [ ] Confirm Phase 8 product APIs and product repository/service contracts exist before wiring inventory behavior; if Phase 8 is absent, stop and document the prerequisite gap.
- [ ] Create `backend/src/modules/inventory/` structure following existing backend module conventions.
- [ ] Define inventory domain/input/filter/DTO types for lots, movements, overview rows, adjustment requests, allocator inputs, allocator results, and shortage warnings.
- [ ] Define canonical enum constants for units `ml`, `l`, `g`, `kg`, movement types `purchase`, `manual_adjustment`, `consumption`, `correction`, and adjustment directions `increase`, `decrease`.
- [ ] Define validation schemas for UUID params, inventory overview query filters, lot list query filters if needed, movement history query filters, lot creation payloads, and manual adjustment payloads.
- [ ] Define DTO mapping helpers that convert database snake_case fields to canonical API camelCase fields.
- [ ] Add no-op-safe route registration and dependency wiring for the inventory route module without opening database connections at import time.
- [ ] Preserve `GET /api/v1/health` as unauthenticated and keep test-only routes isolated.
- [ ] Add focused validation/schema/DTO tests where existing test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/inventory/inventory.types.ts
backend/src/modules/inventory/inventory.validation.ts
backend/src/modules/inventory/inventory.dto.ts
backend/src/modules/inventory/inventory.routes.ts
backend/src/modules/inventory/inventory.service.ts
backend/src/modules/inventory/inventory.repository.ts
backend/src/app/routes.ts
backend/test/inventory/
```

---

# Out of Scope

Do not implement:

- [ ] Repository queries or writes beyond interface stubs needed for wiring.
- [ ] Service workflows beyond interface stubs needed for later steps.
- [ ] Public endpoint behavior beyond route registration returning existing not-implemented behavior if that is the local pattern.
- [ ] FEFO allocation logic; that belongs to Step 2.
- [ ] Inventory overview reads; that belongs to Step 3.
- [ ] Lot creation or purchase movement transaction; that belongs to Step 4.
- [ ] Movement history or manual adjustment behavior; that belongs to Step 5.
- [ ] Activity product consumption or `consumption` movement creation.
- [ ] Frontend pages, frontend API services, AI, weather, storage, push, worker, deployment, or MCP tools.
- [ ] Schema changes or migrations.
- [ ] Direct Supabase SDK usage inside domain services.

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
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing `backend/src/app/`, `backend/src/db/`, `backend/src/shared/`, `backend/src/modules/auth/`, `backend/src/modules/products/`, and backend test helper files touched by the task.

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
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
All inventory rows belong to an account.
Inventory movement ledger is mandatory.
Stock must never change silently.
No negative lot quantity in v1.
Unsupported unit conversions must fail.
The Fastify API remains the application data API under /api/v1.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

This step creates contracts and wiring only. It must not mutate stock.

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 9. Future inventory MCP tools must use backend services/API and must not update inventory tables directly.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend route registration
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
GET /api/v1/inventory
GET /api/v1/products/:productId/inventory-lots
POST /api/v1/products/:productId/inventory-lots
GET /api/v1/products/:productId/inventory-movements
POST /api/v1/inventory/adjustments
```

DTOs must support:

```text
Inventory overview list: productId, productName, category, quantityRemaining, unit, lotsCount, nearestExpiryDate.
Lot creation request: quantityInitial, unit, purchaseDate, expiryDate, batchNumber, notes.
Lot creation response: lot.id and movement.id.
Movement history filters: from, to, movementType, pagination.
Adjustment request: productId, inventoryLotId, quantity, unit, movementType, direction, notes.
```

All responses must use canonical success and error envelopes.

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] API response shape helpers if new DTO helpers are tested
- [ ] route/dependency wiring edge cases

Specific test cases:

1. Lot creation validation accepts positive `quantityInitial` with unit `g`, `ml`, `kg`, or `l`.
2. Lot creation validation rejects zero or negative `quantityInitial`.
3. Lot creation validation rejects unsupported units.
4. Adjustment validation accepts positive quantity with `increase` or `decrease`.
5. Adjustment validation rejects unsupported movement types for manual adjustment flows.
6. Movement query validation accepts canonical `movementType` values and rejects unknown values.
7. Inventory overview query validation parses pagination and optional filters predictably.
8. Route wiring keeps `/api/v1/health` unauthenticated.

---

# Acceptance Criteria

The task is complete when:

- [ ] Inventory module directories and core type/validation/DTO files exist.
- [ ] Canonical inventory endpoint routes are registered or prepared following existing local route patterns.
- [ ] Validation schemas enforce allowed units, movement types, directions, and positive quantities.
- [ ] DTO helpers return camelCase API fields and never raw snake_case rows.
- [ ] No stock mutation, repository write, movement write, activity consumption, frontend, provider, or schema work is included.
- [ ] Focused validation/wiring tests are added or a precise reason is documented if existing test style makes them impractical.
- [ ] Relevant checks pass or failures are clearly documented.

---

# Commands to Run

Run relevant commands from the backend package root:

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

Review focus for this step:

```text
Inventory module boundary, canonical DTO/validation shapes, dependency wiring, and proof that no stock mutation behavior was implemented yet.
```
