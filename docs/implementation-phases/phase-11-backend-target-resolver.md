# Phase 11 — Backend Target Resolver

## 1. Purpose

This phase implements reusable backend target resolution for activities and tasks. It turns user intent scopes into concrete target rows and enforces account/place consistency before any activity or task can persist targets.

## 2. Position in the sequence

Phase 6 must already provide concrete place, perennial, bed, yearly planting, and persistent bed plant rows. Phase 12 depends on this resolver for activities. Phase 18 depends on it for tasks.

This phase must not be merged with Phase 12 because target resolution is a central domain rule and should be tested independently. It must not be implemented in frontend or controllers because backend services own resolved truth.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines bulk actions, target scopes, resolved target rows, empty target rejection, place scoping, and cross-place rejection.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines `TargetType`, `TargetScopeType`, `TargetSelection`, `TargetRef`, and `TargetSummary`.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `TargetResolver` contract and resolution rules.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines required target resolver tests.
- `docs/001_initial_schema_gardening_helper.sql` - defines `activity_targets`, `task_targets`, and target type constraints.
- `docs/004_guards_and_triggers_gardening_helper.sql` - defines polymorphic target consistency guards for activities/tasks.

## 4. Scope

### Backend scope

- Implement `TargetResolver`.
- Support all canonical target scopes:
  - `whole_place`
  - `all_perennials_in_place`
  - `selected_perennials`
  - `all_beds_in_place`
  - `selected_beds`
  - `single_bed`
  - `selected_yearly_plantings`
  - `selected_persistent_bed_plants`
- Validate selected IDs exist, belong to account, and belong to the requested place where applicable.
- Reject empty resolved target sets.
- Reject cross-place mixed targeting in v1.
- Return concrete target refs and optional labels/read models.
- Add repository helper methods needed for multi-ID target lookup.

### Testing scope

- Add unit/integration tests for every target scope and rejection path.

## 5. Out of scope

- Creating activities.
- Creating tasks.
- Persisting `activity_targets` or `task_targets` outside tests.
- Frontend target selector.
- Changing target scope enum values.
- Allowing cross-place bulk operations.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 6, plus backend foundations/auth/database.
- Existing modules expected: places, perennials, beds, persistent bed plants, yearly plantings repositories.
- Expected backend paths after implementation: `src/modules/targets/` or shared domain helper path such as `src/shared/targets/`.
- Database requirements: all targetable tables migrated and seeded/test fixtures available.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: account A/account B, place A/place B, active/archived target fixtures.

## 7. Domain rules and invariants affected

- Bulk actions are first-class.
- Scope records user intent.
- Target rows store resolved truth.
- Resolved targets must not be empty.
- Whole-group targeting is scoped to one place.
- Cross-place mixed targeting is not allowed in v1.
- Target ownership must be validated backend-side.
- Target labels are read models.
- Backend service layer is the business logic source of truth.

## 8. API contract impact

This phase does not introduce or change API endpoints.

It defines backend behavior for future endpoints that accept:

- `targetScopeType`
- `targetSelection`
- `placeId`

DTO/status values that matter:

- `TargetType`: `place`, `perennial`, `bed`, `yearly_bed_planting`, `persistent_bed_plant`.
- `TargetScopeType`: all canonical target scope values listed above.
- `TargetSelection`: only fields relevant to selected scope should be supplied.

## 9. Database impact

Tables read:

- `places`
- `perennials`
- `beds`
- `yearly_bed_plantings`
- `persistent_bed_plants`

Tables used later for persistence:

- `activity_targets`
- `task_targets`

No schema changes are expected in this phase.

## 10. Backend design notes

- Resolver should be a service/helper used by activity and task services, not controllers.
- Resolver must be callable inside a transaction by accepting optional `DbTransaction`.
- All selected IDs should be validated as a set: if one ID is missing, archived, wrong account, or wrong place, the request fails.
- `all_perennials_in_place` and `all_beds_in_place` should include active records only and reject empty results.
- `whole_place` resolves to one `place` target after place/account validation.
- `selected_yearly_plantings` and `selected_persistent_bed_plants` derive place through their bed.
- Target labels can be returned for read/display but must not be persisted as truth.
- Forbidden shortcuts: accepting frontend target labels as truth, resolving all beds globally, ignoring archived status for new activities/tasks, target logic in controllers.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

## 13. Testing requirements

### Unit tests

- Validate scope/selection mismatch is rejected.
- Validate empty ID arrays for selected scopes are rejected.

### Integration tests

- Resolve `whole_place`.
- Resolve all active perennials, excluding archived.
- Resolve selected perennials.
- Resolve all active beds, excluding archived.
- Resolve selected beds.
- Resolve `single_bed` with exactly one bed.
- Resolve selected yearly plantings through bed/place.
- Resolve selected persistent bed plants through bed/place.
- Reject missing IDs.
- Reject archived IDs for new targets.
- Reject cross-account targets.
- Reject cross-place targets.
- Reject empty all-beds/all-perennials result.

## 14. Verification checklist

- [ ] `TargetResolver` exists.
- [ ] Every canonical scope is supported.
- [ ] Resolver returns concrete target refs.
- [ ] Empty resolved target sets are rejected.
- [ ] Cross-account targets are rejected.
- [ ] Cross-place mixed targets are rejected.
- [ ] Archived targets are excluded/rejected for new workflows.
- [ ] Resolver can run inside a transaction.
- [ ] Resolver is not implemented in controllers.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Resolver is backend-owned and reusable for activities/tasks.
- [ ] All-beds/all-perennials are place-scoped.
- [ ] No cross-place mixed target behavior is allowed.
- [ ] Target labels are treated as read models only.
- [ ] Account and archived-state validation is complete.
- [ ] Tests cover all scopes and major failure paths.
- [ ] No activity/task persistence or frontend selector work slipped in.

## 16. Suggested branch name

```text
feature/backend-target-resolver
```

## 17. Expected PR summary

```md
## Summary
Implemented backend TargetResolver.

## Scope
- Added reusable target resolution for activity/task scopes.
- Added repository lookup helpers and target resolver tests.

## Domain rules preserved
- Bulk target scopes resolve to concrete target rows.
- All-beds/all-perennials are scoped to one place.
- Cross-account and cross-place target mixes are rejected.

## Tests
- <commands run and results>

## Deferred work
- Activity/task creation and frontend target selector remain deferred.

## Review focus
- Target resolution correctness.
- Account/place scoping.
- Empty/archived target behavior.
```

## 18. Risks and pitfalls

- Resolving `all_beds_in_place` across all places.
- Trusting frontend-selected labels or counts.
- Allowing partial success when one selected ID is invalid.
- Forgetting yearly/persistent plant place derivation through bed.
- Returning an empty target set as valid.
- Implementing target resolution separately in activity and task services.

## 19. Exit criteria

- Target resolver supports every canonical scope.
- Account, place, active/archived, and empty-result behavior is tested.
- Activity and task phases can reuse the resolver without duplicating logic.
