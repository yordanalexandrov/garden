# Implementation Task - Phase 24 Step 1: AI API Services and Feature Scaffold

## Role

You are the **Implementation Agent**.

Use:

- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement the typed frontend AI API service, DTO/request models, route scaffold, and feature folder structure needed by Phase 24 AI Assistant pages.

## Branch

Use branch:

```text
feature/frontend-ai-assistant
```

---

# Scope

Implement only:

- [ ] Inspect the existing Angular shell, route registration, typed API client, auth token interceptor, API error mapper, shared status/error components, product/bed/problem link helpers, and test setup from earlier frontend phases.
- [ ] Create an AI feature structure using the existing frontend architecture.
- [ ] Define frontend DTO/request types for AI sessions, product ingestion, bed planning, problem assist, suggestions, accept/reject requests, created/updated entity references, warnings, and canonical error envelopes.
- [ ] Add typed `AiApiService` methods for `POST /api/v1/ai/product-ingestion`, `POST /api/v1/ai/bed-planning`, `POST /api/v1/ai/problem-assist`, `POST /api/v1/ai/suggestions/:suggestionId/accept`, and `POST /api/v1/ai/suggestions/:suggestionId/reject`.
- [ ] Use the existing API base client and envelope unwrapping; do not call `HttpClient` directly from feature components.
- [ ] Ensure no request model includes trusted `accountId` or provider configuration.
- [ ] Add lazy route scaffolding for `/ai`, `/ai/product-ingestion`, `/ai/bed-planning`, and `/ai/problem-assist`, replacing only existing Phase 24 placeholders where present.
- [ ] Add route-safe empty shells or lightweight placeholders only; product/bed/problem page behavior belongs to later Phase 24 tasks.
- [ ] Add API service and route tests for canonical paths, request bodies, response envelope mapping, backend error mapping, and no `accountId`.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/ai/
frontend/src/app/features/ai/data-access/
frontend/src/app/features/ai/pages/
frontend/src/app/features/ai/components/
frontend/src/app/core/api/
frontend/src/app/app.routes.ts
frontend/src/app/features/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Full AI page UI beyond route-safe shells needed for wiring.
- [ ] Shared suggestion card behavior; that is Step 2.
- [ ] Product ingestion, bed planning, or problem assist workflows; those are Steps 3-5.
- [ ] Backend endpoints, AI provider adapters, migrations, repositories, services, transactions, or audit behavior.
- [ ] Direct AI/model provider calls, provider SDK imports, provider URLs, or AI provider keys in frontend code/config.
- [ ] Direct Supabase application-table, PostgREST, SQL, or Storage access.
- [ ] Frontend-created products, product rules, tasks, inventory movements, plantings, problem updates, or diagnoses.
- [ ] Push notifications, weather behavior, MCP tools, deployment, or worker/scheduler behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI, frontend boundary, account, and provider sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` AI API and shared envelope/error sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI acceptance and frontend/static boundary sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` route map, API integration, AI Assistant pages, forms, and AI UX rules
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] `docs/implementation-phases/phase-24-frontend-ai-assistant-pages.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend API client, auth/session, routing, error mapper, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] AI suggestions
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
AI output is a suggestion.
AI output becomes business data only after explicit user acceptance through the backend.
Frontend may display, preview, validate basic input, and submit user intent.
Frontend is not business truth.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
AI provider access is backend-side only through AiPort.
Provider keys are backend-only.
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

- [ ] frontend API service
- [ ] frontend DTO/request/response types
- [ ] feature route scaffolding
- [ ] feature folder structure
- [ ] tests
- [ ] static/boundary check updates if the existing project has a frontend boundary-check pattern

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct AI/model provider calls from frontend code
- [ ] no provider URLs, provider SDK imports, `AI_API_KEY`, or `AI_MODEL` in frontend code/config/tests
- [ ] no trusted `accountId` in form values or request models
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows

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

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] API response envelope mapping
- [ ] canonical endpoint paths
- [ ] product ingestion request body mapping
- [ ] bed planning request body mapping
- [ ] problem assist request body mapping
- [ ] accept `editedPayload` omission when absent
- [ ] reject response mapping
- [ ] no trusted `accountId`
- [ ] feature route registration
- [ ] boundary/static checks where configured

Specific test cases:

1. `AiApiService` creates product ingestion sessions through `POST /api/v1/ai/product-ingestion`.
2. `AiApiService` creates bed planning sessions through `POST /api/v1/ai/bed-planning`.
3. `AiApiService` creates problem assist sessions through `POST /api/v1/ai/problem-assist`.
4. `AiApiService` accepts and rejects suggestions through canonical suggestion endpoints.
5. AI route scaffolding registers `/ai`, `/ai/product-ingestion`, `/ai/bed-planning`, and `/ai/problem-assist` through the existing lazy routing pattern.

---

# Acceptance Criteria

The task is complete when:

- [ ] AI feature scaffolding and route shells exist.
- [ ] Typed AI API service consumes canonical endpoints through the existing API client.
- [ ] AI DTO/request/response types match the canonical contract.
- [ ] No direct provider/table/storage access or raw component `HttpClient` usage is introduced.
- [ ] Focused API service/route tests pass.
