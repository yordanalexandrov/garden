# Implementation Task - Phase 7 Step 4: Place Detail Shell and Overview

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
Build the place detail shell and overview route, including place metadata, counts, place-scoped subnavigation, and safe quick links into Phase 7 pages.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Implement `/places/:placeId` as a redirect or shell entry consistent with the route design.
- [ ] Implement `/places/:placeId/overview`.
- [ ] Add place detail shell with sub-navigation:
  - Overview
  - Trees / Perennials
  - Beds
  - Activities
  - Problems
  - Calendar
  - Weather
- [ ] Load place detail through the typed Places API service.
- [ ] Display place metadata, weather-enabled status, and backend-provided counts.
- [ ] Add quick links/actions for add perennial and add bed where those pages can handle them.
- [ ] Keep later-phase actions for log activity, record problem, calendar, weather, and AI as navigation placeholders or disabled/deferred links consistent with existing app patterns.
- [ ] Show loading, empty/not-found, and backend error states.
- [ ] Keep the shell split from child page components.
- [ ] Add route/component tests for subnavigation and overview rendering.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/places/pages/place-detail-shell/
frontend/src/app/features/places/pages/place-overview-page/
frontend/src/app/features/places/places.routes.ts
frontend/src/app/features/places/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Activity, problem, calendar, weather, or AI pages.
- [ ] Backend summary/count calculations beyond consuming existing `GET /places/:placeId`.
- [ ] Perennials or beds page internals; those are later Phase 7 steps.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Frontend-submitted trusted `accountId`.
- [ ] Backend endpoints or migrations.

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
- [ ] `docs/implementation-phases/phase-07/03-places-list-create-edit-archive-pages.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing app shell, route placeholder, navigation, API error, and test files

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
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Places are top-level garden locations.
Weather is advisory and this task must not call weather providers.
Backend-provided counts are display data; frontend must not infer cross-account state.
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
- [ ] place detail shell routing
- [ ] place overview rendering
- [ ] API error/loading/not-found states
- [ ] responsive subnavigation
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
GET /api/v1/places/:placeId
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

Place detail consumes backend-provided:

```text
id
name
description
notes
weatherEnabled
weatherLocationLabel
latitude
longitude
timezone
counts
createdAt
updatedAt
archivedAt
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] API response shape
- [ ] route behavior
- [ ] API error rendering
- [ ] edge cases

Specific test cases:

1. `/places/:placeId` reaches the place detail shell or redirects to `/places/:placeId/overview` consistently.
2. Overview loads place detail through the typed Places API service.
3. Overview displays backend counts without locally querying application tables.
4. Subnavigation includes overview, perennials, beds, and later-phase placeholder links.
5. Missing/inaccessible place errors render a not-found or API error state.
6. Quick add links navigate only to Phase 7-supported flows.
7. Component tests prove the shell does not combine all child page logic into one god component.

---

# Acceptance Criteria

The task is complete when:

- [ ] Place detail shell and overview route work.
- [ ] Place metadata, weather metadata, and counts render from the API.
- [ ] Place-scoped subnavigation works and keeps later-phase routes deferred.
- [ ] Loading, not-found, and API error states are visible.
- [ ] Shell remains separate from perennials/beds child pages.
- [ ] No direct Supabase table/storage access or backend-owned business logic is introduced.
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

