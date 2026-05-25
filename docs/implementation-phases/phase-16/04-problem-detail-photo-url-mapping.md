# Implementation Task - Phase 16 Step 4: Problem Detail Photo URL Mapping

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
Update problem detail reads to include controlled photo URLs obtained through StoragePort, without public bucket URL construction.
```

## Branch

Use branch:

```text
feature/backend-problem-photos
```

---

# Scope

Implement only:

- [ ] Inspect existing Phase 15 problem detail DTO mapping, service detail lookup, repository photo methods, error handling, and route tests.
- [ ] Ensure `GET /api/v1/problems/:problemId` remains account-scoped before any photo URL generation.
- [ ] List `problem_photos` metadata for the requested problem through repository methods.
- [ ] For each photo, call `StoragePort.getSignedUrl` or a protected backend URL helper according to the chosen local implementation.
- [ ] Return detail response photo items with at least `id`, `url`, and `mimeType` as required by the canonical API contract.
- [ ] Include additional metadata only if it is already contract-compatible and useful, such as original filename or size.
- [ ] Do not construct public bucket URLs in domain services or DTO mappers.
- [ ] Do not expose storage credentials, signed URL secrets in logs, or public bucket listing.
- [ ] Decide and implement a controlled failure behavior if signed/protected URL generation fails, using canonical provider error handling or a clearly documented degraded response if local conventions already support it.
- [ ] Add focused tests for URL mapping, account scope, provider failure, and no URL construction bypass.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/problems/problems.service.ts
backend/src/modules/problems/problems.repository.ts
backend/src/modules/problems/problems.dto.ts
backend/src/modules/files/storage.port.ts
backend/test/problems/
```

---

# Out of Scope

Do not implement:

- [ ] Upload route parsing or file validation.
- [ ] Photo metadata creation workflow beyond using Step 3 repository/service output.
- [ ] Frontend display or uploader.
- [ ] Public bucket listing, permanent public URLs, or direct browser storage calls.
- [ ] Observation photos.
- [ ] AI image analysis or problem-assist behavior.
- [ ] Schema changes or migrations.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 13 and 20
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 18.4, 28.3, and 28.4
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` problem detail/photo sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` sections 6.11, 7.1, and 9.3
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- [ ] `docs/implementation-phases/phase-16/01-storage-port-config-and-adapters.md`
- [ ] `docs/implementation-phases/phase-16/03-problem-photo-upload-metadata-transaction-and-cleanup.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing problem detail, DTO, repository, storage, and route test files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] problems/photos
- [ ] API contract
- [ ] storage/file access boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
Problem photo metadata is database truth.
File access must be controlled by signed URLs or protected API URLs.
Do not expose public bucket listing.
Problem photo files live in self-hosted Supabase Storage through backend StoragePort.
Supabase service role key is backend-only.
Services must enforce account scoping before file URL access.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 16. Future MCP tools must use backend detail APIs or services and must not bypass storage access control.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend service method updates
- [ ] repository read method if needed
- [ ] DTO mapping helpers
- [ ] provider adapter through port
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
- [ ] account scoping enforced backend-side before URL generation
- [ ] Supabase Storage used through `StoragePort`
- [ ] no public bucket listing

---

# API Contract

Endpoints involved:

```text
GET /api/v1/problems/:problemId
```

Detail response photo items must include:

```text
id
url
mimeType
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`
- Canonical success and error envelopes

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] account scoping
- [ ] API response shape
- [ ] provider failure behavior
- [ ] edge cases

Specific test cases:

1. Problem detail for a problem with photos returns `photos` with `id`, controlled `url`, and `mimeType`.
2. Problem detail with no photos returns an empty `photos` array or existing contract-compatible empty behavior.
3. Problem detail for an observation does not invent photo URLs.
4. Account A cannot obtain Account B photo URLs through problem detail.
5. `StoragePort.getSignedUrl` or protected URL helper is called for each photo storage key.
6. Signed/protected URL generation failure follows the chosen canonical error/degraded-response behavior.
7. Domain service/DTO code does not construct direct public bucket URLs.

---

# Acceptance Criteria

The task is complete when:

- [ ] Problem detail includes controlled photo URL mapping.
- [ ] URL generation happens only after account-scoped problem access succeeds.
- [ ] Storage access goes through `StoragePort` or a protected backend URL helper.
- [ ] No public bucket URL construction, frontend code, observation photos, schema changes, or AI work is included.
- [ ] Tests cover response shape and access boundaries.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm test -- problems
npm run test:db -- problems
```

If these commands differ in the existing project, use the nearest existing backend typecheck and focused problem detail test commands. Record exact commands and results.
