# Implementation Task - Phase 10 Step 6: Add Lot and Manual Adjustment Forms with Movement-History Refresh

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
Build add inventory lot and manual adjustment forms that submit canonical backend requests and refresh/display resulting movement history.
```

## Branch

Use branch:

```text
feature/frontend-products-inventory
```

---

# Scope

Implement only:

- [ ] Inspect Phase 10 inventory services/pages, form patterns, product selectors, and API error handling.
- [ ] Implement `/inventory/products/:productId/lots/new` add lot form.
- [ ] Implement `/inventory/adjustments/new` manual adjustment form.
- [ ] Add or reuse product/lot selectors where needed for adjustment flow; keep selectors typed and API-backed.
- [ ] Add lot form submits `quantityInitial`, `unit`, `purchaseDate`, `expiryDate`, `batchNumber`, and `notes`.
- [ ] Manual adjustment form submits `productId`, optional `inventoryLotId`, `quantity`, `unit`, `movementType`, `direction`, and `notes`.
- [ ] Validate positive quantities, allowed units, required product/lot context where applicable, and canonical `increase`/`decrease` direction.
- [ ] Display backend validation, negative-stock, and shortage-related errors clearly.
- [ ] After successful lot creation or adjustment, show the returned movement/confirmation and refresh or navigate to a page where movement history is visible.
- [ ] Ensure request bodies do not include trusted `accountId`.
- [ ] Add focused tests for form validation, canonical request bodies, backend error display, and movement-history refresh/navigation.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/inventory/
frontend/src/app/features/products/
frontend/src/app/shared/components/
frontend/src/app/shared/forms/
frontend/src/app/features/inventory/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Backend lot creation, adjustment transactions, or ledger movement behavior.
- [ ] Frontend direct stock mutation, local lot decrement/increment logic, or product balance recalculation.
- [ ] Activity consumption, shortage override for activities, FEFO allocation, or inventory allocator UI.
- [ ] AI ingestion, weather, push, storage, provider, deployment, or MCP behavior.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Complex unit conversion beyond submitting canonical units accepted by the backend.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` inventory ledger and frontend boundary rules
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 16
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` create inventory lot and manual adjustment acceptance/tests
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` inventory page, forms, and state/cache sections
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] Prior files in `docs/implementation-phases/phase-10/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend form, selector, error display, inventory page, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Frontend is not business truth.
Every stock change must have an inventory movement.
Creating a new inventory lot must also create a purchase movement in the same backend transaction.
Manual stock changes must create manual_adjustment or correction movements.
Frontend must not directly update remaining quantity.
Frontend must not calculate FEFO allocation.
No negative lot quantity in v1 is enforced by the backend and backend errors must be visible.
```

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

- [ ] frontend page/component
- [ ] frontend Reactive Forms
- [ ] frontend form validation
- [ ] product/lot selector usage if needed
- [ ] typed API service usage
- [ ] API error display
- [ ] movement-history refresh or navigation behavior
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no direct stock mutation outside backend APIs
- [ ] no frontend ledger movement creation except by calling canonical backend endpoints

---

# API Contract

Endpoints consumed:

```text
GET /api/v1/products
GET /api/v1/products/:productId
GET /api/v1/products/:productId/inventory-lots
POST /api/v1/products/:productId/inventory-lots
GET /api/v1/products/:productId/inventory-movements
POST /api/v1/inventory/adjustments
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] API response shape
- [ ] frontend form behavior
- [ ] boundary/security checks
- [ ] edge cases

Specific test cases:

1. Add lot form validates positive `quantityInitial` and canonical unit.
2. Add lot form sends canonical fields and no `accountId`.
3. Add lot success displays returned lot/movement confirmation or navigates to visible movement history.
4. Manual adjustment form validates selected product, positive quantity, canonical unit, and `increase`/`decrease` direction.
5. Manual adjustment form sends canonical fields and no `accountId`.
6. Manual decrease negative-stock backend error renders clearly and does not locally change displayed quantity.
7. Adjustment success refreshes or navigates to visible movement history.
8. Forms do not implement FEFO allocation, consumption allocation, or direct stock arithmetic.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/inventory/products/:productId/lots/new` and `/inventory/adjustments/new` are implemented.
- [ ] Forms use Reactive Forms and typed API services.
- [ ] Lot and adjustment requests follow canonical request shapes.
- [ ] Backend errors, including negative-stock/shortage-style errors, are visible.
- [ ] Successful writes refresh or navigate to visible movement history.
- [ ] No request sends trusted `accountId`.
- [ ] No frontend direct stock mutation, FEFO allocation, backend, schema, activity, AI, provider, deployment, or MCP behavior is introduced.

---

# Commands to Run

From the frontend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also run any configured frontend boundary/static checks. If any command is unavailable or fails due to pre-existing setup, report it clearly.

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

The frontend does not create ledger truth. It calls backend endpoints that create lots and movement rows transactionally, then displays the backend result.
