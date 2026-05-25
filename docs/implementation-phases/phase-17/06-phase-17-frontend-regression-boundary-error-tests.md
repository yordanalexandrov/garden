# Implementation Task - Phase 17 Step 6: Frontend Regression, Boundary, and Error Tests

## Goal

Add focused frontend regression and static/boundary tests for Phase 17.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

## Scope

- [ ] Test `type = problem` shows uploader.
- [ ] Test `type = observation` hides/disables uploader and never calls photo upload.
- [ ] Test problem saves without photo.
- [ ] Test required field and backend validation errors.
- [ ] Test target summary remains visible.
- [ ] Test upload errors display without losing metadata state.
- [ ] Test detail renders backend-provided photo URLs.
- [ ] Add/update static checks for no direct Supabase Storage calls, no service role key, no storage URL construction, and no trusted `accountId`.

## Out of Scope

- [ ] Backend tests.
- [ ] Full E2E suite unless already cheap and configured.

## Acceptance Criteria

- [ ] Phase 17 critical UI behavior and storage boundary are covered by tests/checks.
