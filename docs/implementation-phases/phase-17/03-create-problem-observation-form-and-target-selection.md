# Implementation Task - Phase 17 Step 3: Create Problem/Observation Form and Target Selection

## Goal

Implement the Reactive Forms create flow for problem and observation metadata with target selection and visible target summary.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

## Scope

- [ ] Build `/problems/new` metadata form with `type`, `placeId`, `targetType`, `targetId`, `title`, `description`, `category`, `severity`, `status`, `observedAt`, and optional linked activity where supported.
- [ ] Reuse existing place/target selector patterns where possible.
- [ ] Show selected place, target type, target label, and target summary before save.
- [ ] Use client validation for required fields and enum choices while keeping backend validation authoritative.
- [ ] Submit canonical metadata payload without trusted `accountId`.
- [ ] Preserve form data on backend validation/business-rule errors.
- [ ] Add component tests for required fields, type switching, target summary, request shape, and API errors.

## Out of Scope

- [ ] Photo uploader implementation beyond reserving the section for Step 4.
- [ ] Backend target validation.
- [ ] Observation photos.

## Domain Rules

- Problems and observations require place/target context.
- Frontend shows user intent but backend validates account/place/target truth.

## Acceptance Criteria

- [ ] Problem and observation metadata can be submitted through the UI.
- [ ] Target summary is visible before save and backend errors do not clear input.
