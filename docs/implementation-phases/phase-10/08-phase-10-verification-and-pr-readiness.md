# Implementation Task - Phase 10 Step 8: Verification and PR Readiness

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
Verify Phase 10 frontend products and inventory pages end to end, update implementation status, and prepare a focused PR for review without marking later phases complete.
```

## Branch

Use branch:

```text
feature/frontend-products-inventory
```

---

# Scope

Implement only:

- [ ] Review all Phase 10 task acceptance criteria from Steps 1-7.
- [ ] Inspect the final diff for unrelated backend, schema, provider, deployment, AI, weather, push, activity, problem/photo, task/calendar, storage, or MCP changes.
- [ ] Verify products list/search/filter/create/edit/archive behavior.
- [ ] Verify product detail displays metadata, usage rules, inventory summary, lots, and movement history.
- [ ] Verify usage rule create/edit/archive behavior with plant selector and duplicate-rule error display.
- [ ] Verify inventory overview and product inventory detail behavior.
- [ ] Verify add lot and manual adjustment flows show backend errors and refresh or navigate to visible movement history.
- [ ] Verify no frontend request sends trusted `accountId`.
- [ ] Verify no direct Supabase application-table/storage access or backend-only secret references were introduced.
- [ ] Verify no frontend FEFO allocation, inventory consumption allocation, or direct stock mutation logic exists.
- [ ] Run required checks and record exact results.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 10 implemented only after the implementation tasks are complete and checks are recorded.
- [ ] Prepare a focused PR description with Summary, Scope, Domain rules preserved, Tests/checks run, Deferred work, and Review focus.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
docs/gardening-helper-implementation-status-handoff.md
frontend/src/app/features/products/
frontend/src/app/features/inventory/
frontend/src/app/shared/
frontend/src/app/core/
frontend/package.json
```

---

# Out of Scope

Do not implement:

- [ ] New Phase 10 product/inventory behavior beyond small verification fixes.
- [ ] Backend endpoints, migrations, services, repositories, or allocation behavior unless a tiny documented compatibility fix is truly blocking verification.
- [ ] Activity product usage, target resolver, activity transaction flow, AI, weather, push, storage, provider, deployment, or MCP behavior.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Broad refactors unrelated to Phase 10.
- [ ] Status changes for Phase 8, Phase 9, Phase 11, or later phases unless they are directly true in the current branch and required by project status rules.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 14, 15, and 16
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/gardening-helper-implementation-status-handoff.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] All prior files in `docs/implementation-phases/phase-10/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All frontend files changed in Phase 10

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] inventory
- [ ] product usage rules
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Inventory is ledger-based and movement history must remain visible.
Never mutate stock without an inventory movement through backend APIs.
No FEFO allocation or inventory consumption allocation in frontend.
Activity creation with product usage remains deferred.
AI suggestions, weather, push, storage, provider, deployment, and MCP work remain out of scope.
```

---

# MCP Impact

This task:

- [ ] has no MCP impact

MCP tools affected:

```text
None.
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
- [ ] verification fixes only if needed
- [ ] PR readiness review

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`
- [ ] no frontend FEFO allocation, direct stock mutation, or hidden inventory ledger behavior

---

# API Contract

Endpoints involved:

```text
All Phase 10 consumed endpoints from Products, Product Usage Rules, and Inventory APIs.
```

Final verification must confirm:

```text
Frontend API service paths match canonical endpoints.
List responses use canonical pagination envelopes.
Mutation responses use canonical data envelopes.
Backend error envelopes render to users.
No request body includes trusted accountId.
Archive UI calls POST /archive endpoints, not DELETE.
Lot and adjustment forms call backend ledger endpoints rather than mutating stock locally.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping boundary via no trusted `accountId` submission
- [ ] API response shape
- [ ] frontend form behavior
- [ ] archive confirmation
- [ ] movement-history visibility
- [ ] boundary/security checks
- [ ] edge cases

Specific test cases:

1. Run the full relevant frontend unit/component/API-service test suite.
2. Run configured frontend static/boundary checks.
3. Run typecheck, lint, and build where configured.
4. Manually inspect or smoke test product list/create/edit/archive.
5. Manually inspect or smoke test product detail, usage rules, inventory summary, lots, and movements.
6. Manually inspect or smoke test usage rule create/edit/archive including duplicate conflict display if a backend/mock path exists.
7. Manually inspect or smoke test inventory overview, add lot, adjustment, and movement-history refresh.
8. Static search verifies no direct Supabase table/storage access, no backend-only secrets, no trusted `accountId`, no FEFO allocation in frontend, and no direct stock mutation logic.

---

# Acceptance Criteria

The task is complete when:

- [ ] All Phase 10 task files' acceptance criteria are satisfied.
- [ ] Products list/search/filter/create/edit/archive works.
- [ ] Product detail displays metadata, usage rules, inventory summary, lots, and movements.
- [ ] Usage rule create/edit/archive works with plant selector and duplicate error display.
- [ ] Inventory overview and product inventory detail work.
- [ ] Add lot and manual adjustment forms work and movement history refreshes or is visible after success.
- [ ] API errors display clearly.
- [ ] Frontend tests/typecheck/lint/build pass where configured, or unavailable/pre-existing failures are reported exactly.
- [ ] Static/boundary checks pass for Supabase access, secrets, `accountId`, raw `HttpClient`, FEFO allocation, and stock mutation.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` is updated accurately for Phase 10 implementation completion.
- [ ] PR description is complete and focused.

---

# Commands to Run

From the frontend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also run any configured frontend boundary/static checks. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason.

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
- Integration/provider status
- Review focus

---

# Notes for Implementation Agent

Only mark Phase 10 implemented after the actual frontend implementation is complete. If this task file is used only as part of task-document creation, do not mark Phase 10 implemented.
