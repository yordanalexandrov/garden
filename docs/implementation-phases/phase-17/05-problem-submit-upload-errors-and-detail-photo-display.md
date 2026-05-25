# Implementation Task - Phase 17 Step 5: Problem Submit, Upload Errors, and Detail Photo Display

## Goal

Integrate metadata save, optional problem photo upload, error handling, and detail refresh/display into a complete create/detail workflow.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

## Scope

- [ ] Support saving a problem without a photo.
- [ ] Support the backend-approved upload flow after problem creation, or during create only if backend contract explicitly supports it.
- [ ] Do not attempt photo upload for observations.
- [ ] Disable primary actions while saving/uploading to reduce duplicate submissions.
- [ ] Display backend validation, business-rule, storage, and upload errors without losing metadata form data.
- [ ] Refresh/navigate to detail after success and render backend-provided photo URLs.
- [ ] Add tests for save-without-photo, upload success, upload failure, observation no-upload, and detail photo rendering.

## Out of Scope

- [ ] Offline upload queue.
- [ ] Direct storage URL construction.
- [ ] AI problem assist.

## Domain Rules

- Problem can be saved without photo.
- Observation photo upload is blocked by UI and backend.
- Backend-provided URLs are the only display source.

## Acceptance Criteria

- [ ] Create problem/observation workflows handle photo and non-photo paths correctly.
