# Implementation Task - Phase 16 Step 2: Multipart Photo Route and File Validation

## Role

You are the **Implementation Agent**.

Use:

- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

Final infrastructure/provider decisions:

- Deployment: Hetzner VPS + Docker Compose
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Add backend multipart route handling and file validation for POST /api/v1/problems/:problemId/photos while keeping controllers thin.
```

## Branch

Use branch:

```text
feature/backend-problem-photos
```

---

# Scope

Implement only:

- [ ] Inspect existing Fastify route registration, auth prehandlers, validation helpers, error envelope helpers, and problems route conventions.
- [ ] Add or configure multipart handling using the project's Fastify plugin pattern.
- [ ] Register `POST /api/v1/problems/:problemId/photos` under the existing problems module.
- [ ] Validate `problemId` path parameter as UUID.
- [ ] Require multipart/form-data with exactly the supported `file` field according to local parser behavior.
- [ ] Validate image MIME type against backend-configured allowed image MIME types.
- [ ] Validate file size against backend-configured problem photo max size.
- [ ] Reject missing file, non-image file, oversized file, malformed multipart request, and unsupported extra file behavior with canonical error envelopes.
- [ ] Pass only validated file stream/buffer metadata to the service layer.
- [ ] Keep route/controller code limited to request parsing, validation, actor extraction, service call, and envelope response.
- [ ] Add focused route/validation tests that do not require real Supabase Storage credentials.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/problems/problems.routes.ts
backend/src/modules/problems/problem-photo.validation.ts
backend/src/modules/problems/problem-photo.controller.ts
backend/src/app/plugins/
backend/test/problems/
```

---

# Out of Scope

Do not implement:

- [ ] `StoragePort` or adapters beyond using the Step 1 port.
- [ ] Metadata transaction and cleanup behavior; that belongs to Step 3.
- [ ] Problem detail photo URL mapping; that belongs to Step 4.
- [ ] Observation photo support.
- [ ] Frontend uploader or direct frontend storage calls.
- [ ] Public bucket URLs, bucket listing, image resizing, or AI analysis.
- [ ] Schema changes or migrations.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 18.3
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` sections 6.17, 6.18, and 8.10
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` sections 7.1 and 9.3
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- [ ] `docs/implementation-phases/phase-16/01-storage-port-config-and-adapters.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend route, auth, validation, multipart, and problem module files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] problems/photos
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary

Important rules to preserve:

```text
Photos are supported only for problems in v1.
Problem creation must work without photos.
Backend owns file validation.
Controllers stay thin.
Errors use canonical envelopes.
The Fastify API remains the application data API under /api/v1.
Frontend must not upload directly to Supabase Storage with service-role credentials.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 16. Future MCP tools must call backend services/API and must not upload directly to storage.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] multipart parser/plugin setup if absent
- [ ] service method call boundary
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Storage used through `StoragePort`

---

# API Contract

Endpoints involved:

```text
POST /api/v1/problems/:problemId/photos
```

Request/response must follow:

- Content type: `multipart/form-data`
- Field: `file`
- Success response: `{ "data": { "id": "uuid", "storageKey": "problems/uuid/photo.jpg" } }` or compatible canonical extension
- Errors use canonical error envelopes from `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path request parsing
- [ ] validation errors
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Valid image multipart request reaches the service with actor, problem ID, file metadata, MIME type, original filename, and size.
2. Missing `file` field returns `VALIDATION_ERROR`.
3. Non-image MIME type returns `VALIDATION_ERROR`.
4. Oversized image returns `VALIDATION_ERROR`.
5. Invalid UUID path parameter returns `VALIDATION_ERROR`.
6. Malformed multipart request returns a canonical error envelope.
7. Unauthenticated upload request is rejected by the existing auth boundary.

---

# Acceptance Criteria

The task is complete when:

- [ ] `POST /api/v1/problems/:problemId/photos` is registered under `/api/v1`.
- [ ] Multipart `file` parsing and validation are implemented.
- [ ] Route/controller remains thin and delegates business rules to the service.
- [ ] No metadata is written without the service workflow.
- [ ] No observation-specific behavior, frontend code, storage SDK calls in services, schema changes, or AI work is introduced.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm test -- problems
```

If these commands differ in the existing project, use the nearest existing backend typecheck and focused route test commands. Record exact commands and results.
