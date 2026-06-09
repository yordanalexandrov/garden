# Implementation Task - Phase 24 Step 5: Problem Assist Page

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement the `/ai/problem-assist` page for optional AI assistance on an existing problem or ad hoc text while avoiding autonomous diagnosis wording and business-record mutation.

## Branch

Use branch:

```text
feature/frontend-ai-assistant
```

---

# Scope

Implement only:

- [ ] Inspect existing problem list/detail links, problem selector patterns, problem create form wording, error summaries, and mobile layouts.
- [ ] Build a Reactive Form that accepts either an existing `problemId` or ad hoc `text`, with validation that requires one supported input path.
- [ ] Submit problem assist requests to `AiApiService.problemAssist`.
- [ ] Render returned problem summary suggestions, possible category suggestions, follow-up questions/actions, backend warnings, and uncertainty as assistive suggestions only.
- [ ] Use wording that avoids diagnosis-as-fact; present categories as possible categories or prompts for user review.
- [ ] Keep the page from updating problem records, tasks, activities, photos, products, inventory, or plantings directly.
- [ ] If the backend returns an accept-capable suggestion, accept/reject may use shared suggestion card state, but acceptance must still call backend AI endpoints only and must not update problem records locally.
- [ ] Preserve form input and result state on backend validation/provider errors.
- [ ] Add focused page tests for input validation, canonical request mapping, no-diagnosis presentation, warning/error display, and no problem mutation calls.

---

# Out of Scope

Do not implement:

- [ ] Backend AI workflow, problem repository/service changes, photo storage changes, provider adapters, or database migrations.
- [ ] Direct problem record updates, category changes, task creation, activity creation, photo upload, product/rule creation, or inventory changes from this page.
- [ ] Autonomous diagnosis language or treatment instructions presented as fact.
- [ ] Direct AI provider calls, provider keys/config, direct Supabase table/storage access, or raw database reads.
- [ ] Product ingestion or bed planning page behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI, problems/photos, frontend boundary, and provider sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` AI problem assist and shared envelope/error sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI problem assistance, no diagnosis, and frontend boundary sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` AI problem assist page and AI UX rules
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-17-frontend-problems-and-photos-flow.md`
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] `docs/implementation-phases/phase-24-frontend-ai-assistant-pages.md`
- [ ] `docs/implementation-phases/phase-24/01-ai-api-services-and-feature-scaffold.md`
- [ ] `docs/implementation-phases/phase-24/02-shared-ai-suggestion-card-and-review-state.md`
- [ ] Existing problem API services, selectors, links, detail components, and tests

---

# Domain Rules Affected

This task touches:

- [ ] AI suggestions
- [ ] problems/photos
- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
AI problem assistance is not diagnosis.
AI output is a suggestion.
AI uncertainty/warnings must be visible.
AI output becomes business data only after explicit user acceptance through the backend.
Problem photos are supported only for problems in v1 and this page does not upload photos.
Frontend never accesses application tables directly.
Frontend must not create tasks, activities, or problem updates as business truth.
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

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no direct AI/model provider calls, no provider keys/config in frontend, no direct Storage calls, no problem/task/activity mutation, and no trusted `accountId`.

---

# API Contract

Endpoint involved:

```text
POST /api/v1/ai/problem-assist
```

Request may include one supported input path:

```text
problemId
text
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

- [ ] existing problem vs ad hoc text validation
- [ ] canonical problem assist request body
- [ ] summary/category/follow-up rendering as possible suggestions
- [ ] no diagnosis-as-fact wording in rendered UI text
- [ ] backend validation/provider error display without clearing input
- [ ] no problem/task/activity/photo/product/inventory mutation calls
- [ ] no trusted `accountId`

Specific test cases:

1. Problem assist form submits either `problemId` or `text` through `AiApiService` and rejects an empty request.
2. Problem summary and possible categories render as reviewable suggestions, not diagnosis.
3. Backend errors remain visible and do not clear selected problem or ad hoc text.
4. The page does not call problem update, task creation, activity creation, photo upload, product/rule, or inventory APIs.

---

# Acceptance Criteria

- [ ] `/ai/problem-assist` works through backend AI endpoints only.
- [ ] Problem assist output is visibly assistive and not diagnosis.
- [ ] No frontend-created problem/task/activity/photo/product/inventory mutation path is introduced.
- [ ] Backend errors/warnings are displayed compactly.
- [ ] Focused page/API tests pass.
