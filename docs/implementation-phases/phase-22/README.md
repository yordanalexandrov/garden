# Phase 22 Task Set - Frontend Weather UX

These files convert `docs/implementation-phases/phase-22-frontend-weather-ux.md` into executable Implementation Agent tasks.

Run the tasks in order on one branch:

```text
feature/frontend-weather
```

## Task Order

1. `01-weather-api-services-and-feature-scaffold.md`
2. `02-place-weather-page-and-forecast-states.md`
3. `03-rain-confirmation-prompt-and-actions.md`
4. `04-calendar-weather-markers.md`
5. `05-phase-22-frontend-regression-boundary-error-tests.md`
6. `06-phase-22-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the frontend weather UX:

- Typed frontend Weather API service consuming Phase 21 backend weather endpoints through the existing `/api/v1` API client.
- Place weather route/tab/page for `/places/:placeId/weather`.
- Forecast display for weather-enabled places.
- Clear weather-disabled state for places where backend returns `enabled: false`.
- Rain confirmation prompt in task/activity context where backend data includes a pending rain-check weather event.
- Yes/no/ignore confirmation actions submitted to the backend as `confirmed_yes`, `confirmed_no`, or `ignored`.
- Calendar weather markers when backend calendar responses include weather events.
- Frontend/component/API-service/static tests for forecast states, advisory wording, confirmation request shape, error handling, and provider-boundary rules.

Do not implement:

- Backend weather APIs, scheduler behavior, provider adapters, migrations, or weather-event persistence.
- Direct Open-Meteo calls from Angular.
- Treatment failure decisions or wording.
- Frontend-owned rain consequences, task creation, task cancellation, treatment invalidation, or business side effects.
- Push notifications, AI weather advice, notification settings, deployment, or MCP tools.
- Editing place weather settings unless the existing place edit flow already supports it and the task explicitly needs small route compatibility wiring.
- Frontend-submitted trusted `accountId`.

## Common Required Documents

Every task in this folder requires the Implementation Agent to read:

- `AGENTS.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- `docs/gardening-helper-canonical-api-contract-v1.md`
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-frontend-technical-spec-v1.md`
- `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- `docs/implementation-phases/phase-22-frontend-weather-ux.md`
- `docs/TASK_TEMPLATE.md`
- Existing frontend app shell, place-detail routing, task/activity context UI, calendar feature, typed API client, auth/session, API error mapper, shared UI/form controls, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the frontend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
```

The boundary check must verify at minimum:

- no direct Supabase application-table access in frontend code
- no direct Supabase Storage business calls in frontend code
- no backend-only secrets referenced in frontend code, environment files, build config, or tests
- no feature component bypasses typed API services with raw `HttpClient`
- no Phase 22 UI sends trusted `accountId`
- no direct Open-Meteo/provider URL calls from frontend code
- no weather provider secrets in frontend config
- no frontend treatment-failure, rain-consequence, planned-task creation, or task-cancellation decisions
- rain confirmation wording asks about observed rain and does not say treatment automatically failed

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
