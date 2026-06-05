# Implementation Task - Phase 20 Step 7: Frontend Regression, Boundary, and Error Tests

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Add focused Phase 20 frontend regression, API-contract, error-display, and static boundary tests.
```

## Branch

Use branch:

```text
feature/frontend-tasks-calendar
```

---

# Scope

Implement only:

- [ ] Review tests added in Phase 20 Steps 1-6 and fill coverage gaps.
- [ ] Add or update API service tests for Tasks, Calendar, and Dashboard canonical endpoint usage.
- [ ] Add page/component tests for dashboard widget rendering and links.
- [ ] Add page/component tests for task list/detail state rendering and task actions.
- [ ] Add page/component tests for calendar month/agenda rendering, legend, place/date filters, item navigation, and read-only quarantine display.
- [ ] Add API error tests showing canonical validation/business errors without losing current UI state.
- [ ] Add static/boundary checks or extend existing frontend boundary checks to guard against direct Supabase application-table access, direct Supabase Storage business calls, backend-only secrets in frontend files, raw component `HttpClient` calls bypassing typed API services, trusted `accountId` in Phase 20 request models, frontend reminder scheduler/timer or reminder payload creation, calendar writes or quarantine mutation paths, and indistinct suggested/planned task rendering.
- [ ] Keep tests deterministic with mocked API responses and date fixtures.

---

# Out of Scope

Do not implement new product behavior beyond tests and small testability fixes, backend endpoint changes except documented tiny compatibility fixes if a blocking mismatch exists, end-to-end browser automation unless obvious lightweight E2E infrastructure already exists, push notification registration tests, weather rain confirmation tests, or AI page tests.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` task/calendar/dashboard sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` frontend, API contract, and acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` frontend test, API, state, boundary, dashboard, task, and calendar sections
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] All earlier Phase 20 step files
- [ ] Existing frontend test helpers, boundary-check scripts, package scripts, and affected feature specs

---

# Domain Rules Affected

This task touches account scoping, target resolution, quarantine, tasks/reminders, weather/rain confirmation, frontend forms, API contract, and auth/session boundary.

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never accesses application tables directly.
Suggested tasks are distinct from planned tasks.
Reminders are created only by backend planned-task workflows.
Calendar is read-only.
Quarantine is read-only.
Weather is advisory.
Backend validation/errors are authoritative and must be displayed.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement tests, static/boundary check updates if configured, and docs/update notes only if needed to explain test commands.

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no direct Storage business calls, no frontend reminder scheduler/timer, no frontend-created reminder payloads, no calendar/quarantine mutation path, and no trusted `accountId`.

---

# API Contract

Endpoints involved:

```text
GET /api/v1/tasks
POST /api/v1/tasks
GET /api/v1/tasks/:taskId
PATCH /api/v1/tasks/:taskId
POST /api/v1/tasks/:taskId/confirm
POST /api/v1/tasks/:taskId/dismiss
POST /api/v1/tasks/:taskId/complete
POST /api/v1/tasks/:taskId/skip
GET /api/v1/calendar
GET /api/v1/dashboard
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for happy path rendering, validation/business error display, API response shape, frontend form/filter behavior, task mutation behavior, calendar item distinction, dashboard links, and frontend/backend boundary rules.

Specific test cases:

1. Task action tests prove confirm displays backend reminders and no reminder payload is sent from frontend.
2. Calendar tests prove activity/task/quarantine/weather item types remain visually distinct and quarantine has no edit controls.
3. Dashboard tests prove summary widgets link to relevant modules and keep suggested/planned tasks separate.
4. Error tests prove canonical API errors display and preserve current UI state after failed mutations.
5. Static checks fail if Phase 20 code adds trusted `accountId`, frontend reminder scheduler/timer code, direct Supabase table/storage access, or calendar/quarantine mutation paths.

---

# Acceptance Criteria

- [ ] Phase 20 has focused regression and API-service tests for dashboard, tasks, and calendar.
- [ ] Boundary checks cover frontend/backend responsibility rules specific to Phase 20.
- [ ] Error-display tests cover task mutation failures and calendar/dashboard load failures.
- [ ] Tests are deterministic and do not depend on real backend/network calls.
- [ ] Relevant frontend test/check commands pass or failures are documented exactly.
