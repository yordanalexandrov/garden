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

# Implementation Task - Phase 12 Step 1: Activities Module Contracts, Validation, and Route Wiring

## Goal

Prepare the backend activities module contracts, validation schemas, DTO mapping, and route wiring for the Phase 12 activity transaction flow.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

---

# Scope

- [ ] Inspect existing backend module, route registration, auth actor, transaction, envelope, validation, target resolver, products/rules, inventory, and test helper patterns.
- [ ] Create `backend/src/modules/activities/` following local conventions.
- [ ] Define activity input/filter/read/side-effect DTO types for list, detail, create request, product usage rows, inventory effects, quarantine periods, suggested tasks, and warnings.
- [ ] Define validation schemas for activity params, list filters, create activity payload, target scope/selection, product usage rows, units, activity types, and `allowInventoryShortage`.
- [ ] Add DTO mappers that preserve canonical envelope field names and return side-effect arrays even when empty.
- [ ] Wire authenticated activity routes under `/api/v1/activities` without implementing business behavior beyond safe placeholders or service calls required by local style.
- [ ] Add focused validation/DTO/route-registration tests.

---

# Out of Scope

- [ ] Repository read queries beyond interfaces needed for later steps.
- [ ] Create activity transaction behavior.
- [ ] Inventory allocation, quarantine, suggested tasks, correction/audit, frontend UI, weather, AI, push, storage, deployment, or MCP tools.
- [ ] Schema changes.

---

# Required Documents

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing backend app, shared, targets, products, inventory, route, validation, and test helper files.

---

# Domain Rules Affected

This task touches:

- [x] account scoping
- [ ] target resolution
- [x] activities
- [ ] inventory
- [ ] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] weather/rain confirmation
- [ ] frontend forms
- [x] API contract
- [ ] database/migrations
- [x] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Activity creation with product usage must be transactional.
Frontend must not submit trusted accountId.
API responses and errors must use the canonical envelope.
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

- [ ] Invalid activity type, target scope mismatch, invalid unit, non-positive product quantity, and malformed UUID are rejected.
- [ ] Route registration keeps health unauthenticated and activity routes authenticated.
- [ ] DTO mapping returns canonical field names and empty side-effect arrays.

---

# Acceptance Criteria

- [ ] Activity module scaffolding matches existing backend conventions.
- [ ] Validation and DTO helpers are ready for later service/repository steps.
- [ ] No business side effects are implemented outside the service layer.

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
