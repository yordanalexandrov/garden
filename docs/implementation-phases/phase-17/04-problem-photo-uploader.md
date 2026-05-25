# Implementation Task - Phase 17 Step 4: Problem Photo Uploader

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

Implement reusable problem-only photo uploader UI that uploads through the backend API.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

---

## Scope

- [ ] Create `app-problem-photo-uploader` or local equivalent following existing shared component conventions.
- [ ] Show uploader only when the selected record type is `problem`.
- [ ] Hide or disable uploader for `observation` and ensure no upload request is sent.
- [ ] Support mobile camera/file input using standard file input behavior.
- [ ] Add optional client MIME/size validation as UX only; backend remains authoritative.
- [ ] Upload using backend `POST /api/v1/problems/:problemId/photos` multipart field `file`.
- [ ] Display upload progress/errors where available and preserve metadata form/detail state on failure.
- [ ] Add component/API tests for problem-only visibility, observation no-upload, multipart call, and errors.

## Out of Scope

- [ ] Direct Supabase Storage upload.
- [ ] Required photo-before-save behavior.
- [ ] Image resizing/AI analysis.

## Domain Rules

- Photos are supported only for problems in v1.
- Frontend must not directly access storage buckets.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] problems/photos
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] frontend forms

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Problem photos are supported only for problems in v1; observation photos are not supported.
Frontend must not directly access Supabase Storage buckets.
Photo display must use backend-provided URLs only.
Service role key must never appear in frontend code, env files, build config, or tests.
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

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls from frontend code
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] no trusted accountId submitted from frontend payloads
- [ ] no observation photo upload path in frontend code
- [ ] photo display uses backend-provided URLs only

---

## Acceptance Criteria

- [ ] Problem photo upload is available only for problems and uses backend API only.

---

# Commands to Run

From the frontend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
```

Also run any configured frontend boundary/static checks. If any command is unavailable or fails due to pre-existing setup, report it clearly.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules affected
- API changes
- Tests run
- Storage/upload boundary status
- Review focus
