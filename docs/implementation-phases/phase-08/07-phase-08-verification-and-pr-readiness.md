# Implementation Task - Phase 8 Step 7: Phase 08 Verification and PR Readiness

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
Verify Phase 8 end to end, update implementation status, confirm no out-of-scope work slipped in, commit focused changes, and open a PR for the backend Products and Product Usage Rules API.
```

## Branch

Use branch:

```text
feature/backend-products-rules
```

---

# Scope

Implement only:

- [ ] Inspect the final Phase 8 diff against the phase spec and task files.
- [ ] Verify all Products API endpoints are implemented and tested.
- [ ] Verify all Product Usage Rules API endpoints are implemented and tested.
- [ ] Verify product/rule account scoping is enforced in repositories, services, and routes.
- [ ] Verify product/plant/account consistency is checked in service logic and backed by database guard tests where available.
- [ ] Verify one active product+plant rule is enforced and archived rules allow replacement.
- [ ] Verify products and rules archive via `archived_at` and are not hard-deleted.
- [ ] Verify product detail is contract-compatible before Phase 9 inventory implementation.
- [ ] Verify no inventory lot/movement, activity, AI, frontend, provider, deployment, or MCP behavior was implemented.
- [ ] Run the relevant backend checks and record exact commands/results.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 8 implemented only after the implementation is complete.
- [ ] Commit focused Phase 8 changes.
- [ ] Push the branch and open a PR.

---

# Out of Scope

Do not implement:

- [ ] Any new product/rule feature beyond final fixes needed to satisfy Phase 8 acceptance.
- [ ] Inventory lots, inventory movements, stock allocation, stock mutation, or inventory API behavior.
- [ ] Activity product usage, quarantine generation, suggested task generation, planned tasks, reminders, target resolver, AI, frontend, storage, weather, push, deployment, or MCP tools.
- [ ] Schema redesign or migration changes unless a documented blocking mismatch was already handled in an earlier Phase 8 step.
- [ ] Broad refactors unrelated to Phase 8.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 10 and 11
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 14 and 15
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` product/rule tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` product repository/service sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` products/rules sections
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-08/README.md`
- [ ] All Phase 8 task files
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Final changed backend files and tests
- [ ] `docs/gardening-helper-implementation-status-handoff.md`

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
Frontend never talks directly to the database.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Products are user-owned definitions.
Product default unit must be simple.
Product category must be controlled.
Products may exist without inventory.
Usage rules are plant-specific product instructions.
One active product+plant rule is allowed in v1.
Archived rules do not count as active.
Reapplication interval drives suggested tasks later, not Phase 8.
Quarantine period drives calendar restriction overlay later, not Phase 8.
Rule changes do not rewrite history.
Archive historical business records instead of hard-deleting them.
Inventory is ledger-based.
Never mutate stock without an inventory movement.
AI suggestions are not business truth until accepted.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 8. Future MCP product/rule tools must preserve the same account scoping, archive behavior, and service/API boundaries.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] docs/update notes
- [ ] final fixes only if verification exposes Phase 8 defects

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
GET /api/v1/products/:productId/rules
POST /api/v1/products/:productId/rules
GET /api/v1/product-rules/:ruleId
PATCH /api/v1/product-rules/:ruleId
POST /api/v1/product-rules/:ruleId/archive
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` sections 14 and 15

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback where relevant
- [ ] API response shape
- [ ] edge cases

Specific test cases to confirm before opening PR:

1. Product create/list/get/update/archive happy paths are covered.
2. Product usage rule create/list/get/update/archive happy paths are covered.
3. Product and rule endpoints reject unauthenticated requests.
4. Product and rule endpoints preserve Account A/Account B isolation.
5. Invalid product categories and units are rejected.
6. Invalid rule dose/unit/interval values are rejected.
7. Product/plant account mismatch is rejected.
8. Duplicate active product+plant rule returns canonical `CONFLICT`.
9. Archived product/rule behavior is covered.
10. Product detail response shape includes empty/zero/null inventory fields and empty recent movements before Phase 9.
11. No Phase 8 operation mutates inventory or creates activity/task/AI side effects.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 8 implementation satisfies all task files and the top-level phase spec.
- [ ] API contract sections 14 and 15 are implemented exactly or documented with justified, source-of-truth-compatible assumptions.
- [ ] Account scoping, duplicate active rule behavior, product/plant consistency, and archive behavior are covered by tests.
- [ ] Relevant backend checks have been run and results are documented.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` is updated for completed Phase 8 implementation.
- [ ] No unrelated changes are included.
- [ ] A focused commit exists.
- [ ] A PR is opened with the required description.

---

# Commands to Run

From the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Also run any repository-specific boundary/static checks that apply to backend API boundaries.

If any command does not exist or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules preserved
- API changes
- Database changes
- Tests/checks run
- Deferred work
- Review focus
