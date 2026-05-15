# Implementation Task - Phase 3 Step 1: Auth Types and Port Contract

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
Define the backend authentication contract, authenticated actor/account context, and bearer-token parsing helpers without wiring a provider or protected routes yet.
```

## Branch

Use branch:

```text
feature/auth-account-boundary
```

---

# Scope

Implement only:

- [ ] Inspect the existing backend app, error model, config, route registration, test helpers, and Phase 2 database abstractions.
- [ ] Add `AuthenticatedActor` and related account/user context types for backend services and controllers.
- [ ] Define `AuthPort.verifyAccessToken(token): Promise<AuthenticatedActor>`.
- [ ] Add a small bearer-token parser for `Authorization: Bearer <access_token>`.
- [ ] Map missing or malformed auth headers to canonical `UNAUTHORIZED` errors.
- [ ] Keep provider-specific JWT verification out of this step.
- [ ] Keep all auth types backend-owned and independent of Supabase SDK types.
- [ ] Document the expected account context fields that later services must receive from request context, not request bodies.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/auth/auth.types.ts
backend/src/modules/auth/auth.port.ts
backend/src/modules/auth/bearer-token.ts
backend/test/auth/
```

---

# Out of Scope

Do not implement:

- [ ] Supabase JWT validation.
- [ ] Deterministic test auth adapter.
- [ ] `AccountsRepository`.
- [ ] Fastify auth plugin/hook wiring.
- [ ] Protected business route groups.
- [ ] Frontend login/session UI.
- [ ] Domain CRUD endpoints.
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
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-03-auth-and-account-boundary.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend app, error, config, validation, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] auth/session boundary
- [ ] API contract
- [ ] provider adapter boundary

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Frontend must not submit accountId for normal flows.
Backend validates Supabase Auth JWTs through AuthPort.
Backend derives authenticated user/account context server-side.
Supabase Auth is used through AuthPort.
Supabase service role key is backend-only.
```

This step defines contracts only. It must not decide domain authorization behavior for future business endpoints.

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

- [ ] backend auth context types
- [ ] `AuthPort` interface
- [ ] bearer-token parser
- [ ] canonical auth error mapping for missing/malformed headers
- [ ] unit tests for parser and error mapping
- [ ] docs/update notes only if auth context expectations need clarification

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
None in this step.
```

Future protected endpoints must use:

```http
Authorization: Bearer <access_token>
```

Missing or malformed tokens must return canonical `UNAUTHORIZED` errors according to `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] API response/error shape where helper behavior is exposed
- [ ] edge cases

Specific test cases:

1. Bearer parser extracts the token from `Authorization: Bearer <token>`.
2. Bearer parser rejects a missing header with `UNAUTHORIZED`.
3. Bearer parser rejects non-Bearer schemes with `UNAUTHORIZED`.
4. Bearer parser rejects empty, whitespace-only, or multi-part malformed bearer values.
5. Auth contract types compile without importing Supabase SDK types into domain/service-facing modules.

---

# Acceptance Criteria

The task is complete when:

- [ ] `AuthPort` is defined.
- [ ] `AuthenticatedActor` or equivalent context type is defined.
- [ ] Missing/malformed bearer tokens map to canonical `UNAUTHORIZED` behavior.
- [ ] No provider adapter, route protection, frontend code, or domain endpoint is introduced.
- [ ] Supabase-specific details do not leak into service-facing auth contracts.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

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

This is a contract step. Keep it small enough that later adapter, repository, and Fastify plugin work can be reviewed independently.
