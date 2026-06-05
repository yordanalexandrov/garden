# Phase 21 Task Set - Backend Weather and Rain Confirmation

These files convert `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-weather-rain
```

## Task Order

1. `01-weather-module-contracts-validation-and-route-wiring.md`
2. `02-weather-port-config-and-adapters.md`
3. `03-weather-repository-and-forecast-service.md`
4. `04-rain-confirmation-service-and-route.md`
5. `05-weather-account-provider-and-side-effect-regression-tests.md`
6. `06-phase-21-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend Weather and Rain Confirmation API:

- `WeatherPort` and Open-Meteo adapter boundary.
- Deterministic test/dev weather adapter behind the same port.
- Backend-owned forecast retrieval for `GET /api/v1/places/:placeId/weather/forecast`.
- Weather-disabled place behavior that returns `enabled: false` and `forecast: []` without calling the provider.
- Backend-owned rain confirmation for `POST /api/v1/weather/events/:weatherEventId/confirm-rain`.
- Exact confirmation mapping:
  - `confirmed_yes` -> `observedRain: true`
  - `confirmed_no` -> `observedRain: false`
  - `ignored` -> `observedRain: null`
- Account-scoped place and weather event access.
- Tests for provider boundary, API response shapes, disabled/enabled behavior, provider failures, confirmation mapping, cross-account rejection, and advisory-only side-effect boundaries.

Do not implement:

- Frontend weather UX.
- Scheduled weather checker worker unless an existing backend pattern makes an on-demand helper necessary and it is explicitly documented.
- Push notifications.
- AI weather advice.
- Weather-based treatment failure, treatment cancellation, task cancellation, follow-up task creation, or planned task creation.
- Direct frontend Open-Meteo calls.
- Provider-specific code inside services.
- Schema redesign or new migrations unless a blocking mismatch is documented.

## Common Required Documents

Every task in this folder requires the Implementation Agent to read:

- `AGENTS.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- `docs/gardening-helper-canonical-api-contract-v1.md`
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-backend-application-design-pack-v1.md`
- `docs/gardening-helper-technical-requirements-and-erd.md`
- `docs/001_initial_schema_gardening_helper.sql`
- `docs/004_guards_and_triggers_gardening_helper.sql`
- `docs/env.example`
- `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, config, places, tasks, activities, calendar, db, transaction, validation, error, repository, integration adapter, route, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If provider or repository tests require external services, use deterministic local/test adapters and a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration. Do not require real Open-Meteo network access for normal automated tests. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
