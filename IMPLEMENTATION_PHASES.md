# Gardening Helper Implementation Phases

This document defines a recommended implementation sequence for Gardening Helper v1. It is intentionally split into small, semantically isolated phases that can later be converted into `docs/TASK_TEMPLATE.md` implementation tasks and `docs/REVIEW_TASK_TEMPLATE.md` review tasks.

The repository currently contains documentation, SQL migrations, templates, and agent instructions, but no backend or frontend application source code. The first phases therefore establish the project foundations before any domain workflow implementation.

All phases must preserve these global constraints:

- Backend owns business logic.
- Controllers stay thin.
- Services own orchestration and transactions.
- Repositories only access data.
- Frontend never accesses application tables directly.
- All application data access goes through the Fastify API under `/api/v1`.
- All business records are account-scoped.
- Integrations go through ports/adapters.
- Supabase service role key is backend-only.
- Activity/task targets resolve to concrete target rows.
- Inventory is ledger-based.
- Suggested tasks are not planned tasks.
- AI and weather remain assistive until explicit user action.
- No hidden business side effects are implemented in database triggers.

## Source-of-Truth Documents Used

Primary source-of-truth order:

1. `docs/gardening-helper-domain-rules-and-invariants-v1.md`
2. `docs/gardening-helper-canonical-api-contract-v1.md`
3. `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
4. `docs/gardening-helper-backend-application-design-pack-v1.md`
5. `docs/gardening-helper-technical-requirements-and-erd.md`
6. SQL migrations:
   - `docs/001_initial_schema_gardening_helper.sql`
   - `docs/002_views_gardening_helper.sql`
   - `docs/003_seed_reference_data_gardening_helper.sql`
   - `docs/004_guards_and_triggers_gardening_helper.sql`
7. `docs/gardening-helper-frontend-technical-spec-v1.md`
8. `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
9. `docs/gardening_helper_functional_spec_v_1.md`
10. `docs/gardening-helper-product-scope.md`

Additional documents inspected:

- `docs/docs_INDEX.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-review-agent-instructions.md`
- `docs/gardening-helper-technical-spec-v1.md`
- `docs/gardening-helper-production-checklist.md`
- `docs/TASK_TEMPLATE.md`
- `docs/REVIEW_TASK_TEMPLATE.md`
- `docs/env.example`
- `.github/pull_request_template.md`
- `AGENTS.md`
- `CODEX.md`
- `CLAUDE.md`

## Full Ordered Phase List

### Phase 1 — Backend Project Foundation

#### Goal
Create the backend application skeleton and shared API conventions without implementing domain workflows.

#### Why this phase exists
Every later backend phase depends on a consistent Fastify, TypeScript, validation, error, and test structure. This phase is separate because it should not be mixed with domain CRUD or transactional behavior.

#### Depends on
- Existing documentation and SQL migration files.

#### Scope
- Scaffold backend package/project structure.
- Add strict TypeScript configuration.
- Add Fastify app bootstrap.
- Add route registration pattern under `/api/v1`.
- Add `GET /api/v1/health`.
- Add config loading and env validation.
- Add centralized API success/error envelope helpers.
- Add `AppError` and standard error code mapping.
- Add validation setup, preferably Zod.
- Add logger setup with secret redaction policy.
- Add baseline backend test framework and scripts.

#### Out of scope
- Domain CRUD endpoints.
- Database schema changes.
- Auth/JWT validation.
- Frontend work.
- AI, weather, push, storage adapters.

#### Documents to use
- `gardening-helper-implementation-instructions-for-ai-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`
- `env.example`

#### Domain rules affected
- Backend owns business logic.
- Controllers stay thin.
- API uses standard response envelopes.
- Provider secrets must not be logged.

#### Backend work
- Create backend directory/package.
- Implement Fastify app factory and server entrypoint.
- Implement error handler returning canonical envelopes.
- Implement health route without auth.
- Add scripts for lint, typecheck, test, and build if tooling exists.

#### Frontend work
- None.

#### Database / migration work
- None.

#### Integration work
- Define placeholder port directory only if needed for future phases.

#### Tests required
- Health endpoint happy path.
- Standard error envelope behavior.
- Validation error mapping.
- Typecheck/build smoke test.

#### Verification checks
- `npm run typecheck` for backend.
- `npm run lint` for backend if configured.
- `npm test` for backend.
- `npm run build` for backend.
- Manual check that `/api/v1/health` returns `{ "data": ... }`.

#### Review focus
- Fastify app is modular.
- Error envelopes match the Canonical API Contract.
- No domain logic is introduced.
- No secrets are hardcoded.

#### Suggested branch name
```text
feature/backend-foundation
```

### Phase 2 — Database Migration and Transaction Foundation

#### Goal
Make the provided SQL migration pack executable and introduce the backend database/transaction abstraction.

#### Why this phase exists
The SQL migrations are the database baseline. Domain services must depend on a transaction abstraction and repositories, not ad hoc queries.

#### Depends on
- Phase 1.

#### Scope
- Add database client setup for self-hosted Supabase Postgres.
- Add migration runner or documented migration command.
- Register the four provided migration files as the baseline.
- Add typed database access setup, preferably Kysely or equivalent.
- Add `DbClient` and `DbTransaction` abstractions.
- Add repository test helpers for real PostgreSQL-compatible integration tests.
- Add deterministic seed/test fixture loader strategy.
- Add a migration smoke test that applies all baseline migrations.

#### Out of scope
- Changing the schema unless a blocking mismatch is documented in a new migration.
- Domain repositories.
- Domain services.
- Frontend work.

#### Documents to use
- SQL migration pack.
- `gardening-helper-technical-requirements-and-erd.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`

#### Domain rules affected
- Database is persistence source of truth.
- Repository + transaction abstraction is mandatory.
- No hidden business side-effect triggers.
- DB constraints are structural safety nets.

#### Backend work
- Implement DB connection lifecycle.
- Implement transaction wrapper.
- Add migration execution command.
- Add health/diagnostic DB connectivity helper if useful.

#### Frontend work
- None.

#### Database / migration work
- Wire existing migrations:
  - initial schema
  - views
  - seed reference data
  - guards/triggers
- Do not edit historical migrations after implementation starts unless explicitly required and documented.

#### Integration work
- PostgreSQL connection only.

#### Tests required
- Migration pack applies cleanly to empty database.
- `updated_at` trigger smoke test.
- representative enum/check constraint rejection.
- guard trigger smoke tests for account mismatch.
- transaction rollback smoke test.

#### Verification checks
- Migration command runs against local/test database.
- Test DB can be created/reset deterministically.
- No public DB exposure is introduced by config or docs.

#### Review focus
- Baseline schema matches provided migrations.
- Transaction abstraction is explicit.
- Tests use real PostgreSQL where practical.
- No business workflow is hidden in triggers.

#### Suggested branch name
```text
feature/database-foundation
```

### Phase 3 — Auth and Account Boundary

#### Goal
Implement backend authentication context and account scoping foundation through `AuthPort`.

#### Why this phase exists
Every business endpoint must derive the actor/account server-side. This phase isolates auth/account mechanics before domain endpoints are built.

#### Depends on
- Phase 1.
- Phase 2.

#### Scope
- Define `AuthPort`.
- Implement Supabase Auth JWT validation adapter or a production-shaped adapter boundary.
- Implement deterministic test/dev auth adapter.
- Add Fastify auth hook/plugin for business routes.
- Add `AuthenticatedActor` type.
- Add `AccountsRepository`.
- Add account lookup/creation policy needed by auth flow, preserving existing `accounts` table.
- Add account-scoped test fixture pattern for account A/account B.

#### Out of scope
- Frontend login UI.
- Direct frontend access to application tables.
- Domain CRUD.
- Role/permission system beyond v1 account scoping.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `env.example`

#### Domain rules affected
- All records are account-scoped.
- Backend validates JWTs through `AuthPort`.
- Frontend must not submit trusted `accountId`.
- Supabase service role key is backend-only.

#### Backend work
- Add auth plugin to protected routes.
- Add actor/account context decoration.
- Add account repository methods.
- Add route test helpers for authenticated and unauthenticated requests.

#### Frontend work
- None.

#### Database / migration work
- None unless account-auth mapping has a documented schema gap requiring a new migration.

#### Integration work
- Supabase Auth behind `AuthPort`.
- Deterministic auth test adapter behind the same port.

#### Tests required
- Missing token returns `UNAUTHORIZED`.
- Invalid token returns `UNAUTHORIZED`.
- Valid token produces actor/account context.
- Account A cannot use account B context in repository helper tests.
- Service role key is not exposed to client-facing config.

#### Verification checks
- Protected route test proves auth hook is applied.
- `AuthPort` is the only Supabase Auth boundary in backend code.
- No frontend code/config exists that contains backend-only keys.

#### Review focus
- Backend derives account context server-side.
- No request body `accountId` is trusted for normal flows.
- Supabase-specific code is confined to auth adapter.

#### Suggested branch name
```text
feature/auth-account-boundary
```

### Phase 4 — Frontend Project Foundation

#### Goal
Create the Angular PWA shell and typed API client foundation without domain feature pages.

#### Why this phase exists
Frontend foundation is independent from backend domain implementation and should be reviewed separately for app structure and boundary rules.

#### Depends on
- Phase 1 for API conventions.

#### Scope
- Scaffold Angular app.
- Configure Angular Material.
- Add standalone component architecture.
- Add responsive app shell and routing.
- Add PWA support/service worker baseline.
- Add Supabase Auth session bootstrap for login/session only.
- Add typed API base client targeting `/api/v1`.
- Add auth token interceptor for Fastify API calls.
- Add global API error mapping and display.
- Add frontend test/build/lint scripts.

#### Out of scope
- Domain pages beyond placeholders.
- Direct database or Supabase table access.
- Business logic in components.
- Push registration flow.
- AI/weather/product/activity forms.

#### Documents to use
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `env.example`

#### Domain rules affected
- Frontend never accesses application tables directly.
- Frontend may use Supabase Auth only for login/session handling.
- Frontend uses typed API services.
- API errors must be displayed.

#### Backend work
- None, except minor CORS/config compatibility if needed.

#### Frontend work
- Angular app shell.
- Primary navigation placeholders.
- API client and error handling.
- Auth session bootstrap.
- PWA setup.

#### Database / migration work
- None.

#### Integration work
- Supabase Auth client for login/session only.

#### Tests required
- App shell renders.
- Primary routes load placeholder pages.
- API error interceptor maps backend error envelope.
- Auth interceptor attaches token when present.
- No direct Supabase table/storage calls exist in app code.

#### Verification checks
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` for frontend.
- Mobile and desktop layout smoke check.
- Static search for service role key or direct application-table access.

#### Review focus
- Frontend/backed responsibility boundary.
- Angular Material and Reactive Forms setup.
- No giant shell component.
- Auth usage stays limited to session handling.

#### Suggested branch name
```text
feature/frontend-foundation
```

### Phase 5 — Backend Places and Plants API

#### Goal
Implement the first account-scoped CRUD APIs for places and plant definitions.

#### Why this phase exists
Places and plants are foundational references used by every later garden, product-rule, target, weather, and activity workflow.

#### Depends on
- Phase 1.
- Phase 2.
- Phase 3.

#### Scope
- Implement `PlacesRepository` and `PlacesService`.
- Implement `PlantsRepository` and `PlantsService`.
- Implement controllers/routes for:
  - `GET /places`
  - `POST /places`
  - `GET /places/:placeId`
  - `PATCH /places/:placeId`
  - `POST /places/:placeId/archive`
  - `GET /plants`
  - `POST /plants`
  - `GET /plants/:plantId`
  - `PATCH /plants/:plantId`
  - `POST /plants/:plantId/archive`
- Include pagination/filter conventions where specified.
- Enforce weather-location validation on places.
- Archive instead of hard-delete.

#### Out of scope
- Perennials, beds, plantings.
- Weather forecast endpoint.
- Frontend pages.
- Activity/task/problem target resolution.

#### Documents to use
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- SQL migrations.

#### Domain rules affected
- All business records belong to account.
- Places are top-level garden locations.
- Plants are reusable user-maintained references.
- Archive over delete.
- Weather is optional per place.

#### Backend work
- Repositories, services, validation schemas, controllers.
- DTO mapping from snake_case DB to camelCase API.
- Account-scoped queries.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- Auth/account context only.

#### Tests required
- CRUD happy paths for places and plants.
- Validation failures for missing required fields and invalid enums.
- Weather-enabled place requires location label or coordinates.
- Account A cannot read/update/archive account B records.
- Archive hides records by default but respects `includeArchived`.
- API envelopes and pagination shape.

#### Verification checks
- Backend test suite passes.
- API contract examples can be exercised with route tests.
- No hard deletes for archived place/plant records.

#### Review focus
- Account scoping on every query.
- API contract paths and response shape.
- Controllers remain thin.
- No frontend or direct DB shortcut.

#### Suggested branch name
```text
feature/backend-places-plants
```

### Phase 6 — Backend Growing Structure API

#### Goal
Implement account-scoped CRUD for perennials, beds, persistent bed plants, and yearly bed plantings.

#### Why this phase exists
Growing structure must exist before target resolution and activity/problem/task workflows can target concrete rows.

#### Depends on
- Phase 5.

#### Scope
- Implement repositories, services, validation, and controllers for:
  - perennials
  - beds
  - persistent bed plants
  - yearly bed plantings
- Implement endpoints from the Canonical API Contract sections 10-13.
- Enforce place/plant/bed account consistency in services.
- Preserve historical bed occupancy.
- Allow duplicate yearly plantings for same bed/plant/year.
- Return bed current contents by year where specified.

#### Out of scope
- Activity or task target resolver.
- Problem creation.
- Frontend pages.
- AI bed planning.

#### Documents to use
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-technical-requirements-and-erd.md`
- SQL migrations and views.

#### Domain rules affected
- Perennials are individually tracked growing units.
- Beds are physical growing areas.
- Persistent plants stay until explicitly removed.
- Yearly plantings are calendar-year based.
- Historical occupancy remains readable.
- Cross-account references are forbidden.

#### Backend work
- Implement all four repositories/services/controllers.
- Add list/detail DTOs including plant names and bed contents.
- Use account-scoped parent lookups for nested endpoints.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- None beyond auth/account context.

#### Tests required
- Create/list/update/archive for each entity.
- Plant/place/bed cross-account reference rejection.
- Cross-place bed relationship rejection where applicable.
- Year validation and status enum validation.
- Archived records excluded from active lists.
- DB guard trigger smoke tests for consistency.

#### Verification checks
- Backend tests pass.
- Bed detail can return persistent and yearly contents for a selected year.
- Account B records are not leaked through nested place/bed routes.

#### Review focus
- Parent-child account consistency.
- No destructive deletes for historical growing records.
- DTOs do not expose inaccessible records.

#### Suggested branch name
```text
feature/backend-growing-structure
```

### Phase 7 — Frontend Garden Structure Pages

#### Goal
Implement frontend pages for places, plants, perennials, beds, persistent plants, and yearly plantings against the stable backend APIs.

#### Why this phase exists
This delivers the first useful UI while avoiding complex transactional workflows and keeping frontend logic limited to presentation and form submission.

#### Depends on
- Phase 4.
- Phase 5.
- Phase 6.

#### Scope
- Places list/detail shell with overview tab.
- Plants list/search/create/edit/archive.
- Perennials list/create/edit/archive within a place.
- Beds list/detail/create/edit/archive.
- Persistent bed plant add/edit/archive.
- Yearly planting list/add/edit/archive with year selector.
- Shared place, plant, year, status, and confirm-dialog components as needed.
- API services for these endpoints.

#### Out of scope
- Create activity flow.
- Products/inventory UI.
- Problem photo upload.
- AI, weather, push.

#### Documents to use
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`

#### Domain rules affected
- Frontend is not business truth.
- Frontend must not submit trusted `accountId`.
- Archive over delete.
- Plant database is reusable reference data.
- Persistent and yearly bed contents are distinct.

#### Backend work
- None except bug fixes in already implemented APIs.

#### Frontend work
- Feature routes/pages/components.
- Reactive Forms for all business forms.
- API error display.
- Responsive layouts.

#### Database / migration work
- None.

#### Integration work
- Auth token to Fastify API only.

#### Tests required
- Place create form validation, including weather location rule.
- Plant enum select validation.
- Bed positive dimension validation.
- Year selector changes planting view.
- Archive confirmation behavior.
- API error display.
- Mobile rendering smoke tests where practical.

#### Verification checks
- Frontend typecheck/lint/test/build.
- Manual smoke: create place, plant, bed, perennial, persistent plant, yearly planting.
- Static search confirms no direct Supabase table access.

#### Review focus
- Reactive Forms usage.
- Typed API services instead of raw component HTTP calls.
- No backend business rule duplication beyond basic UX validation.
- Mobile usability.

#### Suggested branch name
```text
feature/frontend-garden-structure
```

### Phase 8 — Backend Products and Usage Rules API

#### Goal
Implement product catalog and plant-specific product usage rule APIs.

#### Why this phase exists
Products and rules are required before inventory and before activities can consume products or generate quarantine/suggested tasks.

#### Depends on
- Phase 5.

#### Scope
- Implement `ProductsRepository` product methods.
- Implement usage rule repository methods.
- Implement product and usage rule services/controllers.
- Implement endpoints from Canonical API Contract sections 14 and 15.
- Enforce one active product+plant rule in v1.
- Enforce product/plant account consistency.
- Archive products/rules instead of hard-delete.
- Add product detail response with rules and inventory summary placeholder if inventory phase is not yet present.

#### Out of scope
- Inventory lots and movements.
- Activity product usage.
- AI product ingestion.
- Frontend product pages.

#### Documents to use
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- SQL migrations.

#### Domain rules affected
- Products are user-owned definitions.
- Product default unit is limited.
- Product category is controlled.
- One active product+plant rule in v1.
- Rule changes do not rewrite history.

#### Backend work
- Product CRUD repository/service/controller.
- Usage rule CRUD repository/service/controller.
- Validation schemas.
- Conflict handling for duplicate active rules.

#### Frontend work
- None.

#### Database / migration work
- None expected; use existing unique active rule index.

#### Integration work
- None.

#### Tests required
- Product CRUD happy/failure paths.
- Invalid category/unit rejected.
- Usage rule product/plant account mismatch rejected.
- Duplicate active product+plant rule returns conflict.
- Archived rule allows replacement.
- Account scoping across products/rules.
- API contract envelopes.

#### Verification checks
- Backend tests pass.
- Product detail returns contract-compatible shape even before inventory pages exist.
- No hard delete of products/rules.

#### Review focus
- Product/rule consistency.
- Duplicate active rule handling.
- Account-scoped repository filters.

#### Suggested branch name
```text
feature/backend-products-rules
```

### Phase 9 — Backend Inventory Ledger API

#### Goal
Implement inventory lots, movements, manual adjustments, overview, and allocation helper.

#### Why this phase exists
Inventory must be correct before activity product consumption. This phase isolates ledger semantics from activity creation.

#### Depends on
- Phase 8.

#### Scope
- Implement `InventoryRepository`.
- Implement `InventoryService`.
- Implement inventory overview endpoint.
- Implement lot creation endpoint with purchase movement in one transaction.
- Implement movement history endpoint.
- Implement manual adjustment endpoint with movement and lot update in one transaction.
- Implement FEFO inventory allocation helper for later activity use.
- Enforce no negative lot quantity.
- Enforce limited units and reject unsupported conversions.

#### Out of scope
- Activity product consumption.
- Frontend inventory pages.
- Push notifications.
- AI/weather.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`
- SQL migrations and `inventory_product_balances` view.

#### Domain rules affected
- Inventory movement ledger is mandatory.
- Lot quantity is convenience state.
- Purchase lot creates purchase movement.
- Manual changes create adjustment/correction movements.
- No negative lots in v1.
- FEFO allocation is default.

#### Backend work
- Inventory repository/service/controller.
- `POST /products/:productId/inventory-lots`.
- `GET /products/:productId/inventory-lots`.
- `GET /products/:productId/inventory-movements`.
- `GET /inventory`.
- `POST /inventory/adjustments`.
- Allocation helper with unit tests.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- None.

#### Tests required
- Lot creation creates lot and purchase movement transactionally.
- Manual increase/decrease creates movement and updates lot.
- Decrease cannot make lot negative.
- FEFO allocation earliest expiry first.
- Allocation across lots.
- Unsupported unit conversion rejected.
- Account-scoped product/lot access.
- Transaction rollback on movement failure.
- API response shapes.

#### Verification checks
- Movement history visible after lot creation and adjustment.
- No direct update of `quantity_remaining` without movement in service code.
- Inventory overview uses lots/view, not hidden mutable balance.

#### Review focus
- Ledger correctness.
- Transaction boundaries.
- Shortage and negative-stock behavior.
- Product/lot account consistency.

#### Suggested branch name
```text
feature/backend-inventory-ledger
```

### Phase 10 — Frontend Products and Inventory Pages

#### Goal
Implement frontend product catalog, product detail, usage rules, inventory overview, lots, movements, and manual adjustment flows.

#### Why this phase exists
Users need products/rules/lots before creating product-consuming activities. This frontend phase depends on backend products and inventory APIs but does not include create activity.

#### Depends on
- Phase 4.
- Phase 8.
- Phase 9.

#### Scope
- Products list/search/filter/create/edit/archive.
- Product detail with metadata, usage rules, inventory summary, lots, and movement history.
- Usage rule create/edit/archive.
- Inventory overview page.
- Add inventory lot form.
- Manual adjustment form.
- Product and plant selector components if not already present.

#### Out of scope
- Activity product consumption UI.
- AI product ingestion.
- Push/weather.

#### Documents to use
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`

#### Domain rules affected
- Frontend must not mutate stock without backend API.
- Frontend must show products as structured data.
- Frontend must not calculate ledger truth.
- Missing/duplicate rule states must be visible.

#### Backend work
- None except bug fixes.

#### Frontend work
- Product/inventory routes and API services.
- Reactive Forms for product, rule, lot, and adjustment forms.
- Display movement history and stock summary from backend responses.

#### Database / migration work
- None.

#### Integration work
- None.

#### Tests required
- Product form enum validation.
- Usage rule duplicate conflict error display.
- Add lot form validation.
- Manual adjustment form validation and error display.
- Inventory pages refetch after successful mutations.
- No frontend-only stock mutation.

#### Verification checks
- Frontend typecheck/lint/test/build.
- Manual smoke: create product, rule, lot, adjustment; see movement history.
- Static search confirms no inventory allocation logic in components.

#### Review focus
- Frontend delegates business decisions to backend.
- API services are typed.
- Movement history is visible.
- Reactive Forms and errors are implemented cleanly.

#### Suggested branch name
```text
feature/frontend-products-inventory
```

### Phase 11 — Backend Target Resolver

#### Goal
Implement reusable backend target resolution for activities and tasks.

#### Why this phase exists
Target resolution must exist before activity creation and task creation. It is a central domain rule and should be tested independently.

#### Depends on
- Phase 6.

#### Scope
- Implement `TargetResolver`.
- Support all canonical target scopes:
  - `whole_place`
  - `all_perennials_in_place`
  - `selected_perennials`
  - `all_beds_in_place`
  - `selected_beds`
  - `single_bed`
  - `selected_yearly_plantings`
  - `selected_persistent_bed_plants`
- Validate selected IDs exist, belong to account, and belong to place where applicable.
- Reject empty resolved target sets.
- Reject cross-place mixed targeting in v1.
- Return target labels as read models only.

#### Out of scope
- Creating activities or tasks.
- Frontend target selector.
- Persisting target rows outside tests.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`

#### Domain rules affected
- Bulk actions are first-class.
- Scope records user intent.
- Target rows store resolved truth.
- Resolved targets must not be empty.
- All-beds/all-perennials are scoped to one place.
- Cross-place mixed targeting is forbidden.
- Target ownership is validated backend-side.

#### Backend work
- Target resolver service/helper.
- Repository methods needed for multi-ID target lookup.
- Unit and integration tests.

#### Frontend work
- None.

#### Database / migration work
- None.

#### Integration work
- None.

#### Tests required
- Resolve whole place.
- Resolve all active perennials, excluding archived.
- Resolve selected perennials.
- Resolve all active beds.
- Resolve selected beds and single bed.
- Resolve selected yearly plantings through bed/place.
- Resolve selected persistent bed plants through bed/place.
- Reject missing IDs.
- Reject cross-account targets.
- Reject cross-place targets.
- Reject empty all-beds/all-perennials result.

#### Verification checks
- Resolver tests pass with account A/account B fixtures.
- Resolver returns concrete target refs, not strings/arrays as final truth.
- Resolver is not implemented in controllers.

#### Review focus
- Domain correctness of target resolution.
- Account and place scoping.
- Error behavior for empty/mismatched targets.

#### Suggested branch name
```text
feature/backend-target-resolver
```

### Phase 12 — Backend Activity Transaction Flow

#### Goal
Implement the critical `POST /activities` workflow with target persistence, product usage, inventory deduction, quarantine generation, and suggested task generation.

#### Why this phase exists
Activity creation is the central workflow and must be transaction-safe. It depends on products, inventory, and target resolution.

#### Depends on
- Phase 8.
- Phase 9.
- Phase 11.

#### Scope
- Implement `ActivitiesRepository`.
- Implement `ActivitiesService.createActivity`.
- Implement `GET /activities` and `GET /activities/:activityId`.
- Implement `POST /activities`.
- Persist activity header and resolved `activity_targets`.
- Persist `activity_product_usages`.
- Deduct inventory with FEFO allocation.
- Create `inventory_movements`.
- Update `inventory_lots.quantity_remaining`.
- Generate `quarantine_periods` when rule has quarantine days.
- Generate suggested `tasks` and `task_targets` when rule has reapplication interval.
- Return canonical side-effect summary arrays and warnings.
- Implement shortage policy:
  - reject by default.
  - allow only with explicit override.
  - create movements only for covered stock.
  - never create negative lots or fake stock.

#### Out of scope
- Manual task APIs and task confirmation.
- Calendar feed.
- Frontend create activity page.
- Activity correction endpoint.
- Weather rain checks.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`

#### Domain rules affected
- Activity creation is transactional.
- Target rows store resolved truth.
- Product rule must belong to product.
- Product use creates consumption movements.
- No lot goes negative.
- Quarantine generated from product/rule context.
- Suggested tasks are not planned.
- Suggested tasks must not have reminders.
- Missing product rule must be visible.

#### Backend work
- Activities repository/service/controller.
- Internal quarantine creation.
- Internal suggested task creation for activity side effects.
- Inventory allocation integration.
- Response DTOs for side effects and warnings.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- None.

#### Tests required
- Watering all beds creates activity and targets only.
- Treatment with product rule creates all side effects.
- Treatment without product rule succeeds with warning and no rule-derived quarantine/task.
- Shortage blocked rolls back all writes.
- Shortage allowed creates covered movements only and warning.
- Product rule for different product rejected with no side effects.
- Cross-account/cross-place targets rejected with no side effects.
- Failure during movement/quarantine/suggested-task creation rolls back all writes.
- API response includes required arrays even when empty.

#### Verification checks
- Transaction rollback tests inspect DB state.
- No reminders are created for suggested tasks.
- No stock updates occur without movements.
- `activities.place_id` is populated when resolvable.

#### Review focus
- Full transaction boundary.
- Inventory ledger correctness.
- Target persistence.
- Suggested task status/reminder boundary.
- API contract response shape.

#### Suggested branch name
```text
feature/backend-activity-transaction
```

### Phase 13 — Backend Activity Correction and Audit Trail

#### Goal
Implement audit logging foundation for critical operations and the explicit activity correction workflow.

#### Why this phase exists
Corrections and auditability are semantically separate from initial activity creation. They protect history after side effects have been generated.

#### Depends on
- Phase 12.

#### Scope
- Implement `AuditLogsRepository` and audit logging service.
- Add audit logs for already implemented critical operations:
  - product/rule archive or update
  - inventory adjustment
  - activity creation
  - place/archive operations where practical
- Implement `POST /activities/:activityId/correct` according to hybrid correction model.
- Ensure side-effecting activity corrections append reverse/adjust operations instead of silently rewriting history.
- Document what correction cases are supported in v1.

#### Out of scope
- UI for corrections.
- Full arbitrary history rewrite.
- Deleting historical activities.
- Weather/AI/push audit events not yet implemented.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-technical-requirements-and-erd.md`

#### Domain rules affected
- Activity correction should be explicit.
- Archive historical business records instead of hard-deleting.
- Inventory corrections append movement history.
- Audit logs are append-only.
- Audit logging does not replace domain records.

#### Backend work
- Audit repository/service.
- Correction endpoint/service.
- Tests for correction/audit behavior.
- PR notes documenting correction limitations.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- None.

#### Tests required
- Audit log created for inventory adjustment and activity creation.
- Side-effecting activity correction creates reverse/correction movements where supported.
- Correction does not delete original inventory movements.
- Correction is transactional.
- Unsupported correction shape returns business-rule error.
- Account scoping for correction endpoint.

#### Verification checks
- Audit rows are append-only in normal service flows.
- Activity correction does not silently mutate historical side effects.
- Original activity remains readable.

#### Review focus
- Hybrid correction model.
- No hidden history rewrite.
- Transaction safety.
- Audit logs do not become the only source of truth.

#### Suggested branch name
```text
feature/activity-correction-audit
```

### Phase 14 — Frontend Activities and Create Activity Flow

#### Goal
Implement the activity list/detail UI and the critical create activity page.

#### Why this phase exists
The create activity frontend must wait until backend activity behavior is stable. It should display user intent and backend-generated side effects without duplicating backend decisions.

#### Depends on
- Phase 4.
- Phase 7.
- Phase 10.
- Phase 12.

#### Scope
- Activities list page with filters.
- Activity detail page.
- Create activity page.
- `app-bulk-target-selector`.
- `app-product-usage-form-array`.
- Product/rule visibility and missing-rule warning.
- Target summary and selected count.
- Save disabled during submit.
- Display returned side effects:
  - inventory effects
  - quarantine periods
  - suggested tasks
  - warnings.

#### Out of scope
- Activity correction UI.
- Weather rain prompt.
- Task confirm UI.
- AI suggestions.

#### Documents to use
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`

#### Domain rules affected
- Frontend must show user intent clearly.
- Frontend must not calculate resolved targets as final truth.
- Frontend must not allocate inventory.
- Frontend must show missing rule state.
- Frontend must show side effects after save.

#### Backend work
- None except bug fixes.

#### Frontend work
- Activity routes/pages/services.
- Bulk target selector component.
- Product usage form component.
- Responsive create activity workflow.
- Error/warning display.

#### Database / migration work
- None.

#### Integration work
- None.

#### Tests required
- Create activity requires place/type/target scope.
- Bulk selector changes UI by scope.
- Selected beds/perennials multi-select emits canonical `targetSelection`.
- Missing product rule warning visible.
- Submit disabled while saving.
- Backend validation and inventory shortage errors displayed.
- Success side-effect summary shown.
- Mobile layout smoke test.

#### Verification checks
- Frontend tests/build pass.
- Manual smoke: create watering and treatment activity.
- Static search confirms no inventory allocation or target-resolution truth in components.

#### Review focus
- Business logic boundary.
- Component decomposition.
- Mobile usability.
- Side-effect display.
- API request shape exactly matches contract.

#### Suggested branch name
```text
feature/frontend-create-activity
```

### Phase 15 — Backend Problems and Observations API

#### Goal
Implement problem/observation metadata APIs without photo upload.

#### Why this phase exists
Problem metadata and target/place validation are separable from storage/file handling. This keeps review focused before adding uploads.

#### Depends on
- Phase 6.
- Phase 11.

#### Scope
- Implement `ProblemsRepository` metadata methods.
- Implement `ProblemsService` for create/list/detail/update.
- Implement endpoints:
  - `GET /problems`
  - `POST /problems`
  - `GET /problems/:problemId`
  - `PATCH /problems/:problemId`
- Validate target belongs to place/account.
- Support both `problem` and `observation`.
- Support optional linked activity with account/place validation.

#### Out of scope
- Photo upload and storage.
- Frontend problem UI.
- AI problem assist.

#### Documents to use
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`
- SQL guard migration.

#### Domain rules affected
- Problems and observations are historical records.
- Problems require place context.
- Target must belong to place.
- Linked treatment is optional.
- Account scoping is mandatory.

#### Backend work
- Repository/service/controller.
- Validation schemas.
- Detail/list DTOs with target labels if available.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- None.

#### Tests required
- Create problem without photo.
- Create observation without photo.
- Missing title/description rejected.
- Target from another place rejected.
- Target from another account rejected.
- Linked activity from another account/place rejected.
- Status update works.
- API response shapes and filters.

#### Verification checks
- Backend tests pass.
- No storage code introduced yet.
- Problem detail remains account scoped.

#### Review focus
- Place/target validation.
- Account scoping.
- Problem vs observation support.
- Thin controllers.

#### Suggested branch name
```text
feature/backend-problems
```

### Phase 16 — Backend Problem Photo Storage

#### Goal
Implement backend-mediated problem photo upload and metadata persistence through `StoragePort`.

#### Why this phase exists
Photos require provider boundaries and upload validation. They should be reviewed separately from problem metadata.

#### Depends on
- Phase 15.

#### Scope
- Define/implement `StoragePort`.
- Implement test/dev storage adapter behind the port.
- Implement Supabase Storage adapter behind the port if configuration is available.
- Implement `POST /problems/:problemId/photos`.
- Validate image MIME type and size.
- Reject photo upload for observations.
- Store metadata in `problem_photos`.
- Return signed URL or protected API URL in problem detail.
- Add orphan upload cleanup strategy note.

#### Out of scope
- Observation photos.
- Direct frontend Supabase Storage access.
- Advanced image resizing unless explicitly assigned.
- Frontend uploader.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`
- `env.example`

#### Domain rules affected
- Photos are supported only for problems in v1.
- Problem photo metadata is database truth.
- Supabase Storage is used through `StoragePort`.
- File access must be controlled.
- Frontend must not use service role key.

#### Backend work
- Storage port/adapters.
- Multipart route handling.
- Photo metadata transaction.
- Detail response photo URL mapping.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- Supabase Storage through `StoragePort`.
- Deterministic storage mock/test adapter.

#### Tests required
- Valid image upload to problem creates metadata.
- Non-image rejected.
- Oversized file rejected.
- Upload to observation rejected.
- Storage failure does not create metadata.
- Metadata failure cleanup strategy tested or documented.
- Account scoping for problem photo endpoint.

#### Verification checks
- No Supabase Storage service role key in frontend config.
- No direct bucket URL construction in domain services.
- Route tests cover multipart behavior.

#### Review focus
- Storage boundary.
- Observation photo rejection.
- File validation.
- Metadata transaction and cleanup behavior.

#### Suggested branch name
```text
feature/backend-problem-photos
```

### Phase 17 — Frontend Problems and Photos Flow

#### Goal
Implement frontend problems list/detail/create flow with problem-only photo upload behavior.

#### Why this phase exists
This is the second high-frequency field workflow after activity logging and depends on stable backend problem/photo APIs.

#### Depends on
- Phase 4.
- Phase 15.
- Phase 16.

#### Scope
- Problems list page with filters.
- Create problem/observation page.
- Problem detail page.
- `app-problem-photo-uploader`.
- Target selection for problem targets.
- Photo uploader visible only for `type = problem`.
- Save problem without photo.
- Upload photos after or during problem creation according to backend-supported flow.

#### Out of scope
- AI problem assist.
- Activity correction UI.
- Observation photos.

#### Documents to use
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`

#### Domain rules affected
- Frontend must not directly access Supabase Storage buckets.
- Photos only for problems.
- Problem can be saved without photo.
- Target summary must be visible.

#### Backend work
- None except bug fixes.

#### Frontend work
- Problems API service.
- Problems pages and uploader component.
- Reactive Forms and validation.
- Photo preview and client-side file validation.

#### Database / migration work
- None.

#### Integration work
- Backend photo APIs only.

#### Tests required
- Problem type shows uploader.
- Observation type hides/disables uploader.
- Problem saves without photo.
- Required field errors.
- Target summary display.
- Upload error display.
- No direct Supabase Storage access in frontend code.

#### Verification checks
- Frontend tests/build pass.
- Manual smoke: create problem, upload photo, create observation and verify no uploader.

#### Review focus
- Photo boundary.
- Reactive Forms.
- Mobile usability for camera/file input.
- Backend errors shown clearly.

#### Suggested branch name
```text
feature/frontend-problems-photos
```

### Phase 18 — Backend Task Lifecycle and Reminders

#### Goal
Implement task APIs, task confirmation, dismissal/completion/skip, manual task creation, and reminder row generation.

#### Why this phase exists
Tasks should come after activity can generate suggested tasks. This phase turns suggested rows into actionable planned tasks without mixing in calendar UI or push delivery.

#### Depends on
- Phase 11.
- Phase 12.

#### Scope
- Implement full `TasksRepository` and `TasksService`.
- Implement endpoints:
  - `GET /tasks`
  - `POST /tasks`
  - `GET /tasks/:taskId`
  - `PATCH /tasks/:taskId`
  - `POST /tasks/:taskId/confirm`
  - `POST /tasks/:taskId/dismiss`
  - `POST /tasks/:taskId/complete`
  - `POST /tasks/:taskId/skip`
- Confirm suggested task transactionally:
  - status -> planned
  - confirmed timestamp
  - day-before and same-day reminders.
- Manual planned task creation creates reminders transactionally.
- Suggested tasks never have reminders.
- Task completion does not auto-create activity.

#### Out of scope
- Push notification sending.
- Calendar feed.
- Frontend task pages.
- Weather checks.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`

#### Domain rules affected
- Suggested task is not planned.
- Planned tasks can have reminders.
- Confirming task is transactional.
- Task targets use resolved target rows.
- Completing task does not silently create activity.

#### Backend work
- Task repository/service/controller.
- Reminder scheduler helper for row creation.
- Target resolver integration for manual task create/update.
- Audit logs for confirm/dismiss where audit exists.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- None; push delivery comes later.

#### Tests required
- Confirm suggested task creates two reminders transactionally.
- Confirm already planned task rejected without duplicate reminders.
- Suggested task has no reminders.
- Manual planned task creates reminders.
- Manual suggested task creates no reminders.
- Dismiss sets canceled.
- Complete sets done and completed timestamp.
- Complete does not create activity.
- Cross-account task access rejected.
- Reminder creation failure rolls back confirm.

#### Verification checks
- Backend tests pass.
- No frontend timers or push delivery logic introduced.
- DB trigger for planned tasks/reminders aligns with service behavior.

#### Review focus
- Task status transitions.
- Reminder generation boundaries.
- Transaction rollback.
- Target resolver reuse.

#### Suggested branch name
```text
feature/backend-tasks-reminders
```

### Phase 19 — Backend Calendar and Dashboard Read APIs

#### Goal
Implement calendar aggregation and dashboard summary APIs as read models.

#### Why this phase exists
Calendar and dashboard are read aggregations over existing domain data. They should not become a source of truth.

#### Depends on
- Phase 12.
- Phase 15.
- Phase 18.

#### Scope
- Implement `CalendarService`.
- Implement `GET /calendar`.
- Implement `GET /dashboard`.
- Aggregate:
  - activities
  - tasks
  - suggested tasks
  - quarantine periods
  - weather events if present.
- Return separate calendar sections as specified.
- Add filtering by date range and optional place.

#### Out of scope
- Calendar item mutations.
- Frontend calendar/dashboard pages.
- Weather event generation.
- Push notifications.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- SQL views.

#### Domain rules affected
- Calendar is a read model.
- Calendar filters do not change business data.
- Quarantine periods are read-only overlays.
- Suggested and planned task statuses remain distinct.

#### Backend work
- Calendar repository/read queries.
- Dashboard read service.
- Controllers/routes and DTOs.
- Pagination/filtering where applicable.

#### Frontend work
- None.

#### Database / migration work
- None expected; may use `calendar_items_view` or backend queries.

#### Integration work
- None.

#### Tests required
- Calendar returns activities/tasks/quarantine separately.
- Suggested and planned tasks both included with statuses.
- Place/date filters are account-scoped.
- Dashboard returns expected summary buckets.
- Account A cannot see account B calendar/dashboard data.
- API response shape matches contract.

#### Verification checks
- Read APIs do not mutate data.
- Query performance is reasonable with seeded moderate data.
- Calendar does not expose raw internal DB table naming.

#### Review focus
- Read-model-only behavior.
- Account scoping.
- Contract-compatible response sections.

#### Suggested branch name
```text
feature/backend-calendar-dashboard
```

### Phase 20 — Frontend Tasks, Calendar, and Dashboard

#### Goal
Implement task pages, calendar feed UI, and dashboard widgets.

#### Why this phase exists
These UI flows depend on stable task, reminder, calendar, and dashboard APIs. They should distinguish suggested vs planned work clearly.

#### Depends on
- Phase 4.
- Phase 18.
- Phase 19.

#### Scope
- Dashboard page with summary widgets.
- Tasks list/detail pages.
- Suggested task confirm/dismiss actions.
- Planned task done/skip actions.
- Calendar page with month/agenda views.
- Calendar legend and distinct item rendering for:
  - activities
  - planned tasks
  - suggested tasks
  - quarantine periods
  - weather markers if present.

#### Out of scope
- Push notification registration.
- Weather forecast/rain confirmation UI unless backend weather exists.
- AI pages.

#### Documents to use
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`

#### Domain rules affected
- Suggested tasks must look distinct from planned tasks.
- Confirm action creates reminders through backend.
- Calendar is display/read model only.
- Quarantine is read-only overlay.

#### Backend work
- None except bug fixes.

#### Frontend work
- Dashboard, tasks, and calendar routes/components.
- API services.
- Status chips and calendar legend/components.
- Error handling and refresh after mutations.

#### Database / migration work
- None.

#### Integration work
- None.

#### Tests required
- Suggested task shows confirm/dismiss.
- Confirm updates UI to planned and shows reminders.
- Planned task shows done/skip.
- Done/canceled mostly read-only.
- Calendar renders item types distinctly.
- Place/date filters work.
- Dashboard widgets link to modules.
- API errors displayed.

#### Verification checks
- Frontend tests/build pass.
- Manual smoke: confirm suggested task from activity flow and see calendar/dashboard update.

#### Review focus
- Visual/task status distinction.
- No frontend-created reminders.
- Calendar does not mutate business data.
- Mobile agenda usability.

#### Suggested branch name
```text
feature/frontend-tasks-calendar
```

### Phase 21 — Backend Weather and Rain Confirmation

#### Goal
Implement weather forecast access and rain confirmation persistence through `WeatherPort`.

#### Why this phase exists
Weather is advisory and must come after core activity/task workflows. This phase isolates weather behavior from push and AI.

#### Depends on
- Phase 5.
- Phase 12.
- Phase 18.
- Phase 19.

#### Scope
- Define/implement `WeatherPort`.
- Implement Open-Meteo adapter behind the port.
- Implement deterministic test weather adapter.
- Implement `GET /places/:placeId/weather/forecast`.
- Implement `POST /weather/events/:weatherEventId/confirm-rain`.
- Add service logic for weather-disabled places.
- Persist rain confirmation correctly:
  - `confirmed_yes` -> `observedRain = true`
  - `confirmed_no` -> `observedRain = false`
  - `ignored` -> `observedRain = null`
- Add optional/on-demand rain-check event creation if scoped by task.

#### Out of scope
- Weather auto-failing treatment.
- Auto-created planned tasks from weather.
- Frontend weather UX.
- Scheduled weather checker worker if not explicitly included.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`
- `env.example`

#### Domain rules affected
- Weather is optional per place.
- Weather forecast is advisory.
- User confirms observed rain.
- Rain confirmation does not auto-fail treatment.
- Provider payload is not core domain truth.

#### Backend work
- Weather port/adapters.
- Weather repository/service/controller.
- Rain confirmation endpoint.
- Provider failure handling.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- Open-Meteo through `WeatherPort`.
- Test/dev mock through same port.

#### Tests required
- Forecast disabled place returns enabled false and empty forecast.
- Forecast enabled place uses WeatherPort.
- Provider failure maps to `EXTERNAL_SERVICE_ERROR`.
- Confirm yes/no/ignore maps observed rain correctly.
- Cross-account weather event confirmation rejected.
- Confirmed rain does not change activity/task status and does not create planned task.

#### Verification checks
- No weather logic in frontend.
- Open-Meteo calls are isolated to adapter.
- Secrets/config are server-side only.

#### Review focus
- Advisory-only weather semantics.
- Account scoping.
- Port/adaptor boundary.
- Rain confirmation side effects are limited.

#### Suggested branch name
```text
feature/backend-weather-rain
```

### Phase 22 — Frontend Weather UX

#### Goal
Implement weather forecast display and rain confirmation UI.

#### Why this phase exists
Weather UI should use backend-normalized data and must not imply automatic treatment failure.

#### Depends on
- Phase 4.
- Phase 21.

#### Scope
- Place weather tab/page.
- Forecast display for weather-enabled places.
- Weather-disabled state.
- Rain confirmation prompt in task/activity context where backend returns pending event.
- Yes/no/ignore actions calling backend confirmation endpoint.
- Calendar weather marker rendering if backend calendar includes weather events.

#### Out of scope
- Frontend weather provider calls.
- Treatment auto-failure wording.
- Push notifications.
- AI weather advice.

#### Documents to use
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`

#### Domain rules affected
- Weather prompts ask for confirmation.
- Weather is advisory.
- Rain confirmation does not auto-fail treatment.
- Weather appears only where enabled.

#### Backend work
- None except bug fixes.

#### Frontend work
- Weather API service.
- Weather pages/components.
- Rain prompt components.
- Calendar marker support if not already present.

#### Database / migration work
- None.

#### Integration work
- Backend weather API only.

#### Tests required
- Weather-disabled place shows disabled state.
- Forecast renders for enabled place.
- Rain prompt actions call correct endpoint.
- Prompt wording does not say treatment failed.
- Confirmation response updates UI.
- API errors displayed.

#### Verification checks
- Frontend tests/build pass.
- Static search confirms no direct Open-Meteo calls from frontend.

#### Review focus
- Advisory wording.
- No frontend weather decisions.
- Clear place weather state.

#### Suggested branch name
```text
feature/frontend-weather
```

### Phase 23 — Backend AI Suggestion Workflows

#### Goal
Implement AI session/suggestion workflows and acceptance boundary through `AiPort`.

#### Why this phase exists
AI must come after core domain APIs because acceptance creates real products/rules or guidance records. AI output must remain suggestion-only until accepted.

#### Depends on
- Phase 8.
- Phase 15.
- Phase 18.

#### Scope
- Define/implement `AiPort`.
- Implement deterministic dev/test AI adapter.
- Implement provider registry/config shape without exposing provider keys.
- Implement:
  - `POST /ai/product-ingestion`
  - `POST /ai/bed-planning`
  - `POST /ai/problem-assist`
  - `POST /ai/suggestions/:suggestionId/accept`
  - `POST /ai/suggestions/:suggestionId/reject`
- Persist `ai_sessions` and `ai_suggestions`.
- Accept product suggestions into real products.
- Accept product rule suggestions into real rules after validation.
- Reject suggestions without business records.
- Document production AI adapter status if no concrete provider is assigned.

#### Out of scope
- Frontend AI pages.
- Direct AI-to-database writes.
- Autonomous diagnosis.
- Provider-specific production adapter unless explicitly selected by task.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`
- `env.example`

#### Domain rules affected
- AI is never business truth.
- AI acceptance is explicit.
- AI output remains auditable.
- AI uncertainty must be visible.
- AI does not replace validation.
- AI problem assistance is not diagnosis.

#### Backend work
- AI repository/service/controller.
- AI port/adapters.
- Suggestion accept/reject transaction flow.
- Validation of edited payloads before record creation.
- Audit logging for acceptance where audit exists.

#### Frontend work
- None.

#### Database / migration work
- None expected unless a documented account-consistency guard is added in a new migration.

#### Integration work
- `AiPort` with deterministic adapter.
- Optional production provider adapter only when explicitly selected.

#### Tests required
- Product ingestion creates session/suggestions only.
- Accept product suggestion creates product transactionally.
- Accept product rule suggestion validates product/plant/account references.
- Reject suggestion creates no business record.
- Cross-account suggestion accept rejected.
- Invalid edited payload rejected and suggestion remains unaccepted.
- Provider failure maps to `EXTERNAL_SERVICE_ERROR`.
- Problem assist does not create diagnosis/business truth.

#### Verification checks
- No AI provider keys in frontend.
- No business records exist before acceptance.
- Acceptance endpoint returns created/updated entity ids.

#### Review focus
- AI boundary.
- Acceptance transaction.
- Payload validation.
- Provider isolation.

#### Suggested branch name
```text
feature/backend-ai-suggestions
```

### Phase 24 — Frontend AI Assistant Pages

#### Goal
Implement AI product ingestion, bed planning, and problem assist pages with suggestion review/accept/reject UX.

#### Why this phase exists
AI frontend must present suggestions as editable/reviewable data, not saved truth. It depends on backend AI persistence and acceptance endpoints.

#### Depends on
- Phase 4.
- Phase 23.

#### Scope
- AI Assistant route shell.
- Product ingestion page.
- Bed planning page.
- Problem assist page.
- `app-ai-suggestion-card`.
- Structured suggestion display with warnings/uncertainty.
- Accept/reject actions.
- Link to created product/rule after acceptance.

#### Out of scope
- Direct frontend AI provider calls.
- Autonomous product/rule creation.
- Diagnosis wording.
- Advanced chat UI unless built on the same suggestion boundary.

#### Documents to use
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`

#### Domain rules affected
- AI suggestions must be visibly suggestions.
- Accepted AI suggestions transition to real record links.
- Rejected suggestions create no business records.
- AI uncertainty/warnings are visible.

#### Backend work
- None except bug fixes.

#### Frontend work
- AI pages/components/API service.
- Reactive Forms for AI input and editable suggestion payloads.
- Error handling and created-entity links.

#### Database / migration work
- None.

#### Integration work
- Backend AI API only.

#### Tests required
- AI product input form validation.
- Suggestions render as editable cards.
- Accept calls backend and displays created entity link.
- Reject updates UI.
- AI output is not displayed as already saved before acceptance.
- Provider/API errors displayed.

#### Verification checks
- Frontend tests/build pass.
- Static search confirms no direct model provider calls from frontend.

#### Review focus
- Suggestion vs truth distinction.
- No AI diagnosis wording.
- Reactive Forms and validation.
- API contract compatibility.

#### Suggested branch name
```text
feature/frontend-ai-assistant
```

### Phase 25 — Backend Push Notifications and Worker Scheduler

#### Goal
Implement push subscription APIs, raw Web Push adapter, and backend-owned reminder delivery worker.

#### Why this phase exists
Push notifications depend on planned task reminders. Delivery must be backend-owned and should not be implemented as frontend timers.

#### Depends on
- Phase 18.

#### Scope
- Define/implement `PushPort`.
- Implement raw Web Push/VAPID adapter behind `PushPort`.
- Implement deterministic test push adapter.
- Implement endpoints:
  - `POST /push/subscriptions`
  - `GET /push/subscriptions`
  - `POST /push/subscriptions/:subscriptionId/deactivate`
- Implement worker/scheduler process or job module for due reminder delivery.
- Update reminder status to sent/failed/canceled as appropriate.
- Ensure notification failure does not change task status.
- Add worker ownership docs/scripts.

#### Out of scope
- Browser registration UI.
- Weather-check scheduler unless explicitly included in this phase.
- Creating reminders for suggested tasks.

#### Documents to use
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-production-checklist.md`
- `env.example`

#### Domain rules affected
- Notifications are optional.
- Push subscriptions belong to account.
- Reminder rows drive notification sending.
- Notifications only for planned tasks.
- Notification failure must not break task state.
- Raw Web Push is behind `PushPort`.

#### Backend work
- Push subscription repository/service/controller.
- Push port/adapters.
- Worker/scheduler job.
- Logging and failure handling.

#### Frontend work
- None.

#### Database / migration work
- None expected.

#### Integration work
- Raw Web Push/VAPID through `PushPort`.
- Test adapter through same port.

#### Tests required
- Register/reactivate/deactivate subscription.
- Account-scoped subscription listing.
- Due reminder sends through `PushPort`.
- Send success marks reminder sent.
- Send failure marks reminder failed and leaves task unchanged.
- Suggested task reminders cannot exist or send.
- VAPID private key not exposed to frontend config.

#### Verification checks
- Worker can run separately from API or as explicit process.
- Scheduler scans reminders account-safely.
- Backend tests for push adapter boundary pass.

#### Review focus
- Backend worker ownership.
- PushPort isolation.
- Secret handling.
- Reminder/task status boundary.

#### Suggested branch name
```text
feature/backend-push-worker
```

### Phase 26 — Frontend Notifications and PWA Registration

#### Goal
Implement notification settings and browser push subscription registration UI.

#### Why this phase exists
The frontend registration flow depends on backend push APIs and should remain optional/graceful.

#### Depends on
- Phase 4.
- Phase 25.

#### Scope
- Notifications settings page.
- Browser permission state display.
- Request permission action.
- Service worker push subscription flow.
- Register subscription through Fastify API.
- Deactivate/re-register actions.
- Disabled/browser-blocked states.

#### Out of scope
- Reminder delivery logic.
- Frontend timers for reminders.
- VAPID private key exposure.
- Direct task state changes from notification failure.

#### Documents to use
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-production-checklist.md`

#### Domain rules affected
- Notifications are optional.
- App works when notifications are disabled.
- Push subscription registration is frontend-collected but backend-owned.
- Reminder delivery is not frontend business logic.

#### Backend work
- None except bug fixes.

#### Frontend work
- Notification settings route/page.
- Service worker subscription integration.
- API service for push subscriptions.
- UI for permission states.

#### Database / migration work
- None.

#### Integration work
- Browser Push API to backend subscription endpoint.

#### Tests required
- Permission state renders.
- Permission denied/block states render.
- Subscription payload sent to backend.
- Deactivate action calls backend.
- Tasks/calendar still usable without notifications.
- Static check that VAPID private key is not in frontend config.

#### Verification checks
- Frontend tests/build pass.
- Manual smoke in supported browser where possible.
- No frontend reminder scheduler/timer exists.

#### Review focus
- Optional/graceful notification UX.
- Secret boundary.
- No frontend-owned reminder business logic.

#### Suggested branch name
```text
feature/frontend-notifications
```

### Phase 27 — Deployment and Operations Readiness

#### Goal
Prepare production deployment shape for Hetzner VPS + Docker Compose with protected Supabase services.

#### Why this phase exists
Deployment/security is cross-cutting and should be reviewed separately after application behavior is in place.

#### Depends on
- Phase 1 through Phase 26 as applicable.

#### Scope
- Dockerfiles for frontend, API, and worker.
- Docker Compose for app services and self-hosted Supabase stack.
- Reverse proxy configuration example.
- Environment variable documentation aligned with `docs/env.example`.
- Migration/seed execution instructions.
- Backup/restore documentation.
- Healthcheck configuration.
- Supabase Studio protection documentation/config.
- Private PostgreSQL networking.
- CORS and upload size limits.
- Production checklist update if needed.

#### Out of scope
- Changing domain behavior.
- Opening PostgreSQL publicly.
- Public unprotected Studio.
- Direct frontend application-table access through Supabase.

#### Documents to use
- `gardening-helper-production-checklist.md`
- `gardening-helper-implementation-instructions-for-ai-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `env.example`

#### Domain rules affected
- Supabase Studio must be protected.
- PostgreSQL must not be publicly exposed.
- Service role key is backend-only.
- Application data API remains Fastify.
- Worker/scheduler ownership is explicit.

#### Backend work
- Runtime config validation for production.
- Health endpoints/checks as needed.
- Worker entrypoint.

#### Frontend work
- Production build config.
- Public env/config handling for API base and Supabase anon/auth only.

#### Database / migration work
- Migration deployment command and restore test documentation.

#### Integration work
- Self-hosted Supabase services.
- Reverse proxy/TLS.
- Worker/scheduler.

#### Tests required
- Compose config validates.
- API can reach Postgres over private network.
- Frontend reaches API through `/api/v1`.
- Service role key absent from frontend build artifacts.
- Health checks pass.
- Migration command documented and smoke-tested where possible.

#### Verification checks
- Review against production checklist.
- Confirm only ports 80/443 are public in documented setup.
- Confirm Studio protection is configured/documented.
- Confirm Postgres is not exposed publicly.

#### Review focus
- Operational security.
- Secret boundaries.
- API routing.
- Worker ownership.
- Migration/backups/restore path.

#### Suggested branch name
```text
feature/deployment-readiness
```

### Phase 28 — Final Hardening and Acceptance

#### Goal
Close v1 acceptance gaps, broaden tests, run end-to-end flows, and produce final implementation notes.

#### Why this phase exists
This final phase verifies that the assembled system is auditable, transaction-safe, account-scoped, API-compatible, and usable end to end.

#### Depends on
- All implementation phases included in v1 scope.

#### Scope
- Fill missing P0/P1 tests from the Testing and Acceptance Specification.
- Add critical E2E scenarios.
- Run full lint/typecheck/test/build.
- Verify API contract consistency.
- Verify account scoping across major resources.
- Verify security/static checks for frontend/backend boundaries.
- Update README/setup docs.
- Produce final implementation report:
  - completed modules/endpoints/pages/tests
  - provider adapter status
  - mocks used behind ports
  - not implemented/deferred items
  - known limitations
  - how to run migrations/app/tests.

#### Out of scope
- New product features.
- Schema redesign.
- Moving deferred AI/weather/push work earlier.
- Cosmetic-only rewrites unless needed for acceptance.

#### Documents to use
- `gardening-helper-testing-and-acceptance-spec-v1.md`
- `gardening-helper-ai-implementation-handoff-readme-v1.md`
- `gardening-helper-production-checklist.md`
- `TASK_TEMPLATE.md`
- `REVIEW_TASK_TEMPLATE.md`

#### Domain rules affected
- All critical domain invariants.
- Account scoping.
- Activity transaction.
- Inventory ledger.
- Task reminders.
- AI/weather boundaries.
- Problem photo boundary.
- Frontend/backend responsibility boundary.

#### Backend work
- Fix acceptance gaps.
- Add missing tests.
- Improve docs/scripts.
- Address review findings.

#### Frontend work
- Fix acceptance gaps.
- Add missing tests.
- Verify mobile usability.

#### Database / migration work
- Only add documented forward migrations for confirmed gaps.

#### Integration work
- Verify all configured adapters and mocks are behind ports.
- Verify production provider status is documented honestly.

#### Tests required
- Full garden setup E2E.
- Treatment with full side effects E2E.
- Confirm suggested task E2E.
- Inventory shortage E2E.
- Problem with photo E2E.
- Observation without photo rejection.
- AI suggestion accept/reject mock flow.
- Weather rain confirmation mock/adapter flow.
- Cross-account safety.
- Deployment smoke tests where practical.

#### Verification checks
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- E2E suite.
- Static secret/boundary checks.
- Production checklist reviewed.

#### Review focus
- Any remaining P0 gaps.
- Regression risks across integrated workflows.
- Honest test/provider status.
- No shortcuts introduced during hardening.

#### Suggested branch name
```text
feature/final-hardening
```

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

Use these checkpoints across all PR reviews:

- Account scoping: every repository query and service write must derive account from authenticated actor, not request body.
- API contract: endpoints, enums, request/response shapes, envelopes, pagination, and status codes must match the canonical contract.
- Layering: controllers validate/dispatch, services orchestrate, repositories access data, integrations stay behind ports.
- Target resolution: bulk scopes resolve to concrete target rows, empty results are rejected, all-beds/all-perennials are place-scoped.
- Inventory: no stock mutation without movement, no negative lots, purchase/adjustment/consumption flows are transactional.
- Activity transaction: activity, targets, product usages, movements, lot updates, quarantine, suggested tasks, and audit are atomic.
- Tasks: suggested tasks are not planned, suggested tasks have no reminders, confirmation creates reminders transactionally.
- Problems/photos: observations cannot receive photos, problem photo metadata is database truth, storage is backend-mediated.
- AI: suggestions do not become business data until accepted, accepted payloads still pass backend validation.
- Weather: forecasts are advisory, observed rain is user-confirmed, rain does not auto-fail treatment or auto-create planned tasks.
- Frontend boundary: Angular never reads/writes app tables or storage buckets directly and never contains backend-owned business truth.
- Provider secrets: service role key, VAPID private key, AI keys, and other backend-only secrets never reach frontend code/build/logs.
- Deployment: Supabase Studio is protected and PostgreSQL is private.
- Tests: critical flows require happy path, failure path, account scoping, transaction rollback, and API contract tests where relevant.

## Recommended First 3 Implementation Tasks

1. Phase 1 — Backend Project Foundation
   - This creates the API skeleton, test scripts, error model, and validation conventions needed by all backend work.

2. Phase 2 — Database Migration and Transaction Foundation
   - This makes the provided SQL baseline executable and introduces the transaction abstraction needed before domain services.

3. Phase 3 — Auth and Account Boundary
   - This establishes backend-derived actor/account context so every later endpoint can be account-scoped from the start.

Frontend foundation should follow soon after, but backend/database/auth foundations are the safest first implementation path because all business APIs depend on them.

## Notes About Deferred Work

- AI, weather, and push notification phases must not start before core garden structure, products/inventory, target resolution, activity transaction, and task/calendar foundations are working.
- Real production AI provider work should not invent an unassigned provider. If no provider is selected, implement deterministic `AiPort` behavior and document production adapter status clearly.
- Full offline write sync is not part of v1 unless explicitly assigned. PWA shell/read caching and graceful failure are sufficient.
- Crop rotation, family sharing, advanced agronomic analytics, marketplace catalog sync, autonomous disease diagnosis, and native mobile app work are out of v1.
- Schema changes should be avoided. If a real mismatch is discovered, add a new forward migration and document why it is required.
- Calendar remains a read model. Do not introduce a mutable calendar source-of-truth table.
- Database triggers may enforce integrity, but must not create inventory movements, reminders, tasks, quarantine periods, AI records, or other hidden business side effects.
- Problem photos are the only v1 photo workflow. Observation photos remain deferred.
- Activity correction UI can be deferred after backend correction support, but historical side-effect corrections must never be silent rewrites.
