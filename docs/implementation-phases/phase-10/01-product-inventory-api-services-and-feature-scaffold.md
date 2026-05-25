# Implementation Task - Phase 10 Step 1: Product/Inventory API Services and Feature Scaffold

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
Create the typed frontend API services, DTO/request models, route scaffolding, and feature folder structure needed by the Phase 10 products and inventory pages.
```

## Branch

Use branch:

```text
feature/frontend-products-inventory
```

---

# Scope

Implement only:

- [ ] Inspect the existing Angular shell, routing, typed API client, auth token interceptor, API error mapper, shared UI/form controls, selectors, and test setup from Phase 4 and Phase 7.
- [ ] Create feature folders for products, product rules, and inventory using the existing frontend architecture.
- [ ] Define frontend DTO/request/filter types for products, product usage rules, inventory lots, inventory movements, inventory overview rows, and manual adjustments from the canonical API contract.
- [ ] Add typed `ProductsApiService`, `ProductRulesApiService` if useful, and `InventoryApiService` methods for Phase 8 and Phase 9 endpoints.
- [ ] Use the existing API base client and envelope unwrapping; do not call `HttpClient` directly from feature components.
- [ ] Ensure no service request model includes trusted `accountId`.
- [ ] Add route entries for Phase 10 pages if placeholders exist from Phase 4; replace placeholders only inside this phase's routes.
- [ ] Keep later routes such as activities, problems, calendar, weather, AI, push, notifications, and settings as placeholders or existing navigation entries.
- [ ] Add API service tests that verify canonical paths, query params, request bodies, envelope use, and no `accountId`.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/products/
frontend/src/app/features/inventory/
frontend/src/app/shared/components/
frontend/src/app/shared/forms/
frontend/src/app/core/api/
frontend/src/app/app.routes.ts
frontend/src/app/features/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Full page UI beyond route-safe empty shells needed for wiring.
- [ ] Product, usage rule, lot, or adjustment forms; those are later Phase 10 steps.
- [ ] Backend endpoints, migrations, services, repositories, or inventory ledger logic.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Frontend FEFO allocation, inventory consumption allocation, or stock mutation logic.
- [ ] Activity product usage, target resolution, activity creation, problems/photos, tasks/calendar behavior, weather, AI, push, storage, notification, provider, deployment, or MCP behavior.
- [ ] Business decisions that belong to backend services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 14, 15, and 16
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` products, inventory, routing, API service, form, and state sections
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend `core/api`, auth/session, routing, shell, shared UI, selectors, forms, and test helper files

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
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Backend derives account scope from the authenticated actor.
Products are user-owned definitions.
Inventory is ledger-based and stock must never change silently.
Frontend must not decide inventory allocation across lots.
API success, list, and error envelopes must follow the canonical API contract.
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

- [ ] frontend API service
- [ ] frontend DTO/request/filter types
- [ ] feature route scaffolding
- [ ] feature folder structure
- [ ] tests
- [ ] static/boundary check updates if the existing project has a frontend boundary-check pattern

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
- [ ] Supabase Auth used only for auth/session flows
- [ ] no FEFO allocation or stock mutation in frontend code

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
GET /api/v1/inventory
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
- [ ] API response shape
- [ ] auth/session behavior through existing interceptor tests if touched
- [ ] boundary/security checks
- [ ] edge cases

Specific test cases:

1. Products API service uses canonical `/api/v1/products` endpoints and unwraps canonical envelopes through the existing API client.
2. Products list supports `q`, `category`, `includeArchived`, `page`, and `pageSize` query params.
3. Product usage rule API service uses canonical product-nested create/list paths and direct detail/update/archive paths.
4. Inventory API service uses canonical overview, lots, movements, and adjustments paths.
5. Inventory list methods support canonical filter and pagination params without inventing frontend-only contract fields.
6. Product, rule, lot, and adjustment request models do not include trusted `accountId`.
7. Route config maps Phase 10 URLs without removing later-phase placeholder routes.
8. Raw `HttpClient` remains centralized in core API infrastructure.

---

# Acceptance Criteria

The task is complete when:

- [ ] Typed Phase 10 API services and models exist.
- [ ] API service paths exactly match the canonical API contract.
- [ ] Services use the existing API client/envelope behavior.
- [ ] No frontend code sends trusted `accountId`.
- [ ] Phase 10 route scaffolding exists without implementing later workflows.
- [ ] Tests cover service paths, query params, request bodies, and boundary rules.
- [ ] No backend, schema, provider, MCP, or unrelated frontend workflow changes are introduced.

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

Do not implement product/inventory business truth in the frontend. The Phase 10 frontend submits user intent and displays backend responses only.
