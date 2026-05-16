# Implementation Task - Phase 7 Step 3: Places List, Create, Edit, and Archive Pages

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
Build the frontend Places list and create/edit/archive UI using Reactive Forms, typed Places API services, backend error display, and archive confirmation.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Implement `/places` as the active places list page.
- [ ] Show place name, description/notes summary where useful, weather-enabled status, and actions to open, edit, and archive.
- [ ] Add create/edit place form using Reactive Forms and Angular Material controls.
- [ ] Support basic UX validation: required name and weather-enabled location rule.
- [ ] Use typed Places API service for list/create/update/archive.
- [ ] Display backend field-level and form-level validation/business-rule errors.
- [ ] Use archive confirmation before calling `POST /places/:placeId/archive`.
- [ ] Refresh list state after create/update/archive without relying on direct database access.
- [ ] Use responsive layout: scannable rows/table on desktop and stacked cards on mobile.
- [ ] Add focused page/form/API-error tests.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/places/pages/places-list-page/
frontend/src/app/features/places/components/place-form/
frontend/src/app/features/places/places.routes.ts
frontend/src/app/features/places/places-api.service.ts
frontend/src/app/features/places/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Place detail tabs or overview content; those are Step 4.
- [ ] Perennials, beds, plants, persistent plants, or yearly planting flows.
- [ ] Backend endpoints or migrations.
- [ ] Weather forecast calls or rain confirmation.
- [ ] Activity, problem, task, calendar, AI, product, inventory, storage, push, or MCP behavior.
- [ ] Direct Supabase application-table access.
- [ ] Frontend-submitted trusted `accountId`.

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
- [ ] Existing frontend routing, app shell, API client, error mapper, shared components, and tests

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] weather/rain confirmation

Important rules to preserve:

```text
Frontend is not business truth.
Frontend must not submit accountId for normal flows.
All application data access goes through the Fastify API under /api/v1.
Places are top-level garden locations.
Weather is optional per place.
Weather location must be explicit when weather is enabled.
Weather is advisory and this phase must not call weather providers.
Archive historical business records instead of hard-deleting them.
Backend validation remains authoritative.
```

Weather/rain confirmation is affected only through place metadata. Do not implement forecast or rain confirmation flows.

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
- [ ] API error display
- [ ] archive confirmation
- [ ] responsive layout
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
- [ ] Open-Meteo used through `WeatherPort` only by backend and not touched in this task

---

# API Contract

Endpoints involved:

```text
GET /api/v1/places
POST /api/v1/places
GET /api/v1/places/:placeId
PATCH /api/v1/places/:placeId
POST /api/v1/places/:placeId/archive
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

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

1. Places page loads active places through the typed Places API service.
2. Create place form rejects missing name before submit.
3. Weather-enabled place form requires either `weatherLocationLabel` or both `latitude` and `longitude`.
4. Create/update requests do not include `accountId`.
5. Backend validation errors render on the form.
6. Archive action opens confirmation and only calls archive API after confirmation.
7. Archive uses `POST /places/:placeId/archive`, not a DELETE call.
8. Mobile layout renders place actions without overlapping content.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/places` lists places from the Fastify API.
- [ ] Create/edit place form works with Reactive Forms and backend error display.
- [ ] Weather metadata UX validation is present without implementing weather provider behavior.
- [ ] Archive requires confirmation and uses the canonical archive endpoint.
- [ ] No place form or service sends `accountId`.
- [ ] No direct Supabase table/storage access is introduced.
- [ ] Tests cover list, form validation, API errors, archive confirmation, and boundary rules.
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

