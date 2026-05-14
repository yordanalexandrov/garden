# Phase 6 — Backend Growing Structure API

## 1. Purpose

This phase implements account-scoped CRUD for perennials, beds, persistent bed plants, and yearly bed plantings. It creates the concrete garden structure that later target resolution, activities, problems, tasks, calendar, weather context, and frontend garden pages depend on.

## 2. Position in the sequence

Phase 5 must already provide places and plants. Later phases depend on this phase for concrete targetable rows and place/plant/bed account consistency.

This phase must not be merged with Phase 5 because growing structure has more nested parent validation and historical occupancy rules. It must not be merged with Phase 11 because target resolution should be tested independently after the underlying entities exist. It must not be merged with frontend Phase 7 because API correctness should be stable before UI work.

## 3. Source documents

- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Perennials API section 10, Beds API section 11, Persistent Bed Plants API section 12, and Yearly Bed Plantings API section 13.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines perennials, beds, persistent plants, yearly plantings, historical occupancy, archive, account, and cross-place rules.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines repositories for perennials, beds, persistent bed plants, and yearly plantings.
- `docs/gardening-helper-technical-requirements-and-erd.md` - defines fields, constraints, and relationships.
- `docs/001_initial_schema_gardening_helper.sql` - defines all growing structure tables and constraints.
- `docs/002_views_gardening_helper.sql` - defines `bed_current_contents`.
- `docs/004_guards_and_triggers_gardening_helper.sql` - defines account consistency guards for growing structure.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines CRUD, account/cross-place, year, status, and guard tests.

## 4. Scope

### Backend scope

- Implement repositories, services, validation, controllers, and DTO mapping for:
  - perennials
  - beds
  - persistent bed plants
  - yearly bed plantings
- Implement endpoints from canonical sections 10-13.
- Enforce place/plant/bed account consistency in services.
- Preserve historical bed occupancy.
- Allow duplicate yearly plantings for the same bed/plant/year.
- Return bed current contents by selected year where specified.
- Archive/remove via status/`archived_at`, not hard delete.

### Testing scope

- Add route/service/repository tests for all four entity groups.
- Add account A/account B and cross-place fixtures.
- Add DB guard smoke tests for consistency.

## 5. Out of scope

- Activity or task target resolver.
- Activity, task, problem, product, inventory, AI, weather, storage, or push workflows.
- Frontend pages.
- AI bed planning.
- Schema redesign or uniqueness constraints forbidding duplicate yearly plantings.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 5, plus backend foundations from Phases 1-3.
- Existing modules expected: places and plants repositories/services.
- Expected backend paths after implementation: `src/modules/perennials/`, `src/modules/beds/`, `src/modules/plantings/` or equivalent.
- Database requirements: `perennials`, `beds`, `persistent_bed_plants`, `yearly_bed_plantings`, `bed_current_contents`, and consistency guards migrated.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: account A/account B, place A/place B, plant fixtures, and authenticated route helpers.

## 7. Domain rules and invariants affected

- All business records belong to an account.
- Cross-account access is forbidden.
- Account consistency is mandatory.
- Perennials are individually tracked growing units.
- Beds are physical growing areas.
- Persistent bed plants stay until explicitly removed.
- Yearly bed plantings are calendar-year based.
- A bed can contain multiple plantings in the same year.
- Historical bed occupancy must remain readable.
- Archive historical business records instead of hard-deleting them.
- Cross-account references are forbidden.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/places/:placeId/perennials`
- `POST /api/v1/places/:placeId/perennials`
- `GET /api/v1/perennials/:perennialId`
- `PATCH /api/v1/perennials/:perennialId`
- `POST /api/v1/perennials/:perennialId/archive`
- `GET /api/v1/places/:placeId/beds`
- `POST /api/v1/places/:placeId/beds`
- `GET /api/v1/beds/:bedId`
- `PATCH /api/v1/beds/:bedId`
- `POST /api/v1/beds/:bedId/archive`
- `GET /api/v1/beds/:bedId/persistent-plants`
- `POST /api/v1/beds/:bedId/persistent-plants`
- `PATCH /api/v1/persistent-bed-plants/:id`
- `POST /api/v1/persistent-bed-plants/:id/archive`
- `GET /api/v1/beds/:bedId/plantings`
- `POST /api/v1/beds/:bedId/plantings`
- `PATCH /api/v1/plantings/:plantingId`
- `POST /api/v1/plantings/:plantingId/archive`

Request/response shapes to preserve:

- Perennials use `plantId`, `label`, `plantedYear`, `notes`, and status where editable.
- Beds use `name`, `description`, `notes`, `widthM`, `lengthM`, `areaM2`, and `currentContents`.
- Persistent plants use `plantId`, `plantedYear`, `quantity`, and `notes`.
- Yearly plantings use `plantId`, `year`, `quantity`, `notes`, and `status`.
- List responses use pagination envelope.
- Errors use canonical envelope.

Status values that matter:

- Perennial status: `active`, `removed`, `dead`, `archived`.
- Bed status: `active`, `removed`, `archived`.
- Persistent bed plant status: `active`, `removed`, `archived`.
- Yearly planting status: `planned`, `planted`, `removed`, `harvested`, `archived`.

## 9. Database impact

Tables involved:

- `perennials`
- `beds`
- `persistent_bed_plants`
- `yearly_bed_plantings`
- `places`
- `plants`

Views involved:

- `bed_current_contents`

Triggers/guards involved:

- `trg_perennials_validate_consistency`
- `trg_beds_validate_consistency`
- `trg_persistent_bed_plants_validate_consistency`
- `trg_yearly_bed_plantings_validate_consistency`

No schema changes are expected in this phase.

New migrations must not add uniqueness that blocks duplicate same bed/plant/year rows.

## 10. Backend design notes

- Services must validate parent entities belong to actor account before creating children.
- For nested routes, validate parent place/bed access before listing/creating.
- Bed detail/list should include current contents for a selected year without destroying historical rows.
- `areaM2` may be derived from dimensions if implementation chooses, but service behavior must remain documented and consistent.
- Archive should update `archived_at` and/or status according to entity semantics, not delete records.
- Repositories should offer `findManyByIds` and active list methods needed later by `TargetResolver`.
- Controllers must not perform parent/account consistency logic.
- Forbidden shortcuts: filtering only by child ID without account scope, disallowing duplicate yearly plantings, auto-removing persistent plants at year boundary, hard-deleting rows.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

## 13. Testing requirements

### Unit tests

- Validation rejects invalid statuses.
- Validation rejects invalid years outside the documented sane range.
- Bed dimension validation rejects zero/negative values.
- Quantity validation rejects negative values.

### Integration/API tests

- Create/list/get/update/archive perennials.
- Create/list/get/update/archive beds.
- Create/list/update/archive persistent bed plants.
- Create/list/update/archive yearly bed plantings.
- Plant from another account is rejected.
- Place from another account is rejected.
- Bed from another account is rejected.
- Bed/plant cross-account consistency is rejected.
- Yearly duplicate same bed/plant/year is allowed.
- Archived records are excluded from active lists.
- Bed detail/list returns persistent and yearly contents for selected year.
- Account B records are not leaked through nested routes.
- API envelopes and pagination shape are canonical.

### Database tests

- Guard trigger rejects mismatched account references for representative growing structure rows.

## 14. Verification checklist

- [ ] Perennials endpoints are implemented.
- [ ] Beds endpoints are implemented.
- [ ] Persistent bed plants endpoints are implemented.
- [ ] Yearly bed plantings endpoints are implemented.
- [ ] Parent/child account consistency is enforced in services.
- [ ] Duplicate yearly planting rows are allowed.
- [ ] Historical occupancy remains readable.
- [ ] Archived records are excluded by default.
- [ ] Bed current contents work for selected year.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Nested routes validate parent access.
- [ ] Every repository query is account-scoped.
- [ ] Services own cross-entity validation.
- [ ] Controllers remain thin.
- [ ] DTOs match canonical camelCase response shapes.
- [ ] No destructive deletes for historical growing records.
- [ ] Persistent and yearly plants remain distinct.
- [ ] Tests cover account, cross-place, archive, status, year, and DB guards.

## 16. Suggested branch name

```text
feature/backend-growing-structure
```

## 17. Expected PR summary

```md
## Summary
Implemented backend growing structure APIs.

## Scope
- Added perennials, beds, persistent bed plants, and yearly plantings APIs.
- Added parent/account consistency checks and tests.
- Added bed contents read behavior.

## Domain rules preserved
- Growing structure records are account-scoped.
- Historical bed occupancy remains readable.
- Persistent and yearly plantings are distinct.

## Tests
- <commands run and results>

## Deferred work
- Target resolver, activity/task/problem workflows, and frontend pages remain deferred.

## Review focus
- Parent-child account consistency.
- Archive/status behavior.
- Bed contents by year.
- Target-resolver readiness.
```

## 18. Risks and pitfalls

- Missing account filters on nested routes.
- Rejecting valid duplicate yearly plantings.
- Treating persistent plants as yearly records.
- Auto-archiving/removing persistent plants on year change.
- Hard deleting historical rows.
- Building target resolution logic inside CRUD services instead of waiting for Phase 11.

## 19. Exit criteria

- All growing structure APIs are implemented and tested.
- Place/plant/bed account consistency is enforced.
- Bed contents and yearly views are available.
- Later target resolution can use concrete, account-scoped, active rows.
