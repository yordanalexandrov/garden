# Implementation Task - Phase 7 Step 6: Perennials Place Pages

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
Build the place-scoped Perennials page for listing, creating, editing, filtering, and archiving individually tracked trees/perennials using typed API services and Reactive Forms.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Implement `/places/:placeId/perennials` inside the place detail shell.
- [ ] List perennials for the selected place with quick search/filter where practical.
- [ ] Show plant name, label/nickname, planted year, and status.
- [ ] Add create/edit perennial form using Reactive Forms and Angular Material controls.
- [ ] Use plant selector for `plantId`.
- [ ] Use typed Perennials API service for list/create/detail/update/archive.
- [ ] Display backend validation/business-rule errors.
- [ ] Use archive confirmation before calling `POST /perennials/:perennialId/archive`.
- [ ] Keep bulk selection and target resolver behavior out of this phase.
- [ ] Use responsive layout: table or dense rows on desktop and stacked cards on mobile.
- [ ] Add focused page/form/API-error tests.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/perennials/pages/place-perennials-page/
frontend/src/app/features/perennials/components/perennial-form/
frontend/src/app/features/perennials/perennials-api.service.ts
frontend/src/app/features/perennials/**/*.spec.ts
frontend/src/app/features/places/places.routes.ts
```

---

# Out of Scope

Do not implement:

- [ ] Target resolver or activity target selection.
- [ ] Activity logging, problem creation, calendar, tasks, products, inventory, weather, AI, push, storage, or MCP behavior.
- [ ] Backend endpoints or migrations.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Frontend-submitted trusted `accountId`.
- [ ] Hard delete UI.

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
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] `docs/implementation-phases/phase-07/01-garden-structure-api-services-and-feature-scaffold.md`
- [ ] `docs/implementation-phases/phase-07/02-shared-garden-ui-components-and-form-patterns.md`
- [ ] `docs/implementation-phases/phase-07/04-place-detail-shell-and-overview.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing place shell, plant selector, API service, form, and error-display files

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Frontend is not business truth.
Frontend must not submit accountId for normal flows.
Perennials are individually tracked growing units.
Perennial place/plant account consistency is backend-owned.
Archive historical business records instead of hard-deleting them.
Bulk target resolution is future backend-owned behavior and must not be implemented here.
```

Target resolution is affected only because perennials are future targetable rows. Do not implement target resolver or activity target selection in this task.

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
- [ ] plant selector integration
- [ ] API error display
- [ ] archive confirmation
- [ ] responsive list/card layout
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
GET /api/v1/places/:placeId/perennials
POST /api/v1/places/:placeId/perennials
GET /api/v1/perennials/:perennialId
PATCH /api/v1/perennials/:perennialId
POST /api/v1/perennials/:perennialId/archive
GET /api/v1/plants
```

Perennial request fields:

```text
plantId
label
plantedYear
notes
status on update where backend supports it
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

1. Place perennials page loads perennials through `GET /places/:placeId/perennials`.
2. Perennial form requires a selected plant before submit.
3. Perennial form validates sane planted year as basic UX validation where implemented.
4. Create/update requests do not include `accountId`.
5. Backend errors for invalid plant/place references render to the user.
6. Archive action requires confirmation and calls `POST /perennials/:perennialId/archive`.
7. Perennials list does not implement bulk activity targeting.
8. Mobile card layout shows plant name, label, planted year, and status without overlapping actions.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/places/:placeId/perennials` works inside the place detail shell.
- [ ] Perennials can be listed, created, edited, and archived through the Fastify API.
- [ ] Perennial form uses Reactive Forms and plant selector.
- [ ] Archive requires confirmation and uses the canonical archive endpoint.
- [ ] No perennial form or service sends `accountId`.
- [ ] No target resolver, activity, problem, provider, MCP, or direct Supabase table/storage behavior is introduced.
- [ ] Tests cover list, form validation, API errors, archive confirmation, and scope boundaries.
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

