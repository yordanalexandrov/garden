# Implementation Task - Phase 20 Step 2: Dashboard Summary Widgets

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Build the dashboard page as a summary surface backed by the canonical dashboard API, with widgets linking to full modules.
```

## Branch

Use branch:

```text
feature/frontend-tasks-calendar
```

---

# Scope

Implement only:

- [ ] Inspect existing dashboard placeholder, app shell navigation, page header, empty-state, status-chip, and card/list patterns.
- [ ] Replace the dashboard placeholder with a real route page that calls `DashboardApiService`.
- [ ] Render upcoming planned tasks, suggested tasks awaiting confirmation, active quarantine periods, recent activities, open problems, low-stock products, and place summary cards when returned by backend.
- [ ] Keep the dashboard summary-oriented; link each widget item or card to its full module/detail route where available.
- [ ] Provide place filtering only if supported by existing shared selectors or Phase 20 scaffold without adding backend assumptions.
- [ ] Use Angular Material components and existing design patterns.
- [ ] Render canonical loading, empty, and API error states without losing existing data unnecessarily.
- [ ] Ensure suggested tasks and planned tasks are visibly distinct in dashboard widgets.
- [ ] Ensure active quarantine periods are displayed as read-only status/range information, not editable calendar events.
- [ ] Add component/page tests for widget rendering, links, empty/error states, and suggested/planned visual distinction.

---

# Out of Scope

Do not implement full task detail/actions, calendar rendering, backend dashboard aggregation, frontend-created reminders, notification registration, weather rain confirmation UI, AI widgets beyond placeholders, or direct Supabase application-table/PostgREST/Storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Dashboard API and shared task/calendar enum sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` dashboard, calendar, and task acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` dashboard page, shared UI, routing, state, and API sections
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/implementation-phases/phase-20/01-tasks-calendar-dashboard-api-services-and-feature-scaffold.md`
- [ ] Existing dashboard placeholder, shell navigation, shared UI components, API services, and frontend tests

---

# Domain Rules Affected

This task touches account scoping, quarantine, tasks/reminders, problems/photos, frontend forms, API contract, and auth/session boundary.

Important rules to preserve:

```text
Dashboard is a summary surface, not a business source of truth.
Frontend displays backend-provided data and side effects.
Suggested tasks are not planned tasks and must be visually distinct.
Reminders are created only by backend planned-task workflows.
Quarantine is read-only in frontend dashboard/calendar surfaces.
Frontend must not submit accountId or access application tables directly.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement frontend page/component, frontend API service usage, loading/empty/error state rendering, and tests.

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no direct Storage business calls, no frontend reminder scheduler/timer, and no frontend calendar/quarantine mutation path.

---

# API Contract

Endpoints involved:

```text
GET /api/v1/dashboard
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for dashboard API loading behavior, widget rendering, widget links, suggested vs planned task distinction, quarantine read-only display, and empty/error states.

Specific test cases:

1. Dashboard renders upcoming planned tasks and suggested tasks in separate/distinct widgets from a mocked canonical dashboard response.
2. Dashboard renders quarantine, recent activity, open problem, low-stock product, and place summary widgets when arrays are present.
3. Dashboard widget links point to existing module/detail routes and do not trigger calendar/task mutations.
4. Dashboard API errors render visibly while preserving frontend/backend boundary rules.

---

# Acceptance Criteria

- [ ] `/dashboard` loads from the canonical dashboard API.
- [ ] Dashboard widgets are summary-oriented, scannable on mobile, and link to full modules.
- [ ] Suggested tasks, planned tasks, and quarantine periods are visibly distinct.
- [ ] No frontend reminder, calendar mutation, direct table access, or trusted `accountId` behavior is introduced.
- [ ] Focused dashboard tests pass.
