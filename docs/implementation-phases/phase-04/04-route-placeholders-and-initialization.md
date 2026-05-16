# Implementation Task - Phase 4 Step 4: Route Placeholders and Initialization

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
Add the documented frontend route structure with thin placeholder pages and basic app initialization/loading states, without implementing domain feature screens.
```

## Branch

Use branch:

```text
feature/frontend-foundation
```

---

# Scope

Implement only:

- [ ] Inspect the shell and routing setup from earlier Phase 4 steps.
- [ ] Add the route map from `docs/gardening-helper-frontend-technical-spec-v1.md` where practical for a foundation pass.
- [ ] Redirect `/` to `/dashboard`.
- [ ] Add thin placeholder page components for route-level feature areas.
- [ ] Keep placeholders visually consistent with the shell but free of forms, data tables, and business workflows.
- [ ] Add a route for unknown paths if the existing routing style supports it.
- [ ] Add basic route/app initialization loading state primitives that later auth/API work can use.
- [ ] Ensure route titles or accessible headings are present for placeholder pages.
- [ ] Keep route-level modules/features organized under `src/app/features/`.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/app.routes.ts
frontend/src/app/features/
frontend/src/app/shared/
frontend/src/app/core/loading/
```

---

# Out of Scope

Do not implement:

- [ ] create/edit/list/detail business behavior.
- [ ] Reactive Forms for domain workflows.
- [ ] data fetching for placeholders.
- [ ] target selectors, product usage forms, photo uploaders, calendar UI, or dashboard widgets.
- [ ] Supabase Auth session bootstrap.
- [ ] API client or interceptors.
- [ ] route guards requiring authentication.
- [ ] push notification registration.
- [ ] AI, weather, product, inventory, activity, task, problem, photo, or calendar workflows.

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
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] existing frontend routes, shell, shared components, and tests

---

# Domain Rules Affected

This task touches:

- [ ] frontend forms
- [ ] API contract

Important rules to preserve:

```text
Frontend is not business truth.
Frontend must not calculate business truth.
Frontend must not depend on internal database table names.
Do not implement business logic in frontend placeholders.
All application data access goes through the Fastify API.
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

- [ ] frontend route configuration
- [ ] route-level placeholder components
- [ ] shared placeholder/page header component only if it reduces duplication
- [ ] root redirect
- [ ] not-found route if compatible with the route setup
- [ ] app/route loading state primitive
- [ ] route render tests

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
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
None in this step.
```

Placeholder pages must not call backend endpoints.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] route/page rendering
- [ ] edge cases

Specific test cases:

1. `/` redirects to `/dashboard`.
2. Primary placeholder routes render without crashing.
3. Nested placeholder routes such as place/product/inventory/AI settings routes render without data fetching.
4. Unknown routes render a not-found state if that route is added.
5. Placeholder pages expose accessible headings/titles.

---

# Acceptance Criteria

The task is complete when:

- [ ] documented route structure exists where practical for the foundation phase
- [ ] placeholder pages render for primary and nested route areas
- [ ] root route redirects to dashboard
- [ ] app/route loading state primitive exists
- [ ] placeholders are thin and free of business workflows
- [ ] no API or Supabase data calls are introduced
- [ ] route tests cover representative paths
- [ ] relevant frontend checks pass

---

# Commands to Run

From the frontend package root, run relevant commands:

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

---

# Notes for Implementation Agent

Placeholders are intentionally not feature pages. Do not start CRUD screens, selectors, dashboards, calendar widgets, or forms in this step.
