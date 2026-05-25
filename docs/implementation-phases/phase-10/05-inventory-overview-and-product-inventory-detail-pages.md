# Implementation Task - Phase 10 Step 5: Inventory Overview and Product Inventory Detail Pages

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
Build inventory overview and product inventory detail pages that display backend-returned stock summaries, lots, and movement history without frontend-owned ledger calculations.
```

## Branch

Use branch:

```text
feature/frontend-products-inventory
```

---

# Scope

Implement only:

- [ ] Inspect existing Phase 10 API services, product detail inventory sections, list/filter patterns, and frontend error helpers.
- [ ] Implement `/inventory` overview page with search/category filters, low-stock filter if supported by the backend contract, expiring-before filter, pagination, loading, empty, and error states.
- [ ] Render inventory overview rows with product name, category, backend-returned quantity remaining, unit, lots count, nearest expiry date, and links/actions.
- [ ] Implement `/inventory/products/:productId` detail page that focuses on inventory for a product.
- [ ] Display product identity/metadata needed for context without duplicating the full product detail page.
- [ ] Display lots from `GET /products/:productId/inventory-lots`.
- [ ] Display movement history from `GET /products/:productId/inventory-movements` with canonical movement type filters where useful.
- [ ] Add actions/links for add lot and manual adjustment.
- [ ] Ensure data refreshes on navigation back from successful lot or adjustment flows.
- [ ] Add focused tests for filters, rendering, API errors, movement history visibility, and no stock recalculation.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/inventory/
frontend/src/app/features/products/
frontend/src/app/features/inventory/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Add inventory lot form; that is Step 6.
- [ ] Manual adjustment form; that is Step 6.
- [ ] Activity consumption, shortage override UI, or FEFO allocation.
- [ ] Frontend calculation of product balances from lots or movements.
- [ ] Backend endpoints, schema changes, inventory repository/service changes, or allocation helper changes.
- [ ] AI, weather, push, storage, provider, deployment, or MCP behavior.
- [ ] Direct Supabase application-table or storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` inventory and frontend boundary rules
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 16
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` inventory movement history and products/inventory checklist
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` inventory page, product detail, and state/cache sections
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] Prior files in `docs/implementation-phases/phase-10/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend list/detail/error/test helper files

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
Inventory movement ledger is mandatory.
Stock must never change silently.
Current lot quantity is derived/convenience state.
Frontend must not decide inventory allocation across lots.
Frontend must not calculate FEFO allocation.
Inventory balances are mutable transactional data and should refresh after writes rather than be over-cached.
API responses must not leak inaccessible data.
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
- [ ] typed API service usage
- [ ] inventory filters and pagination
- [ ] movement history display
- [ ] API error display
- [ ] route/action wiring
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
- [ ] no frontend FEFO allocation, product balance recomputation, or direct lot quantity mutation

---

# API Contract

Endpoints consumed:

```text
GET /api/v1/inventory
GET /api/v1/products/:productId
GET /api/v1/products/:productId/inventory-lots
GET /api/v1/products/:productId/inventory-movements
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation/API errors
- [ ] API response shape
- [ ] frontend rendering behavior
- [ ] boundary/security checks
- [ ] edge cases

Specific test cases:

1. Inventory overview sends canonical `q`, `category`, `lowStockOnly`, `expiringBefore`, `page`, and `pageSize` params.
2. Inventory overview renders backend-returned quantity, unit, lots count, and nearest expiry date.
3. Product inventory detail renders lots and movement history using canonical endpoints.
4. Movement history remains visible and supports canonical `from`, `to`, and `movementType` filters if implemented.
5. Inventory pages do not recompute product balances from lots or movement rows.
6. Inventory pages do not send `accountId`.
7. Backend errors render clearly for overview, lots, and movements loads.
8. Navigation links to add lot and manual adjustment preserve product context where practical.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/inventory` and `/inventory/products/:productId` are implemented.
- [ ] Inventory overview and product inventory detail consume canonical backend APIs.
- [ ] Lots and movement history are visible.
- [ ] Frontend does not calculate stock truth, FEFO allocation, or direct lot mutations.
- [ ] Backend errors are visible.
- [ ] Tests cover filters, rendering, API paths, and boundary rules.
- [ ] No backend, schema, activity, AI, provider, deployment, or MCP behavior is introduced.

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

The backend is the source for balances. The frontend can sort, filter, and display returned rows, but must not derive ledger truth or simulate allocation.
