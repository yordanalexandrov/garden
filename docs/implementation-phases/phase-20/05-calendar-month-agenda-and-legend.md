# Implementation Task - Phase 20 Step 5: Calendar Month, Agenda, and Legend

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Build the calendar page with month and agenda views, a legend, and visually distinct item rendering for backend-provided calendar item types.
```

## Branch

Use branch:

```text
feature/frontend-tasks-calendar
```

---

# Scope

Implement only:

- [ ] Inspect existing route/page layout patterns, date controls, Angular Material components, and shared status/empty/error components.
- [ ] Implement `/calendar` using `CalendarApiService`.
- [ ] Use month view as the default desktop view and agenda/list view when the viewport is cramped or mobile.
- [ ] Provide date navigation for previous/next/current month or equivalent existing date-range control.
- [ ] Query the backend with canonical `from` and `to` date range for the visible calendar window.
- [ ] Render activities, tasks, quarantine periods, and weather markers from the canonical calendar response.
- [ ] Make item types visually distinct: neutral/completed activities; primary/accent planned tasks; outlined/warning suggested tasks; read-only quarantine range bars/highlights; icon-level weather markers.
- [ ] Add or reuse `app-calendar-legend` showing all item types supported by the feed.
- [ ] Ensure suggested and planned tasks are visually distinct inside calendar cells and agenda rows.
- [ ] Render loading, empty, and API error states.
- [ ] Add component/page tests for date range requests, item grouping, item type rendering, legend entries, mobile agenda behavior where practical, and error states.

---

# Out of Scope

Do not implement calendar item mutations, drag/drop, rescheduling, quarantine edits, task action buttons inside calendar beyond navigation links, backend calendar aggregation, weather forecast/rain confirmation UI beyond displaying backend-provided markers, push notification registration, AI pages, or direct Supabase application-table/PostgREST/Storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Calendar API and task/weather enum sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` calendar page acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` calendar page, calendar legend, item cards/overlays, mobile behavior, and API sections
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/implementation-phases/phase-20/01-tasks-calendar-dashboard-api-services-and-feature-scaffold.md`
- [ ] Existing frontend shared UI/date components, routing, API service, and frontend tests

---

# Domain Rules Affected

This task touches account scoping, quarantine, tasks/reminders, weather/rain confirmation, frontend forms, API contract, and auth/session boundary.

Important rules to preserve:

```text
Calendar is a read-only display/read model.
Calendar item types must remain distinguishable.
Suggested tasks are not planned tasks.
Quarantine is a read-only overlay/range and not an editable event.
Weather markers are advisory and must not auto-fail treatments or mutate tasks.
Frontend must not stitch business truth that belongs in backend aggregation.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement frontend page/component, frontend API service usage, responsive month/agenda rendering, calendar legend, and tests.

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no frontend reminder scheduler/timer, no calendar write/mutation path, no quarantine edit path, and no trusted `accountId`.

---

# API Contract

Endpoints involved:

```text
GET /api/v1/calendar
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for calendar API date range query params, month rendering, agenda rendering, item type visual classes/labels, legend entries, quarantine read-only range display, weather marker display as advisory, and loading/empty/error states.

Specific test cases:

1. Calendar requests `GET /api/v1/calendar` with canonical `from` and `to` for the visible month window.
2. Calendar renders activity, planned task, suggested task, quarantine, and weather items with distinct labels/classes.
3. Calendar legend includes activities, planned tasks, suggested tasks, quarantine, and weather markers when supported.
4. Quarantine periods render as read-only overlays/ranges without edit or mutation controls.
5. Mobile/compact rendering uses an agenda/list layout that preserves item distinctions.

---

# Acceptance Criteria

- [ ] `/calendar` loads a backend calendar feed and renders month/agenda views.
- [ ] Item types are visually distinct and represented in a legend.
- [ ] Quarantine periods are read-only overlays/ranges.
- [ ] Weather markers are advisory display only.
- [ ] No calendar mutation, frontend reminder, or direct table access behavior is introduced.
- [ ] Focused calendar rendering tests pass.
