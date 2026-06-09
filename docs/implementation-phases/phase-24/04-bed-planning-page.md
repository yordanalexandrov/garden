# Implementation Task - Phase 24 Step 4: Bed Planning Page

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement the `/ai/bed-planning` page for requesting AI bed planning guidance and presenting the result as advisory, non-applied suggestions.

## Branch

Use branch:

```text
feature/frontend-ai-assistant
```

---

# Scope

Implement only:

- [ ] Inspect existing place/bed/year selectors, bed detail links, planting overview components, shared form controls, and mobile layouts.
- [ ] Build a Reactive Form for `bedId`, `year`, `candidatePlantIds`, and optional notes using existing selectors where available.
- [ ] Display helpful context from existing frontend APIs only when already available through Fastify endpoints; do not fetch database tables directly.
- [ ] Submit bed planning requests to `AiApiService.bedPlanning`.
- [ ] Render returned bed plan suggestions as guidance with spacing suggestions, coexistence notes, incompatibility warnings, rough quantity guidance, and backend warnings/uncertainty.
- [ ] Make clear that output is advisory and not applied to yearly plantings, persistent plants, tasks, inventory, or activities.
- [ ] If the backend returns an accept-capable suggestion, accept/reject may use shared suggestion card state, but acceptance must still call backend AI endpoints only and must not mutate plantings locally.
- [ ] Preserve form input and result state on backend validation/provider errors.
- [ ] Add focused page tests for form validation, canonical request mapping, advisory-only rendering, warnings, errors, and no planting/task mutations.

---

# Out of Scope

Do not implement:

- [ ] Backend AI workflow, bed repository/service changes, target resolution changes, or database migrations.
- [ ] Auto-creating or editing yearly bed plantings, persistent plants, tasks, activities, product rules, or inventory movements.
- [ ] Frontend-side bed compatibility rules as business truth.
- [ ] Direct AI provider calls, provider keys/config, direct Supabase table/storage access, or raw database reads.
- [ ] Product ingestion or problem assist page behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI, beds/plantings, target, task, frontend boundary, and provider sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` AI bed planning and shared envelope/error sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI acceptance and frontend boundary sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` AI bed planning page and AI UX rules
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] `docs/implementation-phases/phase-24-frontend-ai-assistant-pages.md`
- [ ] `docs/implementation-phases/phase-24/01-ai-api-services-and-feature-scaffold.md`
- [ ] `docs/implementation-phases/phase-24/02-shared-ai-suggestion-card-and-review-state.md`
- [ ] Existing bed/place/plant selectors, route links, API services, and tests

---

# Domain Rules Affected

This task touches:

- [ ] AI suggestions
- [ ] target resolution
- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
AI output is guidance, not auto-applied truth.
AI output becomes business data only after explicit user acceptance through the backend.
Frontend must not decide concrete resolved target rows as final truth.
All-beds/all-perennials are scoped to one place.
Cross-place mixed targeting is not allowed in v1.
Suggested tasks are not planned tasks.
Frontend never accesses application tables directly.
AI provider access is backend-side only through AiPort.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement:

- [ ] frontend page/component
- [ ] frontend Reactive Form validation
- [ ] typed AI API service integration
- [ ] shared suggestion/guidance rendering
- [ ] backend error display
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no direct AI/model provider calls, no provider keys/config in frontend, no planting/task mutation, and no trusted `accountId`.

---

# API Contract

Endpoint involved:

```text
POST /api/v1/ai/bed-planning
```

Request fields:

```text
bedId
year
candidatePlantIds
notes
```

If accept/reject is supported in the implemented UI, use:

```text
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] required bed/year validation
- [ ] candidate plant selection request mapping
- [ ] canonical bed planning request body
- [ ] spacing/coexistence/warning/quantity guidance rendering
- [ ] advisory-only copy/status that does not present output as applied plantings
- [ ] backend validation/provider error display without clearing input
- [ ] no planting/task/activity/inventory mutation calls
- [ ] no trusted `accountId`

Specific test cases:

1. Bed planning form sends `bedId`, `year`, `candidatePlantIds`, and `notes` through `AiApiService`.
2. Bed plan suggestions render spacing, coexistence, warnings, and rough quantity guidance as advisory output.
3. Backend errors remain visible and do not clear selected bed/year/plants.
4. The page does not call planting/task mutation APIs or show guidance as applied records.

---

# Acceptance Criteria

- [ ] `/ai/bed-planning` works through backend AI endpoints only.
- [ ] Bed planning output is visibly advisory and not applied to garden records.
- [ ] Backend errors/warnings are displayed compactly.
- [ ] No frontend-created plantings, tasks, activities, or inventory changes are introduced.
- [ ] Focused page/API tests pass.
