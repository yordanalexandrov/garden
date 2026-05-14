# Implementation Task - Phase 1 Step 1: Backend Package and Tooling

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
Create the backend package/project skeleton, strict TypeScript tooling, and baseline npm scripts for Phase 1 backend foundation.
```

## Branch

Use branch:

```text
feature/backend-foundation
```

---

# Scope

Implement only:

- [ ] Inspect the repository and confirm whether a backend package already exists.
- [ ] If no backend package exists, create a dedicated backend package root, preferably `backend/`.
- [ ] Add backend `package.json` with scripts for `typecheck`, `lint`, `test`, and `build`.
- [ ] Add strict backend TypeScript configuration.
- [ ] Add minimal source/test folder structure for later Phase 1 steps.
- [ ] Add dependencies needed for Fastify, TypeScript, validation, logging, and tests.
- [ ] Keep folder conventions compatible with the documented modular monolith structure.

Suggested backend structure if no structure exists:

```text
backend/
  src/
    app/
    config/
    modules/
    shared/
      api/
      errors/
      validation/
      utils/
  test/
```

---

# Out of Scope

Do not implement:

- [ ] Fastify route behavior beyond placeholders needed for compilation.
- [ ] `GET /api/v1/health`.
- [ ] Database client, migrations, repositories, or transactions.
- [ ] Auth/JWT validation or account context.
- [ ] Frontend project setup.
- [ ] Provider adapters or provider SDK initialization.
- [ ] Domain CRUD or business workflows.
- [ ] Schema changes.

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
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-01-backend-project-foundation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing `package.json`, `tsconfig`, lockfiles, or source files if present

---

# Domain Rules Affected

This task touches:

- [ ] API contract
- [ ] deployment/security docs

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
External integrations go through ports/adapters.
Supabase service role key is backend-only.
Provider secrets must not be logged.
No hidden business side effects are implemented in database triggers.
```

---

# Required Implementation Details

Implement:

- [ ] backend project/package structure
- [ ] strict TypeScript configuration
- [ ] backend dependency and script setup
- [ ] test framework setup shell
- [ ] docs/update notes if backend commands need documentation

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
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`
- [ ] worker/scheduler ownership is explicit for reminders/weather checks

---

# API Contract

Endpoints involved:

```text
None in this step.
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] edge cases

Specific test cases:

1. Tooling smoke check: backend TypeScript project compiles with the empty/minimal source tree.
2. Test runner smoke check: a trivial backend test can run, if the test framework requires one.

---

# Acceptance Criteria

The task is complete when:

- [ ] Backend package/project structure exists.
- [ ] Strict TypeScript is configured.
- [ ] Backend scripts exist for `typecheck`, `lint`, `test`, and `build`.
- [ ] No application database/provider/frontend work has been introduced.
- [ ] No backend-only secrets are hardcoded.
- [ ] Relevant checks pass or unavailable commands are reported exactly.
- [ ] No unrelated changes are included.

---

# Commands to Run

Run from the backend package root:

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

Do not add frontend, database, auth, provider, or domain workflow code in this step.

Do not claim tests passed unless they were actually run.

If unsure about package layout, inspect existing files first and choose the smallest structure that keeps backend and future frontend work separated.
