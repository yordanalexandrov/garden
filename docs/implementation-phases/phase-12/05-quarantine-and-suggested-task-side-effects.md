# Implementation Task - Phase 12 Step 5: Quarantine and Suggested Task Side Effects

## Goal

Add rule-derived quarantine periods and suggested follow-up tasks to the activity creation transaction.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

## Scope

- [ ] Build quarantine period helper from product usage rule context and activity performed date.
- [ ] Persist `quarantine_periods` when a supplied/validated rule has quarantine days.
- [ ] Document and test zero-day quarantine behavior if encountered.
- [ ] Build suggested follow-up task helper from reapplication interval rule context.
- [ ] Persist generated tasks with status `suggested`, source `activity`, and no reminders.
- [ ] Copy concrete activity targets into matching `task_targets`.
- [ ] Return canonical `quarantinePeriods` and `suggestedTasks` arrays.
- [ ] Add rollback tests for quarantine and suggested task creation failures.

## Out of Scope

- [ ] Planned tasks, reminders, task confirmation, task APIs, calendar feed, worker/scheduler.
- [ ] Weather-based task decisions.
- [ ] Frontend task display beyond returned create response.

## Required Documents

- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`

## Domain Rules

- Suggested tasks are not planned tasks.
- Reminders are created only for planned tasks.
- Weather is advisory and must not auto-fail treatments.
- Activity side effects are transaction-safe.

## Tests Required

- [ ] Product rule with quarantine days creates quarantine periods for resolved targets as specified.
- [ ] Product rule with reapplication interval creates suggested tasks and matching task targets.
- [ ] Suggested tasks have status `suggested` and no reminders.
- [ ] Failure during quarantine or suggested task creation rolls back all activity/inventory writes.

## Acceptance Criteria

- [ ] Rule-derived side effects are backend-owned, transaction-safe, and visible in the create response.
