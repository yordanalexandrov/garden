# Implementation Task - Phase 17 Step 2: Problems List and Detail Pages

## Goal

Implement problems list filtering and detail display, including backend-provided photo URL rendering.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

## Scope

- [ ] Implement `/problems` list page with filters for type, status, place, category, date/search where supported.
- [ ] Display problem and observation rows with target label/summary, status, severity, observed date, and `photosCount`.
- [ ] Implement `/problems/:problemId` detail page with metadata, target summary, linked activity where returned, and photos array.
- [ ] Render only backend-provided photo URLs; do not construct storage URLs.
- [ ] Show loading, empty, and canonical API error states.
- [ ] Add list/detail page tests with mocked API responses.

## Out of Scope

- [ ] Create/edit forms.
- [ ] Photo upload.
- [ ] AI problem assist or dashboard widgets.

## Domain Rules

- Frontend displays backend data and does not become business truth.
- File access is controlled through backend-provided URLs.

## Acceptance Criteria

- [ ] Users can list and inspect problem/observation records.
- [ ] Detail page renders backend-provided photos for problems without direct storage access.
