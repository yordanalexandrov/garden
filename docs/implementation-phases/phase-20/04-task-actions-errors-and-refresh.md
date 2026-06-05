# Implementation Task - Phase 20 Step 4: Task Actions, Errors, and Refresh

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Wire suggested-task confirm/dismiss and planned-task done/skip actions through backend endpoints, displaying backend side effects and refreshing relevant data.
```

## Branch

Use branch:

```text
feature/frontend-tasks-calendar
```

---

# Scope

Implement only:

- [ ] Inspect existing mutation, snackbar, confirm-dialog, loading, API error, and route refresh patterns.
- [ ] Wire suggested task confirm action to `POST /tasks/:taskId/confirm`.
- [ ] After confirm, display backend-returned planned status, `confirmedAt`, and reminder rows; do not synthesize reminders in frontend.
- [ ] Wire suggested task dismiss action to `POST /tasks/:taskId/dismiss`.
- [ ] Wire planned task mark-done action to `POST /tasks/:taskId/complete`.
- [ ] Wire planned task skip action to `POST /tasks/:taskId/skip`.
- [ ] Use confirmation dialogs where existing UX patterns require them for status-changing actions.
- [ ] Disable duplicate submissions while a mutation is in flight.
- [ ] Show canonical backend validation/business errors and preserve current UI state after failed mutations.
- [ ] Refresh task detail after each successful mutation.
- [ ] Refresh dashboard snippets and calendar data when those views are active or next navigated according to existing state patterns.
- [ ] Ensure terminal statuses no longer show mutation actions after refresh.
- [ ] Add component/page tests for action calls, backend reminder display after confirm, failed mutation handling, and data refresh.

---

# Out of Scope

Do not implement reminder creation, reminder schedule calculation, frontend reminder payloads, creating planned tasks directly from suggested data without confirm endpoint, calendar item mutations, backend task transaction fixes except documented tiny compatibility fixes, push notification registration, weather rain confirmation UI, or AI pages.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` task mutation endpoint sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` confirm/dismiss/complete/skip and rollback acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` task detail, API error, state refresh, and boundary sections
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/implementation-phases/phase-20/03-tasks-list-and-detail-pages.md`
- [ ] Existing task pages/API service, snackbar/dialog/error components, dashboard/calendar state, and tests

---

# Domain Rules Affected

This task touches account scoping, target resolution, tasks/reminders, weather/rain confirmation, frontend forms, API contract, and auth/session boundary.

Important rules to preserve:

```text
Suggested tasks require backend confirmation before becoming planned.
Confirm action creates reminders only through backend task workflow.
Dismiss sets suggested task to canceled through backend.
Planned task done/skip actions go through backend endpoints.
Frontend displays backend side effects/errors and does not synthesize business truth.
Failed reminder creation must leave task suggested backend-side; frontend must display the backend error and preserve current UI state.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement frontend page/component mutation handling, frontend API service usage, backend side-effect/error display, data refresh after mutations, and tests.

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no frontend reminder scheduler/timer, no frontend-created reminder payloads, no calendar/quarantine mutation path, and no trusted `accountId`.

---

# API Contract

Endpoints involved:

```text
GET /api/v1/tasks/:taskId
POST /api/v1/tasks/:taskId/confirm
POST /api/v1/tasks/:taskId/dismiss
POST /api/v1/tasks/:taskId/complete
POST /api/v1/tasks/:taskId/skip
GET /api/v1/dashboard
GET /api/v1/calendar
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for suggested task confirm/dismiss, planned task complete/skip, backend reminder side-effect rendering, duplicate-submit prevention, failed mutation error display/state preservation, and refresh after successful mutation.

Specific test cases:

1. Confirming a suggested task calls `POST /api/v1/tasks/:taskId/confirm`, displays backend-returned reminders, refreshes task detail, and shows planned state.
2. Dismissing a suggested task calls `POST /api/v1/tasks/:taskId/dismiss`, refreshes task detail, and removes suggested actions.
3. Completing/skipping a planned task calls the canonical endpoint and removes planned actions after refresh.
4. A failed confirm response displays the canonical API error and does not show frontend-synthesized reminders or planned state.
5. Mutation payloads do not include `accountId` or reminder rows.

---

# Acceptance Criteria

- [ ] Suggested task confirm/dismiss and planned task done/skip work through canonical backend endpoints.
- [ ] Confirm displays backend-created reminders and never creates them in frontend.
- [ ] Failed mutations preserve visible state and show backend errors.
- [ ] Relevant task/dashboard/calendar data refreshes after successful mutations.
- [ ] Focused task action tests pass.
