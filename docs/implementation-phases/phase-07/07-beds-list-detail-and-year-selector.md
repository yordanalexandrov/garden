# Implementation Task - Phase 7 Step 7: Beds List, Detail, and Year Selector

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
Build the place-scoped Beds list page and bed detail view, including bed create/edit/archive, selected-year contents, and a year selector that changes the displayed yearly planting view without mutating data.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Implement `/places/:placeId/beds` inside the place detail shell.
- [ ] Implement a bed detail route if the existing route map supports it, such as `/beds/:bedId` or equivalent nested route.
- [ ] List beds for the selected place with selected-year `currentContents`.
- [ ] Show bed name, dimensions/area, status, persistent plant summary, and yearly planting summary.
- [ ] Add create/edit bed form using Reactive Forms and Angular Material controls.
- [ ] Validate required name and positive dimensions as basic UX validation.
- [ ] Use typed Beds API service for list/create/detail/update/archive.
- [ ] Add a year selector for bed list/detail yearly planting views.
- [ ] Ensure year selector changes query/view state only; it must not overwrite or archive planting data.
- [ ] Display backend validation/business-rule errors.
- [ ] Use archive confirmation before calling `POST /beds/:bedId/archive`.
- [ ] Keep log activity, record problem, and AI bed planning actions as later-phase placeholders/links only.
- [ ] Add focused page/form/year-selector/API-error tests.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/beds/pages/place-beds-page/
frontend/src/app/features/beds/pages/bed-detail-page/
frontend/src/app/features/beds/components/bed-form/
frontend/src/app/features/beds/components/bed-current-contents/
frontend/src/app/features/beds/beds-api.service.ts
frontend/src/app/features/beds/**/*.spec.ts
frontend/src/app/features/places/places.routes.ts
```

---

# Out of Scope

Do not implement:

- [ ] Persistent bed plant and yearly planting add/edit/archive forms; those are Step 8.
- [ ] Activity logging, problem creation, AI bed planning, calendar, products, inventory, weather, push, storage, or MCP behavior.
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
- [ ] Existing place shell, year selector, API service, form, and error-display files

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] AI suggestions

Important rules to preserve:

```text
Frontend is not business truth.
Frontend must not submit accountId for normal flows.
Beds are physical growing areas.
Beds can contain persistent bed plants and yearly bed plantings.
Historical bed occupancy must remain readable.
Year selector must not mutate planting data.
Archive historical business records instead of hard-deleting them.
Target resolver and activity/problem workflows are future backend-owned scope.
AI bed planning is future assistive scope and must not auto-apply data.
```

Target resolution and AI are affected only through deferred links/placeholders. Do not implement those workflows in this task.

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
- [ ] year selector integration
- [ ] bed contents rendering
- [ ] API error display
- [ ] archive confirmation
- [ ] responsive list/detail layout
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
GET /api/v1/places/:placeId/beds
POST /api/v1/places/:placeId/beds
GET /api/v1/beds/:bedId
PATCH /api/v1/beds/:bedId
POST /api/v1/beds/:bedId/archive
```

Bed request fields:

```text
name
description
notes
widthM
lengthM
status on update where backend supports it
```

List query parameters for `GET /api/v1/places/:placeId/beds`:

```text
year
q
page
pageSize
```

Detail query parameters for `GET /api/v1/beds/:bedId`:

```text
year
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
- [ ] year selector behavior
- [ ] archive confirmation
- [ ] edge cases

Specific test cases:

1. Place beds page loads beds through `GET /places/:placeId/beds`.
2. Bed form rejects missing name before submit.
3. Bed form rejects zero or negative dimensions before submit.
4. Bed list sends selected `year` as a query param.
5. Year selector changes visible yearly planting query/view without calling mutation endpoints.
6. Persistent plant summary and yearly planting summary render separately.
7. Create/update requests do not include `accountId`.
8. Backend errors render to the user.
9. Archive action requires confirmation and calls `POST /beds/:bedId/archive`.
10. Deferred activity/problem/AI actions do not call later-phase APIs.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/places/:placeId/beds` works inside the place detail shell.
- [ ] Bed detail view works if supported by route structure.
- [ ] Beds can be listed, created, edited, and archived through the Fastify API.
- [ ] Bed form uses Reactive Forms and positive dimension validation.
- [ ] Year selector changes the displayed yearly planting view without mutating data.
- [ ] Persistent and yearly contents are visually distinct.
- [ ] No bed form or service sends `accountId`.
- [ ] No activity/problem/AI/provider/MCP/direct Supabase behavior is introduced.
- [ ] Tests cover list, detail, form validation, year selector, API errors, archive confirmation, and scope boundaries.
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
