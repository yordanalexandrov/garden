# Gardening Helper - Implementation Status Handoff

Last updated: 2026-05-26

This file tracks implementation progress only. It does not replace the source-of-truth specs, domain rules, canonical API contract, or task documents. If this file conflicts with a higher-priority document, follow the source-of-truth priority in `AGENTS.md`.

Implementation agents must update this file in the same branch/PR whenever phase status, task status, the latest implemented step, or the next recommended step changes.

## Current Position

- Last implemented phase: Phase 12 - Backend Activity Transaction Flow.
- Last implemented step: Phase 12 Step 7 - Phase 12 Verification and PR Readiness.
- Last implemented step file: `docs/implementation-phases/phase-12/07-phase-12-verification-and-pr-readiness.md`.
- Last implementation commit observed: Phase 12 backend activity transaction implementation on `feature/backend-activity-transaction`.
- Next implementation phase: Phase 13 - Backend Activity Correction and Audit Trail.
- Next implementation step: Phase 13 Step 1 - Audit Module Contracts, Repository, and Helper.
- Next implementation step file: `docs/implementation-phases/phase-13/01-audit-module-contracts-repository-and-helper.md`.

Note: Phase 6 completed the backend growing-structure API for perennials, beds, persistent bed plants, and yearly bed plantings with account-scoped Fastify handlers, canonical envelopes, archive behavior, historical bed occupancy reads, and duplicate same bed/plant/year yearly planting support. Phase 7 completed the Angular frontend garden-structure pages for places, plants, perennials, beds, persistent bed plants, and yearly plantings. Phase 8 completed the backend products and product usage rules APIs with account-scoped Fastify handlers, canonical envelopes, product category/unit validation, product/rule archive behavior, duplicate active product+plant rule enforcement, product/plant/account consistency checks, placeholder-compatible inventory summary fields, and focused validation/service/repository/route/guard tests. Phase 9 completed the backend inventory ledger API with account-scoped inventory overview, product lot listing, transactional lot purchase movement creation, movement history, transactional manual adjustments, audit log writes for inventory mutations, FEFO allocation and shortage/unit policy helpers, validation/DTO mapping, route wiring, and focused unit/API/guard/scope tests. Phase 10 completed the Angular frontend products and inventory pages with typed products/rules/inventory API services, product CRUD/archive UI, product detail with rules/lots/movements, usage rule forms with plant selector, inventory overview/detail, add-lot and manual-adjustment forms, movement-history navigation, visible API errors, and frontend boundary/static tests. Phase 11 completed the backend target resolver with canonical target contracts, validation/DTO helpers, account/place-scoped repository lookups, whole-place/all-group/selected-scope resolution, empty-result and partial-success rejection, transaction-compatible invocation, and focused validation/resolver tests. Phase 12 completed the backend activities list/detail/create APIs with service-owned transaction orchestration, resolved activity targets, product usage validation, FEFO consumption movements, shortage handling, rule-derived quarantine periods, suggested follow-up tasks without reminders, canonical side-effect arrays, and focused route/transaction regression tests. Activity correction, problems/photos, manual task lifecycle/reminders, calendar behavior, weather, AI, push, storage, provider, and MCP business tools remain deferred. Phase 13 through Phase 28 remain not implemented.

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
- [ ] Phase 13 - Backend Activity Correction and Audit Trail - not implemented; task docs ready.
- [ ] Phase 14 - Frontend Activities and Create Activity Flow - not implemented; Task docs ready.
- [ ] Phase 15 - Backend Problems and Observations API - not implemented; Task docs ready.
- [ ] Phase 16 - Backend Problem Photo Storage - not implemented; task docs ready.
- [ ] Phase 17 - Frontend Problems and Photos Flow - not implemented; task docs ready.
- [ ] Phase 18 - Backend Task Lifecycle and Reminders - not implemented; top-level spec only.
- [ ] Phase 19 - Backend Calendar and Dashboard Read APIs - not implemented; top-level spec only.
- [ ] Phase 20 - Frontend Tasks, Calendar, and Dashboard - not implemented; top-level spec only.
- [ ] Phase 21 - Backend Weather and Rain Confirmation - not implemented; top-level spec only.
- [ ] Phase 22 - Frontend Weather UX - not implemented; top-level spec only.
- [ ] Phase 23 - Backend AI Suggestion Workflows - not implemented; top-level spec only.
- [ ] Phase 24 - Frontend AI Assistant Pages - not implemented; top-level spec only.
- [ ] Phase 25 - Backend Push Notifications and Worker Scheduler - not implemented; top-level spec only.
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

Task docs ready only; implementation is not started.

- [ ] Step 1 - Audit Module Contracts, Repository, and Helper.
- [ ] Step 2 - Critical Operation Audit Integration.
- [ ] Step 3 - Activity Correction Contract, Validation, and Route.
- [ ] Step 4 - Activity Correction Transaction and Compensating Effects.
- [ ] Step 5 - Correction/Audit Account Scope, Rollback, and Guards.
- [ ] Step 6 - Phase 13 Verification and PR Readiness.

### Phase 14 - Frontend Activities and Create Activity Flow

Task docs ready only; implementation is not started.

- [ ] Step 1 - Activities API Services and Feature Scaffold.
- [ ] Step 2 - Activities List and Detail Pages.
- [ ] Step 3 - Bulk Target Selector.
- [ ] Step 4 - Product Usage Form Array.
- [ ] Step 5 - Create Activity Form and Review Flow.
- [ ] Step 6 - Create Activity Submit, Errors, and Side-Effect Summary.
- [ ] Step 7 - Frontend Regression, Boundary, and Error-Display Tests.
- [ ] Step 8 - Phase 14 Verification and PR Readiness.

### Phase 15 - Backend Problems and Observations API

Task docs ready only; implementation is not started.

- [ ] Step 1 - Problems Module Contracts, Validation, and Route Wiring.
- [ ] Step 2 - Problems Repository and Read Models.
- [ ] Step 3 - Problems Service Create/Update and Linked Activity Validation.
- [ ] Step 4 - Problems Routes and API Contract.
- [ ] Step 5 - Problems Account, Place, Target, and Response Regression Tests.
- [ ] Step 6 - Phase 15 Verification and PR Readiness.

### Phase 16 - Backend Problem Photo Storage

Task docs ready only; implementation is not started.

- [ ] Step 1 - Storage Port, Config, and Adapters.
- [ ] Step 2 - Multipart Photo Route and File Validation.
- [ ] Step 3 - Problem Photo Upload, Metadata Transaction, and Cleanup.
- [ ] Step 4 - Problem Detail Photo URL Mapping.
- [ ] Step 5 - Problem Photo Regression, Security, and Boundary Tests.
- [ ] Step 6 - Phase 16 Verification and PR Readiness.

### Phase 17 - Frontend Problems and Photos Flow

Task docs ready only; implementation is not started.

- [ ] Step 1 - Problems API Services and Feature Scaffold.
- [ ] Step 2 - Problems List and Detail Pages.
- [ ] Step 3 - Create Problem/Observation Form and Target Selection.
- [ ] Step 4 - Problem Photo Uploader.
- [ ] Step 5 - Problem Submit, Upload Errors, and Detail Photo Display.
- [ ] Step 6 - Frontend Regression, Boundary, and Error Tests.
- [ ] Step 7 - Phase 17 Verification and PR Readiness.

## Next Phase Step Checklist

### Phase 13 - Backend Activity Correction and Audit Trail

- [ ] Step 1 - Audit Module Contracts, Repository, and Helper.
- [ ] Step 2 - Critical Operation Audit Integration.
- [ ] Step 3 - Activity Correction Contract, Validation, and Route.
- [ ] Step 4 - Activity Correction Transaction and Compensating Effects.
- [ ] Step 5 - Correction/Audit Account Scope, Rollback, and Guards.
- [ ] Step 6 - Phase 13 Verification and PR Readiness.

## Update Rules

When implementation work changes progress, update:

- `Last updated`.
- `Current Position`.
- `Phase Checklist`.
- `Phase Step Status` when a phase/step is completed.
- `Next Phase Step Checklist` when the next phase changes.

When only task documents are created for a future phase, do not mark that phase implemented. Record it as `task docs ready`.
