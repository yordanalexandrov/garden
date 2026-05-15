# Implementation Task Template — Gardening Helper

## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `gardening-helper-implementation-agent-instructions.md`
- `gardening-helper-ai-implementation-handoff-readme-v1.md`
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
<short description of feature/work>
```

## Branch

Use branch:

```text
feature/<task-name>
```

---

# Scope

Implement only:

- [ ] <item 1>
- [ ] <item 2>
- [ ] <item 3>

---

# Out of scope

Do not implement:

- [ ] <item 1>
- [ ] <item 2>
- [ ] <item 3>

---

# Required documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `gardening-helper-implementation-agent-instructions.md`
- [ ] `gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `gardening-helper-canonical-api-contract-v1.md`
- [ ] `gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `<task-specific-doc-or-file>`
- [ ] `<existing-code-files-to-inspect>`

---

# Domain rules affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] weather/rain confirmation
- [ ] frontend forms
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
<list exact rules relevant to this task>
```

---

# MCP impact

This task:

- [ ] adds/changes MCP tool(s)
- [ ] changes backend behavior used by MCP tools
- [ ] requires MCP documentation update
- [ ] has no MCP impact

MCP tools affected:

```text
<tool names>
```

Required MCP documentation updates:

```text
<files/sections>
```

---

# Required implementation details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend service method
- [ ] repository methods
- [ ] transaction handling
- [ ] frontend API service
- [ ] frontend page/component
- [ ] frontend form validation
- [ ] provider adapter through port
- [ ] worker/scheduler behavior
- [ ] deployment/security docs
- [ ] tests
- [ ] docs/update notes

Remove unchecked items that are not relevant.

---

# Required infrastructure/security boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`
- [ ] worker/scheduler ownership is explicit for reminders/weather checks

---

# API contract

Endpoints involved:

```text
<GET/POST/PATCH endpoint list>
```

Request/response must follow:

- `gardening-helper-canonical-api-contract-v1.md`

---

# Tests required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] frontend form behavior
- [ ] edge cases

Specific test cases:

1. `<test case>`
2. `<test case>`
3. `<test case>`

---

# Acceptance criteria

The task is complete when:

- [ ] feature works according to spec
- [ ] API contract is respected
- [ ] domain rules are preserved
- [ ] tests are added/updated
- [ ] relevant checks pass
- [ ] no unrelated changes are included
- [ ] PR description is complete

---

# Commands to run

Run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

If any command does not exist or fails due to pre-existing setup, report it clearly.

---

# PR requirements

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

Do not skip critical tests.

Do not claim tests passed unless they were actually run.

If unsure, stop and explain the ambiguity before making a major assumption.
