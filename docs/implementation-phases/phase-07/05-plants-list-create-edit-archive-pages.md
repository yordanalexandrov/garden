# Implementation Task - Phase 7 Step 5: Plants List, Create, Edit, and Archive Pages

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
Build the frontend Plants list/search/create/edit/archive pages for reusable plant definitions, using typed Plants API services, canonical enum options, Reactive Forms, backend error display, and archive confirmation.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Implement `/plants` list/search/filter page.
- [ ] Implement `/plants/new` create page or dialog route consistent with existing frontend patterns.
- [ ] Implement `/plants/:plantId` detail/edit page.
- [ ] Add plant create/edit form using Reactive Forms and Angular Material controls.
- [ ] Support `q`, `lifecycleType`, `growingStyle`, `includeArchived`, `page`, and `pageSize` list behavior where the backend supports it.
- [ ] Use canonical lifecycle and growing style enum values.
- [ ] Encourage reuse by making search/filter fast and visible.
- [ ] Use typed Plants API service for list/create/detail/update/archive.
- [ ] Display backend field-level and form-level validation/business-rule errors.
- [ ] Use archive confirmation before calling `POST /plants/:plantId/archive`.
- [ ] Add focused page/form/API-error tests.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/plants/pages/plants-list-page/
frontend/src/app/features/plants/pages/plant-detail-page/
frontend/src/app/features/plants/pages/plant-create-page/
frontend/src/app/features/plants/components/plant-form/
frontend/src/app/features/plants/plants.routes.ts
frontend/src/app/features/plants/plants-api.service.ts
frontend/src/app/features/plants/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Product usage rules, products, inventory, AI plant suggestions, or global plant catalog behavior.
- [ ] Backend endpoints or migrations.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Hard delete UI.
- [ ] Frontend-submitted trusted `accountId`.
- [ ] Perennials/beds pages except using the shared plant selector created in prior steps.

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
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] `docs/implementation-phases/phase-07/01-garden-structure-api-services-and-feature-scaffold.md`
- [ ] `docs/implementation-phases/phase-07/02-shared-garden-ui-components-and-form-patterns.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend routing, API client, shared form controls, API error mapper, and tests

---

# Domain Rules Affected

This task touches:

- [ ] frontend forms
- [ ] API contract
- [ ] account scoping
- [ ] auth/session boundary
- [ ] product usage rules

Important rules to preserve:

```text
Frontend is not business truth.
Frontend must not submit accountId for normal flows.
Plant database is reusable user-maintained reference data.
Plant records should not be duplicated unnecessarily.
Plant records with history should be archived instead of deleted.
Lifecycle and growing style values must match the canonical API contract.
Product usage rules are future scope and must not be implemented here.
```

Product usage rules are affected only because plants will later be referenced by rules. Do not implement product/rule UI in this task.

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

- [ ] frontend page/component
- [ ] frontend form validation
- [ ] frontend API service usage
- [ ] canonical enum controls
- [ ] API error display
- [ ] archive confirmation
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows

---

# API Contract

Endpoints involved:

```text
GET /api/v1/plants
POST /api/v1/plants
GET /api/v1/plants/:plantId
PATCH /api/v1/plants/:plantId
POST /api/v1/plants/:plantId/archive
```

Allowed enum values:

```text
LifecycleType: annual, biennial, perennial
GrowingStyle: tree, shrub, vine, herb, vegetable, berry, flower, other
```

Frontend request bodies must not include:

```text
accountId
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] API response shape
- [ ] frontend form behavior
- [ ] archive confirmation
- [ ] edge cases

Specific test cases:

1. Plants page searches through the typed Plants API service.
2. Plant form rejects missing `commonName` before submit.
3. Lifecycle options are limited to `annual`, `biennial`, and `perennial`.
4. Growing style options are limited to canonical values.
5. Opening `/plants/:plantId` loads `GET /plants/:plantId` and populates the edit form.
6. Create/update requests do not include `accountId`.
7. Backend validation errors render on the form.
8. Archived plants are excluded by default and `includeArchived` behavior is explicit.
9. Archive action requires confirmation and calls `POST /plants/:plantId/archive`.
10. Plant pages do not introduce product/rule/inventory behavior.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/plants`, `/plants/new`, and `/plants/:plantId` are implemented for list/search/create/edit/archive.
- [ ] Plant forms use Reactive Forms and canonical enum controls.
- [ ] Plant archive requires confirmation and uses the canonical archive endpoint.
- [ ] Plant search/reuse behavior is visible and ergonomic.
- [ ] No plant form or service sends `accountId`.
- [ ] No direct Supabase table/storage access is introduced.
- [ ] Tests cover search, form validation, enum values, API errors, archive confirmation, and boundary rules.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

From the frontend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run frontend boundary/static checks if configured.

If any command does not exist or fails due to pre-existing setup, report it clearly.

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
