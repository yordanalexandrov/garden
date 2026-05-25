# Implementation Task - Phase 9 Step 2: FEFO Allocator and Shortage Policy Helper

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
Add the backend-only FEFO allocation helper and unit/shortage policy helper that later Phase 12 activity creation will use for inventory consumption planning.
```

## Branch

Use branch:

```text
feature/backend-inventory-ledger
```

---

# Scope

Implement only:

- [ ] Inspect Phase 9 Step 1 inventory types and validation.
- [ ] Implement an `InventoryAllocator` or equivalent pure helper that allocates requested consumption across provided lots using FEFO order.
- [ ] Sort candidate lots by earliest non-null `expiryDate`, then oldest `purchaseDate`, then oldest `createdAt`; document and test how null expiry/purchase dates are ordered.
- [ ] Allocate only from lots with positive `quantityRemaining`.
- [ ] Return allocations, `coveredQuantity`, `uncoveredQuantity`, and unit.
- [ ] Implement a unit compatibility helper that allows same-unit allocation and rejects unsupported conversions.
- [ ] Implement shortage policy helper behavior for covered/uncovered quantities without creating movements or mutating lots.
- [ ] Reject zero or negative requested quantity.
- [ ] Add focused unit tests for FEFO ordering, multi-lot allocation, uncovered quantity, unit mismatch, and invalid quantities.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/inventory/inventory-allocator.ts
backend/src/modules/inventory/inventory-policy.ts
backend/src/modules/inventory/inventory.types.ts
backend/test/inventory/inventory-allocator.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Database repository reads or writes.
- [ ] Inventory movements.
- [ ] Lot quantity updates.
- [ ] Lot creation or manual adjustment workflows.
- [ ] Activity product consumption or activity transaction behavior.
- [ ] Complex unit conversions such as `kg` to `g` or `l` to `ml` unless already explicitly supported by a higher-priority spec and tests are added.
- [ ] Frontend, AI, weather, storage, push, worker, deployment, or MCP tools.
- [ ] Schema changes or migrations.

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
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] All prior files in `docs/implementation-phases/phase-09/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend inventory module and test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] inventory
- [ ] product usage rules
- [ ] API contract
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Inventory movement ledger is mandatory.
Current lot quantity is derived/convenience state.
Product usage creates consumption movement later, not in this step.
No negative lot quantity in v1.
Shortage policy must be explicit.
If allowInventoryShortage is false, insufficient stock must be rejectable with INVENTORY_SHORTAGE by the service using this helper.
If allowInventoryShortage is true, only covered stock can later create consumption movements.
Do not invent fake stock.
FEFO allocation is default: earliest expiry, oldest purchase date, oldest created_at.
Unit conversion is limited; unsupported conversions fail.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 9. Future MCP inventory/activity tools must rely on this backend allocation behavior through services/API.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend allocation helper
- [ ] backend unit compatibility helper
- [ ] backend shortage policy helper
- [ ] tests
- [ ] docs/update notes only if backend test commands change

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
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
No public endpoint behavior should change in this step.
```

The helper must support later endpoint behavior for:

```text
POST /api/v1/activities
```

Do not add activity behavior in this step.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] edge cases

Specific test cases:

1. Allocator uses the lot with the earliest expiry date first.
2. Allocator breaks expiry ties by oldest purchase date.
3. Allocator breaks purchase-date ties by oldest created-at timestamp.
4. Allocator ignores zero-remaining lots.
5. Allocator splits consumption across multiple lots.
6. Allocator returns covered and uncovered quantities when stock is insufficient.
7. Allocator returns no negative allocation and no negative uncovered quantity.
8. Allocator rejects zero requested quantity.
9. Allocator rejects negative requested quantity.
10. Unit policy accepts same-unit allocation.
11. Unit policy rejects unsupported unit conversion, including `g` to `ml`.
12. Shortage helper reports a rejectable `INVENTORY_SHORTAGE` condition when shortage is not allowed.
13. Shortage helper permits only covered quantity when shortage is explicitly allowed.

---

# Acceptance Criteria

The task is complete when:

- [ ] FEFO allocation is deterministic and covered by unit tests.
- [ ] Unsupported unit conversions fail safely.
- [ ] Shortage behavior is explicit and does not create fake stock.
- [ ] The helper is pure and does not perform database writes or create movements.
- [ ] No activity creation, frontend, provider, MCP, schema, or route behavior is introduced.
- [ ] Relevant checks pass or failures are clearly documented.

---

# Commands to Run

Run relevant commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
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

Review focus for this step:

```text
FEFO ordering, same-unit-only policy, shortage behavior, and proof that allocation planning does not mutate stock.
```
