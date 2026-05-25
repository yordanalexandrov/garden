# Implementation Task - Phase 10 Step 2: Product List, Filters, Create/Edit, and Archive Forms

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
Build the products list/search/filter page and product create/edit/archive flows using Reactive Forms and the typed Phase 10 API services.
```

## Branch

Use branch:

```text
feature/frontend-products-inventory
```

---

# Scope

Implement only:

- [ ] Inspect Step 1 services, existing list/page/form patterns, archive confirmation patterns, and API error display helpers.
- [ ] Implement `/products` list page with search, category filter, optional include-archived control where consistent with existing UI, pagination, loading, empty, and error states.
- [ ] Render product rows/cards with name, category, active substance when present, stock summary, rules count, and archived state.
- [ ] Implement `/products/new` create page with Reactive Forms.
- [ ] Implement `/products/:productId/edit` edit page with Reactive Forms populated from backend detail data.
- [ ] Implement product archive action using confirmation UI and `POST /products/:productId/archive`.
- [ ] Use canonical category and unit options from the API contract/specs.
- [ ] Display backend validation and conflict errors visibly; do not replace backend errors with generic messages.
- [ ] Ensure product request bodies do not include trusted `accountId`.
- [ ] Add focused component/form/API integration tests for list filters, create, edit, archive, and error display.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/products/
frontend/src/app/features/products/**/*.ts
frontend/src/app/features/products/**/*.html
frontend/src/app/features/products/**/*.scss
frontend/src/app/features/products/**/*.spec.ts
frontend/src/app/shared/**/*.ts
```

---

# Out of Scope

Do not implement:

- [ ] Product detail inventory sections beyond navigation to existing/placeholder detail routes.
- [ ] Product usage rule create/edit/archive flows; those are Step 4.
- [ ] Inventory overview, lot, movement, or adjustment pages; those are later Phase 10 steps.
- [ ] AI-assisted product ingestion entry beyond leaving existing route placeholders/deferred navigation intact.
- [ ] Backend endpoints, schema changes, inventory ledger logic, or product category redesign.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Activity product usage, target resolution, weather, push, provider, deployment, or MCP behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` product and frontend boundary rules
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 14
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` products/inventory checklist and frontend API error expectations
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` products list page, form, routing, and API sections
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] `docs/implementation-phases/phase-10/01-product-inventory-api-services-and-feature-scaffold.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend list/form/archive/error display components and tests

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
Frontend must not submit accountId for normal flows.
Products are user-owned definitions.
Product default unit must be one of ml, l, g, kg.
Product category must be controlled by the canonical enum.
Products may exist without inventory.
Products with history should be archived, not hard-deleted.
All application data access goes through the Fastify API under /api/v1.
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
- [ ] frontend validation for required fields and canonical enum controls
- [ ] typed API service usage
- [ ] archive confirmation behavior
- [ ] API error display
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
- [ ] Supabase Auth used only for auth/session flows
- [ ] no product inventory mutation in product create/edit/archive UI

---

# API Contract

Endpoints consumed:

```text
GET /api/v1/products
POST /api/v1/products
GET /api/v1/products/:productId
PATCH /api/v1/products/:productId
POST /api/v1/products/:productId/archive
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
- [ ] archive confirmation
- [ ] boundary/security checks
- [ ] edge cases

Specific test cases:

1. Product list sends canonical filter and pagination params.
2. Product list renders name, category, active substance, stock summary, rules count, and archived state from backend data.
3. Product create form validates name, category, and default unit before submit.
4. Product create sends only canonical fields and no `accountId`.
5. Product edit loads detail data and sends only changed/canonical fields according to the existing API service convention.
6. Product archive requires confirmation and calls `POST /api/v1/products/:productId/archive`, not `DELETE`.
7. Backend validation/conflict errors render on create/edit/archive flows.
8. Empty and loading states do not hide API errors.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/products`, `/products/new`, and `/products/:productId/edit` are implemented.
- [ ] Product search/filter/list behavior uses canonical backend APIs.
- [ ] Product create/edit forms use Reactive Forms and canonical enum options.
- [ ] Archive uses confirmation and canonical POST archive endpoint.
- [ ] Backend errors are visible.
- [ ] No product request sends trusted `accountId`.
- [ ] No inventory ledger, activity, AI, provider, backend, schema, or MCP behavior is introduced.

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

Do not add AI product ingestion in this task. The frontend spec mentions the future action, but Phase 10 defers AI ingestion to later AI phases unless a placeholder already exists.
