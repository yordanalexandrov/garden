# Implementation Task - Phase 4 Step 3: App Shell Layout and Navigation

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
Create the responsive Angular Material app shell with top app bar, desktop navigation, mobile navigation behavior, router outlet, and global snackbar surface without adding domain feature logic.
```

## Branch

Use branch:

```text
feature/frontend-foundation
```

---

# Scope

Implement only:

- [ ] Inspect the frontend app structure, Material setup, and routing entry point.
- [ ] Add a layout/core shell component used by the app root.
- [ ] Add a top app bar with application identity and mobile menu control.
- [ ] Add persistent desktop navigation using Angular Material navigation components.
- [ ] Add mobile navigation behavior using a temporary drawer or compact menu that works without hover.
- [ ] Add primary navigation entries from the frontend spec: Dashboard, Places, Calendar, Activities, Problems, Plants, Products, Inventory, AI Assistant, Settings.
- [ ] Add a main content area with a router outlet.
- [ ] Add a global snackbar surface/service placeholder for later API error display.
- [ ] Keep shell state local with Signals where appropriate.
- [ ] Keep the shell thin; it must not fetch or own business data.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/core/layout/
frontend/src/app/core/notifications/
frontend/src/app/app.component.*
frontend/src/app/app.config.ts
```

---

# Out of Scope

Do not implement:

- [ ] full route placeholder map beyond links needed by navigation.
- [ ] domain feature pages.
- [ ] business forms.
- [ ] API data fetching from shell components.
- [ ] Supabase Auth session bootstrap.
- [ ] auth token interceptor.
- [ ] canonical API error mapping.
- [ ] push notification registration or permission prompts.
- [ ] AI/weather/product/inventory/activity/task/problem workflows.

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
- [ ] existing frontend app component, routing, Material, and test files

---

# Domain Rules Affected

This task touches:

- [ ] frontend forms
- [ ] API contract

Important rules to preserve:

```text
Frontend is not business truth.
Frontend may display and collect user intent but must not own business decisions.
Frontend must not hide automation side effects.
All application data access goes through the Fastify API.
Do not implement large god components that absorb feature logic.
```

This step is shell-only. It must not implement feature workflows or data orchestration.

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

- [ ] frontend layout component
- [ ] desktop navigation
- [ ] mobile navigation open/close behavior
- [ ] router outlet placement
- [ ] global snackbar service/surface placeholder
- [ ] Material icons/buttons/lists/sidenav imports or providers
- [ ] component tests for shell rendering and mobile navigation

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

Shell components must not call API endpoints directly.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] key user interactions
- [ ] mobile-friendly component behavior

Specific test cases:

1. App shell renders the top app bar, primary navigation, and router outlet.
2. Desktop navigation includes the documented primary navigation entries.
3. Mobile navigation can open and close through the menu control.
4. Shell component does not require business API data to render.
5. Icon-only controls have accessible names.

---

# Acceptance Criteria

The task is complete when:

- [ ] responsive shell exists
- [ ] top app bar exists
- [ ] desktop navigation exists
- [ ] mobile navigation works without hover
- [ ] router outlet is placed in the main content region
- [ ] global snackbar surface/service placeholder exists
- [ ] shell remains thin and free of business data fetching
- [ ] shell tests cover render and mobile open/close behavior
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

Do not turn the shell into a feature dashboard. Navigation and layout belong here; domain page behavior belongs in later phases.
