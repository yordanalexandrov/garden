# Implementation Task - Phase 4 Step 2: Angular Material and PWA Baseline

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
Configure Angular Material and the PWA/service worker baseline for the frontend app, preserving the rule that PWA support does not imply offline business writes.
```

## Branch

Use branch:

```text
feature/frontend-foundation
```

---

# Scope

Implement only:

- [ ] Inspect the frontend scaffold and existing style/test setup from Step 1.
- [ ] Add Angular Material using the app's standalone provider style.
- [ ] Configure a project-level theme and base responsive styles suitable for later app shell work.
- [ ] Add Material icon font or a locally appropriate icon setup without adding unrelated icon systems.
- [ ] Add Angular PWA/service worker baseline using Angular-supported tooling.
- [ ] Configure manifest and service worker files with Gardening Helper app identity.
- [ ] Ensure PWA caching is limited to static app assets and does not implement offline write synchronization.
- [ ] Add frontend-safe environment/config placeholders for API base URL and Supabase Auth anon configuration if the scaffold needs them now.
- [ ] Document which environment values are frontend-safe.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/styles.*
frontend/src/manifest.webmanifest
frontend/ngsw-config.json
frontend/src/app/app.config.ts
frontend/src/environments/
```

---

# Out of Scope

Do not implement:

- [ ] application shell navigation.
- [ ] route placeholder map.
- [ ] Supabase Auth session service.
- [ ] API client or HTTP interceptors.
- [ ] push notification permission/subscription flow.
- [ ] offline business write queue.
- [ ] domain pages, forms, or feature workflows.
- [ ] direct Supabase table or storage access.
- [ ] backend secret configuration in frontend code.

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
- [ ] existing frontend app config, styles, test setup, and package files

---

# Domain Rules Affected

This task touches:

- [ ] frontend forms
- [ ] auth/session boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
Frontend is not business truth.
PWA setup must not imply offline write sync.
Frontend may receive SUPABASE_ANON_KEY only for Auth session handling.
Frontend must never receive SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, database credentials, VAPID private key, AI keys, or storage service credentials.
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

- [ ] Angular Material provider/theme setup
- [ ] base global styles
- [ ] PWA/service worker baseline
- [ ] web app manifest
- [ ] frontend-safe environment/config placeholders if needed
- [ ] tests or smoke checks for Material/PWA config where practical
- [ ] docs/update notes only if frontend environment setup needs clarification

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

Frontend configuration must preserve the future API base path:

```text
/api/v1
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] frontend configuration behavior
- [ ] security boundary checks where practical

Specific test cases:

1. The Angular app still renders after Material providers are configured.
2. Production build includes the service worker configuration expected by Angular PWA tooling.
3. Frontend environment/config files do not reference backend-only secret names.
4. PWA configuration does not define an offline business write queue or API mutation caching strategy.

---

# Acceptance Criteria

The task is complete when:

- [ ] Angular Material is configured
- [ ] the app has a project-level theme and base styles
- [ ] PWA/service worker baseline is configured
- [ ] manifest identifies the Gardening Helper app
- [ ] frontend-safe environment/config placeholders are documented or present
- [ ] no offline business write behavior is introduced
- [ ] no backend-only secrets are referenced by frontend code/config
- [ ] tests/checks are added or updated for the changed foundation
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

Do not implement push notification registration in this step. Angular PWA support is only the installable/service-worker baseline.

Do not expose backend-only configuration values to the browser.
