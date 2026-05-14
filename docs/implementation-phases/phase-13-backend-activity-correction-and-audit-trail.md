# Phase 13 — Backend Activity Correction and Audit Trail

## 1. Purpose

This phase implements audit logging foundation for critical operations and the explicit activity correction workflow. It protects historical business records after side effects have been generated and ensures corrections are visible and auditable.

## 2. Position in the sequence

Phase 12 must already implement activity creation and side effects. Later phases benefit from audit logging for tasks, AI acceptance, weather confirmation, archive operations, and final hardening.

This phase must not be merged with Phase 12 because initial creation and later correction have different semantics. It must not be merged with frontend Phase 14 because backend historical integrity should be reviewed before any correction UI exists.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines activity correction, archive over delete, inventory correction movements, audit append-only behavior, and historical record preservation.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines `POST /activities/:activityId/correct`.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines hybrid correction model and `AuditLogsRepository`.
- `docs/gardening-helper-technical-requirements-and-erd.md` - defines `audit_logs`, inventory movements, activities, and side-effect tables.
- `docs/001_initial_schema_gardening_helper.sql` - defines `audit_logs`.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines correction/audit-adjacent transaction and append-only expectations.

## 4. Scope

### Backend scope

- Implement `AuditLogsRepository` and audit logging service/helper.
- Add audit logs for already implemented critical operations where practical:
  - product/rule archive or update
  - inventory adjustment
  - activity creation
  - place/archive operations where practical
- Implement `POST /activities/:activityId/correct` according to the hybrid correction model.
- Ensure side-effecting activity corrections append reverse/adjust operations instead of silently rewriting history.
- Document which correction cases are supported in v1.

### Testing scope

- Add audit log tests for representative critical operations.
- Add correction transaction tests.
- Add unsupported correction-shape tests.

### Documentation scope

- Document correction limitations and supported cases honestly in PR notes or backend docs.

## 5. Out of scope

- UI for corrections.
- Full arbitrary history rewrite.
- Deleting historical activities.
- Weather/AI/push audit events not yet implemented.
- Changing the original Phase 12 create activity semantics except to add audit logging.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 12.
- Existing modules expected: activities, inventory, products/rules, audit table migrated.
- Expected backend paths after implementation: `src/modules/audit/`, `src/modules/activities/activities-correction.service.ts` or equivalent.
- Database requirements: `audit_logs`, `activities`, `inventory_movements`, `quarantine_periods`, `tasks`, and related side-effect tables.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: seeded activities with and without side effects, transaction rollback helpers.

## 7. Domain rules and invariants affected

- Activity correction should be explicit.
- Archive historical business records instead of hard-deleting.
- Inventory corrections append movement history.
- Audit logs are append-only.
- Audit logging does not replace domain records.
- Activity records that created side effects must not be silently rewritten.
- Critical operations should be auditable.
- Critical mutation endpoints should be transaction-safe.

## 8. API contract impact

Endpoints involved:

- `POST /api/v1/activities/:activityId/correct`

Request shape:

- The canonical contract leaves correction details intentionally high-level. The implementation must define and document supported v1 correction payloads without weakening the hybrid correction model.

Response expectations:

- Success uses `{ data: ... }` and should summarize correction records/entities created.
- Unsupported correction shape returns `BUSINESS_RULE_VIOLATION` or `VALIDATION_ERROR`.
- Inaccessible activity returns `NOT_FOUND` or `FORBIDDEN`.
- Errors use canonical envelope.

Status/enum values that matter:

- Inventory correction movements must use `correction` or appropriate documented movement type.
- Original activity should remain readable.

## 9. Database impact

Tables involved:

- `audit_logs`
- `activities`
- `activity_targets`
- `activity_product_usages`
- `inventory_movements`
- `inventory_lots`
- `quarantine_periods`
- `tasks`
- `task_targets`

Schema changes are not expected in this phase.

New migrations are allowed only if a clearly documented correction support gap is found, and they must be forward migrations.

## 10. Backend design notes

- Audit logging should happen in the service layer after business decisions are made, ideally in the same transaction as the audited mutation where consistency matters.
- Audit logs should contain actor/account/entity/action and before/after where useful without storing secrets.
- Normal application flows must not edit audit rows.
- Correction service must distinguish side-effect-free/fresh corrections from side-effecting corrections.
- Side-effecting corrections must append reverse/correction inventory movements or compensating records where supported.
- Original activity, original movements, and original generated side effects must remain readable.
- Unsupported corrections should fail explicitly rather than silently rewriting history.
- Forbidden shortcuts: deleting original side effects, mutating movement history, using audit logs instead of domain records, implementing correction in controller.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

## 13. Testing requirements

### Unit tests

- Audit log builder excludes secrets and includes actor/account/entity/action.
- Correction payload validation accepts only documented supported shapes.

### Integration/API tests

- Audit log created for inventory adjustment.
- Audit log created for activity creation.
- Product/rule archive or update audit is created where included in scope.
- Side-effecting activity correction creates reverse/correction movements where supported.
- Correction does not delete original inventory movements.
- Correction does not delete original activity.
- Correction is transactional.
- Unsupported correction returns business-rule error.
- Account A cannot correct account B activity.
- Failure during correction side effects rolls back all correction writes.

## 14. Verification checklist

- [ ] `AuditLogsRepository` exists.
- [ ] Audit logging service/helper exists.
- [ ] Representative critical operations create audit rows.
- [ ] Activity correction endpoint is implemented.
- [ ] Supported v1 correction cases are documented.
- [ ] Side-effecting corrections do not silently mutate history.
- [ ] Correction workflow is transactional.
- [ ] Original activity remains readable.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Hybrid correction model is preserved.
- [ ] Original records and movements remain readable.
- [ ] Audit logs are append-only in normal flows.
- [ ] Audit logs do not replace inventory movements or domain records.
- [ ] Correction endpoint is account-scoped.
- [ ] Unsupported correction cases fail explicitly.
- [ ] Tests cover audit creation, correction, rollback, and account scoping.

## 16. Suggested branch name

```text
feature/activity-correction-audit
```

## 17. Expected PR summary

```md
## Summary
Implemented backend activity correction and audit trail foundation.

## Scope
- Added AuditLogsRepository and audit logging service.
- Added audit rows for selected critical operations.
- Added activity correction endpoint and supported correction cases.

## Domain rules preserved
- Historical activity side effects are not silently rewritten.
- Inventory corrections append movement history.
- Audit logs are append-only traceability, not business truth.

## Tests
- <commands run and results>

## Deferred work
- Correction UI and future AI/weather/push audit events remain deferred.

## Review focus
- Hybrid correction model.
- Transaction safety.
- Append-only audit behavior.
- Supported correction limitations.
```

## 18. Risks and pitfalls

- Mutating or deleting original inventory movements.
- Treating audit logs as a substitute for correction movements.
- Supporting too many ambiguous correction cases without clear semantics.
- Logging secrets or raw provider payloads unnecessarily.
- Adding correction UI or frontend scope too early.
- Failing to roll back partial correction writes.

## 19. Exit criteria

- Audit logging foundation exists.
- Activity correction endpoint supports documented v1 cases.
- Side-effecting corrections preserve history and append compensating records.
- Correction/audit behavior is tested and account-scoped.
