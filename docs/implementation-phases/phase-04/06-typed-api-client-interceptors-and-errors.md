# Implementation Task - Phase 4 Step 6: Typed API Client, Interceptors, and Errors

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
Create the typed frontend API client foundation for canonical /api/v1 envelopes, attach Supabase Auth bearer tokens to Fastify API requests, and map backend error envelopes to global user-visible errors.
```

## Branch

Use branch:

```text
feature/frontend-foundation
```

---

# Scope

Implement only:

- [ ] Inspect backend health route/envelope implementation and frontend auth/session service.
- [ ] Add shared typed API envelope models for success, list, mutation, and error responses.
- [ ] Add typed API error code/type definitions matching the canonical API contract.
- [ ] Add an API base URL config defaulting to `/api/v1`.
- [ ] Add a centralized API client/wrapper around Angular `HttpClient`.
- [ ] Keep raw `HttpClient` usage inside `core/api` and interceptor infrastructure.
- [ ] Add a `GET /api/v1/health` client method only as a smoke-test endpoint.
- [ ] Add an auth token interceptor that attaches `Authorization: Bearer <access_token>` to Fastify API calls when a token exists.
- [ ] Ensure the auth token interceptor omits the header when no token exists.
- [ ] Ensure the auth token interceptor does not attach tokens to non-API or Supabase Auth requests.
- [ ] Add a canonical API error mapper for `{ error: { code, message, details } }`.
- [ ] Connect mapped API errors to the global snackbar/error display added in the shell.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/core/api/
frontend/src/app/core/interceptors/
frontend/src/app/core/errors/
frontend/src/app/core/notifications/
frontend/src/app/core/config/
frontend/src/app/core/api/*.spec.ts
frontend/src/app/core/interceptors/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] domain API services beyond `GET /api/v1/health` smoke support.
- [ ] backend endpoint changes except narrowly scoped CORS/dev compatibility if a real blocker is documented.
- [ ] business forms or feature workflows.
- [ ] frontend business logic or side-effect decisions.
- [ ] direct Supabase table or storage access.
- [ ] login UI.
- [ ] file upload, weather, push, AI, inventory, activity, task, problem, or calendar flows.

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
- [ ] backend health route, envelope, and error model files
- [ ] frontend auth/session, shell notification, config, and test files

---

# Domain Rules Affected

This task touches:

- [ ] API contract
- [ ] auth/session boundary
- [ ] frontend forms

Important rules to preserve:

```text
All application data access goes through the Fastify API.
The application data API remains under /api/v1.
API success responses use { data: ... }.
API error responses use { error: { code, message, details } }.
Authenticated API calls use Authorization: Bearer <access_token>.
Backend derives authenticated actor/account context server-side.
Frontend must not calculate business truth.
Frontend must display API errors clearly.
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

- [ ] frontend API envelope types
- [ ] frontend API error types
- [ ] typed API base client
- [ ] health API client method for smoke testing
- [ ] auth token HTTP interceptor
- [ ] API error interceptor/mapper
- [ ] global snackbar/error display integration
- [ ] unit tests for API client, auth interceptor, and error mapper
- [ ] static check or lint rule guidance keeping raw `HttpClient` centralized

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
GET /api/v1/health
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

Response envelope:

```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-05-13T12:00:00.000Z"
  }
}
```

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  }
}
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation/errors
- [ ] API response shape
- [ ] auth/session behavior
- [ ] edge cases

Specific test cases:

1. API client unwraps `{ data: ... }` success envelopes.
2. Health client calls `GET /api/v1/health`.
3. Error mapper converts canonical backend error envelopes into typed frontend API errors.
4. Error mapper preserves backend `message` and validation `details`.
5. Global error display shows backend error messages through the snackbar/error service.
6. Auth interceptor attaches `Authorization: Bearer <token>` for `/api/v1` calls when a token exists.
7. Auth interceptor omits `Authorization` when no token exists.
8. Auth interceptor does not attach bearer tokens to non-API or Supabase Auth requests.
9. Raw `HttpClient` usage is restricted to core API/interceptor infrastructure.

---

# Acceptance Criteria

The task is complete when:

- [ ] typed API envelope/error models exist
- [ ] API base client targets `/api/v1`
- [ ] health smoke client exists
- [ ] auth token interceptor forwards session token to Fastify API calls
- [ ] auth token interceptor omits token when absent and for non-API requests
- [ ] canonical API error mapper exists
- [ ] global snackbar/error display shows backend messages
- [ ] raw `HttpClient` usage is centralized
- [ ] tests cover API client, token behavior, and error behavior
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

Run frontend boundary/static checks.

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

Do not create domain-specific API services in this step. This step establishes the typed transport and error boundary future feature services will use.
