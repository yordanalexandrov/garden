# Phase 17 — Frontend Problems and Photos Flow

## 1. Purpose

This phase implements frontend problems list/detail/create flow with problem-only photo upload behavior. It supports field recording of problems and observations while preserving backend storage boundaries.

## 2. Position in the sequence

Phase 4 must provide frontend foundation. Phase 15 must provide problem/observation metadata APIs. Phase 16 must provide backend photo upload. Later AI problem assist and dashboard/calendar flows depend on stable problem records.

This phase must not be merged with backend photo Phase 16 because storage safety should be reviewed before UI. It must not include AI problem assist because AI suggestions have a separate acceptance boundary.

## 3. Source documents

- `docs/gardening-helper-frontend-technical-spec-v1.md` - defines problems list, create problem page, problem detail, photo uploader, and mobile camera/file behavior.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Problems API and photo upload endpoint consumed by this phase.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines photos only for problems, problem can be saved without photo, and frontend storage boundary.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines create problem, observation no-photo, uploader, target summary, and error tests.

## 4. Scope

### Frontend scope

- Implement routes/pages:
  - `/problems`
  - `/problems/new`
  - `/problems/:problemId`
- Implement problems list with filters.
- Implement create problem/observation page.
- Implement problem detail page.
- Implement `app-problem-photo-uploader`.
- Implement target selection for problem targets.
- Show photo uploader only when `type = problem`.
- Allow saving a problem without photo.
- Support upload after or during problem creation according to backend-supported flow.
- Display upload progress/errors if available.
- Display backend-provided photo URLs on detail.

### Testing scope

- Add form/uploader/API service tests for problem and observation behavior.
- Add static checks for no direct storage access.

## 5. Out of scope

- AI problem assist.
- Activity correction UI.
- Observation photos.
- Direct Supabase Storage access.
- Image resizing beyond client preview/validation.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 4, Phase 15, Phase 16.
- Existing frontend modules expected: API client, error mapper, target selectors or target lookup UI from prior phases.
- Expected frontend paths after implementation: `src/app/features/problems/`, `src/app/shared/components/problem-photo-uploader/`.
- Backend requirements: problem metadata endpoints and photo upload endpoint available.
- Environment variables: frontend API base and Supabase Auth session config only.
- Test infrastructure requirements: mocked problem/photo API services and file input test helpers.

## 7. Domain rules and invariants affected

- Frontend must not directly access Supabase Storage buckets.
- Photos are supported only for problems in v1.
- Problem can be saved without photo.
- Target summary must be visible.
- Frontend must show user intent clearly.
- Backend validation is authoritative.
- File access must be controlled through signed or protected backend URLs.

## 8. API contract impact

This phase consumes, but does not introduce, API endpoints.

Endpoints consumed:

- `GET /api/v1/problems`
- `POST /api/v1/problems`
- `GET /api/v1/problems/:problemId`
- `PATCH /api/v1/problems/:problemId`
- `POST /api/v1/problems/:problemId/photos`

Request/response expectations:

- Problem/observation metadata uses canonical DTO fields.
- Photo upload uses `multipart/form-data` field `file`.
- Do not send trusted `accountId`.
- Problem detail uses backend-returned `photos` URLs.
- Errors use canonical envelope.

## 9. Database impact

No schema changes are expected in this phase.

Frontend must not access the database or storage buckets directly.

## 10. Backend design notes

No backend work is expected except bug fixes in already implemented APIs.

## 11. Frontend design notes

- Use Reactive Forms for problem/observation metadata.
- Type selector should switch uploader visibility immediately.
- For `type = observation`, photo uploader should be hidden or disabled and no upload request should be sent.
- Save without photo must be supported.
- Target selection should show selected place, target type, target, and summary before save.
- Client file validation may check MIME type/size, but backend remains authoritative.
- Photo display should use backend-provided URLs only.
- Mobile camera/file input should be usable in a single-column layout.
- Forbidden shortcuts: direct Supabase Storage upload, constructing bucket URLs, requiring photo for problem save, allowing observation photo upload from UI.

## 12. Integration design notes

Frontend integration is backend photo API only.

No direct Supabase Storage integration is expected in this phase.

## 13. Testing requirements

### Unit/component tests

- `type = problem` shows uploader.
- `type = observation` hides/disables uploader.
- Problem saves without photo.
- Required fields display errors.
- Target summary displays before save.
- Upload errors display clearly.
- Detail page renders backend-provided photo URL(s).

### Frontend/API-service tests

- Problems API service uses canonical endpoints.
- Photo upload service uses multipart backend endpoint.
- Observation flow does not call photo upload.
- No service sends `accountId`.

### Static/security checks

- No direct Supabase Storage bucket calls.
- No service role key or storage credential in frontend code.

## 14. Verification checklist

- [ ] Problems list with filters works.
- [ ] Create problem flow works.
- [ ] Create observation flow works.
- [ ] Problem detail works.
- [ ] Photo uploader is visible only for problems.
- [ ] Problem can be saved without photo.
- [ ] Photo upload and error display work.
- [ ] Backend-provided photo URLs render.
- [ ] Frontend tests/typecheck/lint/build pass where configured.
- [ ] Manual smoke covers problem with photo and observation without uploader.
- [ ] Static search confirms no direct Supabase Storage access.

## 15. Review checklist

- [ ] Photo boundary is preserved.
- [ ] Observation upload is impossible from UI.
- [ ] Reactive Forms are used.
- [ ] Target summary is visible.
- [ ] API errors are clear and do not clear form data.
- [ ] Mobile file/camera UX is usable.
- [ ] No AI problem assist or activity correction UI slipped in.
- [ ] Tests cover problem vs observation photo behavior.

## 16. Suggested branch name

```text
feature/frontend-problems-photos
```

## 17. Expected PR summary

```md
## Summary
Implemented frontend Problems and Photos flow.

## Scope
- Added problems list/create/detail pages.
- Added problem-only photo uploader.
- Added target selection summary and API error display.

## Domain rules preserved
- Photos are available only for problem records.
- Problem creation does not require a photo.
- Frontend uses backend photo APIs, not direct storage.

## Tests
- <commands run and results>

## Deferred work
- AI problem assist and observation photos remain deferred.

## Review focus
- Problem vs observation behavior.
- Storage boundary.
- Mobile upload usability.
```

## 18. Risks and pitfalls

- Allowing observation photo uploads in the UI.
- Requiring a photo before saving a problem.
- Directly calling Supabase Storage from frontend.
- Constructing storage URLs instead of using backend-provided URLs.
- Hiding target summary until after save.
- Losing form data on upload failure.

## 19. Exit criteria

- Problems and observations can be created through UI.
- Problem photos can be uploaded through backend APIs only.
- Observation photo behavior is blocked/hidden.
- Problem detail displays controlled photo URLs.
