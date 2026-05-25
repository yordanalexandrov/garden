# Implementation Task - Phase 10 Step 3: Product Detail Shell with Rules, Inventory, Lots, and Movements

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
Build the product detail page that displays product metadata, plant-specific usage rules, inventory summary, lots, and movement history from backend APIs.
```

## Branch

Use branch:

```text
feature/frontend-products-inventory
```

---

# Scope

Implement only:

- [ ] Inspect prior Phase 10 product list/API services and existing detail-page patterns.
- [ ] Implement `/products/:productId` detail page with loading, empty/not-found, and API error states.
- [ ] Display product metadata from `GET /products/:productId`.
- [ ] Display product usage rules from product detail data or `GET /products/:productId/rules`, according to the most reliable existing service shape.
- [ ] Display inventory summary from product detail data.
- [ ] Display inventory lots from `GET /products/:productId/inventory-lots`.
- [ ] Display recent/full movement history from product detail data or `GET /products/:productId/inventory-movements`.
- [ ] Add actions/links for edit product, add usage rule, add inventory lot, manual adjustment, and archive product where those target routes/actions exist.
- [ ] Use responsive layout consistent with the frontend spec: two-column detail/inventory on desktop and stacked sections on mobile.
- [ ] Keep movement history visible and refreshed when the route is revisited or child forms navigate back after success.
- [ ] Add focused tests for rendering, API paths, error states, and boundary behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/products/
frontend/src/app/features/inventory/
frontend/src/app/shared/components/
frontend/src/app/features/products/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Usage rule create/edit/archive forms; those are Step 4.
- [ ] Add-lot or manual adjustment forms; those are Step 6.
- [ ] Inventory overview or dedicated product inventory detail page; those are Step 5.
- [ ] Recent activity product usage UI beyond displaying backend-provided product detail fields if already present.
- [ ] Frontend calculation of stock totals, FEFO allocation, inventory consumption, or derived ledger truth.
- [ ] Backend endpoints, migrations, schema changes, or inventory ledger fixes unless a blocking Phase 8/9 compatibility issue is documented.
- [ ] Activity creation, AI ingestion, weather, push, storage, provider, deployment, or MCP behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` frontend, product, usage rule, and inventory rules
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 14, 15, and 16
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` product detail page acceptance
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` product detail and inventory sections
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] Prior files in `docs/implementation-phases/phase-10/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend detail-page, list, route, API error, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] product usage rules
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Frontend is not business truth.
Products may exist without inventory.
Usage rules are plant-specific product instructions.
One active product+plant rule in v1 is enforced by the backend.
Inventory movement ledger is mandatory.
Current lot quantity is derived/convenience state; movement history is audit truth.
Frontend must not calculate inventory allocation across lots.
Frontend must display backend data and errors clearly.
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
- [ ] responsive detail/inventory layout
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
- [ ] account scoping enforced backend-side
- [ ] no frontend FEFO allocation or direct stock mutation
- [ ] no hiding inventory movement history behind only a current balance

---

# API Contract

Endpoints consumed:

```text
GET /api/v1/products/:productId
GET /api/v1/products/:productId/rules
GET /api/v1/products/:productId/inventory-lots
GET /api/v1/products/:productId/inventory-movements
POST /api/v1/products/:productId/archive
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

1. Product detail renders metadata, usage rules, inventory summary, lots, and movement history from canonical response data.
2. Product detail handles a product with no inventory without inventing stock.
3. Usage rules section shows plant-specific rule information and archived state if the backend returns it.
4. Inventory lots section renders backend lot quantities and dates without recalculating balances.
5. Movement history section renders purchase/manual adjustment/correction/consumption movement types returned by the backend.
6. Product detail calls canonical `/api/v1` endpoints and never sends `accountId`.
7. Backend errors render clearly for product, lots, and movements loads.
8. Product archive action, if exposed here, requires confirmation and uses `POST /archive`.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/products/:productId` displays metadata, usage rules, inventory summary, lots, and movement history.
- [ ] Product detail exposes appropriate actions/links for later Phase 10 flows.
- [ ] Movement history is visible and not hidden behind a current stock total.
- [ ] Product detail does not calculate FEFO allocation, stock truth, or inventory consumption locally.
- [ ] Backend errors are visible.
- [ ] Tests cover rendering, API paths, and boundary rules.
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

Do not summarize inventory as a frontend-owned mutable number. Treat all inventory values as backend responses and keep the ledger/movement history visible.
