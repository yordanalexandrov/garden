# Implementation Task - Phase 17 Step 7: Verification and PR Readiness

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

Verify Phase 17 frontend work, update implementation status, commit focused changes, and open the implementation PR.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

---

## Scope

- [ ] Review final diff for accidental backend, AI, correction, observation-photo, direct storage, or service-role scope creep.
- [ ] Verify Reactive Forms, typed API services, backend error display, target summary, problem-only uploader, and detail photo rendering.
- [ ] Run frontend checks.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 17 implemented only if implementation and checks are complete.
- [ ] Commit focused changes and open a PR with the expected Phase 17 summary from the top-level phase spec.

## Required Verification Commands

From the frontend package root, run where configured:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also run configured frontend boundary/static checks for direct Supabase table/storage access, service-role exposure, raw `HttpClient` bypasses, trusted `accountId`, and storage URL construction.

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

- [ ] Problems and observations can be created through UI.
- [ ] Problem photos upload through backend API only.
- [ ] Observation photo behavior is blocked/hidden.
- [ ] Problem detail displays controlled photo URLs.
- [ ] PR is open and ready for Review Agent review.

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
