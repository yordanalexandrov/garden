# Phase 20 Task Set - Frontend Tasks, Calendar, and Dashboard

These files convert `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md` into executable Implementation Agent tasks.

Run the tasks in order on one branch:

```text
feature/frontend-tasks-calendar
```

## Task Order

1. `01-tasks-calendar-dashboard-api-services-and-feature-scaffold.md`
2. `02-dashboard-summary-widgets.md`
3. `03-tasks-list-and-detail-pages.md`
4. `04-task-actions-errors-and-refresh.md`
5. `05-calendar-month-agenda-and-legend.md`
6. `06-calendar-filters-item-links-and-read-only-overlays.md`
7. `07-phase-20-frontend-regression-boundary-error-tests.md`
8. `08-phase-20-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the frontend tasks, calendar, and dashboard experience:

- Angular routes/pages for `/dashboard`, `/tasks/:taskId`, and `/calendar`.
- Optional place-scoped calendar entry points such as `/places/:placeId/calendar` when existing routing supports them.
- Typed frontend API services for Tasks, Calendar, and Dashboard using canonical backend endpoints through the existing `/api/v1` API client.
- Dashboard widgets for upcoming planned tasks, suggested tasks awaiting confirmation, active quarantine periods, recent activities, open problems, low-stock products, and place summaries.
- Task list access where it fits existing navigation, task detail display, and status-specific actions.
- Suggested task confirm/dismiss actions and planned task done/skip actions through backend endpoints.
- Calendar month and agenda views with a legend and visually distinct rendering for activities, planned tasks, suggested tasks, quarantine periods, and weather markers when present in the backend feed.
- Frontend/component/API-service/static tests for task actions, dashboard widgets, calendar rendering, backend error display, data refresh after mutations, and frontend/backend responsibility boundaries.

Do not implement:

- Backend task lifecycle, calendar, or dashboard endpoints.
- Schema changes, repositories, services, worker/scheduler behavior, or reminder generation.
- Frontend-created reminders, reminder timers, notification registration, or push subscription flows.
- Calendar item mutations or quarantine edits.
- Weather forecast/rain confirmation UI beyond displaying weather markers already present in the calendar feed.
- AI pages or AI suggestion workflows.
- Direct Supabase application-table, PostgREST, or Storage access.
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
- `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- `docs/TASK_TEMPLATE.md`
- Existing frontend app shell, routing, API client, auth/session, API error mapper, shared UI/form controls, selectors, status chips, and test helper files touched by the task.

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
- no Phase 20 UI sends trusted `accountId`
- no frontend reminder scheduler, reminder timer, or direct reminder payload creation exists
- no frontend code mutates calendar items or quarantine periods directly
- suggested tasks and planned tasks remain visually and behaviorally distinct
- calendar item types remain visually distinct

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
