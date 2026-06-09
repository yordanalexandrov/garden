# Gardening Helper - Implementation Status Handoff

Last updated: 2026-06-09 (Phase 23 Backend AI Suggestion Workflows implemented)

This file tracks implementation progress only. It does not replace the source-of-truth specs, domain rules, canonical API contract, or task documents. If this file conflicts with a higher-priority document, follow the source-of-truth priority in `AGENTS.md`.

Implementation agents must update this file in the same branch/PR whenever phase status, task status, the latest implemented step, or the next recommended step changes.

## Current Position

- Last implemented phase: Phase 23 - Backend AI Suggestion Workflows.
- Last implemented step: Phase 23 Step 7 - Phase 23 Verification and PR Readiness.
- Last implemented step file: `docs/implementation-phases/phase-23/07-phase-23-verification-and-pr-readiness.md`.
- Last implementation commit observed: Phase 23 backend AI suggestion workflows on `worktree-backend-ai-suggestions`.
- Next implementation phase: Phase 24 - Frontend AI Assistant Pages.
- Next implementation step: Phase 24 Step 1 - AI API Services and Feature Scaffold.
- Next implementation step file: `docs/implementation-phases/phase-24/01-ai-api-services-and-feature-scaffold.md`.
- Phase 23 implemented: AiPort interface, TestAiAdapter, KyselyAiRepository, AiService (product ingestion / bed planning / problem assist generation + accept/reject workflows), 5 Fastify routes, DB migrations for ai_sessions/ai_suggestions, Zod validation schemas, canonical DTOs, and full test suite (26 unit + 23 DB integration tests).
- Phase 24 executable task docs are ready for Frontend AI Assistant Pages planning; Phase 24 is not implemented.
- Phase 25 executable task docs are ready for Backend Push Notifications and Worker Scheduler planning; Phase 25 is not implemented.
- Phase 20 completed frontend dashboard widgets, task list/detail/actions, calendar month/agenda views, typed API services, route wiring, and focused frontend/boundary tests.
- Phase 21 completed backend WeatherPort/adapters, account-scoped place forecast endpoint, rain confirmation endpoint and persistence, canonical DTOs, provider error mapping, and focused regression/static tests.
- Phase 22 completed frontend Weather UX using the Phase 21 backend weather endpoints.

Note: Phase 6 completed the backend growing-structure API for perennials, beds, persistent bed plants, and yearly bed plantings with account-scoped Fastify handlers, canonical envelopes, archive behavior, historical bed occupancy reads, and duplicate same bed/plant/year yearly planting support. Phase 7 completed the Angular frontend garden-structure pages for places, plants, perennials, beds, persistent bed plants, and yearly plantings. Phase 8 completed the backend products and product usage rules APIs with account-scoped Fastify handlers, canonical envelopes, product category/unit validation, product/rule archive behavior, duplicate active product+plant rule enforcement, product/plant/account consistency checks, placeholder-compatible inventory summary fields, and focused validation/service/repository/route/guard tests. Phase 9 completed the backend inventory ledger API with account-scoped inventory overview, product lot listing, transactional lot purchase movement creation, movement history, transactional manual adjustments, audit log writes for inventory mutations, FEFO allocation and shortage/unit policy helpers, validation/DTO mapping, route wiring, and focused unit/API/guard/scope tests. Phase 10 completed the Angular frontend products and inventory pages with typed products/rules/inventory API services, product CRUD/archive UI, product detail with rules/lots/movements, usage rule forms with plant selector, inventory overview/detail, add-lot and manual-adjustment forms, movement-history navigation, visible API errors, and frontend boundary/static tests. Phase 11 completed the backend target resolver with canonical target contracts, validation/DTO helpers, account/place-scoped repository lookups, whole-place/all-group/selected-scope resolution, empty-result and partial-success rejection, transaction-compatible invocation, and focused validation/resolver tests. Phase 12 completed the backend activities list/detail/create APIs with service-owned transaction orchestration, resolved activity targets, product usage validation, FEFO consumption movements, shortage handling, rule-derived quarantine periods, suggested follow-up tasks without reminders, canonical side-effect arrays, and focused route/transaction regression tests. Phase 13 completed the backend audit module foundation, representative critical-operation audit integration, and account-scoped activity inventory correction endpoint with append-only correction movements, lot updates, audit rows, supported-case documentation, and focused validation/route tests. Phase 14 completed the Angular frontend activities flow with typed activity API services, list/detail/create pages, bulk target selector and product usage subforms, create-activity review/submit flow with backend side-effect rendering, route/spec wiring, and frontend regression/static checks. AI, push, and MCP business tools remain deferred. Phase 15 completed the backend problems and observations metadata API with account-scoped list/create/detail/update routes, service-owned place/target/linked activity validation, target label read models, empty Phase 15 photo metadata behavior, and focused validation/DTO/route regression tests. Phase 16 completed backend-mediated problem photo storage with StoragePort, deterministic test storage, Supabase Storage REST adapter boundary, multipart validation, problem-only/account-scoped upload, metadata persistence, cleanup on metadata failure, controlled signed URL detail mapping, and storage/security boundary tests. Phase 17 completed the Angular frontend problems and photos flow with typed `ProblemsApiService` (list/detail/create/update plus multipart `file` photo upload), `/problems` list filters, `/problems/:problemId` detail rendering backend-provided photo URLs and linked activity, `/problems/new` Reactive Forms create page with a reusable single-target `ProblemTargetSelector`, a problem-only `ProblemPhotoUploader` (hidden/disabled for observations, client MIME/size validation as UX only, backend-API upload after problem creation), save-without-photo support, metadata-preserving upload error handling, lazy problems routes, removal of `problems` from the deferred-feature boundary guard, and focused API-service/page regression tests. Phase 18 completed the backend task lifecycle and reminders API with account-scoped canonical task endpoints, manual task creation and patch flows using TargetResolver, transactional suggested-task confirmation and manual planned reminder creation, planned-only reminder boundaries, dismiss/complete/skip transitions without activity auto-creation, audit rows for confirm/dismiss, and focused validation/scheduler/route regression tests. Phase 19 completed the backend calendar and dashboard read APIs with authenticated account-scoped `/api/v1/calendar` and `/api/v1/dashboard` routes, required calendar date-range validation, optional account-authorized place filtering, separate calendar sections for activities/tasks/quarantinePeriods/weatherEvents, dashboard buckets for upcomingTasks/suggestedTasks/activeQuarantinePeriods/recentActivities/openProblems/lowStockProducts/places, read-only Kysely repositories, canonical camelCase DTOs, and focused validation/route/read-only regression tests. Phase 20 completed the Angular frontend tasks, calendar, and dashboard surfaces with typed API services, dashboard widgets, task list/detail/actions, calendar month/agenda views, read-only quarantine/weather summaries, lazy route wiring, and focused frontend/boundary tests. Phase 21 completed backend weather forecast and rain confirmation with WeatherPort/Open-Meteo adapter boundary, deterministic test adapter, account-scoped forecast and confirmation APIs, advisory-only semantics, provider failure mapping, and focused regression/static tests. Phase 22 completed the Angular frontend weather UX with a typed WeatherApiService, `/places/:placeId/weather` forecast page, enabled/disabled/empty/error forecast states, reusable observed-rain confirmation prompt/actions, calendar weather status markers, and focused frontend/boundary/static tests. Phase 23 completed backend AI suggestion workflows with AiPort/ports-and-adapters boundary, deterministic TestAiAdapter, ai_sessions/ai_suggestions DB tables, KyselyAiRepository (account-scoped session+suggestion persistence), AiService (product-ingestion/bed-planning/problem-assist generation, transaction-wrapped accept with product/rule creation via ProductsService, reject), 5 Fastify routes under `/api/v1/ai`, canonical DTOs, Zod v4 validation schemas, provider error mapping to EXTERNAL_SERVICE_ERROR, audit log entries on accept/reject, and a full test suite (26 unit tests + 23 DB integration tests). Phase 24 through Phase 28 remain not implemented.

## Status Legend

- `[x]` Implemented and merged.
- `[ ]` Not implemented.
- `Task docs ready` means executable task files exist; it does not mean the implementation is complete.
- `Top-level spec only` means the phase has not yet been converted into executable task files.

## Phase Checklist

- [x] Phase 1 - Backend Project Foundation - implemented.
- [x] Phase 2 - Database Migration and Transaction Foundation - implemented.
- [x] Phase 3 - Auth and Account Boundary - implemented.
- [x] Phase 4 - Frontend Project Foundation - implemented.
- [x] Phase 5 - Backend Places and Plants API - implemented.
- [x] Phase 6 - Backend Growing Structure API - implemented.
- [x] Phase 7 - Frontend Garden Structure Pages - implemented.
- [x] Phase 8 - Backend Products and Usage Rules API - implemented.
- [x] Phase 9 - Backend Inventory Ledger API - implemented.
- [x] Phase 10 - Frontend Products and Inventory Pages - implemented.
- [x] Phase 11 - Backend Target Resolver - implemented.
- [x] Phase 12 - Backend Activity Transaction Flow - implemented.
- [x] Phase 13 - Backend Activity Correction and Audit Trail - implemented.
- [x] Phase 14 - Frontend Activities and Create Activity Flow - implemented.
- [x] Phase 15 - Backend Problems and Observations API - implemented.
- [x] Phase 16 - Backend Problem Photo Storage - implemented.
- [x] Phase 17 - Frontend Problems and Photos Flow - implemented.
- [x] Phase 18 - Backend Task Lifecycle and Reminders - implemented.
- [x] Phase 19 - Backend Calendar and Dashboard Read APIs - implemented.
- [x] Phase 20 - Frontend Tasks, Calendar, and Dashboard - implemented.
- [x] Phase 21 - Backend Weather and Rain Confirmation - implemented.
- [x] Phase 22 - Frontend Weather UX - implemented.
- [x] Phase 23 - Backend AI Suggestion Workflows - implemented.
- [ ] Phase 24 - Frontend AI Assistant Pages - not implemented; task docs ready.
- [ ] Phase 25 - Backend Push Notifications and Worker Scheduler - not implemented; task docs ready.
- [ ] Phase 26 - Frontend Notifications and PWA Registration - not implemented; top-level spec only.
- [ ] Phase 27 - Deployment and Operations Readiness - not implemented; top-level spec only.
- [ ] Phase 28 - Final Hardening and Acceptance - not implemented; top-level spec only.

## Phase Step Status

### Phase 1 - Backend Project Foundation

- [x] Step 1 - Backend Package and Tooling.
- [x] Step 2 - Fastify App Bootstrap.
- [x] Step 3 - API Envelopes and Error Model.
- [x] Step 4 - Validation Foundation.
- [x] Step 5 - Config and Logger.
- [x] Step 6 - Health Route.
- [x] Step 7 - Foundation Tests and PR Readiness.

### Phase 2 - Database Migration and Transaction Foundation

- [x] Step 1 - Database Dependencies and Config.
- [x] Step 2 - Baseline Migration Runner.
- [x] Step 3 - DB Client Lifecycle and Types.
- [x] Step 4 - Transaction Abstraction.
- [x] Step 5 - Test Database Reset and Fixtures.
- [x] Step 6 - Migration Integrity and Guard Tests.
- [x] Step 7 - Phase 02 Verification and PR Readiness.

### Phase 3 - Auth and Account Boundary

- [x] Step 1 - Auth Types and Port Contract.
- [x] Step 2 - Supabase Auth Adapter Boundary.
- [x] Step 3 - Accounts Repository and Account Lookup.
- [x] Step 4 - Fastify Auth Plugin and Protected Route Context.
- [x] Step 5 - Authenticated Route Test Helpers and Fixtures.
- [x] Step 6 - Auth Account Boundary Tests and Static Checks.
- [x] Step 7 - Phase 03 Verification and PR Readiness.

### Phase 4 - Frontend Project Foundation

- [x] Step 1 - Frontend Workspace and Tooling.
- [x] Step 2 - Angular Material and PWA Baseline.
- [x] Step 3 - App Shell Layout and Navigation.
- [x] Step 4 - Route Placeholders and Initialization.
- [x] Step 5 - Supabase Auth Session Foundation.
- [x] Step 6 - Typed API Client, Interceptors, and Errors.
- [x] Step 7 - Phase 04 Verification and PR Readiness.

### Phase 5 - Backend Places and Plants API

- [x] Step 1 - Module Contracts and Dependency Wiring.
- [x] Step 2 - Places Repository and Service.
- [x] Step 3 - Places Routes and API Contract.
- [x] Step 4 - Plants Repository and Service.
- [x] Step 5 - Plants Routes and API Contract.
- [x] Step 6 - Phase 05 Account Scope and Regression Tests.
- [x] Step 7 - Phase 05 Verification and PR Readiness.

### Phase 6 - Backend Growing Structure API

- [x] Step 1 - Growing Structure Module Contracts and Validation.
- [x] Step 2 - Perennials Repository and Service.
- [x] Step 3 - Perennials Routes and API Contract.
- [x] Step 4 - Beds Repository Service and Current Contents.
- [x] Step 5 - Beds Routes and API Contract.
- [x] Step 6 - Persistent Bed Plants Repository and Service.
- [x] Step 7 - Persistent Bed Plants Routes and API Contract.
- [x] Step 8 - Yearly Bed Plantings Repository and Service.
- [x] Step 9 - Yearly Bed Plantings Routes and API Contract.
- [x] Step 10 - Phase 06 Account Consistency and Regression Tests.
- [x] Step 11 - Phase 06 Verification and PR Readiness.

### Phase 7 - Frontend Garden Structure Pages

- [x] Step 1 - Garden Structure API Services and Feature Scaffold.
- [x] Step 2 - Shared Garden UI Components and Form Patterns.
- [x] Step 3 - Places List/Create/Edit/Archive Pages.
- [x] Step 4 - Place Detail Shell and Overview.
- [x] Step 5 - Plants List/Create/Edit/Archive Pages.
- [x] Step 6 - Perennials Place Pages.
- [x] Step 7 - Beds List Detail and Year Selector.
- [x] Step 8 - Persistent and Yearly Bed Planting Flows.
- [x] Step 9 - Phase 07 Frontend Regression and Boundary Tests.
- [x] Step 10 - Phase 07 Verification and PR Readiness.

### Phase 8 - Backend Products and Usage Rules API

- [x] Step 1 - Products/Rules Module Contracts, Validation, and Route Wiring.
- [x] Step 2 - Products Repository and Service.
- [x] Step 3 - Products Routes and API Contract.
- [x] Step 4 - Product Usage Rules Repository and Service.
- [x] Step 5 - Product Usage Rules Routes and API Contract.
- [x] Step 6 - Product/Rule Account Consistency and Regression Tests.
- [x] Step 7 - Phase 08 Verification and PR Readiness.

### Phase 9 - Backend Inventory Ledger API

- [x] Step 1 - Inventory Module Contracts, Validation, and Route Wiring.
- [x] Step 2 - FEFO Allocator and Shortage Policy Helper.
- [x] Step 3 - Inventory Repository and Overview Reads.
- [x] Step 4 - Inventory Lot Creation Purchase Movement Transaction.
- [x] Step 5 - Movement History and Manual Adjustment Routes.
- [x] Step 6 - Inventory Ledger Account Scope, Rollback, and Guards.
- [x] Step 7 - Phase 09 Verification and PR Readiness.

### Phase 10 - Frontend Products and Inventory Pages

- [x] Step 1 - Product Inventory API Services and Feature Scaffold.
- [x] Step 2 - Product List, Filters, Create/Edit, and Archive Forms.
- [x] Step 3 - Product Detail Shell with Rules, Inventory, Lots, and Movements.
- [x] Step 4 - Usage Rule Create/Edit/Archive Flows with Plant Selector.
- [x] Step 5 - Inventory Overview and Product Inventory Detail Pages.
- [x] Step 6 - Add Lot and Manual Adjustment Forms with Movement-History Refresh.
- [x] Step 7 - Frontend Regression, Boundary, and Error-Display Tests.
- [x] Step 8 - Phase 10 Verification and PR Readiness.

### Phase 11 - Backend Target Resolver

- [x] Step 1 - Target Module Contracts, Validation, and Wiring.
- [x] Step 2 - Target Repository Lookup Helpers.
- [x] Step 3 - Place and Whole-Group Scope Resolution.
- [x] Step 4 - Selected Target Scope Resolution.
- [x] Step 5 - Target Resolver Account, Place, and Archived Regression Tests.
- [x] Step 6 - Phase 11 Verification and PR Readiness.

### Phase 12 - Backend Activity Transaction Flow

Implemented.

- [x] Step 1 - Activities Module Contracts, Validation, and Route Wiring.
- [x] Step 2 - Activities Repository, List, and Detail Reads.
- [x] Step 3 - Create Activity Transaction Header, Targets, and Product Usages.
- [x] Step 4 - Inventory Allocation, Movements, and Shortage Policy.
- [x] Step 5 - Quarantine and Suggested Task Side Effects.
- [x] Step 6 - Activity Transaction Account Scope, Rollback, and Response Tests.
- [x] Step 7 - Phase 12 Verification and PR Readiness.

### Phase 13 - Backend Activity Correction and Audit Trail

Implemented.

- [x] Step 1 - Audit Module Contracts, Repository, and Helper.
- [x] Step 2 - Critical Operation Audit Integration.
- [x] Step 3 - Activity Correction Contract, Validation, and Route.
- [x] Step 4 - Activity Correction Transaction and Compensating Effects.
- [x] Step 5 - Correction/Audit Account Scope, Rollback, and Guards.
- [x] Step 6 - Phase 13 Verification and PR Readiness.

### Phase 14 - Frontend Activities and Create Activity Flow

Implemented.

- [x] Step 1 - Activities API Services and Feature Scaffold.
- [x] Step 2 - Activities List and Detail Pages.
- [x] Step 3 - Bulk Target Selector.
- [x] Step 4 - Product Usage Form Array.
- [x] Step 5 - Create Activity Form and Review Flow.
- [x] Step 6 - Create Activity Submit, Errors, and Side-Effect Summary.
- [x] Step 7 - Frontend Regression, Boundary, and Error-Display Tests.
- [x] Step 8 - Phase 14 Verification and PR Readiness.

### Phase 15 - Backend Problems and Observations API

Implemented.

- [x] Step 1 - Problems Module Contracts, Validation, and Route Wiring.
- [x] Step 2 - Problems Repository and Read Models.
- [x] Step 3 - Problems Service Create/Update and Linked Activity Validation.
- [x] Step 4 - Problems Routes and API Contract.
- [x] Step 5 - Problems Account, Place, Target, and Response Regression Tests.
- [x] Step 6 - Phase 15 Verification and PR Readiness.

### Phase 16 - Backend Problem Photo Storage

Implemented.

- [x] Step 1 - Storage Port, Config, and Adapters.
- [x] Step 2 - Multipart Photo Route and File Validation.
- [x] Step 3 - Problem Photo Upload, Metadata Transaction, and Cleanup.
- [x] Step 4 - Problem Detail Photo URL Mapping.
- [x] Step 5 - Problem Photo Regression, Security, and Boundary Tests.
- [x] Step 6 - Phase 16 Verification and PR Readiness.

### Phase 17 - Frontend Problems and Photos Flow

Implemented.

- [x] Step 1 - Problems API Services and Feature Scaffold.
- [x] Step 2 - Problems List and Detail Pages.
- [x] Step 3 - Create Problem/Observation Form and Target Selection.
- [x] Step 4 - Problem Photo Uploader.
- [x] Step 5 - Problem Submit, Upload Errors, and Detail Photo Display.
- [x] Step 6 - Frontend Regression, Boundary, and Error Tests.
- [x] Step 7 - Phase 17 Verification and PR Readiness.

### Phase 18 - Backend Task Lifecycle and Reminders

Implemented.

- [x] Step 1 - Tasks Module Contracts, Validation, and Route Wiring.
- [x] Step 2 - Tasks Repository Read and Write Models.
- [x] Step 3 - Reminder Scheduler and Service Transaction Workflows.
- [x] Step 4 - Tasks Routes and API Contract.
- [x] Step 5 - Task Status Transition and Reminder Regression Tests.
- [x] Step 6 - Phase 18 Verification and PR Readiness.

### Phase 19 - Backend Calendar and Dashboard Read APIs

Implemented.

- [x] Step 1 - Calendar/Dashboard Module Contracts, Validation, and Route Wiring.
- [x] Step 2 - Calendar Read Repository and Service.
- [x] Step 3 - Dashboard Read Repository and Service.
- [x] Step 4 - Calendar/Dashboard Routes and API Contract.
- [x] Step 5 - Calendar/Dashboard Account Scope, Read-Only, and Response Tests.
- [x] Step 6 - Phase 19 Verification and PR Readiness.

### Phase 20 - Frontend Tasks, Calendar, and Dashboard

Implemented.

- [x] Step 1 - Tasks, Calendar, and Dashboard API Services and Feature Scaffold.
- [x] Step 2 - Dashboard Summary Widgets.
- [x] Step 3 - Tasks List and Detail Pages.
- [x] Step 4 - Task Actions, Errors, and Refresh.
- [x] Step 5 - Calendar Month, Agenda, and Legend.
- [x] Step 6 - Calendar Filters, Item Links, and Read-Only Overlays.
- [x] Step 7 - Phase 20 Frontend Regression, Boundary, and Error Tests.
- [x] Step 8 - Phase 20 Verification and PR Readiness.


### Phase 21 - Backend Weather and Rain Confirmation

Implemented in `feature/backend-weather-rain`.

- [x] Step 1 - Weather Module Contracts, Validation, and Route Wiring.
- [x] Step 2 - Weather Port, Config, and Adapters.
- [x] Step 3 - Weather Repository and Forecast Service.
- [x] Step 4 - Rain Confirmation Service and Route.
- [x] Step 5 - Weather Account, Provider, and Side-Effect Regression Tests.
- [x] Step 6 - Phase 21 Verification and PR Readiness.

### Phase 22 - Frontend Weather UX

Implemented in `feature/frontend-weather`.

- [x] Step 1 - Weather API Services and Feature Scaffold.
- [x] Step 2 - Place Weather Page and Forecast States.
- [x] Step 3 - Rain Confirmation Prompt and Actions.
- [x] Step 4 - Calendar Weather Markers.
- [x] Step 5 - Frontend Regression, Boundary, and Error Tests.
- [x] Step 6 - Phase 22 Verification and PR Readiness.

### Phase 23 - Backend AI Suggestion Workflows

Implemented in `worktree-backend-ai-suggestions`.

- [x] Step 1 - AI Module Contracts, Validation, and Route Wiring.
- [x] Step 2 - AI Port, Config, and Deterministic Adapter.
- [x] Step 3 - AI Session/Suggestion Repository and Persistence.
- [x] Step 4 - AI Suggestion Generation Services and Routes.
- [x] Step 5 - AI Suggestion Accept/Reject Workflows.
- [x] Step 6 - AI Account, Audit, Rollback, and Contract Tests.
- [x] Step 7 - Phase 23 Verification and PR Readiness.


### Phase 24 - Frontend AI Assistant Pages

Not implemented; task docs ready in `docs/implementation-phases/phase-24/`.

- [ ] Step 1 - AI API Services and Feature Scaffold.
- [ ] Step 2 - Shared AI Suggestion Card and Review State.
- [ ] Step 3 - Product Ingestion Page.
- [ ] Step 4 - Bed Planning Page.
- [ ] Step 5 - Problem Assist Page.
- [ ] Step 6 - Phase 24 Frontend Regression, Boundary, and Error Tests.
- [ ] Step 7 - Phase 24 Verification and PR Readiness.


### Phase 25 - Backend Push Notifications and Worker Scheduler

Not implemented; task docs ready in `docs/implementation-phases/phase-25/`.

- [ ] Step 1 - Notifications Module Contracts, Validation, and Route Wiring.
- [ ] Step 2 - Push Subscriptions Repository and Service.
- [ ] Step 3 - Push Port, Config, and Adapters.
- [ ] Step 4 - Reminder Delivery Worker and Status Workflows.
- [ ] Step 5 - Push Worker Regression, Security, and Boundary Tests.
- [ ] Step 6 - Worker Ownership Docs and Operational Hooks.
- [ ] Step 7 - Phase 25 Verification and PR Readiness.


## Next Phase Step Checklist

### Phase 23 - Backend AI Suggestion Workflows

Not implemented; task docs ready.

- [ ] Step 1 - AI Module Contracts, Validation, and Route Wiring (`docs/implementation-phases/phase-23/01-ai-module-contracts-validation-and-route-wiring.md`).
- [ ] Step 2 - AI Port, Config, and Deterministic Adapter (`docs/implementation-phases/phase-23/02-ai-port-config-and-deterministic-adapter.md`).
- [ ] Step 3 - AI Session/Suggestion Repository and Persistence (`docs/implementation-phases/phase-23/03-ai-session-suggestion-repository-and-persistence.md`).
- [ ] Step 4 - AI Suggestion Generation Services and Routes (`docs/implementation-phases/phase-23/04-ai-suggestion-generation-services-and-routes.md`).
- [ ] Step 5 - AI Suggestion Accept/Reject Workflows (`docs/implementation-phases/phase-23/05-ai-suggestion-accept-reject-workflows.md`).
- [ ] Step 6 - AI Account, Audit, Rollback, and Contract Tests (`docs/implementation-phases/phase-23/06-ai-account-audit-rollback-and-contract-tests.md`).
- [ ] Step 7 - Phase 23 Verification and PR Readiness (`docs/implementation-phases/phase-23/07-phase-23-verification-and-pr-readiness.md`).

## Update Rules

When implementation work changes progress, update:

- `Last updated`.
- `Current Position`.
- `Phase Checklist`.
- `Phase Step Status` when a phase/step is completed.
- `Next Phase Step Checklist` when the next phase changes.

When only task documents are created for a future phase, do not mark that phase implemented. Record it as `task docs ready`.
