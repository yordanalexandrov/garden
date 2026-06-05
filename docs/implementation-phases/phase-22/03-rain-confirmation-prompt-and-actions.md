# Implementation Task - Phase 22 Step 3: Rain Confirmation Prompt and Actions

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

Implement the rain confirmation prompt for task/activity contexts where backend data exposes a pending rain-check weather event.

## Branch

Use branch:

```text
feature/frontend-weather
```

---

# Scope

Implement only:

- [ ] Inspect existing task detail, activity detail, calendar detail/popover, side-effect summary, and API error UI patterns.
- [ ] Identify the backend-provided pending rain-check weather event shape already available in Phase 20/21 task, activity, or calendar responses.
- [ ] Add a reusable rain confirmation prompt component or local equivalent following existing shared component conventions.
- [ ] Render the prompt only when backend data includes `eventType: rain_check` and `userConfirmationStatus: pending`.
- [ ] Phrase the prompt as observed-rain confirmation, not treatment failure.
- [ ] Provide actions:
  - [ ] Yes, it rained -> `confirmed_yes`
  - [ ] No, it did not -> `confirmed_no`
  - [ ] Ignore for now -> `ignored`
- [ ] Submit the action through `POST /api/v1/weather/events/:weatherEventId/confirm-rain` using `WeatherApiService`.
- [ ] Update the prompt state from the backend confirmation response, including `userConfirmationStatus` and `observedRain`.
- [ ] Display validation/provider/API errors without losing task/activity context.
- [ ] Add component/API tests for visibility, wording, all three actions, response state update, duplicate-click protection, and errors.

---

# Out of Scope

Do not implement:

- [ ] Backend rain-confirmation behavior.
- [ ] Frontend treatment-failure status changes.
- [ ] Auto-created planned tasks, task cancellation, or treatment invalidation.
- [ ] Weather-sensitive product/rule calculations.
- [ ] Push notifications or AI advice.
- [ ] Direct provider calls or frontend-generated weather events.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` weather/rain confirmation and task automation sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Weather API, calendar, task/activity response sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` weather rain prompt tests
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` Weather UX rules and task/activity context UI
- [ ] `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] `docs/implementation-phases/phase-22-frontend-weather-ux.md`
- [ ] Existing task/activity/calendar detail components and tests touched by the task

---

# Domain Rules Affected

This task touches:

- [ ] weather/rain confirmation
- [ ] activities
- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract

Important rules to preserve:

```text
Weather prompts ask for confirmation.
Weather is advisory.
Forecasted rain does not mean rain happened.
The user confirms observed rain.
Rain confirmation does not automatically invalidate treatment.
Frontend must not auto-create planned tasks from rain confirmation.
Frontend must not decide weather rain confirmation consequences.
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

- [ ] frontend component
- [ ] API service consumption
- [ ] frontend action/loading/error state
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no weather provider calls from frontend
- [ ] no frontend treatment-failure or task side-effect decisions
- [ ] no trusted `accountId` submitted from frontend payloads

---

# API Contract

Endpoints involved:

```text
POST /api/v1/weather/events/:weatherEventId/confirm-rain
```

Request:

```json
{
  "response": "confirmed_yes"
}
```

Allowed `response` values:

```text
confirmed_yes
confirmed_no
ignored
```

Response includes:

```text
id
userConfirmationStatus
observedRain
```

---

# Tests Required

Add or update tests for:

- [ ] prompt renders only for pending rain-check events
- [ ] prompt wording asks about observed rain
- [ ] prompt wording does not say treatment failed or automatically invalid
- [ ] yes/no/ignore actions call the canonical endpoint with correct values
- [ ] confirmation response updates UI
- [ ] API errors display without losing task/activity context
- [ ] no `accountId` in confirmation payloads

Specific test cases:

1. A pending `rain_check` event renders a prompt with yes/no/ignore actions.
2. A non-pending weather event does not render confirmation actions.
3. Clicking yes sends `{ "response": "confirmed_yes" }` and updates observed rain from backend response.
4. Clicking no sends `{ "response": "confirmed_no" }` and updates observed rain from backend response.
5. Clicking ignore sends `{ "response": "ignored" }` and preserves an ignored state without implying rain did or did not happen.
6. Prompt text does not contain treatment-failure wording.

---

# Acceptance Criteria

The task is complete when:

- [ ] Pending rain confirmation can be answered yes/no/ignore through the backend API.
- [ ] UI updates from backend confirmation response.
- [ ] Wording preserves advisory/user-confirmed semantics.
- [ ] No frontend business side effects or direct provider access are introduced.
- [ ] Focused component/API tests pass.
