# Phase 7 — Frontend Garden Structure Pages

## 1. Purpose

This phase implements frontend pages for places, plants, perennials, beds, persistent bed plants, and yearly plantings against stable backend APIs. It delivers the first useful UI while keeping frontend behavior limited to presentation, form submission, and basic UX validation.

## 2. Position in the sequence

Phase 4 must provide the Angular shell and API client. Phases 5 and 6 must provide backend APIs for places, plants, and growing structure. Later frontend phases depend on these pages and shared selectors for products, activities, problems, tasks, weather, and AI.

This phase must not be merged with Phase 10 because products/inventory have distinct ledger/rule concerns. It must not be merged with Phase 14 because activity creation is a critical transactional workflow requiring dedicated review.

## 3. Source documents

- `docs/gardening-helper-frontend-technical-spec-v1.md` - defines route map, places, place detail, perennials, beds, bed detail, plants pages, shared components, forms, and mobile behavior.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines API paths and DTO shapes consumed by these pages.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines frontend not business truth, archive over delete, plant reuse, and growing structure distinctions.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines acceptance tests for app shell, places, plants, place detail, beds, and year selector behavior.
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md` - defines Angular feature folder, Reactive Forms, typed API services, and forbidden frontend shortcuts.

## 4. Scope

### Frontend scope

- Implement routes/pages for:
  - `/places`
  - `/places/:placeId`
  - `/places/:placeId/overview`
  - `/places/:placeId/perennials`
  - `/places/:placeId/beds`
  - `/plants`
  - `/plants/new`
  - `/plants/:plantId`
- Implement places list/detail shell and overview tab.
- Implement plants list/search/create/edit/archive.
- Implement perennials list/create/edit/archive within a place.
- Implement beds list/detail/create/edit/archive.
- Implement persistent bed plant add/edit/archive.
- Implement yearly planting list/add/edit/archive with year selector.
- Add shared place, plant, year, status, page header, empty state, and confirm-dialog components where useful.
- Add typed API services for these endpoints.
- Display backend validation and business-rule errors.

### Testing scope

- Add component/page/API-service tests for key forms and flows.
- Add mobile layout smoke tests where practical.

## 5. Out of scope

- Create activity flow.
- Products and inventory UI.
- Problem photo upload.
- Tasks/calendar/dashboard UI beyond navigation placeholders.
- AI, weather forecast, push notification flows.
- Frontend-owned business validation beyond basic UX checks.
- Direct Supabase application-table access.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 4, Phase 5, Phase 6.
- Existing frontend modules expected: app shell, routing, API client, auth interceptor, error mapper.
- Expected frontend paths after implementation: `src/app/features/places/`, `src/app/features/plants/`, `src/app/features/beds/`, `src/app/features/perennials/`, `src/app/features/plantings/`, `src/app/shared/components/`.
- Backend requirements: canonical places, plants, perennials, beds, persistent bed plants, and yearly plantings endpoints available.
- Environment variables: frontend API base and Supabase Auth session config only.
- Test infrastructure requirements: Angular component tests and API service mocks.

## 7. Domain rules and invariants affected

- Frontend is not business truth.
- Frontend must not submit trusted `accountId`.
- Archive over delete.
- Plant database is reusable reference data.
- Persistent bed plants stay until explicitly removed.
- Yearly bed plantings are calendar-year based.
- Historical bed occupancy must remain readable.
- Frontend must show user intent clearly.
- Frontend must not depend on internal DB table names.

## 8. API contract impact

This phase consumes, but does not introduce, API endpoints.

Endpoints consumed:

- Places, Plants, Perennials, Beds, Persistent Bed Plants, and Yearly Bed Plantings endpoints from Phases 5 and 6.

Request/response expectations:

- Use canonical request field names and camelCase DTOs.
- Do not send trusted `accountId`.
- List responses use `{ data: { items, page, pageSize, total } }`.
- Errors use `{ error: { code, message, details } }`.

Status/enum values in forms:

- Lifecycle, growing style, perennial status, bed status, persistent plant status, yearly planting status.

## 9. Database impact

No schema changes are expected in this phase.

Frontend must not access the database or application tables directly.

## 10. Backend design notes

No backend work is expected except bug fixes in already implemented APIs. Any backend bug fix must stay within Phase 5/6 API contracts and not add new scope.

## 11. Frontend design notes

- Use feature API services instead of raw component HTTP calls.
- Use Reactive Forms for all create/edit forms.
- Use Material controls for selects, dialogs, lists/tables, and form fields.
- Use desktop tables or dense lists where useful, but mobile should use stacked cards/single-column forms.
- Place detail should be a shell with sub-navigation, not a single large component.
- Bed pages must show persistent plants separately from yearly plantings.
- Year selector must change yearly planting view without overwriting data.
- Archive actions require confirmation.
- Basic frontend validation may check required fields, positive dimensions, enum values, and weather location rule, but backend remains authoritative.
- Forbidden shortcuts: direct Supabase table access, business logic in components, frontend-generated account IDs, untyped API responses, god components.

## 12. Integration design notes

No external integration work is expected in this phase.

Frontend uses Fastify API only for application data and Supabase Auth only for session token handling.

## 13. Testing requirements

### Unit/component tests

- Place create form validates required name.
- Weather-enabled place requires location label or coordinates in UX validation.
- Plant form restricts lifecycle/growing style options.
- Bed form validates positive dimensions.
- Year selector changes visible yearly planting query/view.
- Archive actions require confirmation.
- API errors render field-level or form-level messages.

### Frontend/API-service tests

- Places API service uses `/api/v1/places`.
- Plants API service uses canonical plant endpoints.
- Nested perennials/beds/planting services use canonical paths.
- No service sends `accountId`.

### Static/security checks

- No direct Supabase table or storage calls.
- No service role key or backend-only secret in frontend code.

## 14. Verification checklist

- [ ] Places list/detail/overview pages work.
- [ ] Plants list/search/create/edit/archive pages work.
- [ ] Perennials list/create/edit/archive flow works.
- [ ] Beds list/detail/create/edit/archive flow works.
- [ ] Persistent bed plants add/edit/archive flow works.
- [ ] Yearly plantings add/edit/archive flow works with year selector.
- [ ] API errors are displayed.
- [ ] Forms use Reactive Forms.
- [ ] Frontend tests/typecheck/lint/build pass where configured.
- [ ] Manual smoke covers creating place, plant, bed, perennial, persistent plant, and yearly planting.
- [ ] Static search confirms no direct Supabase application-table access.

## 15. Review checklist

- [ ] Components are split by route, form, and reusable selectors.
- [ ] API calls are in typed services.
- [ ] Frontend does not trust or submit account IDs.
- [ ] Archive actions do not call hard delete endpoints.
- [ ] Persistent and yearly contents are visually distinct.
- [ ] Mobile layout remains usable.
- [ ] Backend business decisions are not duplicated in components.
- [ ] Tests cover forms, API errors, archive confirmation, and year selector behavior.

## 16. Suggested branch name

```text
feature/frontend-garden-structure
```

## 17. Expected PR summary

```md
## Summary
Implemented frontend garden structure pages.

## Scope
- Added places, plants, perennials, beds, persistent plant, and yearly planting UI.
- Added typed API services and shared selectors/forms.
- Added validation, archive confirmations, and API error display.

## Domain rules preserved
- Frontend uses Fastify API only.
- Persistent and yearly bed contents remain distinct.
- Archive behavior is used instead of delete.

## Tests
- <commands run and results>

## Deferred work
- Products, inventory, activities, problems, tasks, weather, AI, and push remain deferred.

## Review focus
- Frontend/backend boundary.
- Component structure.
- Reactive Forms and API error handling.
- Mobile usability.
```

## 18. Risks and pitfalls

- Large route components that combine list, detail, and form logic.
- Direct `HttpClient` calls from components.
- Sending `accountId` from forms.
- Treating archive as delete.
- Hiding persistent/yearly distinction.
- Implementing activity/problem shortcuts in garden pages before those workflows exist.

## 19. Exit criteria

- Garden structure UI works against backend APIs.
- Shared selectors/forms are ready for later workflows.
- API errors and archive confirmations are visible.
- Static checks confirm frontend boundary rules.
- No products, inventory, activities, problems, AI, weather, or push behavior has been added.
