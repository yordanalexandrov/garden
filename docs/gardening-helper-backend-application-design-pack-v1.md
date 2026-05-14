# Gardening Helper — Backend Application Design Pack v1

## 1. Purpose

This document defines the backend application design layer that sits **between the database schema/migrations** and the actual module implementation.

It focuses on:

- repository contracts
- transaction boundaries
- service-level workflows
- API request/response contracts
- validation and error conventions
- implementation guidance for the Node.js + Fastify + TypeScript backend

This document is intended to be the next handoff after:
- product scope
- functional specification
- technical requirements / ERD
- SQL schema and migration drafts

---

# 2. Architectural baseline

The backend remains:

- **Node.js + TypeScript**
- **Fastify**
- **self-hosted Supabase Postgres**
- **modular monolith**
- **repository + transaction abstraction**
- **backend-owned business logic**
- **provider access behind ports/adapters**

## Core rule
Repositories are responsible for **data access**.

Services are responsible for:
- orchestration
- validation across aggregates
- transaction boundaries
- integration calls
- side-effect sequencing

The controller layer should remain thin.

---

# 2.1 Infrastructure Decision — Hetzner + Self-hosted Supabase

Gardening Helper v1 runs on a Hetzner VPS using Docker Compose.

The deployment includes:
- Angular PWA frontend
- Fastify API
- background worker/scheduler
- self-hosted Supabase stack:
  - Postgres
  - Auth
  - Storage
  - REST/Meta/Studio as needed

```text
Hetzner VPS
|
+-- Reverse proxy: Caddy / Traefik / Nginx
|     +-- garden.domain.com       -> Angular PWA
|     +-- garden.domain.com/api   -> Fastify API
|     +-- supabase.domain.com     -> Supabase gateway if needed
|     +-- studio.domain.com       -> Supabase Studio, protected
|
+-- app_web
+-- app_api
+-- app_worker
|
+-- supabase_db
+-- supabase_auth
+-- supabase_storage
+-- supabase_rest
+-- supabase_realtime optional
+-- supabase_studio protected
+-- supabase_meta
```

Application architecture remains backend-owned:
- Angular does not access application tables directly.
- Fastify API owns business logic, validation, transactions, account scoping and side effects.
- Supabase service role key is backend-only.
- Supabase Auth may be used for authentication/session handling.
- All application data access goes through the Fastify API.
- Integrations remain behind ports/adapters.

Frontend auth boundary:
- Angular may use self-hosted Supabase Auth for login/session handling only.
- Angular must not access application tables directly.
- Angular must not call Supabase generated REST/table APIs for Gardening Helper application data.
- Angular must not access Supabase Storage buckets directly for business file flows.

Backend auth boundary:
- Fastify validates JWTs through `AuthPort`.
- Fastify derives authenticated actor/account context server-side.
- Fastify enforces account scoping and authorization for all application data.
- Fastify rejects invalid, expired, missing or mismatched tokens.

Provider decisions:
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Database: self-hosted Supabase Postgres
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`

Operational requirements:
- automated PostgreSQL backups
- object storage backups
- restore test procedure
- protected Supabase Studio
- no public PostgreSQL port
- monitored disk usage and container health

Supabase Studio protection must use at least one of:
- VPN/Tailscale
- IP allowlist
- reverse proxy basic auth
- private network access

Hard rules:
- Do not replace the Fastify API with direct Supabase table access.
- Do not move business logic to frontend.
- Do not move business side effects to database triggers.
- Keep repository + transaction abstraction.
- Keep provider access behind ports/adapters.
- Preserve source-of-truth priority from `docs_INDEX.md`.

---

# 3. Recommended backend module structure

```text
src/
  modules/
    places/
      places.repository.ts
      places.service.ts
      places.controller.ts
      places.types.ts
      places.validation.ts

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
    weather/
    ai/
    files/
    notifications/

  db/
    db.ts
    transaction.ts
    database.types.ts

  shared/
    errors/
    validation/
    api/
    utils/
```

---

# 4. Database abstraction contracts

## 4.1 DbClient
Global application database entry point.

### Responsibilities
- create/query connections
- expose query builder
- begin transactions
- provide health checks optionally

### Example shape
```ts
export interface DbClient {
  transaction<T>(fn: (trx: DbTransaction) => Promise<T>): Promise<T>;
}
```

## 4.2 DbTransaction
Transaction wrapper passed into repositories/services during complex writes.

### Responsibilities
- execute all repo writes within one atomic context
- prevent repositories from silently opening nested unmanaged transactions

### Example shape
```ts
export interface DbTransaction {
  // typed query builder instance
}
```

## 4.3 Repository pattern rules
Repositories should:
- accept `dbOrTrx` as dependency or method argument
- return domain-oriented records or DTO-safe read models
- not call weather/AI/storage/push integrations
- not contain HTTP concerns

Repositories should not:
- decide business workflows
- trigger notifications
- create unrelated side effects

---

# 5. Shared backend types

## 5.1 Common primitives

### UUID
```ts
type UUID = string;
```

### Unit
```ts
type Unit = 'ml' | 'l' | 'g' | 'kg';
```

### TargetType
```ts
type TargetType =
  | 'place'
  | 'perennial'
  | 'bed'
  | 'yearly_bed_planting'
  | 'persistent_bed_plant';
```

### ActivityScopeType
```ts
type ActivityScopeType =
  | 'whole_place'
  | 'all_perennials_in_place'
  | 'selected_perennials'
  | 'all_beds_in_place'
  | 'selected_beds'
  | 'single_bed'
  | 'selected_yearly_plantings'
  | 'selected_persistent_bed_plants';
```

### TaskStatus
```ts
type TaskStatus = 'suggested' | 'planned' | 'done' | 'skipped' | 'canceled';
```

### ReminderType
```ts
type ReminderType = 'day_before' | 'same_day';
```

---

# 6. Repository contracts

## 6.1 AccountsRepository
Even if v1 is effectively single-user, keep the repository explicit.

### Responsibilities
- get current account
- get account timezone defaults if any
- verify account existence

### Contract
```ts
interface AccountsRepository {
  findById(accountId: UUID, db?: DbTransaction): Promise<Account | null>;
}
```

---

## 6.2 PlacesRepository

### Responsibilities
- CRUD for places
- weather config retrieval
- list places per account

### Contract
```ts
interface PlacesRepository {
  listActive(accountId: UUID, db?: DbTransaction): Promise<Place[]>;
  findById(accountId: UUID, placeId: UUID, db?: DbTransaction): Promise<Place | null>;
  create(input: CreatePlaceInput, db?: DbTransaction): Promise<Place>;
  update(accountId: UUID, placeId: UUID, patch: UpdatePlaceInput, db?: DbTransaction): Promise<Place>;
  archive(accountId: UUID, placeId: UUID, db?: DbTransaction): Promise<void>;
}
```

---

## 6.3 PlantsRepository

### Responsibilities
- reusable plant definitions
- search/list plants
- validate plant references

### Contract
```ts
interface PlantsRepository {
  list(accountId: UUID, filters: ListPlantsFilters, db?: DbTransaction): Promise<Plant[]>;
  findById(accountId: UUID, plantId: UUID, db?: DbTransaction): Promise<Plant | null>;
  create(input: CreatePlantInput, db?: DbTransaction): Promise<Plant>;
  update(accountId: UUID, plantId: UUID, patch: UpdatePlantInput, db?: DbTransaction): Promise<Plant>;
  archive(accountId: UUID, plantId: UUID, db?: DbTransaction): Promise<void>;
}
```

---

## 6.4 PerennialsRepository

### Responsibilities
- place-bound perennial records
- status changes
- lookup for target resolution

### Contract
```ts
interface PerennialsRepository {
  listByPlace(accountId: UUID, placeId: UUID, db?: DbTransaction): Promise<Perennial[]>;
  findById(accountId: UUID, perennialId: UUID, db?: DbTransaction): Promise<Perennial | null>;
  findManyByIds(accountId: UUID, ids: UUID[], db?: DbTransaction): Promise<Perennial[]>;
  listActiveByPlace(accountId: UUID, placeId: UUID, db?: DbTransaction): Promise<Perennial[]>;
  create(input: CreatePerennialInput, db?: DbTransaction): Promise<Perennial>;
  update(accountId: UUID, perennialId: UUID, patch: UpdatePerennialInput, db?: DbTransaction): Promise<Perennial>;
  archive(accountId: UUID, perennialId: UUID, db?: DbTransaction): Promise<void>;
}
```

---

## 6.5 BedsRepository

### Responsibilities
- CRUD for beds
- place-bound listing
- support target resolution

### Contract
```ts
interface BedsRepository {
  listByPlace(accountId: UUID, placeId: UUID, db?: DbTransaction): Promise<Bed[]>;
  listActiveByPlace(accountId: UUID, placeId: UUID, db?: DbTransaction): Promise<Bed[]>;
  findById(accountId: UUID, bedId: UUID, db?: DbTransaction): Promise<Bed | null>;
  findManyByIds(accountId: UUID, ids: UUID[], db?: DbTransaction): Promise<Bed[]>;
  create(input: CreateBedInput, db?: DbTransaction): Promise<Bed>;
  update(accountId: UUID, bedId: UUID, patch: UpdateBedInput, db?: DbTransaction): Promise<Bed>;
  archive(accountId: UUID, bedId: UUID, db?: DbTransaction): Promise<void>;
}
```

---

## 6.6 PersistentBedPlantsRepository

### Responsibilities
- manage persistent plants attached to beds
- target resolution support

### Contract
```ts
interface PersistentBedPlantsRepository {
  listByBed(accountId: UUID, bedId: UUID, db?: DbTransaction): Promise<PersistentBedPlant[]>;
  findById(accountId: UUID, id: UUID, db?: DbTransaction): Promise<PersistentBedPlant | null>;
  findManyByIds(accountId: UUID, ids: UUID[], db?: DbTransaction): Promise<PersistentBedPlant[]>;
  create(input: CreatePersistentBedPlantInput, db?: DbTransaction): Promise<PersistentBedPlant>;
  update(accountId: UUID, id: UUID, patch: UpdatePersistentBedPlantInput, db?: DbTransaction): Promise<PersistentBedPlant>;
  archive(accountId: UUID, id: UUID, db?: DbTransaction): Promise<void>;
}
```

---

## 6.7 YearlyPlantingsRepository

### Responsibilities
- yearly plantings
- current and historical bed occupancy
- target resolution support

### Contract
```ts
interface YearlyPlantingsRepository {
  listByBedAndYear(accountId: UUID, bedId: UUID, year: number, db?: DbTransaction): Promise<YearlyBedPlanting[]>;
  findById(accountId: UUID, id: UUID, db?: DbTransaction): Promise<YearlyBedPlanting | null>;
  findManyByIds(accountId: UUID, ids: UUID[], db?: DbTransaction): Promise<YearlyBedPlanting[]>;
  create(input: CreateYearlyPlantingInput, db?: DbTransaction): Promise<YearlyBedPlanting>;
  update(accountId: UUID, id: UUID, patch: UpdateYearlyPlantingInput, db?: DbTransaction): Promise<YearlyBedPlanting>;
  archive(accountId: UUID, id: UUID, db?: DbTransaction): Promise<void>;
}
```

---

## 6.8 ProductsRepository

### Responsibilities
- product definitions
- usage rules
- summary reads

### Contract
```ts
interface ProductsRepository {
  list(accountId: UUID, filters: ListProductsFilters, db?: DbTransaction): Promise<Product[]>;
  findById(accountId: UUID, productId: UUID, db?: DbTransaction): Promise<Product | null>;
  create(input: CreateProductInput, db?: DbTransaction): Promise<Product>;
  update(accountId: UUID, productId: UUID, patch: UpdateProductInput, db?: DbTransaction): Promise<Product>;
  archive(accountId: UUID, productId: UUID, db?: DbTransaction): Promise<void>;

  listUsageRules(accountId: UUID, productId: UUID, db?: DbTransaction): Promise<ProductUsageRule[]>;
  findUsageRuleById(accountId: UUID, ruleId: UUID, db?: DbTransaction): Promise<ProductUsageRule | null>;
  findUsageRuleForProductPlant(
    accountId: UUID,
    productId: UUID,
    plantId: UUID,
    db?: DbTransaction
  ): Promise<ProductUsageRule | null>;

  createUsageRule(input: CreateProductUsageRuleInput, db?: DbTransaction): Promise<ProductUsageRule>;
  updateUsageRule(accountId: UUID, ruleId: UUID, patch: UpdateProductUsageRuleInput, db?: DbTransaction): Promise<ProductUsageRule>;
  archiveUsageRule(accountId: UUID, ruleId: UUID, db?: DbTransaction): Promise<void>;
}
```

---

## 6.9 InventoryRepository

### Responsibilities
- lots
- stock movement ledger
- balance summaries
- allocation support during consumption

### Contract
```ts
interface InventoryRepository {
  listLotsByProduct(accountId: UUID, productId: UUID, db?: DbTransaction): Promise<InventoryLot[]>;
  findLotById(accountId: UUID, lotId: UUID, db?: DbTransaction): Promise<InventoryLot | null>;
  createLot(input: CreateInventoryLotInput, db?: DbTransaction): Promise<InventoryLot>;
  updateLotRemainingQuantity(accountId: UUID, lotId: UUID, quantityRemaining: number, db?: DbTransaction): Promise<void>;

  createMovement(input: CreateInventoryMovementInput, db?: DbTransaction): Promise<InventoryMovement>;
  createMovements(inputs: CreateInventoryMovementInput[], db?: DbTransaction): Promise<InventoryMovement[]>;

  getProductBalance(accountId: UUID, productId: UUID, db?: DbTransaction): Promise<ProductInventoryBalance>;
  listMovementsByProduct(accountId: UUID, productId: UUID, db?: DbTransaction): Promise<InventoryMovement[]>;

  listConsumableLotsForProduct(accountId: UUID, productId: UUID, db?: DbTransaction): Promise<InventoryLot[]>;
}
```

---

## 6.10 ActivitiesRepository

### Responsibilities
- activity headers
- targets
- product usages
- activity detail reads

### Contract
```ts
interface ActivitiesRepository {
  create(input: CreateActivityInput, db?: DbTransaction): Promise<Activity>;
  addTargets(activityId: UUID, targets: CreateActivityTargetInput[], db?: DbTransaction): Promise<ActivityTarget[]>;
  addProductUsages(activityId: UUID, usages: CreateActivityProductUsageInput[], db?: DbTransaction): Promise<ActivityProductUsage[]>;
  findById(accountId: UUID, activityId: UUID, db?: DbTransaction): Promise<Activity | null>;
  getDetail(accountId: UUID, activityId: UUID, db?: DbTransaction): Promise<ActivityDetail | null>;
  list(accountId: UUID, filters: ListActivitiesFilters, db?: DbTransaction): Promise<ActivityListItem[]>;
}
```

---

## 6.11 ProblemsRepository

### Responsibilities
- problem / observation records
- photo metadata

### Contract
```ts
interface ProblemsRepository {
  create(input: CreateProblemInput, db?: DbTransaction): Promise<Problem>;
  update(accountId: UUID, problemId: UUID, patch: UpdateProblemInput, db?: DbTransaction): Promise<Problem>;
  findById(accountId: UUID, problemId: UUID, db?: DbTransaction): Promise<Problem | null>;
  list(accountId: UUID, filters: ListProblemsFilters, db?: DbTransaction): Promise<ProblemListItem[]>;

  addPhoto(input: CreateProblemPhotoInput, db?: DbTransaction): Promise<ProblemPhoto>;
  listPhotos(problemId: UUID, db?: DbTransaction): Promise<ProblemPhoto[]>;
}
```

---

## 6.12 TasksRepository

### Responsibilities
- task headers
- targets
- reminder rows
- status changes
- task detail reads

### Contract
```ts
interface TasksRepository {
  create(input: CreateTaskInput, db?: DbTransaction): Promise<Task>;
  addTargets(taskId: UUID, targets: CreateTaskTargetInput[], db?: DbTransaction): Promise<TaskTarget[]>;
  createReminders(taskId: UUID, reminders: CreateTaskReminderInput[], db?: DbTransaction): Promise<TaskReminder[]>;

  findById(accountId: UUID, taskId: UUID, db?: DbTransaction): Promise<Task | null>;
  getDetail(accountId: UUID, taskId: UUID, db?: DbTransaction): Promise<TaskDetail | null>;
  list(accountId: UUID, filters: ListTasksFilters, db?: DbTransaction): Promise<TaskListItem[]>;

  update(accountId: UUID, taskId: UUID, patch: UpdateTaskInput, db?: DbTransaction): Promise<Task>;
  updateStatus(accountId: UUID, taskId: UUID, status: TaskStatus, db?: DbTransaction): Promise<Task>;
}
```

---

## 6.13 QuarantineRepository

### Responsibilities
- create quarantine periods
- list active/historical quarantines

### Contract
```ts
interface QuarantineRepository {
  create(input: CreateQuarantinePeriodInput, db?: DbTransaction): Promise<QuarantinePeriod>;
  list(accountId: UUID, filters: ListQuarantineFilters, db?: DbTransaction): Promise<QuarantinePeriod[]>;
}
```

---

## 6.14 WeatherRepository
Only stores weather-related domain persistence, not provider calls.

### Responsibilities
- persist weather snapshots / rain confirmations

### Contract
```ts
interface WeatherRepository {
  createEvent(input: CreateWeatherEventInput, db?: DbTransaction): Promise<WeatherEvent>;
  findByRelatedEntity(
    accountId: UUID,
    relatedEntityType: 'task' | 'activity',
    relatedEntityId: UUID,
    db?: DbTransaction
  ): Promise<WeatherEvent[]>;
  updateRainConfirmation(
    accountId: UUID,
    weatherEventId: UUID,
    status: 'pending' | 'confirmed_yes' | 'confirmed_no' | 'ignored',
    observedRain: boolean | null,
    db?: DbTransaction
  ): Promise<WeatherEvent>;
}
```

---

## 6.15 AiRepository

### Responsibilities
- AI sessions
- AI suggestions
- acceptance state persistence

### Contract
```ts
interface AiRepository {
  createSession(input: CreateAiSessionInput, db?: DbTransaction): Promise<AiSession>;
  addSuggestions(sessionId: UUID, suggestions: CreateAiSuggestionInput[], db?: DbTransaction): Promise<AiSuggestion[]>;
  findSessionById(accountId: UUID, sessionId: UUID, db?: DbTransaction): Promise<AiSession | null>;
  findSuggestionById(accountId: UUID, suggestionId: UUID, db?: DbTransaction): Promise<AiSuggestion | null>;
  markSuggestionAccepted(accountId: UUID, suggestionId: UUID, db?: DbTransaction): Promise<void>;
  markSuggestionRejected(accountId: UUID, suggestionId: UUID, db?: DbTransaction): Promise<void>;
}
```

---

## 6.16 PushSubscriptionsRepository

### Responsibilities
- store and manage push subscriptions

### Contract
```ts
interface PushSubscriptionsRepository {
  register(input: RegisterPushSubscriptionInput, db?: DbTransaction): Promise<PushSubscriptionRecord>;
  listActiveByAccount(accountId: UUID, db?: DbTransaction): Promise<PushSubscriptionRecord[]>;
  deactivate(accountId: UUID, subscriptionId: UUID, db?: DbTransaction): Promise<void>;
}
```

---

## 6.17 AuditLogsRepository

### Responsibilities
- persist auditable changes for critical actions

### Contract
```ts
interface AuditLogsRepository {
  log(input: CreateAuditLogInput, db?: DbTransaction): Promise<void>;
}
```

---

# 7. Integration ports

## 7.1 StoragePort
Backed by self-hosted Supabase Storage in v1. Business services use this port and never call Supabase Storage directly.
Problem photo files are stored in Supabase Storage; the database stores metadata only.
File access must use signed URLs or protected backend endpoints.

```ts
interface StoragePort {
  uploadProblemPhoto(input: UploadProblemPhotoInput): Promise<UploadedFileResult>;
  deleteObject(storageKey: string): Promise<void>;
  getSignedUrl(storageKey: string): Promise<string>;
}
```

## 7.2 WeatherPort
Backed by Open-Meteo in v1. Weather remains advisory and normalized results, not provider payloads, drive business decisions.

```ts
interface WeatherPort {
  getForecastForPlace(input: WeatherForecastInput): Promise<WeatherForecastResult>;
  getRainRiskForDate(input: RainRiskInput): Promise<RainRiskResult>;
  captureForecastSnapshot(input: ForecastSnapshotInput): Promise<ForecastSnapshotResult>;
}
```

## 7.3 AiPort
```ts
interface AiPort {
  ingestProduct(input: AiProductIngestionInput): Promise<AiProductIngestionResult>;
  suggestBedPlan(input: AiBedPlanInput): Promise<AiBedPlanResult>;
  assistProblem(input: AiProblemAssistInput): Promise<AiProblemAssistResult>;
}
```

## 7.4 PushPort
Backed by raw Web Push with VAPID in v1.

```ts
interface PushPort {
  sendReminder(input: SendReminderInput): Promise<void>;
}
```

## 7.5 AuthPort
Backed by self-hosted Supabase Auth in v1. The service role key is backend-only and must not be exposed to frontend code.
Auth adapters verify Supabase JWTs and return the authenticated actor/account context used by services.

```ts
interface AuthPort {
  verifyAccessToken(token: string): Promise<AuthenticatedActor>;
}
```

---

# 8. Service layer contracts

## 8.1 Why services exist
Services own:
- workflow orchestration
- validation that spans multiple repositories
- transaction boundaries
- integration coordination

## 8.2 Main services
Recommended service classes:

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

---

# 9. Critical transaction flows

## 9.1 CreateActivity flow

This is the most critical workflow in the entire system.

### Inputs
- activity type
- performedAt
- placeId where resolvable
- targetScopeType
- target selector payload
- optional notes
- optional product usages
- policy flag for inventory shortage

### Goal
In one transaction:
- create activity
- resolve and persist concrete targets
- persist product usage
- decrement inventory through ledger
- create quarantine period(s)
- create suggested follow-up task(s)

### Service contract
```ts
interface ActivitiesService {
  createActivity(actor: AuthenticatedActor, input: CreateActivityRequest): Promise<CreateActivityResult>;
}
```

### Step-by-step flow
1. Validate request payload shape.
2. Validate account scope.
3. Resolve target set:
   - if `selected_perennials` -> fetch specified perennials
   - if `all_perennials_in_place` -> fetch active perennials in place
   - if `selected_beds` -> fetch specified beds
   - if `all_beds_in_place` -> fetch active beds in place
   - if `single_bed` -> fetch exactly one bed
   - if `selected_yearly_plantings` -> fetch plantings
   - if `selected_persistent_bed_plants` -> fetch persistent bed plants
   - if `whole_place` -> use place as target
4. Verify resolved targets are non-empty.
5. Verify all resolved targets belong to the same account and, where applicable, to the provided place.
6. Begin DB transaction.
7. Insert `activities`.
8. Insert `activity_targets`.
9. For each product usage:
   - validate product belongs to account
   - if rule supplied, validate rule belongs to product
   - insert `activity_product_usages`
10. For each product usage requiring stock deduction:
   - fetch consumable lots ordered FEFO
   - allocate requested quantity across lots
   - create consumption `inventory_movements`
   - update lot `quantity_remaining`
   - if shortage and not allowed -> fail transaction
   - if shortage and allowed -> create movements only for covered stock and return uncovered quantity as a warning
11. For each product usage with quarantine days:
   - create `quarantine_periods`
12. For each product usage with reapplication interval:
   - create `tasks` with status `suggested`
   - create `task_targets`
13. Insert audit log.
14. Commit transaction.
15. Return created activity detail plus generated side effects summary.

### Return shape
```ts
interface CreateActivityResult {
  activity: ActivityDetail;
  inventoryEffects: InventoryMovement[];
  quarantinePeriods: QuarantinePeriod[];
  suggestedTasks: Task[];
  warnings: string[];
}
```

### Failure policy
Any failure rolls back all writes.

---

## 9.2 ConfirmSuggestedTask flow

### Goal
Convert a suggested task into a planned task and create reminder rows.

### Service contract
```ts
interface TasksService {
  confirmSuggestedTask(actor: AuthenticatedActor, taskId: UUID): Promise<TaskDetail>;
}
```

### Flow
1. Fetch task by id.
2. Ensure it belongs to actor account.
3. Ensure status is `suggested`.
4. Determine timezone from place or account default.
5. Begin transaction.
6. Update task:
   - status -> `planned`
   - confirmed_at -> now
7. Create reminder rows:
   - day_before
   - same_day
8. Insert audit log.
9. Commit.
10. Return task detail.

### Important rule
Do not create reminders for tasks already in planned/done/skipped/canceled.

---

## 9.3 CreateProblemWithPhotos flow

### Goal
Create problem record and attach uploaded photos.

### Service contract
```ts
interface ProblemsService {
  createProblem(actor: AuthenticatedActor, input: CreateProblemRequest): Promise<ProblemDetail>;
}
```

### Flow
1. Validate target reference.
2. Validate target belongs to actor account and place.
3. If files included:
   - validate MIME type and size
   - upload/store files through `StoragePort`
4. Begin transaction.
5. Insert `problems`.
6. For each uploaded file already stored or newly uploaded:
   - write `problem_photos` metadata
7. Insert audit log.
8. Commit.
9. Return created problem with signed photo URLs or metadata.

The frontend must not upload directly to Supabase Storage using service-role credentials.
If signed upload/download URLs are used, they are issued by the backend and scoped to the current authenticated account/problem.

### Note
Binary upload itself can happen before or outside the DB transaction; metadata finalization must happen in transaction.

---

## 9.4 AcceptAiProductSuggestion flow

### Goal
Accept AI-produced structured suggestion and create/update real business records.

### Service contract
```ts
interface AiService {
  acceptSuggestion(actor: AuthenticatedActor, suggestionId: UUID): Promise<AcceptAiSuggestionResult>;
}
```

### Flow
1. Fetch suggestion + session.
2. Ensure suggestion belongs to actor account.
3. Validate suggestion is not already accepted.
4. Parse suggestion payload.
5. Begin transaction.
6. Mark suggestion accepted.
7. Depending on suggestion type:
   - create product
   - create product usage rule
   - create both
   - store plan note / derived record if bed plan
8. Insert audit log.
9. Commit.
10. Return created/updated business record ids.

### Important rule
AI suggestions are never the source of truth. Accepted business records are.

---

## 9.5 CreateInventoryLot flow

### Goal
Create purchase/stock lot and purchase movement together.

### Service contract
```ts
interface InventoryService {
  createLot(actor: AuthenticatedActor, input: CreateInventoryLotRequest): Promise<CreateInventoryLotResult>;
}
```

### Flow
1. Validate product exists and belongs to account.
2. Begin transaction.
3. Insert `inventory_lots`.
4. Insert `inventory_movements` with `movement_type = purchase`.
5. Insert audit log.
6. Commit.

---

## 9.6 ManualInventoryAdjustment flow

### Goal
Adjust stock explicitly without hiding history.

### Service contract
```ts
interface InventoryService {
  adjustStock(actor: AuthenticatedActor, input: ManualInventoryAdjustmentRequest): Promise<ManualInventoryAdjustmentResult>;
}
```

### Flow
1. Validate product and optional lot.
2. Begin transaction.
3. Create `inventory_movements` with `movement_type = manual_adjustment` or `correction`.
4. Update lot remaining quantity if lot-bound adjustment.
5. Insert audit log.
6. Commit.

### Important rule
Never mutate stock without movement history.

---

## 9.7 RegisterPushSubscription flow

### Goal
Persist or reactivate browser push subscription.

### Service contract
```ts
interface NotificationsService {
  registerPushSubscription(actor: AuthenticatedActor, input: RegisterPushSubscriptionRequest): Promise<void>;
}
```

### Flow
1. Validate endpoint, p256dh, auth.
2. Upsert or reactivate existing subscription.
3. Return success.

---

## 9.8 RecordRainConfirmation flow

### Goal
Persist user confirmation about rain around task/activity.

### Service contract
```ts
interface WeatherService {
  confirmRain(actor: AuthenticatedActor, weatherEventId: UUID, response: RainConfirmationResponse): Promise<WeatherEvent>;
}
```

### Flow
1. Validate weather event belongs to actor account.
2. Validate event type = rain_check.
3. Map response:
   - confirmed_yes -> observedRain = true
   - confirmed_no -> observedRain = false
   - ignored -> observedRain = null
4. Persist update.
5. Audit if desired.

---

# 10. Target resolution rules

## 10.1 Why a resolver is needed
Both activities and tasks depend on explicit resolved targets.

The resolution logic should live in a dedicated helper/service, not inside controllers.

## 10.2 Recommended contract
```ts
interface TargetResolver {
  resolveActivityTargets(
    accountId: UUID,
    input: ResolveActivityTargetsInput,
    db?: DbTransaction
  ): Promise<ResolvedTarget[]>;

  resolveTaskTargets(
    accountId: UUID,
    input: ResolveTaskTargetsInput,
    db?: DbTransaction
  ): Promise<ResolvedTarget[]>;
}
```

## 10.3 Resolution rules

### whole_place
Returns exactly:
- one target row of type `place`

### all_perennials_in_place
Returns:
- all active perennials in specified place

### selected_perennials
Returns:
- only provided perennial ids
- fail if any are missing or archived

### all_beds_in_place
Returns:
- all active beds in specified place

### selected_beds
Returns:
- only provided bed ids

### single_bed
Returns:
- exactly one bed target

### selected_yearly_plantings
Returns:
- provided planting ids

### selected_persistent_bed_plants
Returns:
- provided persistent plant ids

## 10.4 Important constraints
- no cross-place mixes in one request unless product requirements change later
- target resolution must return concrete rows for persistence
- empty resolved target set is a validation error

---

# 11. Inventory allocation policy

## 11.1 Recommended v1 allocation strategy
Use **FEFO**:
- earliest expiry date first
- then oldest purchase date
- then creation order

## 11.2 Allocation helper contract
```ts
interface InventoryAllocator {
  allocateConsumption(input: AllocateConsumptionInput): AllocationResult;
}
```

## 11.3 Output
```ts
interface AllocationResult {
  allocations: {
    lotId: UUID | null;
    quantity: number;
    unit: Unit;
  }[];
  coveredQuantity: number;
  uncoveredQuantity: number;
}
```

## 11.4 Shortage policy
Recommended v1:
- if stock shortage and `allowInventoryShortage = false` -> validation/business error
- if stock shortage and `allowInventoryShortage = true` -> allow create flow with explicit uncovered quantity handling policy

## 11.5 Recommended uncovered handling
Best v1 choice:
- create only movements for covered quantity
- include uncovered quantity in result warning
- use the hybrid correction model for later user corrections

This avoids fake stock history.

## 11.6 Hybrid correction model
Correction handling in v1 is hybrid:
- fresh, side-effect-free draft-like mistakes may be edited through normal validated update flows where the edit does not rewrite derived business history
- records that created side effects must use explicit correction workflows
- correction workflows append or create auditable reverse/adjust operations for inventory, quarantine, tasks and related effects
- historical business records are not silently mutated to hide prior effects

Services own correction orchestration and transaction boundaries.

---

# 12. Reminder generation rules

## 12.1 Reminder generation contract
```ts
interface ReminderScheduler {
  buildTaskReminders(input: BuildTaskRemindersInput): CreateTaskReminderInput[];
}
```

## 12.2 Behavior
For a planned task:
- create one reminder for local day before
- create one reminder for local same day

## 12.3 Timezone rule
Use:
1. task place timezone if available
2. fallback account timezone
3. fallback UTC only if absolutely necessary

---

# 13. Calendar aggregation design

## 13.1 CalendarService responsibility
Unify:
- completed activities
- tasks
- quarantine periods
- optional weather markers

### Contract
```ts
interface CalendarService {
  getCalendarFeed(actor: AuthenticatedActor, input: GetCalendarFeedRequest): Promise<CalendarFeedResponse>;
}
```

## 13.2 Response sections
```ts
interface CalendarFeedResponse {
  activities: CalendarActivityItem[];
  tasks: CalendarTaskItem[];
  quarantinePeriods: CalendarQuarantineItem[];
  weatherEvents?: CalendarWeatherItem[];
}
```

## 13.3 Why split sections
Keep the API explicit and predictable.
Frontend can merge them visually as needed.

---

# 14. API design conventions

## 14.1 Base path
`/api/v1`

## 14.2 JSON envelope
Success:
```json
{
  "data": {}
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": ["message"]
    }
  }
}
```

## 14.3 Pagination convention
For list endpoints:
```json
{
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 140
  }
}
```

Use cursor pagination later if needed.
Offset/page pagination is sufficient for v1.

## 14.4 Date/time format
Always ISO 8601 in API responses.

## 14.5 Validation location
All incoming requests must be validated:
- at controller boundary
- before service invocation

---

# 15. API request / response contracts

## 15.1 Places API

### POST /api/v1/places
Request:
```json
{
  "name": "Home Garden",
  "description": "Back garden and orchard",
  "notes": "",
  "weatherEnabled": true,
  "weatherLocationLabel": "Ruse, Bulgaria",
  "latitude": 43.84,
  "longitude": 25.95,
  "timezone": "Europe/Sofia"
}
```

Response:
```json
{
  "data": {
    "id": "uuid",
    "name": "Home Garden",
    "weatherEnabled": true
  }
}
```

Validation:
- name required
- if weatherEnabled true, require either location label or coordinates
- timezone optional but recommended

---

## 15.2 Plants API

### POST /api/v1/plants
Request:
```json
{
  "commonName": "Tomato",
  "variety": "Roma",
  "plantCategory": "vegetable",
  "lifecycleType": "annual",
  "growingStyle": "vegetable",
  "notes": ""
}
```

Validation:
- lifecycleType must be one of allowed values
- growingStyle must be one of allowed values

---

## 15.3 Perennials API

### POST /api/v1/places/:placeId/perennials
Request:
```json
{
  "plantId": "uuid",
  "label": "Pear near fence",
  "plantedYear": 2022,
  "notes": ""
}
```

Validation:
- plant must exist and belong to account
- place must exist and belong to account

---

## 15.4 Beds API

### POST /api/v1/places/:placeId/beds
Request:
```json
{
  "name": "Bed A",
  "description": "",
  "notes": "",
  "widthM": 1.2,
  "lengthM": 4
}
```

Validation:
- name required
- dimensions optional but if provided must be positive

---

## 15.5 Yearly plantings API

### POST /api/v1/beds/:bedId/plantings
Request:
```json
{
  "plantId": "uuid",
  "year": 2026,
  "quantity": 12,
  "notes": "",
  "status": "planted"
}
```

Validation:
- year required and sane range
- status allowed values only

---

## 15.6 Products API

### POST /api/v1/products
Request:
```json
{
  "name": "Example Product",
  "category": "fungicide",
  "activeSubstance": "Copper",
  "manufacturer": "Example Co",
  "formulation": "WG",
  "defaultUnit": "g",
  "notes": ""
}
```

Validation:
- category allowed values only
- defaultUnit allowed values only

---

## 15.7 Product usage rules API

### POST /api/v1/products/:productId/rules
Request:
```json
{
  "plantId": "uuid",
  "doseValue": 20,
  "doseUnit": "g",
  "dilutionText": "20 g / 10 l water",
  "applicationMethod": "foliar spray",
  "reapplicationIntervalDays": 10,
  "quarantinePeriodDays": 14,
  "notes": ""
}
```

Validation:
- product and plant must exist in account
- intervals must be non-negative
- doseValue must be positive

---

## 15.8 Inventory lots API

### POST /api/v1/products/:productId/inventory-lots
Request:
```json
{
  "quantityInitial": 250,
  "unit": "g",
  "purchaseDate": "2026-05-13",
  "expiryDate": "2027-05-13",
  "batchNumber": "B-123",
  "notes": ""
}
```

Validation:
- quantityInitial > 0
- unit must match allowed unit family

---

## 15.9 Activities API

### POST /api/v1/activities
Request:
```json
{
  "placeId": "uuid",
  "type": "treatment",
  "performedAt": "2026-05-13T08:00:00+03:00",
  "targetScopeType": "selected_beds",
  "targetSelection": {
    "bedIds": ["uuid-1", "uuid-2"]
  },
  "notes": "Preventive spray",
  "productUsages": [
    {
      "productId": "uuid",
      "productUsageRuleId": "uuid",
      "quantityUsed": 30,
      "unit": "ml",
      "notes": ""
    }
  ],
  "allowInventoryShortage": false
}
```

Response:
```json
{
  "data": {
    "activity": {},
    "inventoryEffects": [],
    "quarantinePeriods": [],
    "suggestedTasks": [],
    "warnings": []
  }
}
```

Validation:
- type required
- performedAt required
- targetScopeType required
- targetSelection must match targetScopeType
- productUsageRuleId optional but if provided must belong to product
- quantityUsed > 0

---

## 15.10 Problems API

### POST /api/v1/problems
Multipart or metadata-first flow.

JSON metadata shape:
```json
{
  "type": "problem",
  "placeId": "uuid",
  "targetType": "bed",
  "targetId": "uuid",
  "title": "Leaf spots on tomatoes",
  "description": "Dark spots on lower leaves",
  "category": "fungus",
  "severity": "medium",
  "status": "open",
  "observedAt": "2026-05-13T10:00:00+03:00"
}
```

Validation:
- type problem or observation
- title required
- description required
- target must exist and belong to place/account

---

## 15.11 Tasks API

### POST /api/v1/tasks
Request:
```json
{
  "placeId": "uuid",
  "type": "fertilizing",
  "dueDate": "2026-05-20",
  "notes": "",
  "status": "planned",
  "targetScopeType": "selected_beds",
  "targetSelection": {
    "bedIds": ["uuid"]
  }
}
```

Validation:
- type allowed values
- dueDate required
- targetScopeType required
- targetSelection must match targetScopeType
- resolved targets non-empty
- backend sets sourceType = manual for this endpoint
- if status = planned, backend sets confirmedAt and creates reminders immediately
- if status = suggested, reminders must not be created

### POST /api/v1/tasks/:id/confirm
No body required.

Response:
```json
{
  "data": {
    "id": "uuid",
    "status": "planned",
    "confirmedAt": "2026-05-13T12:00:00+03:00"
  }
}
```

---

## 15.12 Calendar API

### GET /api/v1/calendar?from=2026-05-01&to=2026-05-31&placeId=uuid
Response:
```json
{
  "data": {
    "activities": [],
    "tasks": [],
    "quarantinePeriods": [],
    "weatherEvents": []
  }
}
```

---

## 15.13 AI product ingestion API

### POST /api/v1/ai/product-ingestion
Request:
```json
{
  "productName": "Example Product",
  "labelText": "Optional extracted label text"
}
```

or multipart with image.

Response:
```json
{
  "data": {
    "aiSession": {
      "id": "uuid",
      "kind": "product_ingestion",
      "status": "completed"
    },
    "suggestions": [
      {
        "id": "uuid",
        "suggestionType": "product",
        "payload": {}
      },
      {
        "id": "uuid",
        "suggestionType": "product_rule",
        "payload": {}
      }
    ]
  }
}
```

---

## 15.14 AI suggestion acceptance API

### POST /api/v1/ai/suggestions/:id/accept
Response:
```json
{
  "data": {
    "acceptedSuggestionId": "uuid",
    "createdEntities": [
      { "entityType": "product", "entityId": "uuid" },
      { "entityType": "product_usage_rule", "entityId": "uuid" }
    ]
  }
}
```

---

## 15.15 Push subscription API

### POST /api/v1/push/subscriptions
Request:
```json
{
  "endpoint": "...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  },
  "userAgent": "..."
}
```

Validation:
- endpoint required
- p256dh required
- auth required

---

## 15.16 Weather confirmation API

### POST /api/v1/weather/events/:id/confirm-rain
Request:
```json
{
  "response": "confirmed_yes"
}
```

Allowed values:
- confirmed_yes
- confirmed_no
- ignored

---

# 16. Validation strategy

## 16.1 Recommended tooling
Use schema-based validation library, for example:
- Zod
- Valibot
- Yup

Recommended: **Zod**

## 16.2 Validation layers
### Controller layer
Validates:
- request params
- request body
- request query

### Service layer
Validates:
- cross-entity consistency
- business rules
- workflow preconditions

### Database layer
Validates:
- FK integrity
- check constraints
- uniqueness

All three layers are useful. None replaces the others.

---

# 17. Error model

## 17.1 Standard error codes
Recommended codes:
- VALIDATION_ERROR
- NOT_FOUND
- FORBIDDEN
- CONFLICT
- BUSINESS_RULE_VIOLATION
- INVENTORY_SHORTAGE
- EXTERNAL_SERVICE_ERROR
- INTERNAL_ERROR

## 17.2 Example mapping
- malformed request -> VALIDATION_ERROR
- target not found -> NOT_FOUND
- cross-account access -> FORBIDDEN
- duplicate active usage rule -> CONFLICT
- stock too low -> INVENTORY_SHORTAGE
- AI provider timeout -> EXTERNAL_SERVICE_ERROR

## 17.3 Error class shape
```ts
class AppError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
}
```

---

# 18. Controller design rules

Controllers should:
- parse request
- invoke validation schema
- call service
- map result to response

Controllers should not:
- write queries directly
- call multiple repositories
- perform workflow orchestration
- know inventory allocation details

---

# 19. Audit logging policy

## Recommended audit events
Log at minimum:
- place archive/update
- product update
- product usage rule create/update/archive
- inventory adjustment
- create activity
- confirm suggested task
- dismiss suggested task
- accept AI suggestion
- weather rain confirmation

Audit logs should live in service layer after business decision, not inside generic repository methods.

---

# 20. Suggested implementation order from here

## Step 1
Define:
- shared types
- error classes
- db transaction abstraction
- repository interfaces

## Step 2
Implement repositories for:
- places
- plants
- perennials
- beds
- plantings
- products
- inventory

## Step 3
Implement `ActivitiesService` first.
This is the hardest and most central workflow.

## Step 4
Implement:
- tasks
- problems
- quarantine
- calendar

## Step 5
Implement integrations:
- storage
- push
- weather
- AI

---

# 21. Best immediate next coding target

The single best next implementation target is:

## `ActivitiesService.createActivity`

Because it exercises:
- target resolution
- product/rule consistency
- inventory deduction
- quarantine generation
- task suggestion generation
- transaction orchestration

If this flow is designed cleanly, the rest of the backend will be much easier.

---

# 22. Final recommendation

Continue in this exact order:

1. **Repository interfaces**
2. **Shared DTO and validation schemas**
3. **ActivitiesService transaction flow**
4. **Concrete repository implementations**
5. **Controllers**
6. **Integrations**

That keeps the project aligned with the already fixed architecture:
- self-hosted Supabase Postgres with PostgreSQL domain model
- backend-owned business logic
- explicit auditability
- no hidden state
- safe bulk targeting
- service-layer transaction orchestration
