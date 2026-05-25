# Implementation Task - Phase 10 Step 4: Usage Rule Create/Edit/Archive Flows with Plant Selector

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
Build product usage rule create, edit, and archive flows using a plant selector, Reactive Forms, canonical units, and visible backend duplicate-rule errors.
```

## Branch

Use branch:

```text
feature/frontend-products-inventory
```

---

# Scope

Implement only:

- [ ] Inspect existing plant selector/shared selector patterns from Phase 7 and prior Phase 10 services/detail pages.
- [ ] Implement `/products/:productId/rules/new` create flow.
- [ ] Implement `/product-rules/:ruleId/edit` edit flow.
- [ ] Use or adapt an existing typed plant selector for `plantId`; if no selector exists, add the smallest reusable selector consistent with existing shared UI patterns.
- [ ] Implement Reactive Form fields for `plantId`, `doseValue`, `doseUnit`, `dilutionText`, `applicationMethod`, `reapplicationIntervalDays`, `quarantinePeriodDays`, and `notes`.
- [ ] Validate required plant, positive dose, allowed dose unit, and non-negative interval/quarantine values in the frontend while keeping backend authoritative.
- [ ] Implement archive action using confirmation UI and `POST /product-rules/:ruleId/archive`.
- [ ] Display duplicate active product+plant rule conflicts from backend `CONFLICT` errors.
- [ ] Return to product detail or preserve route context after successful create/edit/archive.
- [ ] Add focused component/form/API tests for validation, plant selection, archive, conflict display, and no `accountId`.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/products/
frontend/src/app/features/product-rules/
frontend/src/app/shared/components/
frontend/src/app/shared/forms/
frontend/src/app/features/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Product CRUD or product detail changes beyond links/refresh behavior required by this step.
- [ ] Activity product usage forms or suggested task creation.
- [ ] Quarantine creation, reapplication task generation, or any backend side effect.
- [ ] AI product/rule ingestion or automatic rule extraction.
- [ ] Backend duplicate-rule enforcement or schema changes.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Inventory lot, movement, adjustment, allocation, or stock mutation behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` usage rule and frontend boundary rules
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 15 and plant selector dependencies
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` products/inventory checklist and error display expectations
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` product detail, selector, and form sections
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] Prior files in `docs/implementation-phases/phase-10/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend plant selector, product detail, API error, confirmation dialog, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] product usage rules
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Frontend is not business truth.
Frontend must not submit accountId for normal flows.
Usage rules are plant-specific product instructions.
One active product+plant rule in v1 is enforced by the backend.
Rule changes do not rewrite historical activity records.
Reapplication interval and quarantine days are rule metadata; this frontend task must not create suggested tasks or quarantine periods.
Duplicate rule conflicts must be visible to the user.
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
- [ ] plant selector usage or narrow shared selector addition
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
- [ ] no frontend creation of tasks, quarantines, activities, inventory movements, or AI-accepted data

---

# API Contract

Endpoints consumed:

```text
GET /api/v1/products/:productId/rules
POST /api/v1/products/:productId/rules
GET /api/v1/product-rules/:ruleId
PATCH /api/v1/product-rules/:ruleId
POST /api/v1/product-rules/:ruleId/archive
GET /api/v1/plants
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

1. Rule create requires a selected plant and positive dose value.
2. Rule create accepts canonical dose units only.
3. Rule create rejects negative reapplication interval and quarantine values in the form.
4. Rule create sends canonical fields and no `accountId`.
5. Rule edit loads existing rule data and preserves product/rule route context.
6. Duplicate active product+plant `CONFLICT` error is rendered clearly.
7. Rule archive requires confirmation and calls `POST /api/v1/product-rules/:ruleId/archive`, not `DELETE`.
8. Plant selector uses canonical plant API service behavior and does not directly access tables.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/products/:productId/rules/new` and `/product-rules/:ruleId/edit` are implemented.
- [ ] Usage rule forms use Reactive Forms and a typed plant selector.
- [ ] Duplicate active product+plant conflicts from backend are visible.
- [ ] Rule archive uses confirmation and canonical POST archive endpoint.
- [ ] No request sends trusted `accountId`.
- [ ] No task, quarantine, activity, AI, inventory, backend, schema, provider, or MCP behavior is introduced.

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

Treat rule fields as structured user intent. Do not create downstream business side effects from reapplication or quarantine fields in the frontend.
