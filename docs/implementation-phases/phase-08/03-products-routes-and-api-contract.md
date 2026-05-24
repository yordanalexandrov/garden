# Implementation Task - Phase 8 Step 3: Products Routes and API Contract

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
Expose the canonical Products API routes through Fastify using thin controllers, Phase 8 validation, ProductsService methods, canonical envelopes, and canonical error mapping.
```

## Branch

Use branch:

```text
feature/backend-products-rules
```

---

# Scope

Implement only:

- [ ] Inspect Phase 8 Steps 1-2 implementation plus existing route/controller patterns from places, plants, and growing-structure modules.
- [ ] Implement `GET /api/v1/products`.
- [ ] Implement `POST /api/v1/products`.
- [ ] Implement `GET /api/v1/products/:productId`.
- [ ] Implement `PATCH /api/v1/products/:productId`.
- [ ] Implement `POST /api/v1/products/:productId/archive`.
- [ ] Validate params, query, and body using Phase 8 schemas.
- [ ] Use authenticated actor context from the backend auth boundary; never accept `accountId` from client request bodies or query params.
- [ ] Return canonical success envelopes and pagination envelopes.
- [ ] Return canonical error envelopes for validation, not found, and conflict cases.
- [ ] Ensure product detail response includes `usageRules`, `inventorySummary`, and `recentMovements` fields even before inventory is implemented.
- [ ] Add route/API tests for canonical paths, envelopes, validation, auth, account scoping, conflict, and archive behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/products/products.routes.ts
backend/src/modules/products/products.controller.ts
backend/test/products/products.routes.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Product usage rules route behavior; those routes belong to Step 5.
- [ ] Inventory lots, inventory movements, stock summaries backed by inventory, allocation, adjustments, or stock mutation.
- [ ] Activity product usage, quarantine generation, suggested task generation, task planning, reminders, target resolver, problems, weather, AI, push, storage, frontend code, or MCP tools.
- [ ] Direct database access in controllers.
- [ ] Schema changes, migrations, hard deletes, or direct Supabase SDK usage in domain services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 14
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` product API tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` `products`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing product module files from Steps 1-2
- [ ] Existing places/plants route/controller/error tests
- [ ] Existing auth route test helpers

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] API contract
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Products are user-owned definitions.
Product default unit must be simple: ml, l, g, or kg.
Product category must be controlled.
Products may exist without inventory.
Archive historical business records instead of hard-deleting them.
Inventory is ledger-based and must not be mutated in this phase.
The Fastify API remains the application data API under /api/v1.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 8. Future product MCP tools must call these API/service paths rather than direct database writes.
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
- [ ] backend service method use
- [ ] DTO/envelope mapping
- [ ] tests

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
GET /api/v1/products
POST /api/v1/products
GET /api/v1/products/:productId
PATCH /api/v1/products/:productId
POST /api/v1/products/:productId/archive
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` section 14

Product request/response fields include:

```text
name
category
activeSubstance
manufacturer
formulation
defaultUnit
notes
stockSummary
rulesCount
archivedAt
usageRules
inventorySummary
recentMovements
```

Use canonical envelopes for success, pagination, validation errors, not found, and conflict errors.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. `GET /api/v1/products` returns paginated canonical envelope with Account A products only.
2. `GET /api/v1/products` honors `q`, `category`, `includeArchived`, `page`, and `pageSize`.
3. `POST /api/v1/products` creates a product without accepting `accountId`.
4. `POST /api/v1/products` rejects invalid category and invalid default unit with canonical validation error.
5. `GET /api/v1/products/:productId` returns product detail with `usageRules`, `inventorySummary`, and `recentMovements`.
6. `GET /api/v1/products/:productId` returns not found for Account B product.
7. `PATCH /api/v1/products/:productId` updates allowed product fields and rejects invalid fields/values.
8. `POST /api/v1/products/:productId/archive` archives the row and later list excludes it by default.
9. Duplicate active product name in the same account returns canonical `CONFLICT`.
10. Unauthenticated requests are rejected according to existing protected route behavior.

---

# Acceptance Criteria

The task is complete when:

- [ ] All canonical Products API routes are registered under `/api/v1`.
- [ ] Controllers are thin and delegate business decisions to `ProductsService`.
- [ ] Product API envelopes and DTO fields match the canonical contract.
- [ ] Account scoping and auth boundary are enforced server-side.
- [ ] Product archive behavior is exposed through POST `/archive`, not DELETE.
- [ ] Product detail is contract-compatible before inventory implementation.
- [ ] No product usage rule route, inventory, activity, AI, frontend, schema, or MCP work is introduced.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

From the backend package root, run relevant commands:

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
