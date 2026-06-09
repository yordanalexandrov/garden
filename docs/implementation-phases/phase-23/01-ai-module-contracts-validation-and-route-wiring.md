# Implementation Task - Phase 23 Step 1: AI Module Contracts, Validation, and Route Wiring

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
Create the backend AI module skeleton, canonical request/response contracts, validation schemas, DTO helpers, dependency wiring, and protected route registration for Phase 23.
```

## Branch

Use branch:

```text
feature/backend-ai-suggestions
```

---

# Scope

Implement only:

- [ ] Inspect existing backend module, route registration, validation, DTO, auth, error envelope, dependency injection, and test helper patterns.
- [ ] Create the `ai` backend module structure using local conventions.
- [ ] Define AI session and suggestion domain/API types for canonical kinds and suggestion types:
  - [ ] `product_ingestion`
  - [ ] `bed_planning`
  - [ ] `problem_assist`
  - [ ] `product`
  - [ ] `product_rule`
  - [ ] `bed_plan`
  - [ ] `problem_summary`
  - [ ] `followup_questions`
- [ ] Add validation schemas for:
  - [ ] `POST /ai/product-ingestion` JSON request with `productName` and/or `labelText`
  - [ ] multipart product ingestion placeholder/boundary if existing route patterns support it
  - [ ] `POST /ai/bed-planning`
  - [ ] `POST /ai/problem-assist`
  - [ ] `POST /ai/suggestions/:suggestionId/accept`
  - [ ] `POST /ai/suggestions/:suggestionId/reject`
- [ ] Add DTO mappers for `aiSession`, `suggestions`, warnings, accept result, and reject result using camelCase canonical responses.
- [ ] Register protected `/api/v1/ai/*` routes with thin handlers that derive actor/account from backend auth context and call placeholder service methods.
- [ ] Ensure route handlers return canonical success/error envelopes through existing project mechanisms.
- [ ] Add focused validation/route-wiring tests where existing project patterns make this practical.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/ai/
backend/src/modules/ai/ai.types.ts
backend/src/modules/ai/ai.validation.ts
backend/src/modules/ai/ai.dto.ts
backend/src/modules/ai/ai.routes.ts
backend/src/modules/ai/ai.service.ts
backend/test/ai/
```

---

# Out of Scope

Do not implement:

- [ ] `AiPort` provider adapter internals; that belongs to Step 2.
- [ ] Repository persistence; that belongs to Step 3.
- [ ] Product ingestion, bed planning, or problem assist service workflows; that belongs to Step 4.
- [ ] Accept/reject business workflows; that belongs to Step 5.
- [ ] Frontend AI pages.
- [ ] Push notifications.
- [ ] MCP tools.
- [ ] Direct AI provider calls from routes or services.
- [ ] Direct database mutations from routes.
- [ ] Schema changes or migrations.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI and API invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 22 and error envelope sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI/API contract sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` AI API and service sections
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend module, route, validation, auth, error, DTO, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] AI suggestions
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
AI output is suggestion-only until explicit backend acceptance.
Frontend must not send trusted accountId for normal flows.
Backend derives account scope from the authenticated actor.
Errors use canonical envelopes.
MCP is not a privileged bypass channel; no MCP tool implementation is part of this phase step.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP AI tools may call these backend endpoints/services.
No MCP tool implementation is part of Phase 23.
```

Required MCP documentation updates:

```text
None unless endpoint paths, payloads, or acceptance behavior deviate from the canonical API contract. Do not introduce such a deviation without documenting the source-of-truth reason.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend service method placeholders or interfaces as needed for route wiring
- [ ] dependency wiring
- [ ] API DTO mapping
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no direct AI provider calls outside `AiPort`

---

# API Contract

Endpoints involved:

```text
POST /api/v1/ai/product-ingestion
POST /api/v1/ai/bed-planning
POST /api/v1/ai/problem-assist
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` section 22

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] auth/account context usage
- [ ] API response shape
- [ ] route registration

Specific test cases:

1. AI routes require authenticated backend actor context.
2. Product ingestion request validates supported JSON shape.
3. Bed planning request validates `bedId`, `year`, `candidatePlantIds`, and `notes`.
4. Problem assist validates either `problemId` or ad hoc `text`.
5. Accept request validates `suggestionId` and optional `editedPayload`.
6. Reject request validates `suggestionId`.
7. Validation failures use canonical error envelopes.

---

# Acceptance Criteria

The task is complete when:

- [ ] AI module and route skeleton exist.
- [ ] Canonical route validation and DTO shapes are represented.
- [ ] Handlers are thin and protected by backend auth.
- [ ] No provider calls, persistence workflows, business acceptance, frontend, push, MCP, or schema scope slipped in.

---

# Commands to Run

Run relevant backend commands:

```bash
npm run typecheck
npm run lint
npm test
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
