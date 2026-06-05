# Implementation Task - Phase 20 Step 3: Tasks List and Detail Pages

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Build task list access and task detail UI that clearly separates suggested, planned, done, skipped, and canceled task states.
```

## Branch

Use branch:

```text
feature/frontend-tasks-calendar
```

---

# Scope

Implement only:

- [ ] Inspect existing list/detail page patterns, route params, status chips, selectors, error summary components, and shared date formatting patterns.
- [ ] Add task list UI where it fits existing navigation, such as `/tasks` if already configured or a dashboard/calendar-linked list route if required by the existing route design.
- [ ] Add filters for place, status, type, and due date range using canonical `GET /tasks` query params.
- [ ] Implement `/tasks/:taskId` detail route using `TasksApiService.getTask`.
- [ ] Render task type, due date, place, target summary/details, source type/reference, notes, status, reminder summary, and backend-provided weather events.
- [ ] Render status-specific action areas without wiring mutations yet: suggested shows confirm/edit/dismiss; planned shows done/skip/edit; done/skipped/canceled are mostly read-only.
- [ ] Use existing Angular Material and shared UI patterns.
- [ ] Ensure suggested and planned task states are visually and behaviorally distinct.
- [ ] Render API loading, empty, not-found, and error states consistently.
- [ ] Add component/page tests for filters, detail rendering, status-specific action visibility, read-only terminal statuses, and API error display.

---

# Out of Scope

Do not implement confirm/dismiss/complete/skip mutations, reminder creation or reminder payload construction, calendar rendering, backend task endpoints, push notification registration, weather rain confirmation UI, AI pages, or direct Supabase application-table/PostgREST/Storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Tasks API and shared enum sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` task detail and task action acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` task detail, routing, forms, API, and state sections
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/implementation-phases/phase-20/01-tasks-calendar-dashboard-api-services-and-feature-scaffold.md`
- [ ] Existing frontend list/detail pages, shared components, task API service, and frontend tests

---

# Domain Rules Affected

This task touches account scoping, target resolution, tasks/reminders, weather/rain confirmation, frontend forms, API contract, and auth/session boundary.

Important rules to preserve:

```text
Suggested tasks are not planned tasks.
Reminders exist only for planned tasks and are created backend-side.
Frontend displays backend-provided targets, reminders, weather events, and errors.
Frontend must not decide target resolution truth or account scope.
Weather is advisory and must not auto-fail treatments.
Terminal task statuses are mostly read-only.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement frontend page/component, frontend API service usage, frontend form/filter controls, and tests.

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no frontend reminder scheduler/timer, no frontend task confirmation/reminder side-effect orchestration, and no trusted `accountId`.

---

# API Contract

Endpoints involved:

```text
GET /api/v1/tasks
GET /api/v1/tasks/:taskId
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for task list filters/query params, task detail response rendering, status-specific action visibility, reminder summary display, weather-event advisory display, and API error/not-found states.

Specific test cases:

1. Task list filters call `GET /api/v1/tasks` with canonical `placeId`, `status`, `type`, `dueFrom`, `dueTo`, and pagination params.
2. Suggested task detail shows confirm/dismiss affordances and no planned reminder assumptions.
3. Planned task detail shows done/skip affordances and backend-provided reminders.
4. Done, skipped, and canceled task details are mostly read-only.
5. Weather events on task detail render as advisory context only.

---

# Acceptance Criteria

- [ ] Task list access and `/tasks/:taskId` detail UI work against mocked/canonical API responses.
- [ ] Task statuses drive visible but non-mutating action affordances.
- [ ] Suggested/planned distinction is clear.
- [ ] Frontend does not create reminders, resolve business targets, or submit trusted account scope.
- [ ] Focused task list/detail tests pass.
