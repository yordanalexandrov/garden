## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `gardening-helper-implementation-agent-instructions.md`
- `gardening-helper-ai-implementation-handoff-readme-v1.md`
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

# Implementation Task - Phase 12 Step 6: Activity Transaction Account Scope, Rollback, and Response Tests

## Goal

Add comprehensive regression coverage for the full Phase 12 activity transaction workflow.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

---

# Scope

- [ ] Expand deterministic fixtures for account A/B places, beds, perennials, products, rules, inventory lots, and activities.
- [ ] Add API/service integration tests for watering, treatment with rule, treatment without rule, shortage blocked, shortage allowed, product/rule mismatch, cross-account/cross-place target rejection, and read scoping.
- [ ] Add rollback tests that inspect database state after failures in target persistence, product usage persistence, movement creation, lot update, quarantine creation, and suggested task creation.
- [ ] Verify API response arrays are present even when empty.
- [ ] Verify canonical error envelopes for validation, business-rule, not-found, and inventory-shortage cases.
- [ ] Add static/boundary tests if project has existing checks for controller/service/repository layering.

---

# Out of Scope

- [ ] Frontend E2E tests.
- [ ] Activity correction tests from Phase 13.
- [ ] Manual task lifecycle/reminder tests from Phase 18.

---

# Required Documents

- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing backend test fixtures and reset helpers.

---

# Domain Rules Affected

This task touches:

- [x] account scoping
- [x] target resolution
- [x] activities
- [x] inventory
- [x] product usage rules
- [x] quarantine
- [x] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] weather/rain confirmation
- [ ] frontend forms
- [x] API contract
- [ ] database/migrations
- [x] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [x] worker/scheduler responsibility
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Critical mutation endpoints must be transaction-safe.
Account scoping is mandatory.
No stock update occurs without movement history.
Suggested tasks have no reminders.
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

- [ ] Happy path watering and treatment flows.
- [ ] Shortage blocked and allowed behavior.
- [ ] Cross-account/cross-place/product-rule rejection.
- [ ] Rollback database state assertions for every critical partial-failure point.
- [ ] Response shape arrays and canonical error envelopes.

---

# Acceptance Criteria

- [ ] The Phase 12 workflow has enough automated coverage to review transaction safety and domain invariants.

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
