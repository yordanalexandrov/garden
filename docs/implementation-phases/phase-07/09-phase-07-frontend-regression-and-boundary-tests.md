# Implementation Task - Phase 7 Step 9: Frontend Regression and Boundary Tests

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
Complete Phase 7 frontend regression tests and static boundary checks proving canonical API usage, Reactive Forms behavior, archive confirmation, API error display, no trusted accountId submission, and no direct Supabase application-table access.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Review Phase 7 code from Steps 1-8 for missing tests and behavior gaps.
- [ ] Add or strengthen API service tests for every Phase 7 endpoint family.
- [ ] Add or strengthen component/form tests for places, plants, perennials, beds, persistent bed plants, and yearly bed plantings.
- [ ] Add archive confirmation tests for every archive UI flow.
- [ ] Add API error rendering tests for representative field-level and form-level backend errors.
- [ ] Add route/navigation tests for Phase 7 routes and place detail subnavigation.
- [ ] Add year selector tests proving it changes bed yearly planting view/query without calling mutation endpoints.
- [ ] Add responsive/mobile smoke tests where practical for dense list/card layouts.
- [ ] Add or update static/boundary checks proving Phase 7 frontend code does not directly access Supabase application tables or storage.
- [ ] Add static/boundary checks proving Phase 7 feature components do not use raw `HttpClient` directly.
- [ ] Add static/boundary checks proving Phase 7 request models/bodies do not include trusted `accountId`.
- [ ] Add regression checks that products, inventory, activities, problems/photos, tasks/calendar behavior, weather forecast, AI, push, storage, backend schema, and MCP work were not introduced by Phase 7.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/**/*.spec.ts
frontend/src/app/shared/**/*.spec.ts
frontend/src/app/core/**/*.spec.ts
frontend/test/
frontend/scripts/
frontend/package.json
```

---

# Out of Scope

Do not implement:

- [ ] New user-facing behavior beyond filling Phase 7 test gaps.
- [ ] Backend endpoints or migrations.
- [ ] E2E flows for products, inventory, activities, problems, tasks, weather, AI, push, storage, or MCP.
- [ ] Direct Supabase application-table or storage access.
- [ ] Test shortcuts that bypass typed frontend API services when testing frontend behavior.

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
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] All prior files in `docs/implementation-phases/phase-07/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All frontend files changed in Phase 7 Steps 1-8
- [ ] Existing frontend test helpers, package scripts, and static boundary checks

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Frontend is not business truth.
Frontend must not submit accountId for normal flows.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Archive historical business records instead of hard-deleting them.
Persistent and yearly bed plantings remain distinct.
Year selector must not mutate planting data.
Supabase service role key is backend-only.
Supabase Storage business flows are out of scope.
Provider integrations remain backend-side behind ports/adapters.
MCP tools are not a privileged bypass channel and are out of scope for frontend Phase 7.
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
- [ ] frontend boundary/static checks
- [ ] route/navigation tests
- [ ] API service tests
- [ ] form/component tests
- [ ] docs/update notes only if frontend test commands or setup changed

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

---

# API Contract

Endpoints involved:

```text
All Phase 7 consumed endpoints from Places, Plants, Perennials, Beds, Persistent Bed Plants, and Yearly Bed Plantings APIs.
```

Regression tests must verify:

```text
List responses are consumed as { data: { items, page, pageSize, total } }.
Mutation responses are consumed as canonical { data: ... } envelopes.
Backend error envelopes render to users.
No request body includes trusted accountId.
Archive UI calls POST /archive endpoints, not DELETE.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] API response shape
- [ ] frontend form behavior
- [ ] archive confirmation
- [ ] boundary/security checks
- [ ] edge cases

Specific test cases:

1. Places, plants, perennials, beds, persistent bed plants, and yearly planting services use canonical `/api/v1` paths.
2. No Phase 7 service request model or request body sends `accountId`.
3. Feature components do not use raw `HttpClient`; typed API services do.
4. No frontend code directly calls Supabase application tables or storage for Phase 7 business data.
5. Places weather metadata UX validation works and backend errors render.
6. Plants lifecycle and growing style options are canonical.
7. Perennials form requires plant selection and renders backend errors.
8. Bed form validates positive dimensions.
9. Year selector changes yearly planting query/view without mutation calls.
10. Persistent and yearly bed contents render separately.
11. Yearly planting UI allows duplicate same bed/plant/year submissions.
12. Every archive flow requires confirmation and calls canonical POST archive endpoint.
13. Phase 7 route navigation works for `/places`, `/places/:placeId/overview`, `/places/:placeId/perennials`, `/places/:placeId/beds`, `/plants`, `/plants/new`, and `/plants/:plantId`.
14. Phase 7 code does not introduce products, inventory, activities, problems/photos, task/calendar behavior, weather forecast, AI, push, storage, backend migrations, or MCP tools.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 7 API services are covered by canonical path and envelope tests.
- [ ] Phase 7 forms are covered by validation and backend error-rendering tests.
- [ ] Archive confirmation is tested for all archive flows.
- [ ] Year selector behavior is tested.
- [ ] Static/boundary checks prove no direct Supabase table/storage access, no frontend service role key, no trusted accountId submission, and no feature-level raw `HttpClient`.
- [ ] Scope regression checks show no later-phase workflows or backend/schema drift.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

From the frontend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run frontend boundary/static checks if configured.

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

---

# Notes for Implementation Agent

The goal of this step is proof, not new surface area. If a missing behavior is discovered, fix the smallest Phase 7 implementation gap and add the regression test that would have caught it.

Do not claim tests passed unless they were actually run.

