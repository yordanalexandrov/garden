# Implementation Task - Phase 20 Step 6: Calendar Filters, Item Links, and Read-Only Overlays

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Complete calendar filtering and item interactions while preserving read-only calendar and quarantine semantics.
```

## Branch

Use branch:

```text
feature/frontend-tasks-calendar
```

---

# Scope

Implement only:

- [ ] Add or reuse a place filter that calls `GET /calendar` with optional canonical `placeId`.
- [ ] Support place-scoped calendar routing such as `/places/:placeId/calendar` if the existing route structure already includes or expects it.
- [ ] Keep selected date range and place filter in route query params if consistent with existing frontend patterns.
- [ ] Implement item click behavior: activity items link to activity detail; task items link to task detail; quarantine items open a read-only summary or link to related activity/product detail when IDs are present; weather markers open advisory information only if backend data supports it.
- [ ] Ensure quarantine summaries cannot edit quarantine records or mutate calendar state.
- [ ] Ensure calendar item clicks never mark tasks done/skipped, confirm suggestions, dismiss suggestions, or create reminders directly.
- [ ] Refresh calendar data after task mutations when navigating back from task detail according to existing route/state patterns.
- [ ] Preserve readable empty/error states when filters return no items.
- [ ] Add component/page tests for place filtering, route query params if used, item navigation, read-only quarantine behavior, and no mutation controls on calendar items.

---

# Out of Scope

Do not implement drag/drop or editable calendar events, calendar-side task confirmation/done/skip/dismiss/reminder creation, backend calendar read models or dashboard/task APIs, weather forecast/rain confirmation UI beyond backend-provided advisory marker display, push notification registration or frontend notification scheduling, AI pages, or direct Supabase application-table/PostgREST/Storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Calendar API and related detail endpoint sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` calendar page and task confirmation acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` calendar click behavior, place routing, mobile behavior, and state sections
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/implementation-phases/phase-20/05-calendar-month-agenda-and-legend.md`
- [ ] Existing frontend place selector/routing patterns, activities/tasks route definitions, calendar components, and tests

---

# Domain Rules Affected

This task touches account scoping, quarantine, tasks/reminders, weather/rain confirmation, frontend forms, API contract, and auth/session boundary.

Important rules to preserve:

```text
Calendar is display/read model only.
Quarantine is read-only and historical/auditable.
Calendar item clicks navigate or show read-only context; they do not mutate business data.
Task status changes and reminder creation happen only through backend task workflows.
Weather is advisory and does not automatically change task/activity status.
Frontend must not submit trusted accountId.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement frontend page/component, frontend API service usage, frontend filter controls, read-only overlay/dialog where needed, and tests.

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no frontend reminder scheduler/timer, no calendar write/mutation path, no quarantine edit path, and no trusted `accountId`.

---

# API Contract

Endpoints involved:

```text
GET /api/v1/calendar
GET /api/v1/activities/:activityId
GET /api/v1/tasks/:taskId
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for place filter canonical query params, place-scoped route handling if implemented, item click navigation, quarantine read-only summary, weather marker advisory summary, no calendar-side task mutation controls, and filter empty/error states.

Specific test cases:

1. Selecting a place filter calls `GET /api/v1/calendar` with canonical `placeId`, `from`, and `to`.
2. Activity and task calendar items navigate to the correct detail routes.
3. Quarantine calendar items render a read-only summary or link to related details without edit controls.
4. Calendar items do not expose confirm, dismiss, complete, skip, or reminder creation controls.
5. Weather marker details are advisory and do not mutate tasks or activities.

---

# Acceptance Criteria

- [ ] Calendar place/date filtering works through canonical query params.
- [ ] Calendar item interactions navigate or show read-only context only.
- [ ] Quarantine and weather marker behavior preserve backend-owned business truth.
- [ ] No calendar mutation, reminder creation, or trusted account scope behavior is introduced.
- [ ] Focused calendar interaction tests pass.
