# Implementation Task - Phase 17 Step 4: Problem Photo Uploader

## Goal

Implement reusable problem-only photo uploader UI that uploads through the backend API.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

## Scope

- [ ] Create `app-problem-photo-uploader` or local equivalent following existing shared component conventions.
- [ ] Show uploader only when the selected record type is `problem`.
- [ ] Hide or disable uploader for `observation` and ensure no upload request is sent.
- [ ] Support mobile camera/file input using standard file input behavior.
- [ ] Add optional client MIME/size validation as UX only; backend remains authoritative.
- [ ] Upload using backend `POST /api/v1/problems/:problemId/photos` multipart field `file`.
- [ ] Display upload progress/errors where available and preserve metadata form/detail state on failure.
- [ ] Add component/API tests for problem-only visibility, observation no-upload, multipart call, and errors.

## Out of Scope

- [ ] Direct Supabase Storage upload.
- [ ] Required photo-before-save behavior.
- [ ] Image resizing/AI analysis.

## Domain Rules

- Photos are supported only for problems in v1.
- Frontend must not directly access storage buckets.

## Acceptance Criteria

- [ ] Problem photo upload is available only for problems and uses backend API only.
