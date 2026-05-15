# Gardening Helper Implementation Phase Specs

These files expand `IMPLEMENTATION_PHASES.md` into one detailed specification per implementation phase. They are meant to make each phase implementation-ready by capturing purpose, scope, source documents, domain/API/database impacts, design notes, tests, review focus, risks, and exit criteria.

The top-level `phase-XX-...md` files are detailed phase specs, not executable implementation steps. When a phase has already been converted into implementation tasks, those executable task files live in a phase-specific subfolder such as `phase-01/`. Use the top-level phase specs as inputs when creating future Implementation Agent tasks from `docs/TASK_TEMPLATE.md` and Review Agent tasks from `docs/REVIEW_TASK_TEMPLATE.md`.

## Phase Files

1. [Phase 1 - Backend Project Foundation](phase-01-backend-project-foundation.md)
2. [Phase 2 - Database Migration and Transaction Foundation](phase-02-database-migration-and-transaction-foundation.md)
3. [Phase 3 - Auth and Account Boundary](phase-03-auth-and-account-boundary.md)
4. [Phase 4 - Frontend Project Foundation](phase-04-frontend-project-foundation.md)
5. [Phase 5 - Backend Places and Plants API](phase-05-backend-places-and-plants-api.md)
6. [Phase 6 - Backend Growing Structure API](phase-06-backend-growing-structure-api.md)
7. [Phase 7 - Frontend Garden Structure Pages](phase-07-frontend-garden-structure-pages.md)
8. [Phase 8 - Backend Products and Usage Rules API](phase-08-backend-products-and-usage-rules-api.md)
9. [Phase 9 - Backend Inventory Ledger API](phase-09-backend-inventory-ledger-api.md)
10. [Phase 10 - Frontend Products and Inventory Pages](phase-10-frontend-products-and-inventory-pages.md)
11. [Phase 11 - Backend Target Resolver](phase-11-backend-target-resolver.md)
12. [Phase 12 - Backend Activity Transaction Flow](phase-12-backend-activity-transaction-flow.md)
13. [Phase 13 - Backend Activity Correction and Audit Trail](phase-13-backend-activity-correction-and-audit-trail.md)
14. [Phase 14 - Frontend Activities and Create Activity Flow](phase-14-frontend-activities-and-create-activity-flow.md)
15. [Phase 15 - Backend Problems and Observations API](phase-15-backend-problems-and-observations-api.md)
16. [Phase 16 - Backend Problem Photo Storage](phase-16-backend-problem-photo-storage.md)
17. [Phase 17 - Frontend Problems and Photos Flow](phase-17-frontend-problems-and-photos-flow.md)
18. [Phase 18 - Backend Task Lifecycle and Reminders](phase-18-backend-task-lifecycle-and-reminders.md)
19. [Phase 19 - Backend Calendar and Dashboard Read APIs](phase-19-backend-calendar-and-dashboard-read-apis.md)
20. [Phase 20 - Frontend Tasks, Calendar, and Dashboard](phase-20-frontend-tasks-calendar-and-dashboard.md)
21. [Phase 21 - Backend Weather and Rain Confirmation](phase-21-backend-weather-and-rain-confirmation.md)
22. [Phase 22 - Frontend Weather UX](phase-22-frontend-weather-ux.md)
23. [Phase 23 - Backend AI Suggestion Workflows](phase-23-backend-ai-suggestion-workflows.md)
24. [Phase 24 - Frontend AI Assistant Pages](phase-24-frontend-ai-assistant-pages.md)
25. [Phase 25 - Backend Push Notifications and Worker Scheduler](phase-25-backend-push-notifications-and-worker-scheduler.md)
26. [Phase 26 - Frontend Notifications and PWA Registration](phase-26-frontend-notifications-and-pwa-registration.md)
27. [Phase 27 - Deployment and Operations Readiness](phase-27-deployment-and-operations-readiness.md)
28. [Phase 28 - Final Hardening and Acceptance](phase-28-final-hardening-and-acceptance.md)

## Dependency Table

| Phase | Name | Depends on |
|---:|---|---|
| 1 | Backend Project Foundation | none |
| 2 | Database Migration and Transaction Foundation | 1 |
| 3 | Auth and Account Boundary | 1, 2 |
| 4 | Frontend Project Foundation | 1 |
| 5 | Backend Places and Plants API | 1, 2, 3 |
| 6 | Backend Growing Structure API | 5 |
| 7 | Frontend Garden Structure Pages | 4, 5, 6 |
| 8 | Backend Products and Usage Rules API | 5 |
| 9 | Backend Inventory Ledger API | 8 |
| 10 | Frontend Products and Inventory Pages | 4, 8, 9 |
| 11 | Backend Target Resolver | 6 |
| 12 | Backend Activity Transaction Flow | 8, 9, 11 |
| 13 | Backend Activity Correction and Audit Trail | 12 |
| 14 | Frontend Activities and Create Activity Flow | 4, 7, 10, 12 |
| 15 | Backend Problems and Observations API | 6, 11 |
| 16 | Backend Problem Photo Storage | 15 |
| 17 | Frontend Problems and Photos Flow | 4, 15, 16 |
| 18 | Backend Task Lifecycle and Reminders | 11, 12 |
| 19 | Backend Calendar and Dashboard Read APIs | 12, 15, 18 |
| 20 | Frontend Tasks, Calendar, and Dashboard | 4, 18, 19 |
| 21 | Backend Weather and Rain Confirmation | 5, 12, 18, 19 |
| 22 | Frontend Weather UX | 4, 21 |
| 23 | Backend AI Suggestion Workflows | 8, 15, 18 |
| 24 | Frontend AI Assistant Pages | 4, 23 |
| 25 | Backend Push Notifications and Worker Scheduler | 18 |
| 26 | Frontend Notifications and PWA Registration | 4, 25 |
| 27 | Deployment and Operations Readiness | application phases as available |
| 28 | Final Hardening and Acceptance | all included v1 phases |

## Critical Review Checkpoints

- Account scoping: every repository query and service write must derive account from authenticated actor, not request body.
- API contract: endpoints, enums, request/response shapes, envelopes, pagination, and status codes must match `docs/gardening-helper-canonical-api-contract-v1.md`.
- Layering: controllers validate/dispatch, services orchestrate, repositories access data, integrations stay behind ports.
- Target resolution: bulk scopes resolve to concrete target rows, empty results are rejected, all-beds/all-perennials are place-scoped.
- Inventory: no stock mutation without movement, no negative lots, purchase/adjustment/consumption flows are transactional.
- Activity transaction: activity, targets, product usages, movements, lot updates, quarantine, suggested tasks, and audit are atomic where in scope.
- Tasks: suggested tasks are not planned, suggested tasks have no reminders, confirmation creates reminders transactionally.
- Problems/photos: observations cannot receive photos, problem photo metadata is database truth, storage is backend-mediated.
- AI: suggestions do not become business data until accepted, and accepted payloads still pass backend validation.
- Weather: forecasts are advisory, observed rain is user-confirmed, rain does not auto-fail treatment or auto-create planned tasks.
- Frontend boundary: Angular never reads/writes app tables or storage buckets directly and never contains backend-owned business truth.
- Provider secrets: service role key, VAPID private key, AI keys, database credentials, and other backend-only secrets never reach frontend code/build/logs.
- Deployment: Supabase Studio is protected and PostgreSQL is private.
- Tests: critical flows require happy path, failure path, account scoping, transaction rollback, and API contract tests where relevant.

## Using These Files With Task Templates

To create an executable implementation task:

1. Pick exactly one phase file unless a later planning pass intentionally splits it further.
2. Copy the phase purpose, scope, out-of-scope, dependencies, domain rules, API/database impact, design notes, testing requirements, verification checklist, and branch name into `docs/TASK_TEMPLATE.md`.
3. Convert the phase scope into concrete implementation steps only in that later task prompt.
4. Include the phase file itself in the task-specific required documents.
5. Keep deferred items from the phase file in the task's out-of-scope section.
6. Require the Implementation Agent to run the phase-specific verification checklist before opening a PR.

To create a review task:

1. Use `docs/REVIEW_TASK_TEMPLATE.md`.
2. Include the phase file, PR description, diff/changed files, domain rules, API contract, and testing spec as required reading.
3. Copy the phase Review checklist and Risks and pitfalls into the task-specific review focus.
4. Require severity labels `[BLOCKING]`, `[SHOULD FIX]`, `[NIT]`, and `[QUESTION]`.

## Important Warning

The top-level phase files intentionally do not contain executable step-by-step implementation tasks. They define the detailed implementation-ready scope and guardrails for each phase. A separate follow-up planning task should convert one phase at a time into smaller executable work items in a phase-specific subfolder, as already done for Phase 1 in `phase-01/`.
