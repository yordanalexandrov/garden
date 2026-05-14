# Phase 19 — Backend Calendar and Dashboard Read APIs

## 1. Purpose

This phase implements calendar aggregation and dashboard summary APIs as read models over existing domain data. It gives frontend pages efficient read endpoints without making calendar or dashboard a source of truth.

## 2. Position in the sequence

Phase 12 must provide activities/quarantine/suggested tasks. Phase 15 must provide problems. Phase 18 must provide tasks/reminders. Frontend Phase 20 depends on calendar/dashboard APIs.

This phase must not be merged with Phase 18 because task lifecycle mutations and read aggregation have different review concerns. It must not include frontend calendar UI or weather generation.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines calendar as read model, item type distinction, quarantine overlays, and filters not mutating data.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Calendar API section 20 and Dashboard API section 24.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `CalendarService` and response sections.
- `docs/002_views_gardening_helper.sql` - defines `calendar_items_view`, `active_quarantine_periods`, `activity_detail_view`, and `task_detail_view`.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines calendar/dashboard aggregation, account scoping, and response shape tests.

## 4. Scope

### Backend scope

- Implement `CalendarService`.
- Implement `GET /calendar`.
- Implement `GET /dashboard`.
- Aggregate:
  - activities
  - tasks
  - suggested tasks
  - quarantine periods
  - weather events if present.
- Return separate calendar sections as specified.
- Add filtering by date range and optional place.
- Implement dashboard summary buckets:
  - upcoming tasks
  - suggested tasks
  - active quarantine periods
  - recent activities
  - open problems
  - low stock products
  - places

### Testing scope

- Add API/read-model tests for calendar/dashboard response shape, filters, and account scoping.

## 5. Out of scope

- Calendar item mutations.
- Frontend calendar/dashboard pages.
- Weather event generation.
- Push notifications.
- Changing task/activity/problem state.
- Treating calendar view as writeable table.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 12, Phase 15, Phase 18.
- Existing modules expected: activity, task, problem, inventory read repositories or query helpers.
- Expected backend paths after implementation: `src/modules/calendar/`, `src/modules/dashboard/` or combined read module.
- Database requirements: activities, tasks, quarantine, problems, inventory, places, optional weather events, and relevant views migrated.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: moderate seeded data across accounts, dates, statuses, and places.

## 7. Domain rules and invariants affected

- Calendar is a read model.
- Calendar item types must remain distinguishable.
- Quarantine periods are read-only overlays.
- Calendar filters must not change business data.
- Suggested and planned task statuses remain distinct.
- API responses must not leak inaccessible data.
- Frontend must not depend on internal DB table names.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/calendar`
- `GET /api/v1/dashboard`

Request/response shapes to preserve:

- Calendar query uses required `from`, required `to`, and optional `placeId`.
- Calendar response has separate arrays: `activities`, `tasks`, `quarantinePeriods`, and `weatherEvents`.
- Dashboard query may use optional `placeId`.
- Dashboard response has `upcomingTasks`, `suggestedTasks`, `activeQuarantinePeriods`, `recentActivities`, `openProblems`, `lowStockProducts`, and `places`.
- Errors use canonical envelope.

Status/enum values that matter:

- Calendar task items must preserve task `status`.
- Calendar item `type` values must distinguish `activity`, `task`, `quarantine`, and `weather`.

## 9. Database impact

Tables/views involved:

- `activities`
- `tasks`
- `quarantine_periods`
- `weather_events`
- `problems`
- `inventory_lots`
- `products`
- `places`
- `calendar_items_view`
- `active_quarantine_periods`
- `inventory_product_balances`

No schema changes are expected in this phase.

## 10. Backend design notes

- Calendar/dashboard services are read services and must not mutate data.
- Prefer explicit sectioned response DTOs over exposing raw `calendar_items_view` rows.
- Date and place filters must be account-scoped.
- Quarantine remains read-only and linked back to activity/product context.
- Dashboard should avoid forcing frontend to perform many independent requests on app load.
- Query performance should be reasonable with moderate seeded data.
- Forbidden shortcuts: writeable calendar records, changing task status from calendar query, leaking raw DB names or account B rows.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

Weather events are included only if already present. This phase does not call `WeatherPort`.

## 13. Testing requirements

### API tests

- Calendar returns activities/tasks/quarantine separately.
- Calendar includes suggested and planned tasks with status.
- Calendar includes weather events if seeded.
- Place/date filters work and are account-scoped.
- Missing required `from`/`to` returns `VALIDATION_ERROR`.
- Account A cannot see account B calendar/dashboard data.
- Dashboard returns expected summary buckets.
- Dashboard optional place filter works.
- Response shapes match contract.

### Integration tests

- Read APIs do not mutate database state.
- Query handles moderate seeded data within reasonable local time.

## 14. Verification checklist

- [ ] `GET /calendar` is implemented.
- [ ] `GET /dashboard` is implemented.
- [ ] Calendar response sections are separate.
- [ ] Suggested and planned tasks remain distinguishable.
- [ ] Quarantine periods are read-only overlays.
- [ ] Date/place filters are account-scoped.
- [ ] Dashboard buckets are populated from existing domain data.
- [ ] Read APIs do not mutate data.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Calendar is read-only.
- [ ] Dashboard is read-only.
- [ ] Account scoping is applied to every query.
- [ ] Response shapes match canonical contract.
- [ ] Calendar does not expose raw internal table naming.
- [ ] Query performance is reasonable for v1.
- [ ] No frontend UI, weather generation, or push behavior slipped in.

## 16. Suggested branch name

```text
feature/backend-calendar-dashboard
```

## 17. Expected PR summary

```md
## Summary
Implemented backend Calendar and Dashboard read APIs.

## Scope
- Added calendar feed aggregation.
- Added dashboard summary endpoint.
- Added account-scoped date/place filtering tests.

## Domain rules preserved
- Calendar is a read model only.
- Quarantine remains a read-only overlay.
- Suggested and planned tasks remain distinct.

## Tests
- <commands run and results>

## Deferred work
- Frontend calendar/dashboard UI, weather event generation, and push remain deferred.

## Review focus
- Read-only behavior.
- Account scoping.
- Contract-compatible response sections.
```

## 18. Risks and pitfalls

- Treating `calendar_items_view` as mutable source-of-truth.
- Merging item types into one ambiguous response array.
- Filtering by place without account check.
- Updating task/quarantine/activity state from read endpoints.
- Calling weather provider from calendar read.
- Returning raw database snake_case rows.

## 19. Exit criteria

- Calendar and dashboard read APIs are implemented and tested.
- Responses are account-scoped and contract-compatible.
- Frontend Phase 20 can build UI without client-side data stitching.
