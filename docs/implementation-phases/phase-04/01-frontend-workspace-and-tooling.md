# Implementation Task - Phase 4 Step 1: Frontend Workspace and Tooling

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
Create the Angular frontend workspace/package foundation with strict TypeScript, standalone app structure, routing enabled, and reviewable package scripts, without adding domain feature behavior yet.
```

## Branch

Use branch:

```text
feature/frontend-foundation
```

---

# Scope

Implement only:

- [ ] Inspect the existing repository layout, backend package scripts, root `.gitignore`, and existing generated files before creating the frontend package.
- [ ] Create a frontend package/workspace at `frontend/` unless existing code clearly establishes another frontend path.
- [ ] Scaffold an Angular app using standalone components, routing, strict TypeScript, and a maintainable stylesheet format.
- [ ] Keep frontend dependencies isolated from the backend package unless the repository already has a root package manager strategy.
- [ ] Add or verify frontend scripts for `typecheck`, `lint`, `test`, and `build`.
- [ ] Add baseline frontend README/setup notes if the scaffold does not clearly document how to run checks.
- [ ] Ensure generated build outputs, Angular cache directories, coverage directories, and dependency directories are ignored by git.
- [ ] Keep the initial app minimal so later steps can add Material, PWA, shell, routes, auth, and API infrastructure deliberately.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/
frontend/package.json
frontend/angular.json
frontend/tsconfig.json
frontend/src/
frontend/src/app/
frontend/src/app/app.config.ts
frontend/src/app/app.routes.ts
```

---

# Out of Scope

Do not implement:

- [ ] Angular Material setup beyond dependencies created by the scaffold.
- [ ] PWA/service worker behavior.
- [ ] app shell navigation.
- [ ] domain feature pages beyond any default scaffold placeholder.
- [ ] Supabase Auth client setup.
- [ ] typed API client, API interceptors, or error mapping.
- [ ] backend CORS/config changes unless a blocker is discovered and documented for a later task.
- [ ] direct Supabase table or storage access.
- [ ] business forms or business workflows.

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
- [ ] existing root, backend, and git ignore/package files

---

# Domain Rules Affected

This task touches:

- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API.
The application data API remains under /api/v1.
Supabase service role key is backend-only.
```

This step creates tooling only. It must not introduce domain decisions or user-facing workflows.

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

- [ ] frontend Angular package/workspace
- [ ] standalone Angular app bootstrap
- [ ] strict TypeScript configuration
- [ ] routing-enabled app skeleton
- [ ] frontend package scripts
- [ ] test runner baseline from the selected Angular scaffold
- [ ] lint tooling if not included by the scaffold
- [ ] git ignore updates for frontend generated artifacts
- [ ] README/setup note only if needed for running frontend commands

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

Future frontend API calls must target:

```text
/api/v1
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] frontend app bootstrap behavior

Specific test cases:

1. The scaffolded Angular app test suite runs with the initial standalone app.
2. `npm run typecheck` validates the frontend TypeScript project.
3. `npm run build` builds the minimal frontend app.

---

# Acceptance Criteria

The task is complete when:

- [ ] frontend package/workspace exists in the expected location
- [ ] standalone Angular app bootstraps
- [ ] routing is enabled
- [ ] strict TypeScript is configured
- [ ] frontend package scripts exist for typecheck, lint, test, and build where tooling exists
- [ ] generated artifacts are ignored by git
- [ ] no domain feature behavior is implemented
- [ ] no provider secrets or direct database access are introduced
- [ ] no unrelated changes are included

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

Do not redesign the product.

Do not add domain pages in this tooling step.

Do not claim tests passed unless they were actually run.

If the Angular scaffold generates files that conflict with the repository layout, choose the smallest adjustment that preserves the existing backend package and document the assumption.
