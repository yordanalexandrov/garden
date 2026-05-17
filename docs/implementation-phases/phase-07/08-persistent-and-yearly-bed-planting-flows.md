# Implementation Task - Phase 7 Step 8: Persistent and Yearly Bed Planting Flows

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
Add persistent bed plant and yearly bed planting create/edit/archive flows within bed pages, keeping persistent and yearly contents distinct and preserving selected-year behavior.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Add persistent bed plant add/edit/archive UI within the bed list/detail experience.
- [ ] Add yearly bed planting add/edit/archive UI within the bed list/detail experience.
- [ ] Use plant selector for `plantId` in both forms.
- [ ] Use Reactive Forms and Angular Material controls.
- [ ] Validate required plant, non-negative quantity, and sane calendar year as basic UX validation.
- [ ] Use canonical status options for persistent bed plants and yearly bed plantings.
- [ ] Use typed Persistent Bed Plants and Yearly Bed Plantings API services.
- [ ] Display backend validation/business-rule errors.
- [ ] Use archive confirmation before calling persistent/yearly archive endpoints.
- [ ] Keep duplicate same bed/plant/year yearly planting rows allowed; frontend must not block them.
- [ ] Keep persistent plants active across year changes unless the user explicitly archives/updates them.
- [ ] Refresh selected bed contents after mutations without direct database access.
- [ ] Add focused form/API-error/archive/year behavior tests.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/plantings/components/persistent-bed-plant-form/
frontend/src/app/features/plantings/components/yearly-bed-planting-form/
frontend/src/app/features/plantings/persistent-bed-plants-api.service.ts
frontend/src/app/features/plantings/yearly-bed-plantings-api.service.ts
frontend/src/app/features/beds/components/bed-current-contents/
frontend/src/app/features/plantings/**/*.spec.ts
frontend/src/app/features/beds/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Target resolver or activity target selection.
- [ ] AI bed planning output or auto-applied planting plans.
- [ ] Problem/task/calendar/product/inventory/weather/push/storage/MCP behavior.
- [ ] Backend endpoints or migrations.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Frontend-submitted trusted `accountId`.
- [ ] Uniqueness rules that prevent duplicate yearly plantings for the same bed/plant/year.
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
- [ ] `docs/implementation-phases/phase-07/07-beds-list-detail-and-year-selector.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing bed pages, plant selector, year selector, API services, form helpers, and error-display files

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
Persistent bed plants stay until explicitly removed or archived.
Persistent bed plants must not be automatically removed when year changes.
Yearly bed plantings are calendar-year based.
Duplicate same plant/bed/year rows are allowed.
Historical bed occupancy must remain readable.
Archive historical business records instead of hard-deleting them.
AI suggestions are not business truth and AI bed planning is out of scope.
Target resolver and activity workflows are out of scope.
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

- [ ] frontend page/component
- [ ] frontend form validation
- [ ] frontend API service usage
- [ ] plant selector integration
- [ ] year selector integration
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
GET /api/v1/beds/:bedId/persistent-plants
POST /api/v1/beds/:bedId/persistent-plants
PATCH /api/v1/persistent-bed-plants/:id
POST /api/v1/persistent-bed-plants/:id/archive
GET /api/v1/beds/:bedId/plantings
POST /api/v1/beds/:bedId/plantings
PATCH /api/v1/plantings/:plantingId
POST /api/v1/plantings/:plantingId/archive
GET /api/v1/plants
GET /api/v1/beds/:bedId
```

Persistent bed plant request fields:

```text
plantId
plantedYear
quantity
notes
status on update where backend supports it
```

Yearly bed planting request fields:

```text
plantId
year
quantity
notes
status
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

1. Persistent bed plant form requires plant selection before submit.
2. Persistent bed plant form allows year changes in the UI without auto-removing the row.
3. Yearly bed planting form requires `year` and plant selection before submit.
4. Quantity validation rejects negative values before submit.
5. Status controls expose only canonical values for persistent and yearly rows.
6. Yearly planting create does not block duplicate same bed/plant/year rows.
7. Create/update requests do not include `accountId`.
8. Backend validation errors render to the user.
9. Archive actions require confirmation and call canonical archive endpoints.
10. Selected-year refresh updates visible yearly rows without hiding persistent rows.
11. No activity/problem/AI/provider/direct Supabase behavior is introduced.

---

# Acceptance Criteria

The task is complete when:

- [ ] Persistent bed plants can be added, edited, and archived from bed pages.
- [ ] Yearly bed plantings can be added, edited, and archived from bed pages.
- [ ] Persistent and yearly contents remain visually and behaviorally distinct.
- [ ] Year selector affects only the displayed yearly planting set.
- [ ] Duplicate same bed/plant/year yearly planting rows are allowed by the UI.
- [ ] No planting form or service sends `accountId`.
- [ ] No target resolver, activity, problem, AI/provider/MCP/direct Supabase behavior is introduced.
- [ ] Tests cover form validation, API errors, archive confirmation, year behavior, duplicate allowance, and scope boundaries.
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

