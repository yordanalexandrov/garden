# Implementation Task - Phase 8 Step 4: Product Usage Rules Repository and Service

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
Implement account-scoped Product Usage Rules repository methods and service workflows for plant-specific product instructions, including duplicate active rule enforcement and product/plant account consistency.
```

## Branch

Use branch:

```text
feature/backend-products-rules
```

---

# Scope

Implement only:

- [ ] Inspect Phase 8 Steps 1-3 implementation plus existing repository/service patterns from plants, products, and growing-structure modules.
- [ ] Implement usage rule repository methods for account-scoped list by product, find by rule id, find active rule for product+plant, create, update, and archive.
- [ ] Implement service methods for list, create, get, update, and archive product usage rules.
- [ ] Validate that the product belongs to the actor account before listing or creating rules under `/products/:productId/rules`.
- [ ] Validate that the plant belongs to the same actor account before creating or updating a rule.
- [ ] Enforce one active product+plant rule in v1 in service logic and map database uniqueness conflicts to canonical `CONFLICT`.
- [ ] Ensure archived rules do not count as active and allow a replacement active rule.
- [ ] Validate `doseValue > 0`, canonical `doseUnit`, and null/non-negative interval fields.
- [ ] Archive product usage rules by setting `archived_at` rather than hard-deleting.
- [ ] Ensure rule changes update the rule record only and do not rewrite historical activities or generated side effects.
- [ ] Add repository/service tests for happy paths, account consistency, duplicate active rule, archive/replacement, validation, and conflict behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/products/product-usage-rules.repository.ts
backend/src/modules/products/product-usage-rules.service.ts
backend/test/products/product-usage-rules.repository.test.ts
backend/test/products/product-usage-rules.service.test.ts
```

It is also acceptable to keep usage rule methods inside `products.repository.ts` and `products.service.ts` if that matches the backend design pack and existing module style.

---

# Out of Scope

Do not implement:

- [ ] Product route behavior; that belongs to Step 3 and should only be adjusted if needed for integration.
- [ ] Product usage rules routes/controllers; those belong to Step 5.
- [ ] Inventory lots, movements, stock allocation, stock mutation, or shortage behavior.
- [ ] Activity product usage, quarantine generation, suggested task generation, task planning, reminders, target resolver, problems, weather, AI, push, storage, frontend code, or MCP tools.
- [ ] Schema changes, migration edits, hard deletes, or direct Supabase SDK usage in domain services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` section 11
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 15
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` product rule and account consistency tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` `ProductsRepository`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` `product_usage_rules`
- [ ] `docs/001_initial_schema_gardening_helper.sql` `product_usage_rules` table and unique active index
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql` `trg_product_usage_rules_validate_accounts`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing Phase 5 plants repository/service tests
- [ ] Existing product module files from Steps 1-3
- [ ] Existing database transaction and fixture helpers

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] product usage rules
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
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
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 8. Future product rule MCP tools must use these backend services/API rather than direct database writes.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend service method
- [ ] repository methods
- [ ] product account validation
- [ ] plant account validation
- [ ] duplicate active product+plant rule conflict handling
- [ ] archive behavior
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
No route handlers are implemented in this step.
```

The service/repository behavior must support:

```text
GET /api/v1/products/:productId/rules
POST /api/v1/products/:productId/rules
GET /api/v1/product-rules/:ruleId
PATCH /api/v1/product-rules/:ruleId
POST /api/v1/product-rules/:ruleId/archive
```

Request/response shapes must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback if the existing service opens a transaction for cross-entity validation plus write
- [ ] API response shape at service/DTO boundary if applicable
- [ ] edge cases

Specific test cases:

1. Account A can create a usage rule for Account A product and Account A plant.
2. Rule creation rejects a product from Account B.
3. Rule creation rejects a plant from Account B.
4. Rule creation rejects `doseValue <= 0`.
5. Rule creation rejects invalid `doseUnit`.
6. Rule creation rejects negative `reapplicationIntervalDays` and `quarantinePeriodDays`.
7. Creating a second active rule for the same product+plant returns canonical `CONFLICT`.
8. Archiving the first rule allows a replacement active rule for the same product+plant.
9. Account A cannot read/update/archive Account B rule.
10. Updating a rule cannot move it to a product/plant combination that violates account consistency or duplicate active policy.
11. Rule archive sets `archived_at` and does not hard-delete the row.

---

# Acceptance Criteria

The task is complete when:

- [ ] Usage rule repository methods are account-scoped and covered by tests.
- [ ] Usage rule service methods validate product and plant account consistency.
- [ ] One active product+plant rule is enforced in service behavior and database conflict mapping.
- [ ] Archived rules allow replacement active rules.
- [ ] Rule archive uses `archived_at`, not hard delete.
- [ ] Rule changes do not affect historical activity data.
- [ ] No inventory ledger, activity, AI, frontend, schema, or MCP work is introduced.
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
