# Phase 15 — Backend Problems and Observations API

## 1. Purpose

This phase implements problem and observation metadata APIs without photo upload. It validates place/target context and linked activity references before storage/file complexity is introduced.

## 2. Position in the sequence

Phase 6 must provide targetable growing structure. Phase 11 must provide target validation/resolution logic or reusable target lookup helpers. Phase 16 depends on this metadata API for photo uploads. Frontend Phase 17 depends on Phases 15 and 16.

This phase must not be merged with Phase 16 because storage/provider boundaries and multipart upload validation should be reviewed separately. It must not include AI problem assist.

## 3. Source documents

- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Problems API metadata endpoints.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines problems/observations as historical records, place context, target-place consistency, linked treatment optionality, and account scoping.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `ProblemsRepository` and create problem flow.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines problem/observation metadata and account/place validation tests.
- `docs/001_initial_schema_gardening_helper.sql` - defines `problems`.
- `docs/004_guards_and_triggers_gardening_helper.sql` - defines problem target and linked activity consistency guards.

## 4. Scope

### Backend scope

- Implement `ProblemsRepository` metadata methods.
- Implement `ProblemsService` for create/list/detail/update.
- Implement endpoints:
  - `GET /problems`
  - `POST /problems`
  - `GET /problems/:problemId`
  - `PATCH /problems/:problemId`
- Validate target belongs to place/account.
- Support both `problem` and `observation`.
- Support optional linked activity with account/place validation.
- Return detail/list DTOs with target labels where available.

### Testing scope

- Add metadata route/service tests for problem and observation cases.
- Add target/account/place/linked activity rejection tests.

## 5. Out of scope

- Photo upload and storage.
- Problem photo metadata creation.
- Frontend problem UI.
- AI problem assist.
- Activity correction or treatment linking workflows beyond optional linked activity validation.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 6, Phase 11.
- Existing modules expected: target lookup/resolver helpers, activities read access where linked activity validation is needed.
- Expected backend paths after implementation: `src/modules/problems/` with repository, service, controller, validation, and types.
- Database requirements: `problems` table and problem consistency guard migrated.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: place, target, activity, account A/account B fixtures.

## 7. Domain rules and invariants affected

- Problems and observations are historical records.
- Problems require place context.
- Target must belong to place.
- Linked treatment is optional.
- Account scoping is mandatory.
- Photos are supported only for problems in v1, but photo upload is deferred.
- Backend validation is authoritative.
- Cross-entity validation belongs in service layer.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/problems`
- `POST /api/v1/problems`
- `GET /api/v1/problems/:problemId`
- `PATCH /api/v1/problems/:problemId`

Request/response shapes to preserve:

- Create request uses `type`, `placeId`, `targetType`, `targetId`, `title`, `description`, `category`, `severity`, `status`, `observedAt`, and optional `linkedActivityId`.
- List response includes `type`, `placeId`, target fields/label, `title`, `category`, `severity`, `status`, `observedAt`, and `photosCount`.
- Detail response includes `photos: []` or no photos until Phase 16, but must remain contract-compatible.
- List responses use pagination envelope.
- Errors use canonical envelope.

Enums/status values that matter:

- `ProblemType`: `problem`, `observation`.
- `ProblemStatus`: `open`, `monitoring`, `resolved`.
- `ProblemCategory`: canonical category values or null.
- `TargetType`: canonical target type values.

## 9. Database impact

Tables involved:

- `problems`
- `places`
- targetable tables
- `activities` for optional linked activity validation

Triggers/guards involved:

- `trg_problems_validate_consistency`

No schema changes are expected in this phase.

## 10. Backend design notes

- Services must validate place access and target-place consistency before create/update.
- Target validation may reuse Phase 11 lookup logic, but should not persist target rows for problems.
- Linked activity must belong to the same account and compatible place.
- Problem and observation both require title and description.
- Photo upload is not part of this phase; detail responses should not invent photo URLs.
- Status updates should be validated and account-scoped.
- Controllers remain thin.
- Forbidden shortcuts: accepting target IDs without place validation, allowing account B linked activities, adding direct storage code here.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

Storage and AI are explicitly deferred.

## 13. Testing requirements

### Unit tests

- Problem validation rejects missing title/description/place/target.
- Invalid problem type/status/category/target type is rejected.

### Integration/API tests

- Create problem without photo succeeds.
- Create observation without photo succeeds.
- List problems by filters.
- Get problem detail.
- Patch problem status/fields.
- Target from another place is rejected.
- Target from another account is rejected.
- Linked activity from another account is rejected.
- Linked activity from another place is rejected where place context conflicts.
- Account A cannot list/get/update account B problems.
- API response shapes and filters match contract.

## 14. Verification checklist

- [ ] Problem list/create/detail/update endpoints are implemented.
- [ ] Observation metadata create/update is supported.
- [ ] Target belongs to place/account validation is enforced.
- [ ] Optional linked activity validation is enforced.
- [ ] No photo upload/storage code is introduced.
- [ ] Detail/list DTOs are contract-compatible.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Place/target validation is service-layer and account-scoped.
- [ ] Problem vs observation type behavior is preserved.
- [ ] Linked activity validation is account/place-safe.
- [ ] Controllers remain thin.
- [ ] No storage, AI, or frontend scope slipped in.
- [ ] Tests cover happy paths, validation, account scoping, and response shapes.

## 16. Suggested branch name

```text
feature/backend-problems
```

## 17. Expected PR summary

```md
## Summary
Implemented backend Problems and Observations metadata API.

## Scope
- Added problem/observation list, create, detail, and update endpoints.
- Added target/place/account and linked activity validation.

## Domain rules preserved
- Problems and observations are account-scoped historical records.
- Targets must belong to the selected place.
- Photo upload remains deferred.

## Tests
- <commands run and results>

## Deferred work
- Problem photo storage, frontend problem UI, and AI problem assist remain deferred.

## Review focus
- Target/place validation.
- Account scoping.
- Problem vs observation metadata behavior.
```

## 18. Risks and pitfalls

- Allowing target IDs from another place.
- Allowing linked activities from another account/place.
- Adding photo upload before storage boundary exists.
- Treating observations as photo-capable.
- Returning raw DB target table names to frontend.
- Forgetting account filters on list/detail.

## 19. Exit criteria

- Problems and observations metadata APIs are implemented and tested.
- Target/place/account rules are enforced.
- Photo/storage phase can build on stable problem records.
