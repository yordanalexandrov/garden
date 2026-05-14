# Phase 5 — Backend Places and Plants API

## 1. Purpose

This phase implements the first account-scoped business APIs: places and plant definitions. Places define garden locations and weather configuration context. Plants are reusable user-maintained reference data used by perennials, beds, product usage rules, and AI planning.

## 2. Position in the sequence

Phases 1, 2, and 3 must already provide backend app conventions, database access, migrations, transactions, authentication, and account context. Later phases depend on places and plants for growing structure, weather, product rules, targets, problems, tasks, activities, and AI workflows.

This phase must not be merged with Phase 6 because growing structure has more parent-child consistency rules and target implications. It must not be merged with frontend Phase 7 because the backend API contract should stabilize before UI work.

## 3. Source documents

- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Places API section 8 and Plants API section 9.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines place, plant, account, archive, weather-location, and frontend/backend boundary rules.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `PlacesRepository`, `PlantsRepository`, service responsibilities, and validation strategy.
- `docs/gardening-helper-technical-requirements-and-erd.md` - defines `places` and `plants` fields, constraints, and relationships.
- `docs/001_initial_schema_gardening_helper.sql` - defines `places`, `plants`, uniqueness indexes, enum checks, timestamps, and archive columns.
- `docs/004_guards_and_triggers_gardening_helper.sql` - relevant indirectly because later entities validate against place/plant account consistency.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines CRUD, account scoping, archive, API envelope, and validation tests.

## 4. Scope

### Backend scope

- Implement `PlacesRepository` and `PlacesService`.
- Implement `PlantsRepository` and `PlantsService`.
- Implement validation schemas and controllers/routes for all canonical places/plants endpoints.
- Map snake_case database fields to camelCase API DTOs.
- Enforce backend-derived account scope on every query and write.
- Support archive instead of hard delete.
- Support `includeArchived` where specified.
- Validate weather-enabled places require `weatherLocationLabel` or both `latitude` and `longitude`.

### Testing scope

- Add backend route/service/repository tests for places and plants.
- Add cross-account fixtures for account A/account B.

## 5. Out of scope

- Perennials, beds, persistent plants, and yearly plantings.
- Weather forecast endpoint.
- Frontend pages.
- Activity/task/problem target resolution.
- Product rules that reference plants.
- Hard delete behavior.
- Schema redesign.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 1, Phase 2, Phase 3.
- Existing modules expected: Fastify app, auth hook, `DbClient`, `DbTransaction`, migration runner, account context.
- Expected backend paths after implementation: `src/modules/places/` and `src/modules/plants/` with repository, service, controller, validation, and types files.
- Database requirements: `accounts`, `places`, and `plants` tables migrated.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: authenticated route helpers and account A/account B fixtures.

## 7. Domain rules and invariants affected

- All business records belong to an account.
- Cross-account access is forbidden.
- Frontend must not submit accountId for normal flows.
- Places are top-level garden locations.
- Weather is optional per place.
- Weather location must be explicit.
- Places should be archived instead of hard-deleted.
- Plants are reusable user-maintained references.
- Plant records should not be duplicated unnecessarily, but database should not over-enforce uniqueness for varieties/local names.
- Plant records with history should be archived instead of deleted.
- Backend validation is authoritative.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/places`
- `POST /api/v1/places`
- `GET /api/v1/places/:placeId`
- `PATCH /api/v1/places/:placeId`
- `POST /api/v1/places/:placeId/archive`
- `GET /api/v1/plants`
- `POST /api/v1/plants`
- `GET /api/v1/plants/:plantId`
- `PATCH /api/v1/plants/:plantId`
- `POST /api/v1/plants/:plantId/archive`

Request/response shapes to preserve:

- Places use `name`, `description`, `notes`, `weatherEnabled`, `weatherLocationLabel`, `latitude`, `longitude`, and `timezone`.
- Plants use `commonName`, `variety`, `plantCategory`, `lifecycleType`, `growingStyle`, and `notes`.
- List responses use `{ data: { items, page, pageSize, total } }`.
- Mutations use `{ data: { id, ... } }` or canonical archive response `{ data: { archived: true } }`.
- Errors use `{ error: { code, message, details } }`.

Enums/status values that matter:

- `LifecycleType`: `annual`, `biennial`, `perennial`.
- `GrowingStyle`: `tree`, `shrub`, `vine`, `herb`, `vegetable`, `berry`, `flower`, `other`.

## 9. Database impact

Tables involved:

- `places`
- `plants`
- `accounts`

Relevant indexes/constraints:

- `idx_places_account_archived`
- `idx_plants_account_common_name`
- `uq_places_account_name_active`
- `plants_lifecycle_type_chk`
- `plants_growing_style_chk`

No schema changes are expected in this phase.

New migrations are not expected and should be avoided unless a blocking mismatch is documented.

## 10. Backend design notes

- Repositories must filter by `account_id` for all reads/writes.
- Services own weather-location validation and archive policy.
- Controllers should validate params/query/body and call services only.
- `includeArchived` should be explicit and default to excluding archived records.
- Detail endpoints should return inaccessible records as `NOT_FOUND` or `FORBIDDEN` consistently.
- Duplicate active place name conflicts should map to `CONFLICT` if the unique index is hit.
- Plant uniqueness should not be over-enforced beyond the provided schema.
- Archive should set `archived_at`, not delete rows.
- Forbidden shortcuts: trusting request body `accountId`, returning snake_case DTOs, hard deleting records, bypassing repository layer.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

Weather configuration is stored as place metadata only; no Open-Meteo calls occur here.

## 13. Testing requirements

### Unit tests

- Place weather validation allows disabled weather without location.
- Place weather validation requires label or coordinates when enabled.
- Plant enum validation rejects invalid lifecycle/growing style values.

### Integration/API tests

- Create/list/get/update/archive place.
- Create/list/get/update/archive plant.
- `includeArchived` behavior includes archived records only when requested.
- Default lists exclude archived records.
- Account A cannot read/update/archive account B places or plants.
- Missing required fields return `VALIDATION_ERROR`.
- Duplicate active place name returns `CONFLICT` where applicable.
- Response envelopes and pagination shape match the canonical contract.

## 14. Verification checklist

- [ ] All Places API endpoints are implemented.
- [ ] All Plants API endpoints are implemented.
- [ ] All queries and writes are account-scoped.
- [ ] Weather-enabled place validation is enforced backend-side.
- [ ] Archive uses `archived_at`, not hard delete.
- [ ] DTOs are camelCase and contract-compatible.
- [ ] List endpoints return pagination envelope.
- [ ] API errors use canonical envelope.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Endpoints match canonical paths and shapes.
- [ ] Account scope comes from authenticated actor, not request body.
- [ ] Controllers remain thin.
- [ ] Services own cross-field validation and archive behavior.
- [ ] Repositories only access data.
- [ ] Archived records are excluded by default.
- [ ] No growing structure, frontend pages, or weather provider calls slipped in.
- [ ] Tests cover happy path, validation, archive, API shape, and account scoping.

## 16. Suggested branch name

```text
feature/backend-places-plants
```

## 17. Expected PR summary

```md
## Summary
Implemented account-scoped backend Places and Plants APIs.

## Scope
- Added places repository/service/controller/validation.
- Added plants repository/service/controller/validation.
- Added account-scoped route tests.

## Domain rules preserved
- Places and plants are account-scoped.
- Weather-enabled places require explicit location data.
- Records are archived instead of hard-deleted.

## Tests
- <commands run and results>

## Deferred work
- Growing structure, frontend pages, weather forecast, targets, and activities remain deferred.

## Review focus
- Account scoping.
- API contract shape.
- Archive behavior.
- Weather-location validation.
```

## 18. Risks and pitfalls

- Trusting `accountId` from request body.
- Forgetting `includeArchived` default behavior.
- Hard deleting places or plants.
- Returning database snake_case fields directly.
- Over-enforcing plant uniqueness beyond v1 requirements.
- Calling weather provider because place has weather fields.

## 19. Exit criteria

- Places and plants APIs are implemented and tested.
- Account scoping is proven with account A/account B tests.
- Archive behavior works.
- Weather metadata validation works.
- Later growing structure phases can safely reference places and plants.
