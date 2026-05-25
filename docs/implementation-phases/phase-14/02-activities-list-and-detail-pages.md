# Implementation Task - Phase 14 Step 2: Activities List and Detail Pages

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

Implement:

```text
Build the activities list and activity detail pages that display backend activity history, filters, target summaries, product usage, and returned side-effect summaries.
```

## Branch

Use branch:

```text
feature/frontend-create-activity
```

---

# Scope

Implement only:

- [ ] Inspect existing list/detail page patterns, filter components, date controls, empty states, loading states, error display, and responsive layout from prior frontend phases.
- [ ] Implement `/activities` page with filters for place, date range, and activity type.
- [ ] Display paginated backend activity results using the existing canonical list envelope pattern.
- [ ] Show each activity list item with type, performed date/time, place, target summary, products used if present, and backend-provided generated effect summary where available.
- [ ] Add navigation from list items to `/activities/:activityId`.
- [ ] Add a clear primary action to `/activities/new`.
- [ ] Implement `/activities/:activityId` detail page with activity header fields, target summary, notes, product usage rows, warnings, inventory effects, quarantine periods, and suggested tasks returned by the backend.
- [ ] Render suggested tasks distinctly from planned tasks if task-like summaries appear.
- [ ] Preserve user-visible backend errors without clearing current filters.
- [ ] Add focused component/page tests for filters, loading/error/empty states, navigation, and detail rendering.

---

# Out of Scope

Do not implement:

- [ ] Create activity form behavior.
- [ ] Activity correction or edit UI.
- [ ] Weather rain prompt, task confirmation, AI suggestions, problems/photos, or calendar/dashboard aggregation.
- [ ] Local generation of target resolution, inventory allocation, quarantine periods, or suggested tasks.
- [ ] Backend endpoint or schema changes.
- [ ] Direct Supabase application-table or storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Activities API and shared enum/target sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` Activities list page, activity detail, API integration, state, and mobile sections
- [ ] `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- [ ] `docs/implementation-phases/phase-14/01-activities-api-services-and-feature-scaffold.md`
- [ ] Existing frontend list/detail/filter/page test patterns

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract

Important rules to preserve:

```text
Activities are historical records.
Target labels returned to frontend are display helpers, not source of truth.
Frontend must not calculate resolved targets as final truth.
Frontend must display backend-returned side effects and warnings.
Suggested tasks are not planned tasks and must look distinct where displayed.
All application data access goes through the Fastify API under /api/v1.
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

- [ ] frontend page/component
- [ ] frontend filters
- [ ] frontend loading/error/empty states
- [ ] frontend route navigation
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] no target resolution truth, FEFO allocation, stock mutation, quarantine generation, or suggested-task generation in frontend code

---

# API Contract

Endpoints involved:

```text
GET /api/v1/activities
GET /api/v1/activities/:activityId
Supporting selector/list endpoint for places if needed by filters
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] list happy path
- [ ] filters and query params
- [ ] empty state
- [ ] API error display
- [ ] detail happy path
- [ ] side-effect summary rendering
- [ ] suggested task display distinction
- [ ] mobile smoke where practical

Specific test cases:

1. Activities list sends place, date range, type, and pagination filters through `ActivitiesApiService`.
2. Activities list shows type, performed date/time, place, target summary, product summary, and backend effect summary.
3. Activity detail displays targets, products, warnings, inventory effects, quarantine periods, and suggested tasks from the API response.
4. API errors render without clearing selected filters.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/activities` renders filterable backend activity history.
- [ ] `/activities/:activityId` renders backend activity detail and side-effect information.
- [ ] The list links to detail and create routes.
- [ ] Frontend remains display-only for targets, inventory, quarantine, and suggested task side effects.
- [ ] Focused page/component tests pass.
