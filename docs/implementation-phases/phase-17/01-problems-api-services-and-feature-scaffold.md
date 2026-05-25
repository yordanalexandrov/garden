# Implementation Task - Phase 17 Step 1: Problems API Services and Feature Scaffold

## Goal

Create the frontend problems feature scaffold and typed API services for metadata and photo upload endpoints.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

## Scope

- [ ] Inspect existing Angular routes, API client, auth interceptor, error mapper, shared controls, selectors, and Phase 10 feature patterns.
- [ ] Create `src/app/features/problems/` structure following local conventions.
- [ ] Add routes for `/problems`, `/problems/new`, and `/problems/:problemId`.
- [ ] Define frontend DTO/types for canonical problem, observation, photo, filters, create/update payloads, and upload responses.
- [ ] Implement `ProblemsApiService` for `GET/POST/PATCH /api/v1/problems` and `POST /api/v1/problems/:problemId/photos`.
- [ ] Ensure services do not send trusted `accountId` and do not call Supabase Storage directly.
- [ ] Add API service tests for canonical endpoints and multipart field name `file`.

## Out of Scope

- [ ] Page UI beyond minimal scaffold.
- [ ] Direct storage access.
- [ ] Backend API changes.
- [ ] AI problem assist.

## Required Documents

- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- [ ] Existing frontend API service and routing files.

## Acceptance Criteria

- [ ] Problems routes and API service are scaffolded with typed canonical request/response shapes.
- [ ] No direct database/storage access or trusted `accountId` is introduced.
