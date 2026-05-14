# Gardening Helper — Implementation Instructions for AI v1

## 1. Purpose

You are implementing **Gardening Helper v1**.

This document is the main instruction file for the implementation AI/developer.

You must use the provided project documents as source of truth and generate an implementation that follows them strictly.

Your goal is not to redesign the product.

Your goal is to implement the agreed system faithfully.

---

# 2. Documents you must read first

Start with the handoff and high-priority contract documents, then read the supporting design documents:

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

If any documents appear to conflict, use this priority order:

1. Domain Rules and Invariants
2. Canonical API Contract
3. Implementation Instructions for AI
4. Backend Application Design Pack
5. Technical Requirements / ERD
6. SQL Migrations
7. Frontend Technical Specification
8. Testing and Acceptance Specification
9. Functional Specification
10. Product Scope

Do not invent behavior when a rule is already specified.

---

# 3. Product summary

Gardening Helper is a **PWA-first garden management application** for managing:

- places/gardens
- trees and perennial plants
- garden beds
- persistent bed plants
- yearly bed plantings
- activities
- problems and observations
- product database
- product usage rules by plant
- inventory lots and stock movements
- calendar tasks
- quarantine periods
- weather context
- AI-assisted suggestions
- push notifications

The application must be simple to use but structurally correct.

---

# 4. Mandatory technology stack

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
- Modular monolith architecture
- REST JSON API under `/api/v1`

## Database
Use:

- self-hosted Supabase Postgres
- the provided SQL migrations as the schema baseline

## Infrastructure/provider decisions
Use:

- Hetzner VPS + Docker Compose for deployment
- self-hosted Supabase Auth through `AuthPort`
- self-hosted Supabase Storage through `StoragePort`
- Open-Meteo through `WeatherPort`
- raw Web Push with VAPID through `PushPort`

Do not replace the Fastify API with direct Supabase table access.
Supabase service role key must remain backend-only.

## Recommended backend data access
Use:

- Kysely or an equivalent typed SQL/query-builder approach
- repository layer
- explicit transaction abstraction

If you choose a different library, the architecture and contracts must remain equivalent.

---

# 5. Architecture rules

## 5.1 Backend owns business logic

The frontend must never talk directly to the database.

The backend owns:

- validation beyond basic UI checks
- account scoping
- target resolution
- inventory allocation
- activity transaction orchestration
- quarantine generation
- suggested task generation
- reminder creation
- AI suggestion acceptance
- weather rain confirmation
- file metadata finalization

## 5.2 Modular monolith

Implement as a modular monolith.

Do not create microservices.

Recommended backend modules:

- auth
- places
- plants
- perennials
- beds
- plantings
- products
- inventory
- activities
- problems
- tasks
- calendar
- weather
- ai
- files
- notifications
- audit

## 5.3 Repository + service layering

Use this layering:

```text
Controller
  -> validates request shape
  -> calls service

Service
  -> owns business workflow
  -> performs cross-entity validation
  -> opens transactions
  -> calls repositories
  -> calls integration ports

Repository
  -> performs database reads/writes
  -> no business orchestration

Integration Port
  -> wraps external provider
  -> storage / AI / weather / push / auth
```

## 5.4 Forbidden layering shortcuts

Do not:

- put business workflows in controllers
- put business workflows in repositories
- call database directly from Angular
- call provider SDKs directly from domain services without ports/adapters
- spread transaction logic across controllers
- hide critical behavior in database triggers
- duplicate backend business rules in frontend

---

# 6. Database rules

## 6.1 Use the provided migrations

Use the provided migration pack as the baseline.

Do not redesign the schema unless there is a real blocking implementation issue.

If schema changes are necessary:
- explain why
- keep them compatible with PostgreSQL / self-hosted Supabase Postgres
- keep them compatible with the domain rules
- add a new migration rather than editing historical migrations once implementation has started

## 6.2 UUID primary keys

All major entities use UUID primary keys.

## 6.3 Archive over delete

Do not hard-delete business records with history.

Use:

- `archived_at`
- status transitions

## 6.4 No hidden business side-effect triggers

Do not implement triggers that silently create:

- inventory movements
- tasks
- reminders
- quarantine periods
- AI suggestions
- weather decisions

Allowed triggers:
- `updated_at` maintenance
- integrity guards
- carefully designed audit helpers if explicitly specified

Business side effects belong in backend services.

---

# 7. API rules

## 7.1 Base path

All versioned business endpoints must live under:

```text
/api/v1
```

## 7.2 Response envelope

All successful responses must use:

```json
{
  "data": {}
}
```

All failed responses must use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  }
}
```

## 7.3 API contract is binding

Implement endpoints, request shapes, response shapes, status codes, and transactional behavior according to **Canonical API Contract v1**.

Do not rename endpoint paths unless there is a compelling reason.

Do not use different enum values.

Do not return unwrapped raw objects.

## 7.4 Account scoping

Every endpoint must enforce authenticated account scope.

A user must never be able to:

- read another account's data
- write another account's data
- reference another account's entity in a request

---

# 8. Frontend rules

## 8.1 Angular structure

Use feature-based structure.

Recommended frontend folders:

```text
src/app/
  core/
    api/
    auth/
    errors/
    layout/
    interceptors/

  shared/
    components/
    forms/
    selectors/
    utils/

  features/
    dashboard/
    places/
    plants/
    perennials/
    beds/
    plantings/
    products/
    inventory/
    activities/
    problems/
    tasks/
    calendar/
    ai/
    weather/
    settings/
```

## 8.2 Components

Use:

- route/page components for feature screens
- reusable presentational components for repeated UI
- dedicated form components for complex forms
- shared selector components for plants/products/places/targets

Do not create giant god-components.

## 8.3 Forms

Use Reactive Forms for all business forms.

Do not use `ngModel` for core workflows.

Important forms:

- create/edit place
- create/edit plant
- create/edit bed
- create/edit product
- create product usage rule
- add inventory lot
- create activity
- create problem
- create/confirm task
- AI product ingestion review

## 8.4 Frontend must not decide business truth

Frontend may display expected user intent, but backend decides:

- resolved targets
- inventory allocation
- quarantine creation
- suggested task generation
- reminder creation
- AI acceptance result
- weather/rain state persistence

## 8.5 Required frontend UX

The UI must make these clear:

- selected place
- selected target scope
- selected target count/summary
- product and rule selection
- missing rule warning
- quantity used
- generated side effects after save
- suggested vs planned task difference
- AI suggestions are not saved yet
- rain prompt is only confirmation, not automatic treatment failure

---

# 9. Core domain rules that must be enforced

## 9.1 Bulk target rules

Activities and tasks must support:

- whole place
- all perennials in place
- selected perennials
- all beds in place
- selected beds
- single bed
- selected yearly plantings
- selected persistent bed plants

The backend must resolve scopes into concrete target rows.

“All beds” and “all perennials” always mean within one selected place.

Cross-place mixed targeting is not allowed in v1.

## 9.2 Activity transaction rule

Creating an activity with product usage must happen in one transaction:

1. create activity
2. create resolved activity targets
3. create activity product usage rows
4. create inventory movements
5. update inventory lots
6. create quarantine periods if applicable
7. create suggested tasks if applicable
8. create audit log where applicable

If any step fails, rollback everything.

## 9.3 Inventory rules

Inventory is ledger-based.

Never change stock without an inventory movement.

Creating a lot creates a purchase movement.

Consuming stock creates consumption movement(s).

Manual changes create adjustment/correction movements.

Lot quantity must not become negative in v1.

## 9.4 Product rule rules

Product usage rules are plant-specific.

In v1, there is at most one active rule per product + plant.

A product can still be used without a rule, but the UI must show this clearly.

If a rule is supplied, it must belong to the selected product.

## 9.5 Quarantine rules

Quarantine periods are generated from activity + product usage rule context.

They are calendar overlays/read models.

Do not let users edit quarantine directly as a normal calendar event.

## 9.6 Task rules

Suggested task is not planned.

Suggested tasks do not have reminders.

Only planned tasks have reminders.

Confirming a suggested task must create day-before and same-day reminders transactionally.

Completing a task must not silently create an activity unless an explicit workflow is built.

## 9.7 AI rules

AI suggestions are not business truth.

AI may suggest:
- product data
- product usage rules
- bed spacing/coexistence
- problem summaries/questions

AI must not silently:
- create products
- create product rules
- create tasks
- diagnose as fact
- change inventory
- modify plantings

AI output becomes business data only after explicit acceptance through the backend.

## 9.8 Weather rules

Weather is optional per place.

Weather forecast is advisory.

Rain forecast does not mean rain happened.

User confirms rain as:
- confirmed_yes
- confirmed_no
- ignored

Confirmed rain must not automatically mark treatment failed.

Allowed:
- record confirmation
- show warning
- suggest follow-up task if explicitly implemented as suggested

Forbidden:
- auto-delete treatment
- auto-fail treatment
- auto-create planned task

## 9.9 Problem photo rules

Photos are supported only for problems in v1.

Problem can be created without photo.

Observations should not accept photos in v1.

---

# 10. Critical workflows to implement first

Implement in this order:

## Phase 1 — project foundations
- backend app bootstrap
- frontend app shell
- database connection
- migration runner
- Supabase Auth adapter through `AuthPort`
- standard API response/error handling
- shared DTO/enums
- validation setup

## Phase 2 — basic domain CRUD
- places
- plants
- perennials
- beds
- persistent bed plants
- yearly bed plantings

## Phase 3 — products and inventory
- products
- product usage rules
- inventory lots
- inventory movements
- inventory overview

## Phase 4 — activity core
- target resolver
- create activity service
- inventory allocator
- quarantine generation
- suggested task generation
- activity list/detail

## Phase 5 — problems and tasks
- problems
- problem photos
- tasks
- task confirmation
- reminders
- calendar feed

## Phase 6 — integrations
- push notifications
- weather
- AI
- dashboard refinements
- audit expansion

Do not start with AI/weather before activity + inventory is correct.

---

# 11. Required backend deliverables

Generate/implement:

## 11.1 App foundation
- Fastify app
- route registration
- error handler
- auth hook/plugin
- validation schemas/hooks
- config loading
- logger
- health endpoint

## 11.2 Database layer
- DB client
- transaction wrapper
- typed database interfaces
- migration runner or migration instructions
- repository base helpers if useful

## 11.3 Repositories
Implement repositories for:

- AccountsRepository
- PlacesRepository
- PlantsRepository
- PerennialsRepository
- BedsRepository
- PersistentBedPlantsRepository
- YearlyPlantingsRepository
- ProductsRepository
- InventoryRepository
- ActivitiesRepository
- ProblemsRepository
- TasksRepository
- QuarantineRepository
- WeatherRepository
- AiRepository
- PushSubscriptionsRepository
- AuditLogsRepository

## 11.4 Services
Implement services for:

- PlacesService
- PlantsService
- PerennialsService
- BedsService
- ProductsService
- InventoryService
- ActivitiesService
- ProblemsService
- TasksService
- CalendarService
- WeatherService
- AiService
- NotificationsService

## 11.5 API routes/controllers
Implement routes according to Canonical API Contract v1.

## 11.6 Tests
Generate tests according to Testing and Acceptance Specification v1.

At minimum include tests for:
- account scoping
- target resolution
- create activity transaction
- inventory shortage
- confirm task
- problem photo rules
- AI acceptance boundary
- weather rain confirmation boundary

---

# 12. Required frontend deliverables

Generate/implement:

## 12.1 App shell
- Angular Material layout
- responsive navigation
- route outlet
- global error/snackbar handling
- Supabase Auth login/session bootstrap
- PWA setup

## 12.2 Core API services
- typed HTTP client layer
- API error mapping
- auth interceptor
- per-feature API services

## 12.3 Shared UI components
At minimum:

- page header
- empty state
- confirm dialog
- status chip
- place selector
- plant selector
- product selector
- bulk target selector
- target summary
- photo uploader
- date range filter
- year selector
- calendar legend
- AI suggestion card

## 12.4 Feature pages
Implement pages according to Frontend Technical Specification:

- dashboard
- places
- place detail shell
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
- calendar
- task detail
- AI product ingestion
- AI bed planning
- AI problem assist
- settings
- notifications settings

## 12.5 Forms
All business forms must use Reactive Forms.

## 12.6 Frontend tests
Include tests for:
- create activity form
- bulk target selector
- create problem form/photo behavior
- task confirm UI
- AI suggestion display/acceptance flow
- API error display

---

# 13. External integrations

## 13.1 Auth

Use self-hosted Supabase Auth through an `AuthPort`/adapter approach.
Keep auth concerns isolated and do not bake Supabase-specific logic into domain modules.
Dev/test mocks are allowed only behind the same port.
The frontend may use Supabase Auth only for login/session handling.
All application data access goes through the Fastify API.
The Fastify API validates JWTs, derives authenticated actor/account context server-side and enforces account scoping.
The Supabase service role key is backend-only.

## 13.2 Storage

Use self-hosted Supabase Storage through a `StoragePort`.

Problem photo upload must go through backend.

Do not access Supabase Storage directly from business components.
The database stores photo metadata only.
File access must use signed URLs or protected backend endpoints.

## 13.3 Weather

Use Open-Meteo through a `WeatherPort`.
Tests may use deterministic mocks behind the same port.
Preserve rain confirmation flow.

## 13.4 AI

Use an `AiPort`.

If no real LLM provider is configured yet:
- implement a mock provider returning deterministic suggestions
- preserve session/suggestion persistence
- preserve accept/reject flow

## 13.5 Push notifications

Use raw Web Push with VAPID through a `PushPort`.
Implement backend subscription registration, reminder data, send operation and frontend permission/subscription flow.
Tests may mock the send operation behind the same port.

---

# 14. Testing requirements

Do not deliver implementation without tests.

Prioritize:

## P0 tests
- account scoping
- target resolution
- create activity transaction rollback
- inventory movement correctness
- product rule consistency
- task confirmation/reminder creation
- problem photo allowed/rejected rules
- AI suggestion acceptance boundary
- weather rain confirmation boundary

## P1 tests
- calendar aggregation
- dashboard aggregation
- CRUD for core modules
- frontend create activity
- frontend create problem

## P2 tests
- advanced filters
- audit log detail
- provider-specific integration behavior

Use mocks for:
- AI provider
- weather provider
- storage provider
- push provider

Use real PostgreSQL test database for repository/service integration tests if possible.

---

# 15. Acceptance checklist

Implementation is not complete until the following work:

## Core data
- [ ] Places CRUD
- [ ] Plants CRUD
- [ ] Perennials CRUD
- [ ] Beds CRUD
- [ ] Persistent bed plants
- [ ] Yearly bed plantings by year

## Products and inventory
- [ ] Products CRUD
- [ ] Product usage rules
- [ ] Inventory lots
- [ ] Inventory movements
- [ ] Purchase movement on lot creation
- [ ] Manual adjustment with movement
- [ ] Stock deduction on product usage

## Activities
- [ ] Watering without product
- [ ] Treatment/fertilizing with product
- [ ] Multiple selected targets
- [ ] All beds/all perennials scope
- [ ] Resolved targets stored
- [ ] Inventory deducted
- [ ] Quarantine generated
- [ ] Suggested task generated
- [ ] Transaction rollback works

## Problems
- [ ] Problem creation
- [ ] Observation creation
- [ ] Problem photo upload
- [ ] Observation photo rejected/disabled
- [ ] Problem status update

## Tasks/calendar
- [ ] Suggested task visible
- [ ] Suggested task confirmation
- [ ] Reminder rows created on confirmation
- [ ] Calendar shows activities/tasks/quarantine
- [ ] Suggested and planned tasks visually distinct

## AI
- [ ] AI product ingestion creates suggestions only
- [ ] Accepting AI suggestion creates real records
- [ ] Rejecting suggestion creates no business record
- [ ] Bed planning is guidance only

## Weather
- [ ] Weather can be enabled/disabled per place
- [ ] Forecast context available where enabled
- [ ] Rain confirmation works
- [ ] Rain does not auto-fail treatment

## Notifications
- [ ] Push subscription registration
- [ ] Reminder records exist
- [ ] Web Push/VAPID send operation is implemented behind PushPort
- [ ] App works when notifications are disabled

## Frontend
- [ ] Responsive app shell
- [ ] Navigation works
- [ ] Create activity page works on mobile
- [ ] Bulk target selector works
- [ ] Create problem with photo works
- [ ] API errors shown clearly
- [ ] AI suggestions shown as structured editable suggestions

## Security/integrity
- [ ] Account scoping enforced everywhere
- [ ] No frontend direct DB access
- [ ] No provider secrets exposed
- [ ] Critical writes transactional
- [ ] No hidden business side-effect triggers

---

# 16. Coding style requirements

## 16.1 TypeScript
Use strict TypeScript.

Avoid:
- `any`
- untyped API responses
- untyped error objects
- implicit `unknown` handling without narrowing

## 16.2 Naming
Use:

- DB: snake_case
- API DTOs: camelCase
- TypeScript types/classes: PascalCase
- variables/functions: camelCase

## 16.3 Validation
Use schema validation, preferably Zod.

Validate:
- params
- query
- body
- multipart metadata
- AI accepted payloads

## 16.4 Error handling
Use centralized application error classes.

Do not throw raw strings.

Map domain errors to standard API error codes.

## 16.5 Transactions
Use explicit transaction wrapper.

Do not manually pass random connection objects without clear transaction context.

## 16.6 Logging
Log:
- request failures
- external provider failures
- critical transaction failures
- notification send failures

Do not log secrets.

---

# 17. Forbidden implementation shortcuts

Do not:

1. Build only CRUD and skip transaction flows.
2. Store inventory as only one mutable quantity.
3. Generate planned tasks automatically from product rules.
4. Save AI data directly into products/rules without suggestion acceptance.
5. Mark treatment failed automatically because of rain forecast.
6. Implement all-beds/all-trees globally across all places.
7. Skip account scoping because app is single-user in v1.
8. Put product usage rules as free text only.
9. Put activity targets as comma-separated strings.
10. Use frontend-only validation as protection.
11. Hard-delete historical records by default.
12. Implement photo upload for observations in v1.
13. Create reminders for suggested tasks.
14. Let frontend calculate inventory allocation.
15. Let calendar become a source-of-truth table.
16. Ignore test requirements.

---

# 18. How to handle uncertainty

If something is not explicitly specified:

1. Check Domain Rules and Invariants first.
2. Check Canonical API Contract.
3. Check Backend Application Design Pack.
4. Check Frontend Technical Specification.
5. Choose the simplest implementation that preserves:
   - auditability
   - backend-owned business logic
   - explicit user confirmation
   - self-hosted Supabase Postgres with PostgreSQL domain model
   - Supabase Auth/Storage behind ports
6. Document the assumption in code comments or implementation notes.

Do not silently invent major product behavior.

---

# 19. Recommended implementation plan for AI

A good AI implementation agent should work in this sequence:

## Step 1
Create project structure and shared foundations:
- backend app
- frontend app
- shared DTO/enums
- error model
- validation setup
- DB connection
- migrations runner

## Step 2
Implement core CRUD:
- places
- plants
- beds
- perennials
- persistent plants
- yearly plantings

## Step 3
Implement products/inventory:
- products
- rules
- lots
- movements
- inventory overview

## Step 4
Implement critical activity flow:
- target resolver
- inventory allocator
- activity service transaction
- quarantine generation
- suggested task generation
- tests

## Step 5
Implement problems/photos and tasks/calendar:
- problems
- photo upload
- tasks
- confirm/dismiss/complete/skip
- reminders
- calendar

## Step 6
Implement frontend flows:
- app shell
- feature pages
- selectors
- create activity
- create problem
- product/inventory screens
- calendar/task screens

## Step 7
Implement selected provider adapters behind ports:
- Supabase Auth adapter
- Supabase Storage adapter
- Open-Meteo adapter
- raw Web Push/VAPID adapter
- AI mock or selected AI adapter, depending on task scope

## Step 8
Add deterministic test mocks behind the same ports where needed.

## Step 9
Run full test suite and fix gaps.

## Step 10
Produce implementation notes:
- what is complete
- which selected provider adapters are implemented
- which test/dev mocks are used behind ports
- what is not implemented
- how to run app/tests
- known limitations

---

# 20. Expected final output from implementation AI

The final implementation should include:

## Backend
- source code
- migrations
- repository implementations
- services
- controllers/routes
- validation schemas
- integration adapters and test/dev mocks behind ports
- tests
- README instructions

## Frontend
- Angular app
- Material theme/layout
- routes
- feature pages
- shared components
- API services
- forms
- PWA setup
- tests
- README instructions

## Documentation
- setup instructions
- environment variables
- migration instructions
- test instructions
- integration/provider status

---

# 21. Final instruction

Implement exactly the agreed Gardening Helper v1.

Do not redesign the product.

Do not simplify away the hard parts.

The minimum quality bar is:

- correct domain model
- correct transactions
- correct account scoping
- correct API contract
- usable Angular UI
- tested critical flows
- no hidden business side effects
- AI and weather remain assistive
- inventory and activity history remain auditable

If a shortcut violates these rules, do not take it.
