# Phase 20 — Frontend Tasks, Calendar, and Dashboard

## 1. Purpose

This phase implements task pages, calendar feed UI, and dashboard widgets. It presents planned and suggested work clearly and consumes backend read/mutation APIs without making the calendar a business data source.

## 2. Position in the sequence

Phase 4 must provide frontend foundation. Phase 18 must provide task lifecycle APIs. Phase 19 must provide calendar/dashboard read APIs. Later push, weather, and final hardening phases depend on these UI surfaces.

This phase must not be merged with Phase 18 or 19 because frontend display and backend task/read semantics need separate review. It must not include notification registration from Phase 26.

## 3. Source documents

- `docs/gardening-helper-frontend-technical-spec-v1.md` - defines dashboard, calendar, task detail, calendar legend, item types, and mobile agenda behavior.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines task, calendar, and dashboard endpoints consumed by this phase.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines suggested vs planned task distinction, calendar read model, quarantine read-only overlay, and frontend side-effect boundaries.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines task detail, calendar, dashboard, confirm suggested task, and UI acceptance tests.

## 4. Scope

### Frontend scope

- Implement dashboard page with summary widgets.
- Implement tasks list/detail pages or task detail route as specified.
- Implement suggested task confirm/dismiss actions.
- Implement planned task done/skip actions.
- Implement calendar page with month/agenda views.
- Implement calendar legend and distinct item rendering for:
  - activities
  - planned tasks
  - suggested tasks
  - quarantine periods
  - weather markers if present.
- Add API services for tasks, calendar, and dashboard.
- Refresh task/calendar/dashboard data after mutations.

### Testing scope

- Add component/page/API service tests for task actions, calendar rendering, dashboard widgets, and error handling.

## 5. Out of scope

- Push notification registration.
- Weather forecast/rain confirmation UI unless backend weather exists.
- AI pages.
- Creating reminders in frontend.
- Calendar item mutations.
- Frontend timers for reminders.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 4, Phase 18, Phase 19.
- Existing frontend modules expected: shell, API client, error mapper, status chip/calendar legend components where present.
- Expected frontend paths after implementation: `src/app/features/dashboard/`, `src/app/features/tasks/`, `src/app/features/calendar/`.
- Backend requirements: task lifecycle endpoints and calendar/dashboard read endpoints available.
- Environment variables: frontend API base and Supabase Auth session config only.
- Test infrastructure requirements: mocked task/calendar/dashboard API responses and date fixtures.

## 7. Domain rules and invariants affected

- Suggested tasks must look distinct from planned tasks.
- Confirm action creates reminders through backend.
- Calendar is display/read model only.
- Quarantine is read-only overlay.
- Calendar item types must remain distinguishable.
- Frontend must not hide automation side effects.
- Backend validation is authoritative.

## 8. API contract impact

This phase consumes, but does not introduce, API endpoints.

Endpoints consumed:

- Task endpoints from Phase 18.
- `GET /api/v1/calendar`
- `GET /api/v1/dashboard`

Request/response expectations:

- Confirm/dismiss/complete/skip actions call canonical endpoints.
- Calendar uses `from`, `to`, and optional `placeId`.
- Dashboard uses optional `placeId`.
- Do not send trusted `accountId`.
- Errors use canonical envelope.

Status/enum values:

- Task statuses: `suggested`, `planned`, `done`, `skipped`, `canceled`.
- Calendar item types: `activity`, `task`, `quarantine`, `weather`.

## 9. Database impact

No schema changes are expected in this phase.

Frontend must not access the database or application tables directly.

## 10. Backend design notes

No backend work is expected except bug fixes in already implemented APIs. Frontend must not create reminders or mutate calendar data directly.

## 11. Frontend design notes

- Dashboard should summarize current work and link to full modules.
- Suggested tasks should have confirm/dismiss actions and visual style distinct from planned tasks.
- Planned tasks should have done/skip actions.
- Done/skipped/canceled tasks should be mostly read-only.
- Calendar should visually distinguish activities, tasks, quarantine, and weather markers.
- Quarantine periods should render as overlays/ranges and link to related details, not editable events.
- Mobile calendar should use agenda/list view if grid is cramped.
- Refresh relevant task/calendar/dashboard data after mutations.
- Forbidden shortcuts: frontend-created reminders, calendar writes, treating suggested tasks as planned, hiding quarantine status.

## 12. Integration design notes

No external integration work is expected in this phase.

Browser push registration is deferred to Phase 26.

## 13. Testing requirements

### Unit/component tests

- Suggested task shows confirm/dismiss.
- Confirm updates UI to planned and shows reminders from backend response.
- Planned task shows done/skip.
- Done/canceled tasks are mostly read-only.
- Calendar renders item types distinctly.
- Calendar legend includes item types.
- Place/date filters call calendar API correctly.
- Dashboard widgets link to relevant modules.
- API errors display and preserve current UI state.

### Frontend/API-service tests

- Task actions call canonical endpoints.
- Calendar API service uses `from`, `to`, `placeId`.
- Dashboard API service uses canonical endpoint.
- No component creates reminder payloads directly.

### Static/security checks

- No frontend reminder scheduler/timer.
- No direct DB access.

## 14. Verification checklist

- [ ] Dashboard page works.
- [ ] Task list/detail UI works.
- [ ] Suggested task confirm/dismiss works.
- [ ] Planned task done/skip works.
- [ ] Calendar month/agenda UI works.
- [ ] Calendar item types are visually distinct.
- [ ] Quarantine renders as read-only overlay.
- [ ] Data refreshes after task mutations.
- [ ] Frontend tests/typecheck/lint/build pass where configured.
- [ ] Manual smoke confirms suggested task from activity and sees calendar/dashboard update.

## 15. Review checklist

- [ ] Suggested vs planned task distinction is clear.
- [ ] Frontend does not create reminders.
- [ ] Calendar does not mutate business data.
- [ ] Quarantine is read-only.
- [ ] API services are typed and centralized.
- [ ] Mobile agenda usability is acceptable.
- [ ] No push/weather/AI scope slipped in.
- [ ] Tests cover task action and calendar rendering behavior.

## 16. Suggested branch name

```text
feature/frontend-tasks-calendar
```

## 17. Expected PR summary

```md
## Summary
Implemented frontend Tasks, Calendar, and Dashboard.

## Scope
- Added dashboard widgets.
- Added task detail/actions.
- Added calendar month/agenda views and item legend.

## Domain rules preserved
- Suggested tasks are visually distinct from planned tasks.
- Confirmation/reminder behavior goes through backend.
- Calendar remains a read-only display.

## Tests
- <commands run and results>

## Deferred work
- Push notification registration, weather UX, and AI pages remain deferred.

## Review focus
- Task status UI.
- Calendar item distinction.
- Frontend/backend responsibility boundary.
- Mobile usability.
```

## 18. Risks and pitfalls

- Displaying suggested tasks as scheduled planned work.
- Creating reminder rows from frontend.
- Making quarantine editable as a calendar event.
- Adding frontend reminder timers.
- Merging calendar item types into indistinct UI.
- Not refreshing after confirm/dismiss/done/skip.

## 19. Exit criteria

- Dashboard, task actions, and calendar UI work against backend APIs.
- Suggested/planned distinction is visible.
- Calendar remains read-only.
- Frontend tests and boundary checks pass.
