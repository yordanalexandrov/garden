# Implementation Task - Phase 9 Step 7: Phase 9 Verification and PR Readiness

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
Complete Phase 9 verification, confirm scope boundaries, run backend checks, update required docs, and prepare the PR description for the backend Inventory Ledger API.
```

## Branch

Use branch:

```text
feature/backend-inventory-ledger
```

---

# Scope

Implement only:

- [ ] Inspect all Phase 9 implementation files for consistency with the phase spec and task files.
- [ ] Confirm canonical Inventory API section 16 endpoints are implemented and tested.
- [ ] Confirm inventory overview, lot listing, lot creation, movement history, and adjustment endpoints are account-scoped.
- [ ] Confirm `POST /products/:productId/inventory-lots` creates lot and purchase movement in one transaction.
- [ ] Confirm `POST /inventory/adjustments` creates movement and updates lot in one transaction.
- [ ] Confirm no lot can become negative through service/API/database guard paths.
- [ ] Confirm no service updates `inventory_lots.quantity_remaining` without creating a movement in the same workflow.
- [ ] Confirm FEFO allocator is implemented, deterministic, same-unit-only unless documented otherwise, and unit tested.
- [ ] Confirm shortage helper behavior is explicit and does not create fake stock.
- [ ] Confirm movement history is append-only for normal Phase 9 flows.
- [ ] Confirm `inventory_product_balances` is used only as a read model and not as mutable truth.
- [ ] Confirm controllers are thin, services own workflows/transactions, and repositories only access data.
- [ ] Confirm no activity consumption, frontend pages/API services, AI, weather, storage, push, worker, deployment, schema redesign, or MCP behavior slipped in.
- [ ] Run all required backend checks.
- [ ] Update backend README or implementation notes only if run commands, environment setup, or Phase 9 API availability need documentation.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` only if Phase 9 implementation progress changes; do not mark complete until this phase is fully implemented and verified.
- [ ] Prepare the PR description using the Phase 9 expected PR summary.

Expected paths to review:

```text
backend/src/modules/inventory/
backend/src/modules/products/
backend/src/app/
backend/src/db/
backend/src/shared/
backend/test/inventory/
backend/test/db/
backend/test/helpers/
backend/README.md
docs/implementation-phases/phase-09-backend-inventory-ledger-api.md
docs/implementation-phases/phase-09/
docs/gardening-helper-implementation-status-handoff.md
```

---

# Out of Scope

Do not implement:

- [ ] New domain features beyond fixing Phase 9 verification gaps.
- [ ] Activity product consumption, target resolver, quarantine, suggested tasks, task lifecycle, correction flow, or activity transaction behavior.
- [ ] Frontend work.
- [ ] Products/rules behavior beyond fixing a documented blocking mismatch from Phase 8.
- [ ] AI, weather, storage, push, worker, deployment, notifications, or MCP tools.
- [ ] Schema redesign.
- [ ] Broad refactors unrelated to Phase 9.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] All prior files in `docs/implementation-phases/phase-09/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All backend source, test, config, package, and docs files changed in Phase 9

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] product usage rules
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Inventory movement ledger is mandatory.
Every stock change must have an inventory movement.
Current lot quantity is derived/convenience state.
Purchase lot creation creates purchase movement in the same transaction.
Manual changes create manual_adjustment or correction movements.
No negative lot quantity in v1.
Shortage policy must be explicit.
FEFO allocation is default.
Unit conversion is limited.
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
External integrations go through ports/adapters.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 9.
```

Required MCP documentation updates:

```text
None, unless the implementation PR adds MCP documentation for future inventory tools. Do not add inventory MCP tools in Phase 9.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] docs/update notes if needed
- [ ] PR description
- [ ] verification checklist
- [ ] static/scope checks

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
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
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
GET /api/v1/inventory
GET /api/v1/products/:productId/inventory-lots
POST /api/v1/products/:productId/inventory-lots
GET /api/v1/products/:productId/inventory-movements
POST /api/v1/inventory/adjustments
```

Final verification must confirm:

```text
List responses use { data: { items, page, pageSize, total } } where paginated.
Lot creation returns { data: { lot: { id }, movement: { id } } }.
Inventory overview fields are productId, productName, category, quantityRemaining, unit, lotsCount, nearestExpiryDate.
Lot creation request fields are quantityInitial, unit, purchaseDate, expiryDate, batchNumber, notes.
Adjustment request fields are productId, inventoryLotId, quantity, unit, movementType, direction, notes.
Allowed units are ml, l, g, kg.
Allowed movement types are purchase, manual_adjustment, consumption, correction; adjustment endpoint must not allow inappropriate creation of consumption movements.
Errors use { error: { code, message, details } }.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] edge cases
- [ ] static/scope regression

Specific test cases:

1. FEFO allocator unit tests from Step 2 pass.
2. Inventory overview API tests from Step 3 pass.
3. Lot listing API tests from Step 3 pass.
4. Lot creation transaction tests from Step 4 pass.
5. Movement history API tests from Step 5 pass.
6. Manual adjustment transaction tests from Step 5 pass.
7. Account A/account B tests from Step 6 pass.
8. Database guard tests from Step 6 pass.
9. Negative-lot rejection tests from Step 6 pass.
10. API envelope tests cover representative inventory read and write endpoints.
11. Static/scope regression confirms activity consumption and frontend inventory pages are still deferred.

---

# Acceptance Criteria

The task is complete when:

- [ ] All Phase 9 endpoints are implemented and tested.
- [ ] FEFO allocation helper is ready for Phase 12.
- [ ] Lot creation and adjustments are transaction-safe.
- [ ] Movement history is visible and account-scoped.
- [ ] Stock never changes without movement history.
- [ ] No lot can become negative.
- [ ] Unsupported unit conversions fail safely.
- [ ] No product-consuming activity behavior has been implemented yet.
- [ ] Backend checks pass where configured or failures are documented with exact commands and reasons.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` accurately reflects Phase 9 progress without overstating completion.
- [ ] PR description is complete.

---

# Commands to Run

Run relevant commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Also run any backend boundary/static checks configured by the project. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.

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

Use this PR summary structure:

```md
## Summary
Implemented backend Inventory Ledger API.

## Scope
- Added inventory lots, movements, overview, manual adjustments, and FEFO allocator.
- Added transaction and rollback tests for ledger writes.

## Domain rules preserved
- Stock never changes without an inventory movement.
- Lot quantity cannot become negative.
- Purchase and adjustment flows are transactional.

## Tests
- <commands run and results>

## Deferred work
- Activity consumption and frontend inventory pages remain deferred.

## Review focus
- Ledger correctness.
- Transaction safety.
- Account scoping.
- Unit/shortage behavior.
```
