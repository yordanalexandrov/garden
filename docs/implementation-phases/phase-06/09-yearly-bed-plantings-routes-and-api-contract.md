# Implementation Task - Phase 6 Step 9: Yearly Bed Plantings Routes and API Contract

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
Expose the canonical Yearly Bed Plantings API routes with authenticated Fastify handlers, request validation, response envelopes, DTO mapping, duplicate-row allowance, and API-level tests.
```

## Branch

Use branch:

```text
feature/backend-growing-structure
```

---

# Scope

Implement only:

- [ ] Register authenticated yearly bed planting routes under `/api/v1`.
- [ ] Implement thin route handlers for list by bed/year, create, update, and archive.
- [ ] Validate route params, query strings, and bodies using schemas from Step 1.
- [ ] Call `YearlyBedPlantingsService`; do not perform bed/plant account consistency logic in controllers.
- [ ] Return canonical success envelopes for list, mutation, and archive responses.
- [ ] Return canonical error envelopes through existing app error handling.
- [ ] Preserve list pagination envelope with `items`, `page`, `pageSize`, and `total`.
- [ ] Ensure the API allows duplicate rows for the same bed, plant, and year.
- [ ] Add API route tests for success, validation, auth, account scope, duplicate-row allowance, year filtering, and response shape.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/plantings/yearly-bed-plantings.routes.ts
backend/src/app/routes.ts
backend/test/plantings/yearly-bed-plantings.routes.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Target resolver, activities, inventory, problems, tasks, AI, weather, storage, push, frontend code, or MCP tools.
- [ ] Uniqueness constraints for bed/plant/year.
- [ ] New repository/service behavior beyond fixing yearly planting gaps found while wiring routes.
- [ ] Schema changes or migrations.
- [ ] Hard deletes.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-06/01-growing-structure-module-contracts-and-validation.md`
- [ ] `docs/implementation-phases/phase-06/08-yearly-bed-plantings-repository-and-service.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing app route registration and auth test helpers
- [ ] Yearly bed plantings repository/service files from Step 8

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Backend validates Supabase Auth JWTs through AuthPort.
The backend derives authenticated account context server-side.
Controllers stay thin.
Services own bed/plant account consistency validation.
Yearly bed plantings are calendar-year based.
Duplicate same plant/bed/year rows are allowed.
Historical bed occupancy must remain readable.
API responses use canonical success and error envelopes.
Archive historical business records instead of hard-deleting them.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 6.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema usage
- [ ] backend service method calls
- [ ] API DTO mapping
- [ ] duplicate-row allowance tests
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] account scoping enforced backend-side

---

# API Contract

Endpoints involved:

```text
GET /api/v1/beds/:bedId/plantings
POST /api/v1/beds/:bedId/plantings
PATCH /api/v1/plantings/:plantingId
POST /api/v1/plantings/:plantingId/archive
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

Yearly bed planting route behavior must include:

```text
List query: year required or defaulted to current year consistently with the canonical API; status optional; page and pageSize if list pagination is implemented.
Create body: plantId, year, quantity, notes, status.
Update body: only editable yearly planting fields; reject invalid status, negative quantity, and invalid years.
Duplicate same bed/plant/year rows must be accepted.
Mutations return { data: { id } } unless existing project convention includes the updated DTO.
Archive preserves the row and returns a canonical mutation/archive envelope.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] auth errors
- [ ] duplicate-row allowance
- [ ] archive behavior
- [ ] edge cases

Specific test cases:

1. Unauthenticated yearly planting routes return `UNAUTHORIZED`.
2. `GET /beds/:bedId/plantings?year=2026` returns canonical pagination/list envelope.
3. List returns only rows for the requested calendar year.
4. `POST /beds/:bedId/plantings` creates an account-scoped row and returns `{ data: { id } }`.
5. Create rejects cross-account `bedId`.
6. Create rejects cross-account `plantId`.
7. Create allows duplicate same bed/plant/year rows.
8. Patch rejects invalid status, negative quantity, and invalid `year`.
9. Patch/archive return `NOT_FOUND` or the existing inaccessible-resource policy for account B rows.
10. Archive preserves the row and excludes it from default active/current list behavior.
11. Validation errors use canonical `VALIDATION_ERROR` envelope.

---

# Acceptance Criteria

The task is complete when:

- [ ] All canonical Yearly Bed Plantings API endpoints are registered and authenticated.
- [ ] Handlers are thin and call `YearlyBedPlantingsService`.
- [ ] Request validation and DTO mapping match the canonical API contract.
- [ ] Duplicate same bed/plant/year rows are allowed through the API.
- [ ] Errors use canonical error envelope.
- [ ] Account-scope and cross-account tests pass.
- [ ] No frontend, provider, MCP, uniqueness constraint, or schema work is introduced.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If database-backed tests require a dedicated local/private PostgreSQL-compatible database and it is unavailable, report that exactly.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules affected
- API changes
- Database changes
- Tests run
- Integration/provider status
- Review focus

---

# Notes for Implementation Agent

Do not redesign the product.

