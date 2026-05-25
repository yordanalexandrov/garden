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

# Implementation Task - Phase 12 Step 4: Inventory Allocation, Movements, and Shortage Policy

## Goal

Add product inventory consumption to activity creation using the Phase 9 allocator and ledger rules.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

---

# Scope

- [ ] Reuse Phase 9 FEFO allocation and shortage/unit policy helpers.
- [ ] For each product usage, allocate only account-scoped available lots for that product and unit.
- [ ] Persist `inventory_movements` with movement type `consumption` for covered stock.
- [ ] Update `inventory_lots.quantity_remaining` in the same transaction.
- [ ] Reject shortage by default when `allowInventoryShortage` is false.
- [ ] When shortage override is explicit, consume covered stock only, never create negative lots, and return uncovered quantity warning.
- [ ] Return canonical `inventoryEffects` from backend data, not calculated by frontend.
- [ ] Add rollback tests around movement creation and lot updates.

---

# Out of Scope

- [ ] Quarantine and suggested task side effects.
- [ ] Manual adjustments or lot purchase APIs.
- [ ] Activity correction/correction movements.
- [ ] Frontend inventory allocation.

---

# Required Documents

- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing inventory allocator, repository, and movement tests.

---

# Domain Rules Affected

This task touches:

- [x] account scoping
- [ ] target resolution
- [x] activities
- [x] inventory
- [x] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] weather/rain confirmation
- [ ] frontend forms
- [x] API contract
- [x] database/migrations
- [x] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Inventory is ledger-based.
Never mutate stock without an inventory movement.
No lot goes negative.
Shortage policy must be explicit.
Activity creation with product usage must be transactional.
```

---

# MCP Impact

This task has no MCP impact.

- [x] has no MCP impact

MCP tools affected:

```text
none
```

Required MCP documentation updates:

```text
none
```

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
- [ ] worker/scheduler ownership is explicit for reminders/weather checks

---

# Tests Required

- [ ] Treatment with product consumes FEFO lots and creates movement rows.
- [ ] Shortage blocked returns `INVENTORY_SHORTAGE` and rolls back all writes.
- [ ] Shortage allowed creates covered movements only and warning for uncovered quantity.
- [ ] Failure during movement or lot update rolls back activity, targets, product usages, movements, and lot updates.

---

# Acceptance Criteria

- [ ] Product usage consumes inventory through ledger movements only.
- [ ] Shortage behavior is explicit, tested, and canonical.

---

# Commands to Run

Run from the backend package root:

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
