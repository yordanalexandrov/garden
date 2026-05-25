# Phase 16 Task Set - Backend Problem Photo Storage

These files convert `docs/implementation-phases/phase-16-backend-problem-photo-storage.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-problem-photos
```

## Task Order

1. `01-storage-port-config-and-adapters.md`
2. `02-multipart-photo-route-and-file-validation.md`
3. `03-problem-photo-upload-metadata-transaction-and-cleanup.md`
4. `04-problem-detail-photo-url-mapping.md`
5. `05-problem-photo-regression-security-and-boundary-tests.md`
6. `06-phase-16-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend problem photo storage API:

- `StoragePort` and storage adapter boundary for self-hosted Supabase Storage.
- Deterministic test/dev storage adapter behind the same port.
- Backend-mediated `POST /api/v1/problems/:problemId/photos`.
- Multipart `file` handling with image MIME type and size validation.
- Account-scoped problem lookup before metadata writes.
- Rejection of observation photo uploads.
- `problem_photos` metadata persistence without storing image binary in Postgres.
- Controlled signed or protected photo URLs on problem detail responses.
- Cleanup or documented cleanup strategy for upload success followed by metadata failure.
- Tests for multipart validation, account scoping, provider failure, metadata failure, URL mapping, and security boundaries.

Do not implement:

- Observation photos.
- Frontend uploader or frontend problem pages.
- Direct frontend Supabase Storage access.
- Public bucket listing or permanent public URL construction.
- AI image analysis or problem-assist behavior.
- Advanced image resizing, thumbnails, or EXIF processing unless explicitly assigned.
- Schema redesign or new migrations unless a blocking mismatch is documented.

## Common Required Documents

Every task in this folder requires the Implementation Agent to read:

- `AGENTS.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- `docs/gardening-helper-canonical-api-contract-v1.md`
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-backend-application-design-pack-v1.md`
- `docs/gardening-helper-technical-requirements-and-erd.md`
- `docs/001_initial_schema_gardening_helper.sql`
- `docs/004_guards_and_triggers_gardening_helper.sql`
- `docs/env.example`
- `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, config, route registration, multipart, storage/integration, problems module, transaction, validation, error, repository, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If multipart, storage, or repository tests require a database or object storage, run them with deterministic local/test adapters and a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration. Do not require real Supabase Storage credentials for normal automated tests. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
