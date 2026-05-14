# Phase 14 — Frontend Activities and Create Activity Flow

## 1. Purpose

This phase implements the activity list/detail UI and the critical create activity page. It lets users submit activity intent and display backend-generated side effects without duplicating backend decisions.

## 2. Position in the sequence

Phase 4 must provide frontend foundation. Phase 7 must provide garden structure UI/selectors. Phase 10 must provide products/inventory UI/selectors. Phase 12 must provide stable backend activity transaction behavior.

This phase must not be merged with Phase 12 because backend transaction correctness must be reviewed before frontend UX consumes it. It must not include correction UI from Phase 13 unless explicitly assigned later.

## 3. Source documents

- `docs/gardening-helper-frontend-technical-spec-v1.md` - defines activities list, create activity workflow, bulk target selector, product usage form, side-effect display, and mobile behavior.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Activities API, target DTOs, product usage request shape, and side-effect response arrays.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines frontend intent display, no frontend target truth, no inventory allocation, missing rule visibility, and side-effect visibility.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines create activity page, bulk target selector, side-effect summary, errors, and mobile tests.

## 4. Scope

### Frontend scope

- Implement routes/pages:
  - `/activities`
  - `/activities/new`
  - `/activities/:activityId`
- Implement activities list with filters.
- Implement activity detail page.
- Implement create activity page with:
  - place selection
  - activity type selection
  - target scope selection
  - target selection when required
  - notes
  - optional product usage rows
  - inventory shortage override UI only when explicitly needed/allowed by request flow
  - review/submit state
- Implement `app-bulk-target-selector`.
- Implement `app-product-usage-form-array`.
- Show product/rule visibility and missing-rule warning.
- Show target summary and selected count.
- Disable save while submitting.
- Display backend-returned `inventoryEffects`, `quarantinePeriods`, `suggestedTasks`, and `warnings`.

### Testing scope

- Add form/component/API service tests for create activity and bulk target selector.
- Add mobile smoke tests where practical.

## 5. Out of scope

- Activity correction UI.
- Weather rain prompt.
- Task confirm UI.
- AI suggestions.
- Frontend inventory allocation.
- Frontend target resolution as business truth.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 4, Phase 7, Phase 10, Phase 12.
- Existing frontend modules expected: places/plants/beds selectors, product selector, API client, error mapper.
- Expected frontend paths after implementation: `src/app/features/activities/`, `src/app/shared/selectors/bulk-target-selector/`, `src/app/shared/forms/product-usage-form-array/`.
- Backend requirements: activity list/detail/create APIs and related selector APIs available.
- Environment variables: frontend API base and Supabase Auth session config only.
- Test infrastructure requirements: Angular tests with mocked API services and fixture DTOs.

## 7. Domain rules and invariants affected

- Frontend must show user intent clearly.
- Frontend must not calculate resolved targets as final truth.
- Frontend must not allocate inventory.
- Frontend must show missing rule state.
- Frontend must not hide automation side effects.
- Backend validation is authoritative.
- Warnings returned by backend must be shown.
- Suggested tasks must look distinct from planned tasks where displayed.

## 8. API contract impact

This phase consumes, but does not introduce, API endpoints.

Endpoints consumed:

- `GET /api/v1/activities`
- `POST /api/v1/activities`
- `GET /api/v1/activities/:activityId`
- Supporting selector/list endpoints for places, beds, perennials, yearly plantings, persistent plants, products, and rules.

Request/response expectations:

- Create request must match canonical `POST /activities` shape.
- `targetScopeType` and `targetSelection` must use canonical enum/DTO values.
- Product usage rows must use `productId`, optional `productUsageRuleId`, `quantityUsed`, `unit`, and `notes`.
- Do not send trusted `accountId`.
- Display all create response arrays even when empty.
- Errors use canonical envelope.

## 9. Database impact

No schema changes are expected in this phase.

Frontend must not access the database or application tables directly.

## 10. Backend design notes

No backend work is expected except bug fixes in already implemented APIs. The frontend must not compensate for missing backend side effects with local business logic.

## 11. Frontend design notes

- Use Reactive Forms for the create activity workflow.
- Consider step-like sections on mobile, but do not hide selected intent before submit.
- `app-bulk-target-selector` should disable invalid scopes until place is selected and show empty states.
- Target selector should emit canonical `targetScopeType` and `targetSelection`, not resolved target rows as final truth.
- Product usage form should allow multiple rows and show missing rule/inconsistent rule states.
- Submit button must be disabled during request to reduce duplicate submissions.
- Backend validation, inventory shortage, and business-rule errors must be displayed without clearing user input.
- Success screen/summary must show side effects returned by backend.
- Forbidden shortcuts: calculating inventory allocation, creating quarantine/task summaries locally as truth, hiding shortage warnings, direct table access.

## 12. Integration design notes

No external integration work is expected in this phase.

## 13. Testing requirements

### Unit/component tests

- Create activity requires place, type, and target scope.
- Bulk selector changes UI by scope.
- Selected beds/perennials multi-select emits canonical `targetSelection`.
- All beds/all perennials scope shows target count/empty state.
- Product usage rows can be added/removed.
- Missing product rule warning is visible.
- Submit disabled while saving.
- Backend validation and inventory shortage errors display.
- Success side-effect summary shows inventory, quarantine, suggested tasks, and warnings.

### Frontend/API-service tests

- Activities API service uses canonical endpoints and request shape.
- Component does not send `accountId`.
- Component does not send resolved target rows as final truth.

### Static/security checks

- No inventory allocation logic in components.
- No direct Supabase table/storage calls.

## 14. Verification checklist

- [ ] Activities list works with filters.
- [ ] Activity detail works.
- [ ] Create activity workflow supports all canonical target scopes.
- [ ] Product usage form array works.
- [ ] Missing rule warning is visible.
- [ ] Save disables during submit.
- [ ] Backend errors and warnings display.
- [ ] Success side-effect summary displays returned arrays.
- [ ] Frontend tests/typecheck/lint/build pass where configured.
- [ ] Manual smoke covers watering and treatment activity.
- [ ] Static search confirms no inventory allocation or target-resolution truth in components.

## 15. Review checklist

- [ ] Request shape exactly matches `POST /activities` contract.
- [ ] Frontend displays intent and side effects clearly.
- [ ] Business logic remains backend-owned.
- [ ] Bulk target selector is reusable and mobile-friendly.
- [ ] Product usage form shows missing-rule state.
- [ ] API errors do not clear user input.
- [ ] No correction, weather, task confirm, or AI scope slipped in.
- [ ] Tests cover form behavior, selector behavior, errors, and success summary.

## 16. Suggested branch name

```text
feature/frontend-create-activity
```

## 17. Expected PR summary

```md
## Summary
Implemented frontend Activities and Create Activity flow.

## Scope
- Added activities list/detail/create pages.
- Added bulk target selector and product usage form array.
- Added side-effect and warning display after activity creation.

## Domain rules preserved
- Frontend submits user intent, not resolved business truth.
- Backend remains responsible for inventory, quarantine, and suggested tasks.
- Missing rule and warning states are visible.

## Tests
- <commands run and results>

## Deferred work
- Activity correction UI, weather prompts, task confirmation UI, and AI remain deferred.

## Review focus
- Request shape.
- Business logic boundary.
- Mobile create activity usability.
- Side-effect display.
```

## 18. Risks and pitfalls

- Duplicating target resolution in frontend as truth.
- Allocating inventory in frontend.
- Not showing backend warnings after save.
- Building a single oversized create activity component.
- Losing form input after backend validation errors.
- Treating suggested tasks as planned in the result display.

## 19. Exit criteria

- Users can create watering and treatment activities through the UI.
- Target and product intent are clear before submit.
- Backend side effects are displayed after success.
- Frontend boundary and tests are clean.
