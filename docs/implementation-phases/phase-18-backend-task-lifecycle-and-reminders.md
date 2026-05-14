# Phase 18 — Backend Task Lifecycle and Reminders

## 1. Purpose

This phase implements task APIs, task confirmation, dismissal/completion/skip, manual task creation, and reminder row generation. It turns suggested task rows into actionable planned tasks without adding push delivery or calendar UI.

## 2. Position in the sequence

Phase 11 must provide target resolution. Phase 12 must already generate suggested tasks from activities. Phase 19 depends on task data for calendar/dashboard reads. Phase 25 depends on reminder rows for push delivery.

This phase must not be merged with Phase 12 because task confirmation/reminders are separate from activity-generated suggestions. It must not be merged with push Phase 25 because reminder rows and notification delivery are distinct responsibilities.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines suggested vs planned tasks, reminders only for planned tasks, confirmation transaction, task targets, and no auto activity on completion.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Tasks API section 19.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `TasksRepository`, `TasksService`, reminder scheduler, and confirm flow.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines task confirmation, duplicate confirm, dismiss, complete, manual task, reminder rollback, and account tests.
- `docs/001_initial_schema_gardening_helper.sql` - defines tasks, task targets, and task reminders.
- `docs/004_guards_and_triggers_gardening_helper.sql` - enforces planned-task reminder boundaries and target consistency.

## 4. Scope

### Backend scope

- Implement full `TasksRepository` and `TasksService`.
- Implement endpoints:
  - `GET /tasks`
  - `POST /tasks`
  - `GET /tasks/:taskId`
  - `PATCH /tasks/:taskId`
  - `POST /tasks/:taskId/confirm`
  - `POST /tasks/:taskId/dismiss`
  - `POST /tasks/:taskId/complete`
  - `POST /tasks/:taskId/skip`
- Confirm suggested task transactionally:
  - status -> `planned`
  - set `confirmed_at`
  - create day-before and same-day reminders.
- Manual planned task creation creates reminders transactionally.
- Suggested tasks never have reminders.
- Task completion does not auto-create activity.
- Reuse `TargetResolver` for manual task create/update.
- Add audit logs for confirm/dismiss if audit exists.

### Testing scope

- Add service/API tests for task status transitions, reminders, targets, account scoping, and rollback.

## 5. Out of scope

- Push notification sending.
- Calendar feed.
- Frontend task pages.
- Weather checks.
- Auto-creating activities from completed tasks.
- Reminder delivery worker.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 11, Phase 12.
- Existing modules expected: target resolver, activities-generated suggested tasks, audit module if Phase 13 included.
- Expected backend paths after implementation: `src/modules/tasks/` with repository, service, controller, validation, reminder scheduler, and types.
- Database requirements: `tasks`, `task_targets`, `task_reminders`, guards, and unique reminder index migrated.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: suggested/planned task fixtures, target fixtures, account A/account B fixtures, transaction failure injection.

## 7. Domain rules and invariants affected

- Tasks represent planned or suggested future work.
- Suggested task is not planned.
- Planned tasks can have reminders.
- Confirming task is transactional.
- Task reminders are generated from planned status.
- Task completion does not automatically create activity in v1.
- Dismissing suggested task is explicit.
- Task targets use resolved target rows.
- Notifications only for planned tasks later.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/:taskId`
- `PATCH /api/v1/tasks/:taskId`
- `POST /api/v1/tasks/:taskId/confirm`
- `POST /api/v1/tasks/:taskId/dismiss`
- `POST /api/v1/tasks/:taskId/complete`
- `POST /api/v1/tasks/:taskId/skip`

Request/response shapes to preserve:

- Manual task create uses `placeId`, `type`, `dueDate`, `notes`, `status`, `targetScopeType`, and `targetSelection`.
- Backend sets `sourceType = manual` for manual task create.
- Confirm response returns `id`, `status`, `confirmedAt`, and `reminders`.
- Detail response includes `targets`, `reminders`, and `weatherEvents`.
- List responses use pagination envelope.
- Errors use canonical envelope.

Status/enum values:

- `TaskType`: `spraying`, `fertilizing`, `pruning`, `planting`, `harvest_reminder`, `custom`.
- `TaskStatus`: `suggested`, `planned`, `done`, `skipped`, `canceled`.
- `TaskSourceType`: `activity`, `manual`, `weather`, `ai`.
- `ReminderType`: `day_before`, `same_day`.
- `ReminderStatus`: `scheduled`, `sent`, `failed`, `canceled`.

## 9. Database impact

Tables involved:

- `tasks`
- `task_targets`
- `task_reminders`
- targetable tables

Triggers/guards involved:

- `trg_tasks_validate_consistency`
- `trg_task_targets_validate_consistency`
- `trg_task_reminders_validate_consistency`
- `ux_task_targets_unique`
- `ux_task_reminders_unique`

No schema changes are expected in this phase.

## 10. Backend design notes

- Manual task create should resolve targets, create task, create target rows, and create reminders if planned in one transaction.
- Confirm suggested task should update status and create reminders in one transaction.
- Confirming an already planned/done/skipped/canceled task should fail and not duplicate reminders.
- Reminder scheduler should use place timezone, then account timezone, then UTC fallback only if necessary.
- Suggested tasks should never have reminders; DB guard should be safety net, not primary logic.
- Completing a task sets `done` and `completed_at`, but does not create an activity.
- Dismiss sets suggested task to canceled or equivalent specified status and should remain historically visible.
- Forbidden shortcuts: frontend timers, push send in this phase, reminders for suggested tasks, task completion creating activity silently.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

Push delivery comes later in Phase 25.

## 13. Testing requirements

### Unit tests

- Reminder scheduler creates day-before and same-day reminders.
- Reminder scheduler applies timezone fallback.
- Validation rejects invalid status/type/scope.

### Integration/API tests

- Confirm suggested task creates two reminders transactionally.
- Reminder creation failure rolls back confirm.
- Confirm already planned task is rejected without duplicate reminders.
- Suggested task has no reminders.
- Manual planned task creates reminders transactionally.
- Manual suggested task creates no reminders.
- Dismiss suggested task sets canceled.
- Complete planned task sets done and completed timestamp.
- Complete does not create activity.
- Skip planned task sets skipped.
- Cross-account task access rejected.
- Target resolver is reused for manual task create/update.
- API response envelopes match contract.

## 14. Verification checklist

- [ ] Task list/create/detail/update endpoints are implemented.
- [ ] Confirm/dismiss/complete/skip endpoints are implemented.
- [ ] Confirm suggested task transaction creates two reminders.
- [ ] Manual planned task creates reminders.
- [ ] Suggested tasks have no reminders.
- [ ] Reminder creation rollback is tested.
- [ ] Completing task does not create activity.
- [ ] Target resolver is reused.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Status transitions follow domain rules.
- [ ] Reminder generation is service-owned and transactional.
- [ ] DB reminder guard aligns with service behavior.
- [ ] Suggested vs planned distinction is preserved.
- [ ] No push delivery or frontend timer behavior exists.
- [ ] Account scoping and target scoping are tested.
- [ ] API response shapes match contract.

## 16. Suggested branch name

```text
feature/backend-tasks-reminders
```

## 17. Expected PR summary

```md
## Summary
Implemented backend Task lifecycle and Reminders.

## Scope
- Added task CRUD/status endpoints.
- Added manual task target resolution.
- Added transactional suggested-task confirmation and reminder creation.

## Domain rules preserved
- Suggested tasks are not planned.
- Reminders are created only for planned tasks.
- Task completion does not auto-create activities.

## Tests
- <commands run and results>

## Deferred work
- Calendar/dashboard APIs, frontend task UI, and push delivery remain deferred.

## Review focus
- Status transitions.
- Reminder transaction safety.
- Target resolver reuse.
- Account scoping.
```

## 18. Risks and pitfalls

- Creating reminders for suggested tasks.
- Confirming planned tasks twice and duplicating reminders.
- Completing tasks and silently creating activities.
- Implementing reminder delivery here instead of only reminder rows.
- Failing to roll back task status when reminder creation fails.
- Not reusing target resolver.

## 19. Exit criteria

- Task lifecycle APIs are implemented and tested.
- Suggested/planned/reminder boundaries are correct.
- Reminder rows are ready for calendar/dashboard and later push delivery.
