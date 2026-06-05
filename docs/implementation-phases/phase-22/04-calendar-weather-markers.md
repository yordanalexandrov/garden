# Implementation Task - Phase 22 Step 4: Calendar Weather Markers

## Role

You are the **Implementation Agent**.

Use:

- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

Final infrastructure/provider decisions:

- Deployment: Hetzner VPS + Docker Compose
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Render lightweight calendar weather markers when backend calendar responses include weather events.

## Branch

Use branch:

```text
feature/frontend-weather
```

---

# Scope

Implement only:

- [ ] Inspect existing calendar API service, DTOs, calendar page/components, marker rendering, filters, and tests from Phase 20.
- [ ] Extend calendar DTO/type mapping only as needed for backend-provided `weatherEvents`.
- [ ] Render weather markers as lightweight, visually distinct indicators on the relevant date.
- [ ] If a calendar detail popover/panel exists, show only backend-provided weather event context and rain confirmation status.
- [ ] Reuse the Step 3 rain confirmation prompt in calendar context if the existing calendar detail UI naturally exposes pending rain-check events.
- [ ] Ensure weather markers do not hide or override activities, tasks, quarantine, or problem indicators.
- [ ] Display weather marker errors only if calendar weather data is loaded separately; otherwise rely on the existing calendar endpoint error handling.
- [ ] Add focused tests for marker rendering, visual distinction semantics, pending status display, optional prompt reuse, and no treatment-failure wording.

---

# Out of Scope

Do not implement:

- [ ] Backend calendar APIs or weather-event generation.
- [ ] Direct forecast fetching from calendar components unless backend contract requires it.
- [ ] Direct Open-Meteo/provider calls.
- [ ] Calendar-driven treatment invalidation, task cancellation, or planned-task creation.
- [ ] Push notification markers or AI weather advice.
- [ ] A new calendar system if one already exists.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` weather and task sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` calendar response and Weather API sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` calendar/weather acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` calendar and Weather UX rules
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] `docs/implementation-phases/phase-22-frontend-weather-ux.md`
- [ ] Existing calendar API service, components, marker styles, and tests touched by the task

---

# Domain Rules Affected

This task touches:

- [ ] weather/rain confirmation
- [ ] tasks/reminders
- [ ] activities
- [ ] API contract

Important rules to preserve:

```text
Calendar weather markers are contextual indicators only.
Weather is advisory.
Weather forecast does not automatically mean rain happened.
Rain confirmation requires explicit user intent.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks backend-side.
Frontend must not decide treatment validity or weather consequences.
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

- [ ] frontend page/component update
- [ ] frontend DTO/API mapping update if needed
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no direct weather provider calls from frontend
- [ ] no frontend treatment-failure, task-cancellation, or planned-task creation decisions
- [ ] no trusted `accountId` submitted from frontend payloads

---

# API Contract

Endpoints involved:

```text
Existing Phase 19/20 calendar read endpoint if it includes weatherEvents
POST /api/v1/weather/events/:weatherEventId/confirm-rain only if prompt reuse is included
```

Expected calendar weather event fields include:

```text
id
type: weather
date
eventType: rain_check
userConfirmationStatus
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] calendar renders weather markers when backend response includes weather events
- [ ] weather markers are visually distinct from task/activity/quarantine markers
- [ ] marker detail shows backend-provided confirmation status
- [ ] pending rain-check marker can reuse rain confirmation prompt if calendar detail supports it
- [ ] marker wording remains advisory and does not imply treatment failure
- [ ] calendar still renders activities/tasks/quarantine alongside weather markers

Specific test cases:

1. A `weatherEvents` item with `type: weather` renders a marker on its date.
2. Calendar detail displays `userConfirmationStatus: pending` as confirmation status, not as rain truth.
3. Existing activity/task/quarantine markers remain visible when weather markers are present.
4. No marker label says a treatment automatically failed.

---

# Acceptance Criteria

The task is complete when:

- [ ] Backend-provided calendar weather events render as lightweight markers.
- [ ] Calendar weather context remains advisory.
- [ ] Weather markers do not change task/activity state.
- [ ] No direct provider access or frontend business side effects are introduced.
- [ ] Focused calendar tests pass.
