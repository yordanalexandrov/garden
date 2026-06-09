# Implementation Task - Phase 24 Step 6: Frontend Regression, Boundary, and Error Tests

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Add focused frontend regression, error-display, route, and static/boundary tests for Phase 24 AI Assistant pages.

## Branch

Use branch:

```text
feature/frontend-ai-assistant
```

---

# Scope

Implement only:

- [ ] Test AI route registration and navigation for `/ai`, `/ai/product-ingestion`, `/ai/bed-planning`, and `/ai/problem-assist`.
- [ ] Test `AiApiService` uses canonical endpoints and existing API envelope/error handling.
- [ ] Test product ingestion suggestions are not displayed as saved products/rules before acceptance.
- [ ] Test accept sends `editedPayload` only when present and renders backend-created entity links after success.
- [ ] Test reject updates UI without rendering created entity links.
- [ ] Test backend validation/provider errors display on all three pages without clearing user input or suggestion edits.
- [ ] Test bed planning output remains advisory and does not call planting/task/activity/inventory mutation APIs.
- [ ] Test problem assist output avoids diagnosis-as-fact wording and does not call problem/task/activity/photo/product/inventory mutation APIs.
- [ ] Add/update static checks for no direct AI/model provider calls, no provider SDK imports, no provider URLs, no `AI_API_KEY`/`AI_MODEL`, no service role key, no direct Supabase application-table/PostgREST/Storage access, no raw feature-component `HttpClient`, and no trusted `accountId`.

---

# Out of Scope

Do not implement:

- [ ] Backend tests.
- [ ] Provider adapter tests.
- [ ] Full E2E suite unless already cheap and configured.
- [ ] Push notification, weather, MCP, deployment, or worker/scheduler tests.
- [ ] New feature behavior beyond small fixes needed to satisfy Phase 24 acceptance criteria.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI and frontend/provider boundary sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` AI API and shared errors
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI product ingestion, AI acceptance, no-diagnosis, frontend boundary, and static/security sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` AI pages, API integration, state, forms, and boundary rules
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] `docs/implementation-phases/phase-24-frontend-ai-assistant-pages.md`
- [ ] All Phase 24 step files
- [ ] Existing frontend test helpers, package scripts, and boundary-check scripts

---

# Domain Rules Affected

This task touches:

- [ ] AI suggestions
- [ ] product usage rules
- [ ] problems/photos
- [ ] target resolution
- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
AI output is not business truth until accepted.
AI problem assistance is not diagnosis.
Rejected suggestions create no business records.
Bed planning is guidance only and does not auto-apply plantings.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Provider keys are backend-only.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Infrastructure/Security Boundaries

Preserve:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs/tests
- [ ] no direct Supabase Storage business calls
- [ ] no direct AI/model provider calls, provider URLs, provider SDK imports, or provider secrets in frontend code/config/tests
- [ ] no raw `HttpClient` calls from AI feature components
- [ ] no trusted `accountId` in frontend request models
- [ ] no frontend-created product/rule/problem/task/activity/planting/inventory truth
- [ ] no diagnosis-as-fact wording in problem assist UI

---

# API Contract

Endpoints covered:

```text
POST /api/v1/ai/product-ingestion
POST /api/v1/ai/bed-planning
POST /api/v1/ai/problem-assist
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] happy paths for all three AI pages
- [ ] validation errors
- [ ] provider/API errors
- [ ] canonical API response shapes
- [ ] accept/reject UI state
- [ ] route registration
- [ ] frontend boundary/static checks
- [ ] no local business-record mutation

Specific test cases:

1. Product ingestion keeps suggestions unaccepted until accept succeeds and then shows backend-created entity links.
2. Bed planning renders guidance without mutation calls to planting/task/activity/inventory services.
3. Problem assist renders possible categories/follow-up questions without diagnosis-as-fact wording or mutation calls.
4. Boundary checks fail if frontend code references AI provider secrets/SDKs/URLs, Supabase application-table/Storage APIs, raw AI feature `HttpClient`, or trusted `accountId`.

---

# Acceptance Criteria

- [ ] Phase 24 critical UI behavior and AI/provider/database boundaries are covered by focused tests/checks.
- [ ] Backend error display is covered for each page.
- [ ] Static checks protect against direct provider/Supabase access and frontend-owned business truth.

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
- AI/provider/database boundary status
- Review focus
