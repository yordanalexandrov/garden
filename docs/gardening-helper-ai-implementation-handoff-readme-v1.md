# Gardening Helper — AI Implementation Handoff README v1

## 1. Purpose

This is the master handoff document for implementing **Gardening Helper v1** with an AI coding agent.

Give this file to the AI agent first.

The purpose of this README is to:

- define which documents must be read
- define the correct reading order
- define source-of-truth priority
- define expected implementation output
- define implementation phases
- define selected infrastructure/provider integrations
- define hard constraints and forbidden shortcuts
- prevent the AI agent from redesigning the product

This file does **not** replace the detailed specifications.  
It is the index and execution guide for them.

---

# 2. Project summary

Gardening Helper is a **PWA-first garden management application** for personal garden/orchard management.

It manages:

- places / gardens
- trees and perennial plants
- garden beds
- persistent bed plants
- yearly bed plantings
- activity logging
- problems and observations
- problem photos
- product database
- plant-specific product usage rules
- inventory lots
- inventory stock movements
- tasks and calendar
- quarantine periods
- weather context
- rain confirmation
- AI-assisted suggestions
- PWA push notifications

The product must be:

- simple enough for daily field use
- structured enough for automation
- auditable enough to preserve history
- safe enough to avoid hidden business state

---

# 3. Mandatory document reading order

The AI implementation agent must start with this handoff and the highest-priority contract documents, then read the supporting design documents:

1. `gardening-helper-ai-implementation-handoff-readme-v1.md`
2. `gardening-helper-implementation-instructions-for-ai-v1.md`
3. `gardening-helper-domain-rules-and-invariants-v1.md`
4. `gardening-helper-canonical-api-contract-v1.md`
5. `gardening-helper-testing-and-acceptance-spec-v1.md`
6. `gardening-helper-implementation-agent-instructions.md`
7. `gardening-helper-backend-application-design-pack-v1.md`
8. `gardening-helper-technical-requirements-and-erd.md`
9. SQL migration pack:
   - `001_initial_schema_gardening_helper.sql`
   - `002_views_gardening_helper.sql`
   - `003_seed_reference_data_gardening_helper.sql`
   - `004_guards_and_triggers_gardening_helper.sql`
10. `gardening-helper-frontend-technical-spec-v1.md`
11. `gardening_helper_functional_spec_v_1.md`
12. `gardening-helper-product-scope.md`

The agent must not start implementation before reading all files.

Before selecting the next phase or task, also read `gardening-helper-implementation-status-handoff.md`. It tracks current implementation progress only and does not replace the source-of-truth documents or priority order below.

---

# 4. Source-of-truth priority

If documents appear to conflict, use this priority order:

1. **Domain Rules and Invariants**
2. **Canonical API Contract**
3. **Implementation Instructions for AI**
4. **Backend Application Design Pack**
5. **Technical Requirements / ERD**
6. **SQL Migrations**
7. **Frontend Technical Specification**
8. **Testing and Acceptance Specification**
9. **Functional Specification**
10. **Product Scope**

Do not invent behavior when a higher-priority document defines it.

If something is still unclear, choose the simplest implementation that preserves:

- backend-owned business logic
- PostgreSQL domain model on self-hosted Supabase Postgres
- explicit user confirmation
- auditability
- inventory ledger correctness
- target resolution correctness
- AI/weather as assistive features only

Document any assumption in implementation notes.

---

# 5. Mandatory technology stack

## Frontend

Use:

- Angular
- Angular Material
- Standalone components
- Reactive Forms
- Signals for local UI state
- RxJS for async/API flows
- PWA support

## Backend

Use:

- Node.js
- Fastify
- TypeScript
- REST JSON API
- Modular monolith architecture

## Database

Use:

- PostgreSQL
- provided migration pack as schema baseline

## Backend data access

Use:

- repository layer
- explicit transaction abstraction
- Kysely or equivalent typed SQL/query-builder approach

Do not use frontend direct database access.

---

# 6. Expected final implementation output

The implementation AI should generate a complete project containing:

## Backend

- Fastify app
- TypeScript setup
- route registration
- controllers
- services
- repositories
- validation schemas
- database client
- transaction wrapper
- migration setup
- integration ports/adapters
- deterministic test/dev adapters where needed
- tests
- README/setup instructions

## Frontend

- Angular app
- Angular Material layout
- PWA setup
- responsive app shell
- routing
- feature pages
- shared UI components
- typed API services
- Reactive Forms
- API error handling
- tests
- README/setup instructions

## Database

- use provided migrations
- add new migrations only if necessary
- do not silently modify already provided migrations after implementation starts

## Documentation

Final implementation should include:

- setup instructions
- environment variables
- migration instructions
- test instructions
- integration/provider status
- implementation notes
- known limitations

---

# 7. Required implementation phases

The AI agent should implement in this order.

## Phase 1 — Project foundation

Implement:

- backend project structure
- frontend project structure
- shared type/enums strategy
- backend config loading
- backend error model
- backend validation hooks/plugins
- Supabase Auth adapter through `AuthPort`
- database connection
- transaction helper
- migration runner/instructions
- MCP server bootstrap foundation:
  - `apps/mcp-server` package structure
  - MCP SDK and minimal stdio entrypoint
  - config validation without committed secrets
  - `McpToolContext` and authenticated account-context derivation
  - typed backend API client for `GET /health`
  - structured result/error helpers
  - `health.check`
  - bootstrap tests
- frontend app shell
- frontend routing
- frontend API client base
- global error display

Do not start AI/weather features or MCP business tools here.

For the Phase 1 MCP item, follow `gardening-helper-mcp-server-design-v1.md` Phase MCP-1. Register `health.check` only unless docs tooling is explicitly assigned. Do not expose MCP business read tools or mutation tools during Phase 1 unless the task explicitly scopes that work and the MCP design requirements are satisfied.

---

## Phase 2 — Core garden structure

Implement:

- places
- plants
- perennials
- beds
- persistent bed plants
- yearly bed plantings

Required:

- backend CRUD
- API contract compliance
- frontend list/detail/create/edit flows
- account scoping
- validation
- tests

---

## Phase 3 — Products and inventory

Implement:

- products
- product usage rules
- inventory lots
- inventory movements
- inventory overview
- product detail page
- inventory pages

Required rules:

- inventory uses lots + movements
- creating lot creates purchase movement
- manual adjustment creates movement
- one active product + plant usage rule in v1
- no stock mutation without movement

---

## Phase 4 — Activity core

This is the most important phase.

Implement:

- target resolver
- bulk target selector API support
- `ActivitiesService.createActivity`
- inventory allocator
- treatment/fertilizing product usage
- inventory deduction
- quarantine generation
- suggested task generation
- activity list/detail
- create activity frontend page

Required:

- full transaction handling
- rollback tests
- shortage handling
- resolved target persistence
- side-effect summary returned to frontend

Do not skip this or simplify it to basic CRUD.

---

## Phase 5 — Problems, photos, tasks, calendar

Implement:

- problems
- observations
- problem photo upload
- task creation
- suggested task confirmation
- reminders
- calendar feed
- dashboard summary if practical

Required:

- photos only for problems in v1
- task reminders only for planned tasks
- suggested tasks are not planned
- calendar is read aggregation, not source of truth

---

## Phase 6 — Frontend completion

Implement and polish:

- dashboard
- places
- place detail tabs
- perennials
- beds
- bed detail
- plants
- products
- product detail
- inventory
- activities
- create activity
- problems
- create problem
- problem detail
- tasks
- calendar
- settings
- notification settings

Required:

- mobile-friendly layout
- Angular Material
- Reactive Forms
- clear validation errors
- no business logic duplication from backend

---

## Phase 7 — Selected integrations

Implement provider adapters behind ports for:

- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- AI
- Push notifications: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

Test/dev mocks must preserve the real interface shape and stay behind ports.

The app should keep core domain tests runnable without external API keys.

---

## Phase 8 — Deployment readiness

Prepare the Hetzner VPS + Docker Compose deployment shape:
- Angular PWA
- Fastify API
- background worker/scheduler
- self-hosted Supabase Postgres/Auth/Storage plus REST/Meta/Studio as needed

Do not replace the Fastify API with direct Supabase table access.
Supabase service role key must remain backend-only.
Frontend may use Supabase Auth only for login/session handling.
Fastify validates JWTs, derives authenticated actor/account context server-side and enforces account scoping.
Supabase Studio must be protected.
PostgreSQL must not be publicly exposed.
Worker/scheduler ownership must be explicit for reminders and weather checks.

---

## Phase 9 — Tests

Implement tests according to:

- Testing and Acceptance Specification v1

Minimum required test focus:

- account scoping
- target resolution
- create activity transaction
- transaction rollback
- inventory shortage
- product rule consistency
- confirm suggested task
- problem photo rules
- AI acceptance boundary
- weather rain confirmation boundary
- frontend create activity flow
- frontend create problem flow

---

## Phase 10 — Final review and implementation notes

Before final output, provide:

- what was implemented
- which selected adapters are implemented
- which test/dev mocks are used behind ports
- what is not implemented
- how to run backend
- how to run frontend
- how to run migrations
- how to run tests
- known limitations
- recommended next steps

---

# 8. Infrastructure/provider integration policy

Provider decisions are fixed for v1:

- Deployment: Hetzner VPS + Docker Compose
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

Mocks are allowed for tests and local scaffolding only when they preserve the same port contract.

## Auth

Use self-hosted Supabase Auth behind `AuthPort`.

Do not bake Supabase auth details or mock auth into business modules.
The frontend may use Supabase Auth only for login/session handling; all application data access goes through the Fastify API.
The Supabase service role key is backend-only.

## Storage

Use self-hosted Supabase Storage behind `StoragePort`.

Problem photo metadata must still be persisted.
Frontend must not access storage buckets directly for business flows.
File access must use signed URLs or protected backend endpoints.

## Weather

Use Open-Meteo behind `WeatherPort`.

Rain confirmation flow must still be implemented.

## AI

Allowed for initial implementation:

- deterministic mock AI provider
- mock product ingestion result
- mock bed planning result
- mock problem assist result

But architecture must keep an `AiPort`.

AI suggestion persistence and accept/reject flow must still be implemented.

## Push notifications

Use raw Web Push with VAPID behind `PushPort`.

Reminder rows must still be generated.
Reminder delivery must be owned by the backend worker/scheduler.

---

# 9. Hard implementation rules

These are mandatory.

## 9.1 Backend rules

- backend owns business logic
- controllers remain thin
- services orchestrate workflows
- repositories only access database
- integrations go through ports/adapters
- critical writes use explicit transactions
- account scoping enforced everywhere
- Supabase SDKs are used behind adapters, not inside core domain services
- backend validates JWTs through `AuthPort`
- worker/scheduler ownership is explicit for reminders/weather checks

## 9.2 Frontend rules

- Angular frontend never talks directly to database
- Angular frontend never accesses application tables directly
- use Angular Material
- use Reactive Forms for business forms
- use typed API services
- display backend validation errors
- show generated side effects after critical mutations
- keep AI output visibly as suggestions
- keep suggested tasks visually distinct from planned tasks

## 9.3 Database rules

- use UUID primary keys
- use PostgreSQL migrations
- use constraints for structural integrity
- no hidden business side-effect triggers
- no public PostgreSQL port
- no public Supabase Studio without protection
- archive over delete for historical records
- inventory movement history must be preserved

## 9.4 Domain rules

- all bulk actions resolve to concrete target rows
- all-beds/all-perennials are scoped to one place
- cross-place mixed targeting is not allowed in v1
- inventory stock never changes without movement
- suggested tasks require confirmation before planned
- reminders only for planned tasks
- AI suggestions are not business truth
- weather does not decide treatment validity
- problem photos only for problems in v1
- hybrid correction model for corrections

---

# 10. Forbidden shortcuts

Do not:

1. Redesign the product.
2. Redesign the schema without a documented reason.
3. Skip the inventory ledger.
4. Store activity targets as strings or arrays instead of resolved rows.
5. Treat all beds/all trees globally across places.
6. Save AI-generated product/rule data directly without user acceptance.
7. Create planned tasks automatically from product rules.
8. Create reminders for suggested tasks.
9. Mark treatment failed automatically because of rain forecast.
10. Let frontend calculate inventory allocation.
11. Put business workflows in controllers.
12. Put business workflows in repositories.
13. Use database triggers for hidden business side effects.
14. Hard-delete historical records by default.
15. Implement photo upload for observations in v1.
16. Ignore transaction rollback tests.
17. Expose provider secrets to frontend.
18. Return raw unwrapped API responses.
19. Use untyped request/response objects everywhere.
20. Skip tests because the app compiles.
21. Expose Supabase service role key to frontend.
22. Use Supabase SDKs directly inside domain services instead of adapters.
23. Make Supabase Studio public without protection.
24. Open PostgreSQL publicly.
25. Implement reminder/weather-check business workflows as frontend timers.

---

# 11. Critical workflows that must work

## 11.1 Create activity — treatment with full side effects

Must:

1. create activity
2. resolve and persist targets
3. create product usage rows
4. allocate inventory consumption
5. create inventory movements
6. update lots
7. create quarantine if rule has quarantine days
8. create suggested task if rule has reapplication interval
9. return side-effect summary
10. rollback all if any step fails

## 11.2 Confirm suggested task

Must:

1. verify task is suggested
2. update task to planned
3. set confirmed timestamp
4. create day-before reminder
5. create same-day reminder
6. rollback all if reminder creation fails

## 11.3 Create inventory lot

Must:

1. create inventory lot
2. create purchase movement
3. happen in one transaction

## 11.4 Manual inventory adjustment

Must:

1. create adjustment/correction movement
2. update lot remaining quantity if lot-bound
3. prevent negative lot quantity
4. preserve movement history

## 11.5 Create problem with photo

Must:

1. create problem metadata
2. allow zero or more photos
3. persist photo metadata
4. reject photo upload for observations in v1

## 11.6 Accept AI suggestion

Must:

1. verify suggestion belongs to account
2. validate accepted payload
3. mark suggestion accepted
4. create/update business record
5. rollback all if business record creation fails

## 11.7 Rain confirmation

Must:

1. verify weather event belongs to account
2. persist user confirmation
3. set observedRain correctly
4. not auto-fail treatment
5. not auto-create planned task

---

# 12. Required API behavior

Implement the API according to:

- `gardening-helper-canonical-api-contract-v1.md`

Required conventions:

## Base path

```text
/api/v1
```

## Success response

```json
{
  "data": {}
}
```

## Error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  }
}
```

## Pagination response

```json
{
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

Critical endpoints:

- `POST /activities`
- `POST /tasks/:taskId/confirm`
- `POST /products/:productId/inventory-lots`
- `POST /inventory/adjustments`
- `POST /problems`
- `POST /problems/:problemId/photos`
- `POST /ai/suggestions/:suggestionId/accept`
- `POST /weather/events/:weatherEventId/confirm-rain`

---

# 13. Required frontend behavior

Implement frontend according to:

- `gardening-helper-frontend-technical-spec-v1.md`

Critical frontend flows:

## Create activity page

Must support:

- place selection
- activity type selection
- target scope selection
- bulk target selector
- product usage form array
- product rule visibility
- missing rule warning
- quantity/unit input
- save button disabled during submit
- side-effect summary after success

## Create problem page

Must support:

- place selection
- target selection
- problem/observation type
- photo upload only for problem
- saving problem without photo
- validation error display

## Calendar page

Must show:

- activities
- tasks
- suggested tasks
- quarantine periods
- weather markers if available

Item types must be visually distinct.

## AI product ingestion page

Must show AI output as structured suggestions, not saved truth.

## Task detail page

Must distinguish:

- suggested
- planned
- done
- skipped
- canceled

Suggested task must have confirm/dismiss actions.

---

# 14. Required tests

Implement tests according to:

- `gardening-helper-testing-and-acceptance-spec-v1.md`

At minimum, include tests for:

## Backend

- account scoping
- target resolver
- inventory allocator
- create activity happy path
- create activity rollback on inventory failure
- inventory shortage blocked
- inventory shortage allowed
- confirm suggested task
- duplicate confirm rejected
- create inventory lot creates movement
- manual adjustment creates movement
- problem photo upload only for problems
- AI suggestion accept boundary
- rain confirmation boundary

## Frontend

- app shell loads
- routes work
- create activity form
- bulk target selector
- product usage form warnings
- create problem form
- photo uploader behavior
- task confirm UI
- AI suggestion display
- API error display

Tests can use mocks behind `AiPort`, `WeatherPort`, `StoragePort` and `PushPort`.

---

# 15. Environment and configuration

The implementation should support environment variables such as:

## Backend

```text
NODE_ENV=
PORT=
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
# Backend-only; never expose to frontend.
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
STORAGE_PROVIDER=supabase
STORAGE_BUCKET=
WEATHER_PROVIDER=open-meteo
AI_PROVIDER=
PUSH_PROVIDER=web-push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

## Frontend

```text
API_BASE_URL=/api/v1
```

Do not hardcode secrets.

---

# 16. Final implementation report

When done, the AI agent should return a final report containing:

## Completed

- list of implemented modules
- list of implemented endpoints
- list of implemented frontend pages
- list of implemented tests

## Integration/provider status

- Auth: Supabase Auth adapter status
- Storage: Supabase Storage adapter status
- Weather: Open-Meteo adapter status
- AI: selected adapter or mock status
- Push notifications: Web Push/VAPID adapter status

State which test/dev mocks are used behind ports.

## Not implemented

List anything not implemented and why.

## How to run

Include commands for:

- install dependencies
- run backend
- run frontend
- run migrations
- run tests
- seed database

## Known limitations

Mention any limitations clearly.

Do not pretend test/dev mocks are production provider adapters.

---

# 17. Final instruction to the AI agent

Implement **Gardening Helper v1** according to the provided documents.

Do not redesign.

Do not skip the hard transactional parts.

Do not implement only superficial CRUD.

The implementation is acceptable only if:

- backend business logic is correct
- database migrations are applied
- frontend follows the specified UX
- API contract is respected
- inventory ledger is preserved
- activity transaction is correct
- AI/weather remain assistive
- tests cover critical flows
- documentation explains how to run and verify the system

If a shortcut would violate domain rules, do not take it.
