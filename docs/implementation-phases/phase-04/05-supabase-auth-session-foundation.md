# Implementation Task - Phase 4 Step 5: Supabase Auth Session Foundation

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
Add frontend Supabase Auth session bootstrap and access-token handling for Fastify API calls, while forbidding Supabase application-table and storage usage.
```

## Branch

Use branch:

```text
feature/frontend-foundation
```

---

# Scope

Implement only:

- [ ] Inspect existing backend auth boundary, frontend config, shell, and app initialization primitives.
- [ ] Add a frontend auth/session module under `core/auth`.
- [ ] Configure Supabase Auth client creation using only frontend-safe Supabase URL and anon key values.
- [ ] Add session bootstrap on app startup.
- [ ] Track current session/access token using Signals and/or RxJS in a testable service.
- [ ] Expose a method for API infrastructure to read the current access token.
- [ ] Add sign-in/sign-out scaffolding only if needed for session bootstrap tests; do not build a full login UX.
- [ ] Handle missing config in a clear development-safe way without leaking secrets.
- [ ] Add static checks or tests proving Supabase usage is limited to Auth/session handling.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/core/auth/
frontend/src/app/core/config/
frontend/src/app/app.config.ts
frontend/src/environments/
frontend/src/app/core/auth/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] full login page or account settings UI.
- [ ] route guards beyond minimal session bootstrap plumbing.
- [ ] backend JWT validation changes.
- [ ] direct Supabase application table reads/writes.
- [ ] direct Supabase Storage access.
- [ ] service role key or JWT secret usage in frontend code.
- [ ] API client/interceptor behavior except exposing token read capability for the next step.
- [ ] domain data access or feature workflows.

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
- [ ] existing backend auth types/adapters for context only
- [ ] existing frontend config, initialization, and test files

---

# Domain Rules Affected

This task touches:

- [ ] auth/session boundary
- [ ] API contract
- [ ] provider adapter boundary

Important rules to preserve:

```text
The Angular PWA may use self-hosted Supabase Auth only for login/session handling, session refresh, and obtaining an access token.
Frontend must not use Supabase generated REST/table APIs for Gardening Helper application data.
Frontend must not call Supabase Storage directly for business file flows.
All business data reads/writes go through the Fastify API.
The frontend sends the user access token to the Fastify API; backend validates it and derives account context server-side.
Supabase service role key is backend-only.
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

- [ ] frontend auth/session service
- [ ] Supabase Auth client factory/config
- [ ] session bootstrap provider or initializer
- [ ] access-token read method for API infrastructure
- [ ] session state tests using deterministic mocks
- [ ] static/security checks for forbidden Supabase table/storage usage
- [ ] docs/update notes only if frontend env setup is clarified

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
None directly in this step.
```

Future authenticated API calls must send:

```http
Authorization: Bearer <access_token>
```

The frontend must not send trusted `accountId` for normal application operations.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] auth/session behavior
- [ ] security boundary checks
- [ ] edge cases

Specific test cases:

1. Session bootstrap stores/exposes an access token when Supabase Auth returns a session.
2. Session bootstrap exposes no token when no session exists.
3. Auth state changes update the current token.
4. Missing frontend auth configuration fails clearly without exposing backend secrets.
5. Static check rejects direct Supabase `.from(...)` table calls in frontend source.
6. Static check rejects direct Supabase Storage business calls in frontend source.
7. Static check rejects backend-only secret names in frontend source/config.

---

# Acceptance Criteria

The task is complete when:

- [ ] frontend auth/session module exists
- [ ] Supabase Auth client uses only frontend-safe config
- [ ] app bootstraps auth session state
- [ ] API infrastructure can read the current access token
- [ ] no full login workflow is introduced
- [ ] no Supabase table/storage business usage is introduced
- [ ] backend-only secrets are not referenced in frontend code/config
- [ ] tests/static checks cover session and boundary behavior
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

Run the frontend boundary/static checks added by this task.

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

Keep Supabase-specific frontend code isolated under `core/auth`. If a future business component needs data, it must use the Fastify API client, not Supabase table or storage APIs.
