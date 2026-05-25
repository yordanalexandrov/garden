# Implementation Task - Phase 10 Step 7: Frontend Regression, Boundary, and Error-Display Tests

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
Complete Phase 10 frontend regression tests and static boundary checks proving canonical API usage, Reactive Forms behavior, backend error visibility, movement-history visibility, no trusted accountId submission, no direct Supabase access, and no frontend inventory allocation or stock mutation logic.
```

## Branch

Use branch:

```text
feature/frontend-products-inventory
```

---

# Scope

Implement only:

- [ ] Review Phase 10 code from Steps 1-6 for missing tests and behavior gaps.
- [ ] Add or strengthen API service tests for every Phase 10 endpoint family.
- [ ] Add or strengthen component/form tests for product CRUD/archive, usage rules, inventory overview, product inventory detail, add lot, and manual adjustment.
- [ ] Add archive confirmation tests for product and usage rule archive flows.
- [ ] Add API error rendering tests for representative field-level and form-level backend errors.
- [ ] Add duplicate active product+plant rule conflict display tests.
- [ ] Add negative-stock/invalid adjustment backend error display tests.
- [ ] Add movement-history visibility and refresh/navigation tests after lot creation and manual adjustment.
- [ ] Add route/navigation tests for Phase 10 routes.
- [ ] Add responsive/mobile smoke tests where practical for product detail and inventory list/detail layouts.
- [ ] Add or update static/boundary checks proving Phase 10 frontend code does not directly access Supabase application tables or storage.
- [ ] Add static/boundary checks proving Phase 10 feature components do not use raw `HttpClient` directly.
- [ ] Add static/boundary checks proving Phase 10 request models/bodies do not include trusted `accountId`.
- [ ] Add static/boundary checks proving Phase 10 code does not implement FEFO allocation, inventory consumption allocation, or direct stock mutation logic.
- [ ] Add regression checks that activities, target resolution, problems/photos, tasks/calendar behavior, weather forecast, AI ingestion, push, storage, backend schema, deployment, and MCP work were not introduced by Phase 10.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/**/*.spec.ts
frontend/src/app/shared/**/*.spec.ts
frontend/src/app/core/**/*.spec.ts
frontend/test/
frontend/scripts/
frontend/package.json
```

---

# Out of Scope

Do not implement:

- [ ] New user-facing behavior beyond filling Phase 10 test gaps.
- [ ] Backend endpoints, migrations, services, or inventory allocation behavior.
- [ ] E2E flows for activity product consumption, problems/photos, tasks, weather, AI, push, storage, deployment, or MCP.
- [ ] Direct Supabase application-table or storage access.
- [ ] Test shortcuts that bypass typed frontend API services when testing frontend behavior.
- [ ] Frontend FEFO allocation or stock mutation behavior.

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
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] All prior files in `docs/implementation-phases/phase-10/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All frontend files changed in Phase 10 Steps 1-6
- [ ] Existing frontend test helpers, package scripts, and static boundary checks

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] product usage rules
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Frontend is not business truth.
Frontend must not submit accountId for normal flows.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Products and usage rules remain structured and account-scoped by backend APIs.
Inventory is ledger-based and movement history must remain visible.
Frontend must not mutate stock without backend APIs.
Frontend must not calculate FEFO allocation or inventory consumption allocation.
Supabase service role key is backend-only.
Provider integrations remain backend-side behind ports/adapters.
MCP tools are not a privileged bypass channel and are out of scope for frontend Phase 10.
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

- [ ] tests
- [ ] frontend boundary/static checks
- [ ] route/navigation tests
- [ ] API service tests
- [ ] form/component tests
- [ ] error-display tests
- [ ] docs/update notes only if frontend test commands or setup changed

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
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`
- [ ] no frontend direct stock mutation, FEFO allocation, or hidden inventory ledger behavior

---

# API Contract

Endpoints involved:

```text
All Phase 10 consumed endpoints from Products, Product Usage Rules, and Inventory APIs.
```

Regression tests must verify:

```text
List responses are consumed as { data: { items, page, pageSize, total } }.
Mutation responses are consumed as canonical { data: ... } envelopes.
Backend error envelopes render to users.
No request body includes trusted accountId.
Archive UI calls POST /archive endpoints, not DELETE.
Lot creation calls POST /products/:productId/inventory-lots.
Manual adjustment calls POST /inventory/adjustments.
Inventory movement history is visible after lot and adjustment flows.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] API response shape
- [ ] frontend form behavior
- [ ] archive confirmation
- [ ] error display
- [ ] boundary/security checks
- [ ] edge cases

Specific test cases:

1. Product, rule, inventory overview, lot, movement, and adjustment services use canonical `/api/v1` paths.
2. No Phase 10 service request model or request body sends `accountId`.
3. Feature components do not use raw `HttpClient`; typed API services do.
4. No frontend code directly calls Supabase application tables or storage for Phase 10 business data.
5. Product form validates name, category, and default unit.
6. Usage rule form validates plant, dose, unit, and interval/quarantine values.
7. Duplicate active product+plant rule conflict renders clearly.
8. Add lot form validates positive quantity and allowed unit.
9. Manual adjustment form validates product/lot context, direction, positive quantity, and allowed unit.
10. Negative-stock or invalid adjustment backend error renders clearly and does not locally mutate displayed stock.
11. Inventory overview and product inventory detail render backend-returned balances, lots, and movements without recalculating stock truth.
12. Movement history renders and refreshes or is navigated to after lot creation and adjustment.
13. Product and usage rule archive flows require confirmation and call canonical POST archive endpoints.
14. Phase 10 route navigation works for `/products`, `/products/new`, `/products/:productId`, `/products/:productId/edit`, `/products/:productId/rules/new`, `/product-rules/:ruleId/edit`, `/inventory`, `/inventory/products/:productId`, `/inventory/products/:productId/lots/new`, and `/inventory/adjustments/new`.
15. Phase 10 code does not introduce activity product usage, target resolution, problems/photos, task/calendar behavior, weather forecast, AI ingestion, push, storage, backend migrations, deployment, or MCP tools.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 10 API services are covered by canonical path and envelope tests.
- [ ] Phase 10 forms are covered by validation and backend error-rendering tests.
- [ ] Product and rule archive confirmation is tested.
- [ ] Duplicate rule and negative-stock/adjustment backend errors are tested.
- [ ] Movement history visibility and refresh/navigation behavior are tested.
- [ ] Static/boundary checks prove no direct Supabase table/storage access, no frontend service role key, no trusted `accountId` submission, no feature-level raw `HttpClient`, and no frontend FEFO/stock mutation logic.
- [ ] Scope regression checks show no later-phase workflows or backend/schema drift.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

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

This is a regression and boundary hardening task. Keep fixes tightly scoped to Phase 10 frontend behavior and tests.
