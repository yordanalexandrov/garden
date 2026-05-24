# Implementation Task - Phase 8 Step 5: Product Usage Rules Routes and API Contract

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
Expose the canonical Product Usage Rules API routes through Fastify using thin controllers, Phase 8 validation, product/rule service methods, canonical envelopes, and canonical error mapping.
```

## Branch

Use branch:

```text
feature/backend-products-rules
```

---

# Scope

Implement only:

- [ ] Inspect Phase 8 Steps 1-4 implementation plus existing route/controller patterns from products, plants, and growing-structure modules.
- [ ] Implement `GET /api/v1/products/:productId/rules`.
- [ ] Implement `POST /api/v1/products/:productId/rules`.
- [ ] Implement `GET /api/v1/product-rules/:ruleId`.
- [ ] Implement `PATCH /api/v1/product-rules/:ruleId`.
- [ ] Implement `POST /api/v1/product-rules/:ruleId/archive`.
- [ ] Validate params and bodies using Phase 8 schemas.
- [ ] Use authenticated actor context from the backend auth boundary; never accept `accountId` from client request bodies or query params.
- [ ] Return canonical success envelopes and canonical error envelopes.
- [ ] Map duplicate active product+plant rule conflicts to canonical `CONFLICT`.
- [ ] Keep product usage rule controllers thin and delegate product/plant consistency to services.
- [ ] Add route/API tests for canonical paths, envelopes, validation, auth, account scoping, conflict, archive, and replacement behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/products/product-usage-rules.routes.ts
backend/src/modules/products/product-usage-rules.controller.ts
backend/test/products/product-usage-rules.routes.test.ts
```

It is also acceptable to keep rule routes/controllers inside `products.routes.ts` if that matches the module style chosen in earlier Phase 8 steps.

---

# Out of Scope

Do not implement:

- [ ] Inventory lots, inventory movements, stock allocation, shortage behavior, or stock mutation.
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
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` section 11
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 15
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` product usage rule API tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` `product_usage_rules`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing product module files from Steps 1-4
- [ ] Existing places/plants route/controller/error tests
- [ ] Existing auth route test helpers

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] product usage rules
- [ ] tasks/reminders
- [ ] API contract
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Product/rule/plant account consistency is mandatory.
Usage rules are plant-specific product instructions.
One active product+plant rule is allowed in v1.
Archived rules do not count as active.
Reapplication interval drives suggested tasks later, not in Phase 8.
Quarantine period drives calendar restriction overlay later, not in Phase 8.
Rule changes do not rewrite history.
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
None in Phase 8. Future product rule MCP tools must call these API/service paths rather than direct database writes.
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
- [ ] duplicate active rule conflict mapping
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
GET /api/v1/products/:productId/rules
POST /api/v1/products/:productId/rules
GET /api/v1/product-rules/:ruleId
PATCH /api/v1/product-rules/:ruleId
POST /api/v1/product-rules/:ruleId/archive
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` section 15

Usage rule request/response fields include:

```text
plantId
doseValue
doseUnit
dilutionText
applicationMethod
reapplicationIntervalDays
quarantinePeriodDays
notes
archivedAt
```

Use canonical envelopes for success, validation errors, not found, and conflict errors.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. `GET /api/v1/products/:productId/rules` returns only rules for an Account A product.
2. `GET /api/v1/products/:productId/rules` returns not found or canonical forbidden/not found behavior for Account B product according to existing project convention.
3. `POST /api/v1/products/:productId/rules` creates a rule without accepting `accountId`.
4. `POST /api/v1/products/:productId/rules` rejects Account B plant.
5. `POST /api/v1/products/:productId/rules` rejects invalid dose and invalid interval values.
6. Duplicate active product+plant rule returns canonical `CONFLICT`.
7. `GET /api/v1/product-rules/:ruleId` returns a canonical envelope for Account A rule and not found for Account B rule.
8. `PATCH /api/v1/product-rules/:ruleId` updates allowed rule fields and validates duplicate active rule policy.
9. `POST /api/v1/product-rules/:ruleId/archive` archives the rule and permits a replacement active rule afterward.
10. Unauthenticated requests are rejected according to existing protected route behavior.

---

# Acceptance Criteria

The task is complete when:

- [ ] All canonical Product Usage Rules API routes are registered under `/api/v1`.
- [ ] Controllers are thin and delegate business decisions to service methods.
- [ ] Rule API envelopes and DTO fields match the canonical contract.
- [ ] Account scoping and product/plant consistency are enforced server-side.
- [ ] Duplicate active product+plant rule conflicts return canonical `CONFLICT`.
- [ ] Rule archive behavior is exposed through POST `/archive`, not DELETE.
- [ ] No inventory, activity, AI, frontend, schema, or MCP work is introduced.
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
