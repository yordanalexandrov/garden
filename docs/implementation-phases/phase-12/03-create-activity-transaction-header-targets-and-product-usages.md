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

# Implementation Task - Phase 12 Step 3: Create Activity Transaction Header, Targets, and Product Usages

## Goal

Implement the first transaction slice of `POST /activities`: activity header, resolved targets, and product usage rows.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

---

# Scope

- [ ] Implement `ActivitiesService.createActivity` transaction boundary.
- [ ] Validate requested place/account context and use Phase 11 `TargetResolver` for all canonical target scopes.
- [ ] Persist `activities` header with `place_id` when resolvable.
- [ ] Persist concrete `activity_targets` from resolver output.
- [ ] Validate products and optional `productUsageRuleId` belong to the actor account.
- [ ] Enforce supplied usage rule belongs to supplied product and compatible account.
- [ ] Persist `activity_product_usages`.
- [ ] Return missing-rule warning when product usage is otherwise valid and no usage rule is supplied.
- [ ] Add tests for header/target/product usage persistence and rollback before inventory work is added.

---

# Out of Scope

- [ ] Inventory deduction/movements and lot updates.
- [ ] Quarantine periods.
- [ ] Suggested tasks.
- [ ] Activity correction/audit expansion.
- [ ] Frontend create activity UI.

---

# Required Documents

- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing targets, products/rules, transaction, and test helper files.

---

# Domain Rules Affected

This task touches:

- [x] account scoping
- [x] target resolution
- [x] activities
- [ ] inventory
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
Target rows store resolved truth.
Resolved targets must not be empty.
Product usage rule is optional but must be consistent if provided.
Any failure rolls back the whole create activity mutation.
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

- [ ] Watering all beds creates activity and target rows only.
- [ ] Product rule for a different product is rejected with no activity/target/product usage rows.
- [ ] Cross-account/cross-place targets are rejected with no side effects.
- [ ] Missing usage rule succeeds with warning and no rule-derived side effects.

---

# Acceptance Criteria

- [ ] Activity header, targets, and product usage rows are transaction-safe and account-scoped.

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
