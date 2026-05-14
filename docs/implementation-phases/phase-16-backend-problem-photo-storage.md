# Phase 16 — Backend Problem Photo Storage

## 1. Purpose

This phase implements backend-mediated problem photo upload and metadata persistence through `StoragePort`. It adds storage provider boundaries and file validation while preserving the v1 rule that photos are supported only for problems, not observations.

## 2. Position in the sequence

Phase 15 must already provide problem/observation metadata APIs. Frontend Phase 17 depends on backend photo upload and detail URL behavior.

This phase must not be merged with Phase 15 because storage adapters, multipart handling, secret boundaries, and cleanup behavior require separate review. It must not be merged with frontend Phase 17 because backend storage safety must be proven first.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines problem-only photos, database metadata truth, storage behind backend abstraction, controlled file access, and orphan cleanup.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines `POST /problems/:problemId/photos` and problem detail photo URL expectations.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `StoragePort`, problem photo flow, and metadata transaction.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines multipart, problem-only, failure, and account scoping tests.
- `docs/001_initial_schema_gardening_helper.sql` - defines `problem_photos`.
- `docs/004_guards_and_triggers_gardening_helper.sql` - rejects photo metadata for observations.
- `docs/env.example` - defines Supabase Storage backend-only configuration and problem photo bucket.

## 4. Scope

### Backend scope

- Define/implement `StoragePort`.
- Implement deterministic test/dev storage adapter behind the port.
- Implement Supabase Storage adapter behind the port if configuration is available.
- Implement `POST /problems/:problemId/photos`.
- Add multipart route handling.
- Validate image MIME type and size.
- Reject photo upload for observations.
- Store metadata in `problem_photos`.
- Return signed URL or protected API URL in problem detail.
- Add orphan upload cleanup strategy note.

### Integration scope

- Self-hosted Supabase Storage through `StoragePort`.
- Test/dev storage mock behind same interface.

### Testing scope

- Add multipart API tests and storage failure/metadata failure tests.

## 5. Out of scope

- Observation photos.
- Direct frontend Supabase Storage access.
- Advanced image resizing unless explicitly assigned.
- Frontend uploader.
- AI image analysis.
- Public bucket listing.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 15.
- Existing modules expected: problems repository/service/detail response.
- Expected backend paths after implementation: `src/modules/problems/`, `src/modules/files/` or `src/integrations/storage/`.
- Database requirements: `problem_photos` table and guard trigger migrated.
- Environment variables: `SUPABASE_STORAGE_URL`, `SUPABASE_STORAGE_BUCKET_PROBLEM_PHOTOS`, `SUPABASE_SERVICE_ROLE_KEY` backend-only if Supabase adapter is implemented.
- Test infrastructure requirements: multipart route testing, deterministic storage mock, file fixtures.

## 7. Domain rules and invariants affected

- Photos are supported only for problems in v1.
- Problem photo metadata is database truth.
- Object storage is behind backend abstraction.
- Database stores metadata, not image binary.
- File access must be controlled.
- Supabase service role key is backend-only.
- Orphaned uploads should be cleanable.
- Frontend must not use service role key or direct storage bucket access.

## 8. API contract impact

Endpoints involved:

- `POST /api/v1/problems/:problemId/photos`
- `GET /api/v1/problems/:problemId` response photo mapping is updated to include photo URLs or protected URLs.

Request/response shapes to preserve:

- Upload content type: `multipart/form-data`.
- Field: `file`.
- Success response: `{ data: { id, storageKey } }` or compatible canonical extension.
- Detail response photo item includes `id`, `url`, and `mimeType`.
- Errors use canonical envelope.

Error cases:

- Non-image file returns `VALIDATION_ERROR`.
- Oversized file returns `VALIDATION_ERROR`.
- Observation upload returns `BUSINESS_RULE_VIOLATION`.
- Storage provider failure returns `EXTERNAL_SERVICE_ERROR`.
- Inaccessible problem returns `NOT_FOUND` or `FORBIDDEN`.

## 9. Database impact

Tables involved:

- `problems`
- `problem_photos`

Triggers/guards involved:

- `trg_problem_photos_validate_consistency`

No schema changes are expected in this phase.

## 10. Backend design notes

- Photo upload route must authenticate and account-scope the problem before storing metadata.
- File binary storage can occur outside DB transaction, but metadata finalization must be transactional.
- If storage succeeds and metadata fails, cleanup should delete uploaded object or document/manual-job cleanup strategy.
- Problem detail should obtain signed/protected URLs through `StoragePort`, not by constructing public bucket URLs in domain service.
- Storage adapter should isolate Supabase SDK/service role use.
- Validate MIME type and size before upload where possible.
- Do not store image binary in Postgres.
- Forbidden shortcuts: direct frontend upload with service role key, public bucket listing, photo upload for observations, storage logic in controller.

## 11. Frontend design notes

No frontend work is expected in this phase.

Future frontend must upload through backend API only and display backend-provided signed/protected URLs.

## 12. Integration design notes

Port/interface:

- `StoragePort.uploadProblemPhoto`
- `StoragePort.deleteObject`
- `StoragePort.getSignedUrl`

Adapter expectations:

- Supabase Storage adapter stores files under problem/account-safe keys.
- Test/dev adapter is deterministic and does not require provider credentials.

Secret handling:

- Service role key and storage credentials are backend-only.
- Do not log signed URL secrets or service role values.

Failure handling:

- Storage upload failure returns `EXTERNAL_SERVICE_ERROR`.
- Metadata failure after upload triggers cleanup or records a documented cleanup path.

## 13. Testing requirements

### Unit tests

- MIME type validation accepts allowed image types.
- MIME type validation rejects non-images.
- Size validation rejects oversized files.
- Storage key builder avoids unsafe path values.

### Integration/API tests

- Valid image upload to `type = problem` creates metadata.
- Non-image upload rejected.
- Oversized upload rejected.
- Upload to `type = observation` rejected.
- Storage failure does not create metadata.
- Metadata failure cleanup strategy is tested or documented.
- Problem detail returns signed/protected URL mapping.
- Account A cannot upload photo to account B problem.

### Static/security checks

- No Supabase Storage service role key in frontend config.
- No direct bucket URL construction in domain services.
- Supabase Storage SDK usage confined to adapter.

## 14. Verification checklist

- [ ] `StoragePort` exists.
- [ ] Test/dev storage adapter exists.
- [ ] Supabase Storage adapter exists or production status is documented.
- [ ] Multipart photo upload endpoint is implemented.
- [ ] Image MIME and size validation exist.
- [ ] Observation photo upload is rejected.
- [ ] Photo metadata is persisted in `problem_photos`.
- [ ] Problem detail includes controlled photo URLs.
- [ ] Cleanup strategy is implemented or documented.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Storage access goes through `StoragePort`.
- [ ] Problem-only photo rule is enforced in service and tested.
- [ ] Account scoping is enforced before upload/metadata.
- [ ] File validation is adequate.
- [ ] Metadata transaction and cleanup behavior are clear.
- [ ] No direct frontend storage access or service role exposure exists.
- [ ] No observation photos or AI image features slipped in.

## 16. Suggested branch name

```text
feature/backend-problem-photos
```

## 17. Expected PR summary

```md
## Summary
Implemented backend problem photo storage.

## Scope
- Added StoragePort and storage adapter boundary.
- Added problem photo upload endpoint and metadata persistence.
- Added controlled photo URL mapping on problem detail.

## Domain rules preserved
- Photos are only for problems in v1.
- Storage is backend-mediated through StoragePort.
- Database stores metadata, not image binary.

## Tests
- <commands run and results>

## Deferred work
- Frontend uploader, AI image assistance, and observation photos remain deferred.

## Review focus
- Storage boundary.
- File validation.
- Account scoping.
- Metadata cleanup behavior.
```

## 18. Risks and pitfalls

- Uploading directly from frontend to private bucket with service role key.
- Allowing observation photo metadata.
- Constructing permanent public URLs manually.
- Creating metadata after failed storage upload.
- Leaving orphan uploads without cleanup strategy.
- Logging file URLs or credentials.

## 19. Exit criteria

- Problem photo upload works through backend.
- Observation upload is rejected.
- Metadata and controlled access URL behavior are tested.
- Storage provider code is isolated behind `StoragePort`.
