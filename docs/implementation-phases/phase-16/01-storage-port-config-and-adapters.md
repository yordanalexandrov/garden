# Implementation Task - Phase 16 Step 1: Storage Port, Config, and Adapters

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
Create the backend StoragePort contract, backend-only storage configuration, deterministic test/dev adapter, and Supabase Storage adapter boundary needed for problem photos.
```

## Branch

Use branch:

```text
feature/backend-problem-photos
```

---

# Scope

Implement only:

- [ ] Inspect existing backend config, dependency injection, integration port, auth adapter, logger, error, and test adapter patterns.
- [ ] Confirm Phase 15 problems metadata module exists before wiring photo behavior; if Phase 15 is absent, stop and document the prerequisite gap.
- [ ] Define `StoragePort` with `uploadProblemPhoto`, `deleteObject`, and `getSignedUrl` methods.
- [ ] Define typed inputs/results for problem photo upload, uploaded file metadata, and signed/protected URL generation.
- [ ] Add backend-only storage configuration for Supabase Storage URL, problem photo bucket, service role key access, max photo bytes, allowed image MIME types, and signed URL TTL where local config conventions support it.
- [ ] Ensure config validation never exposes service role values in frontend code, public config, logs, build output, or client-visible errors.
- [ ] Implement a deterministic test/dev storage adapter behind `StoragePort` that stores enough in memory or a test-local safe location to support automated route/service tests without provider credentials.
- [ ] Implement a Supabase Storage adapter behind `StoragePort` if the existing dependency/config pattern supports it; otherwise document production adapter status and leave a typed boundary with no domain-service SDK usage.
- [ ] Add a storage key builder that creates account/problem-safe object keys and rejects unsafe path values.
- [ ] Add focused unit tests for storage key construction, config parsing, and test adapter behavior where existing test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/files/storage.port.ts
backend/src/modules/files/storage.types.ts
backend/src/modules/files/storage-key.ts
backend/src/modules/files/test-storage.adapter.ts
backend/src/modules/files/supabase-storage.adapter.ts
backend/src/config/
backend/test/files/
```

---

# Out of Scope

Do not implement:

- [ ] Multipart upload route behavior; that belongs to Step 2.
- [ ] Problem photo service workflow or metadata transaction; that belongs to Step 3.
- [ ] Problem detail photo URL mapping; that belongs to Step 4.
- [ ] Frontend uploader, frontend storage access, or Angular configuration.
- [ ] Public bucket listing or permanent public URL construction.
- [ ] Image resizing, thumbnails, EXIF parsing, or AI image analysis.
- [ ] Schema changes or migrations.
- [ ] Direct Supabase SDK usage inside domain services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 18.3, 18.4, 28.3, and 28.4
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` problem photo and multipart sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` sections 7.1 and 9.3
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- [ ] `docs/env.example`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend config, integration adapter, dependency injection, logger, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] problems/photos
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
Object storage is behind backend abstraction.
Business flows use backend APIs and StoragePort.
Supabase service role key is backend-only.
Database stores photo metadata, not image binary.
File access must use signed URLs or protected API URLs.
Do not expose public bucket listing.
Supabase SDK usage is confined to adapters, not domain services.
```

---

# MCP Impact

This task:

- [ ] has no MCP impact

MCP tools affected:

```text
None.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] provider adapter through port
- [ ] backend config validation
- [ ] storage key helper
- [ ] deterministic test/dev adapter
- [ ] tests
- [ ] docs/update notes only if backend storage configuration or production adapter status changes

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] Supabase Storage used through `StoragePort`
- [ ] account scoping enforced backend-side before object keys or signed URLs are used by business flows
- [ ] no public bucket listing

---

# API Contract

Endpoints involved:

```text
None directly in this step.
```

This step prepares the storage boundary used later by:

```text
POST /api/v1/problems/:problemId/photos
GET /api/v1/problems/:problemId
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] provider adapter boundary
- [ ] edge cases

Specific test cases:

1. Storage key builder creates deterministic problem photo keys scoped by account and problem identifiers.
2. Storage key builder rejects path traversal, slashes in generated filename components, or unsafe original filename usage.
3. Backend config accepts required problem photo storage settings without exposing secret values in serialized errors/logs.
4. Test/dev storage adapter supports upload, signed/protected URL generation, and delete behavior deterministically.
5. Supabase SDK or service role usage, if introduced, is confined to the storage adapter.

---

# Acceptance Criteria

The task is complete when:

- [ ] `StoragePort` and typed storage inputs/results exist.
- [ ] A deterministic test/dev adapter exists and needs no provider credentials.
- [ ] Supabase Storage adapter exists or production adapter status is explicitly documented.
- [ ] Storage config is backend-only and secret-safe.
- [ ] Storage key creation is account/problem-safe.
- [ ] No route, metadata transaction, frontend, schema, AI, or unrelated provider work is included.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm test -- storage
```

If these commands differ in the existing project, use the nearest existing backend typecheck and focused test commands. Record exact commands and results.
