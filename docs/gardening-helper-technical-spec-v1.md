# Gardening Helper — Technical Specification v1

## 1. Purpose

This document translates the approved product scope and functional specification into an implementation-oriented technical specification.

It defines:

- architecture
- domain entities
- relationships
- key business rules
- API surface
- background processing boundaries
- storage design
- AI/weather/notification integration boundaries

This specification is intended to be stable enough to start implementation.

---

## 2. Scope Alignment

This technical specification implements the product requirements defined in:

- **Product Scope**
- **Functional Specification v1**

It specifically supports:

- places with optional weather integration
- trees/perennials, beds, persistent bed plants, yearly bed plantings
- activity logging with bulk targeting
- problems with photos and observations without photos in v1
- products, plant-specific usage rules, inventory lots and movements
- tasks, suggestions, quarantine periods, reminders
- weather-aware task context
- AI-assisted product ingestion and planting suggestions

---

## 3. Recommended Technology Stack

## 3.1 Frontend
- **Angular** latest stable
- Standalone components
- Signals-based state where practical
- Angular Router
- Angular Service Worker for PWA
- IndexedDB for lightweight offline caching of read data and queued actions later
- Native browser APIs for:
  - push notifications
  - camera/file upload
  - installable PWA behavior

## 3.2 Backend
- **Node.js + TypeScript**
- **Fastify**
- Modular monolith architecture
- REST API
- Background job runner inside same deployable service for v1 if hosting allows, otherwise scheduled worker process

## 3.3 Database
- **self-hosted Supabase Postgres**
- Strong relational model
- JSONB only where flexibility is warranted
- Soft-archive instead of hard delete for business entities

## 3.4 Storage
- **self-hosted Supabase Storage** for uploaded photos through `StoragePort`
- Store only metadata in database

## 3.5 External integrations
- self-hosted Supabase Auth through `AuthPort`
- Open-Meteo through `WeatherPort`
- LLM provider for AI assistance
- raw Web Push with VAPID through `PushPort`

## 3.6 Deployment target
Selected:
- Hetzner VPS
- Docker Compose
- Angular PWA frontend + Fastify API + background worker/scheduler
- self-hosted Supabase Postgres/Auth/Storage plus REST/Meta/Studio as needed
- keep architecture compatible with future native mobile clients

---

## 4. Architecture

## 4.1 High-level architecture

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

## 4.1.1 Infrastructure Decision — Hetzner + Self-hosted Supabase

Gardening Helper v1 runs on a Hetzner VPS using Docker Compose.

Application architecture remains backend-owned:
- Angular does not access application tables directly.
- Fastify API owns business logic, validation, transactions, account scoping and side effects.
- Supabase service role key is backend-only.
- Supabase Auth may be used for authentication/session handling.
- All application data access goes through the Fastify API.
- Integrations remain behind ports/adapters.

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

Hard rules:
- Do not replace the Fastify API with direct Supabase table access.
- Do not move business logic to frontend.
- Do not move business side effects to database triggers.
- Keep repository + transaction abstraction.
- Keep provider access behind ports/adapters.

## 4.2 Architectural style
Use a **modular monolith**, not microservices.

Reason:
- domain is broad but still manageable
- lower complexity for v1
- easier consistency across activity, inventory, tasks, weather, and AI
- easier future extraction if one module becomes heavy

## 4.3 Backend modules
Recommended internal modules:

- auth
- places
- plants
- perennials
- beds
- bed_plantings
- activities
- problems
- products
- inventory
- tasks
- quarantine
- weather
- ai
- files
- notifications
- audit

## 4.4 Core design principles
- preserve history
- avoid hidden derived truth
- keep automation reviewable
- model bulk actions explicitly
- separate definition data from operational data
- allow future multi-user growth without rewriting core entities

---

## 5. Identity, Ownership, and Deletion Strategy

## 5.1 Ownership model
v1 is single-user oriented, but every top-level business record should still carry `account_id` so the schema does not collapse when sharing is added later.

Recommended:
- `accounts`
- every business table references `account_id`

## 5.2 IDs
Use UUIDs for all major entities.

## 5.3 Deletion strategy
- hard delete allowed only for brand-new or obviously mistaken records where no dependent history exists
- otherwise use:
  - `archived_at`
  - status transitions
- activities, inventory movements, and task history should generally never be hard deleted

---

## 6. Domain Model

## 6.1 Core entities overview

### Foundation
- accounts
- places
- plants

### Physical growing structure
- perennials
- beds
- persistent_bed_plants
- yearly_bed_plantings

### Operations
- activities
- activity_targets
- activity_product_usages

### Problems
- problems
- problem_photos

### Products and inventory
- products
- product_usage_rules
- inventory_lots
- inventory_movements

### Planning
- tasks
- task_targets
- quarantine_periods
- task_reminders

### Integrations/support
- weather_events
- ai_sessions
- ai_suggestions
- push_subscriptions
- audit_logs

Weather configuration lives on `places` in the v1 schema. A separate `weather_place_settings` table is a future extraction only.

---

## 7. Relational Entity Definitions

## 7.1 accounts
Represents the owning user/workspace boundary.

Fields:
- id UUID PK
- display_name
- created_at
- archived_at nullable

Notes:
- v1 can have one row, but keep the boundary explicit

---

## 7.2 places
Represents a garden/orchard/yard location.

Fields:
- id UUID PK
- account_id UUID FK -> accounts.id
- name text not null
- description text nullable
- notes text nullable
- weather_enabled boolean not null default false
- weather_location_label text nullable
- latitude numeric nullable
- longitude numeric nullable
- timezone text nullable
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

Constraints:
- either location label or lat/lng can be used
- archived places remain visible in history

Indexes:
- (account_id, archived_at)
- optional geolocation index later

---

## 7.3 plants
Reusable plant reference database owned by user.

Fields:
- id UUID PK
- account_id UUID FK -> accounts.id
- common_name text not null
- variety text nullable
- plant_category text nullable
- lifecycle_type text not null
- growing_style text not null
- notes text nullable
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

Constraints:
- lifecycle_type in ('annual', 'biennial', 'perennial')
- growing_style in ('tree','shrub','vine','herb','vegetable','berry','flower','other')

Indexes:
- (account_id, common_name)
- trigram/full-text search optional

---

## 7.4 perennials
Individually tracked trees/shrubs/vines/perennial items.

Fields:
- id UUID PK
- account_id UUID FK
- place_id UUID FK -> places.id
- plant_id UUID FK -> plants.id
- label text nullable
- planted_year int nullable
- notes text nullable
- status text not null
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

Constraints:
- status in ('active','removed','dead','archived')

Indexes:
- (place_id, status)
- (account_id, plant_id)

---

## 7.5 beds
Physical garden bed.

Fields:
- id UUID PK
- account_id UUID FK
- place_id UUID FK -> places.id
- name text not null
- description text nullable
- notes text nullable
- width_m numeric nullable
- length_m numeric nullable
- area_m2 numeric generated or nullable
- status text not null
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

Constraints:
- status in ('active','removed','archived')
- width_m is null or width_m > 0
- length_m is null or length_m > 0
- area_m2 is null or area_m2 > 0

Indexes:
- (place_id, status)

---

## 7.6 persistent_bed_plants
Plants that remain in a bed across years.

Fields:
- id UUID PK
- account_id UUID FK
- bed_id UUID FK -> beds.id
- plant_id UUID FK -> plants.id
- planted_year int nullable
- quantity numeric nullable
- notes text nullable
- status text not null
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

Constraints:
- status in ('active','removed','archived')

Indexes:
- (bed_id, status)

---

## 7.7 yearly_bed_plantings
Annual crop entries for a bed/year.

Fields:
- id UUID PK
- account_id UUID FK
- bed_id UUID FK -> beds.id
- plant_id UUID FK -> plants.id
- year int not null
- quantity numeric nullable
- notes text nullable
- status text not null
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

Constraints:
- status in ('planned','planted','removed','harvested','archived')

Indexes:
- (bed_id, year)
- (account_id, year)
- (bed_id, plant_id, year)

Rule:
- duplicates are allowed because same plant may appear in separate rows/sections of a bed in same year

---

## 7.8 products
Product master data.

Fields:
- id UUID PK
- account_id UUID FK
- name text not null
- category text not null
- active_substance text nullable
- manufacturer text nullable
- formulation text nullable
- default_unit text not null
- notes text nullable
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

Constraints:
- category in (
  'insecticide','fungicide','pesticide','fertilizer',
  'foliar_fertilizer','biostimulant','soil_amendment','other_preparation'
)
- default_unit in ('ml','l','g','kg')

Indexes:
- (account_id, name)

---

## 7.9 product_usage_rules
Plant-specific product usage sections.

Fields:
- id UUID PK
- account_id UUID FK
- product_id UUID FK -> products.id
- plant_id UUID FK -> plants.id
- dose_value numeric not null
- dose_unit text not null
- dilution_text text nullable
- application_method text nullable
- reapplication_interval_days int nullable
- quarantine_period_days int nullable
- notes text nullable
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

Constraints:
- dose_value > 0
- dose_unit in ('ml','l','g','kg')
- reapplication_interval_days >= 0
- quarantine_period_days >= 0

Indexes:
- (product_id, plant_id)

Important:
- multiple rules per product/plant may be allowed later
- for v1, keep one active rule per product + plant unless there is a clear reason to version

Optional constraint:
- unique(product_id, plant_id) where archived_at is null

---

## 7.10 inventory_lots
Purchased/owned stock lots.

Fields:
- id UUID PK
- account_id UUID FK
- product_id UUID FK -> products.id
- quantity_initial numeric not null
- quantity_remaining numeric not null
- unit text not null
- purchase_date date nullable
- expiry_date date nullable
- batch_number text nullable
- notes text nullable
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

Constraints:
- unit in ('ml','l','g','kg')
- quantity_initial > 0
- quantity_remaining >= 0

Indexes:
- (product_id, archived_at)
- (expiry_date)

Design note:
- no lot should become negative in v1; if shortage is explicitly allowed, create movements only for covered stock and return a warning for the uncovered quantity

---

## 7.11 inventory_movements
Immutable stock ledger.

Fields:
- id UUID PK
- account_id UUID FK
- product_id UUID FK -> products.id
- inventory_lot_id UUID FK -> inventory_lots.id nullable
- movement_type text not null
- quantity numeric not null
- unit text not null
- activity_id UUID FK -> activities.id nullable
- occurred_at timestamptz not null
- notes text nullable
- created_at timestamptz not null

Constraints:
- movement_type in ('purchase','manual_adjustment','consumption','correction')
- quantity > 0

Indexes:
- (product_id, occurred_at)
- (activity_id)

Rule:
- do not update history rows silently; corrections should use new movement rows

---

## 7.12 activities
Operational log header.

Fields:
- id UUID PK
- account_id UUID FK
- place_id UUID FK -> places.id nullable
- type text not null
- performed_at timestamptz not null
- target_scope_type text not null
- notes text nullable
- created_at timestamptz not null
- updated_at timestamptz not null

Constraints:
- type in (
  'watering','treatment','fertilizing','pruning','planting',
  'transplanting','harvesting','observation','maintenance','soil_work','custom'
)
- target_scope_type in (
  'whole_place','all_perennials_in_place','selected_perennials',
  'all_beds_in_place','selected_beds','single_bed',
  'selected_yearly_plantings','selected_persistent_bed_plants'
)

Indexes:
- (account_id, performed_at desc)
- (place_id, performed_at desc)
- (type, performed_at desc)

Design note:
- `place_id` should be set whenever resolvable, even for selected targets, to simplify filtering

---

## 7.13 activity_targets
Resolved targets for an activity.

Fields:
- id UUID PK
- activity_id UUID FK -> activities.id
- target_type text not null
- target_id UUID not null
- created_at timestamptz not null

Constraints:
- target_type in ('place','perennial','bed','yearly_bed_planting','persistent_bed_plant')

Indexes:
- (activity_id)
- (target_type, target_id)

Important:
- this table preserves what was actually targeted
- even if user selected “all beds”, system should persist the resolved bed rows here

---

## 7.14 activity_product_usages
Links product consumption and rule selection to an activity.

Fields:
- id UUID PK
- activity_id UUID FK -> activities.id
- product_id UUID FK -> products.id
- product_usage_rule_id UUID FK -> product_usage_rules.id nullable
- quantity_used numeric not null
- unit text not null
- created_stock_movement boolean not null default false
- created_quarantine boolean not null default false
- created_followup_suggestion boolean not null default false
- notes text nullable
- created_at timestamptz not null

Constraints:
- quantity_used > 0
- unit in ('ml','l','g','kg')

Indexes:
- (activity_id)
- (product_id)

---

## 7.15 problems
Problem/observation records.

Fields:
- id UUID PK
- account_id UUID FK
- type text not null
- place_id UUID FK -> places.id
- target_type text not null
- target_id UUID not null
- title text not null
- description text not null
- category text nullable
- severity text nullable
- status text not null
- observed_at timestamptz not null
- linked_activity_id UUID FK -> activities.id nullable
- created_at timestamptz not null
- updated_at timestamptz not null

Constraints:
- type in ('problem','observation')
- target_type in ('place','perennial','bed','yearly_bed_planting','persistent_bed_plant')
- status in ('open','monitoring','resolved')
- category in (
  'insect','fungus','bacteria','nutrient_deficiency',
  'watering_issue','weather_damage','growth_issue','unknown','other'
) or null

Indexes:
- (place_id, observed_at desc)
- (target_type, target_id)
- (status, observed_at desc)

---

## 7.16 problem_photos
Metadata for uploaded problem images.

Fields:
- id UUID PK
- problem_id UUID FK -> problems.id
- storage_key text not null
- original_filename text nullable
- mime_type text nullable
- file_size_bytes bigint nullable
- width_px int nullable
- height_px int nullable
- created_at timestamptz not null

Indexes:
- (problem_id)

---

## 7.17 tasks
Planned/suggested future actions.

Fields:
- id UUID PK
- account_id UUID FK
- place_id UUID FK -> places.id nullable
- type text not null
- due_date date not null
- notes text nullable
- source_type text nullable
- source_reference_id UUID nullable
- target_scope_type text not null
- status text not null
- created_at timestamptz not null
- updated_at timestamptz not null
- confirmed_at timestamptz nullable
- completed_at timestamptz nullable

Constraints:
- type in ('spraying','fertilizing','pruning','planting','harvest_reminder','custom')
- status in ('suggested','planned','done','skipped','canceled')
- source_type in ('activity','manual','weather','ai') or null
- target_scope_type in (
  'whole_place','all_perennials_in_place','selected_perennials',
  'all_beds_in_place','selected_beds','single_bed',
  'selected_yearly_plantings','selected_persistent_bed_plants'
)

Indexes:
- (account_id, due_date)
- (status, due_date)
- (place_id, due_date)

---

## 7.18 task_targets
Resolved targets for a task.

Fields:
- id UUID PK
- task_id UUID FK -> tasks.id
- target_type text not null
- target_id UUID not null
- created_at timestamptz not null

Constraints:
- target_type in ('place','perennial','bed','yearly_bed_planting','persistent_bed_plant')

Indexes:
- (task_id)
- (target_type, target_id)

---

## 7.19 task_reminders
Notification schedule rows.

Fields:
- id UUID PK
- task_id UUID FK -> tasks.id
- reminder_type text not null
- scheduled_for timestamptz not null
- sent_at timestamptz nullable
- status text not null
- created_at timestamptz not null

Constraints:
- reminder_type in ('day_before','same_day')
- status in ('scheduled','sent','failed','canceled')

Indexes:
- (scheduled_for, status)

---

## 7.20 quarantine_periods
Informational restricted windows generated from treatment.

Fields:
- id UUID PK
- account_id UUID FK
- place_id UUID FK -> places.id nullable
- activity_id UUID FK -> activities.id
- activity_product_usage_id UUID FK -> activity_product_usages.id
- product_id UUID FK -> products.id
- starts_on date not null
- ends_on date not null
- notes text nullable
- created_at timestamptz not null

Indexes:
- (place_id, starts_on, ends_on)
- (activity_id)

Rule:
- targets are derived from activity_targets for the linked activity

---

## 7.21 Weather place settings
Weather configuration is stored on `places` in the v1 schema.

Existing v1 fields:
- weather_enabled boolean not null default false
- weather_location_label text nullable
- latitude numeric nullable
- longitude numeric nullable
- timezone text nullable

Future note:
- a separate `weather_place_settings` table may be introduced later if Open-Meteo/place weather configuration outgrows the `places` fields

---

## 7.22 weather_events
Weather observations/relevant snapshots linked to tasks/activities.

Fields:
- id UUID PK
- account_id UUID FK
- place_id UUID FK -> places.id
- related_entity_type text not null
- related_entity_id UUID not null
- event_type text not null
- forecasted_rain boolean nullable
- observed_rain boolean nullable
- user_confirmation_status text nullable
- provider_payload jsonb nullable
- created_at timestamptz not null
- updated_at timestamptz not null

Constraints:
- related_entity_type in ('task','activity')
- event_type in ('rain_check','forecast_snapshot')
- user_confirmation_status in ('pending','confirmed_yes','confirmed_no','ignored') or null

Indexes:
- (place_id, related_entity_type, related_entity_id)

Purpose:
- preserve rain confirmation history instead of keeping only transient UI state

---

## 7.23 ai_sessions
Tracks AI-assisted interactions.

Fields:
- id UUID PK
- account_id UUID FK
- kind text not null
- input_mode text not null
- status text not null
- raw_input_text text nullable
- related_entity_type text nullable
- related_entity_id UUID nullable
- created_at timestamptz not null
- updated_at timestamptz not null

Constraints:
- kind in ('product_ingestion','bed_planning','problem_assist')
- input_mode in ('name','text','image','mixed')
- status in ('pending','completed','failed','dismissed','accepted')

Indexes:
- (account_id, created_at desc)

---

## 7.24 ai_suggestions
Structured AI outputs awaiting acceptance or retained for history.

Fields:
- id UUID PK
- ai_session_id UUID FK -> ai_sessions.id
- suggestion_type text not null
- payload jsonb not null
- accepted boolean nullable
- accepted_at timestamptz nullable
- created_at timestamptz not null

Constraints:
- suggestion_type in ('product','product_rule','bed_plan','problem_summary','followup_questions')

Purpose:
- keep AI outputs auditable and editable before saving final business data

---

## 7.25 audit_logs
High-value change history.

Fields:
- id UUID PK
- account_id UUID FK
- actor_type text not null
- actor_id UUID nullable
- entity_type text not null
- entity_id UUID not null
- action text not null
- before_json jsonb nullable
- after_json jsonb nullable
- created_at timestamptz not null

Indexes:
- (entity_type, entity_id)
- (created_at desc)

Recommended tracked actions:
- product updates
- usage rule changes
- inventory corrections
- task confirmation/dismissal
- place weather setting changes

---

## 8. Relationship Summary

## 8.1 Main one-to-many relationships
- account -> places
- account -> plants
- place -> perennials
- place -> beds
- bed -> persistent_bed_plants
- bed -> yearly_bed_plantings
- product -> product_usage_rules
- product -> inventory_lots
- product -> inventory_movements
- activity -> activity_targets
- activity -> activity_product_usages
- task -> task_targets
- task -> task_reminders
- problem -> problem_photos
- ai_session -> ai_suggestions

## 8.2 Cross-module relationships
- activity_product_usage may reference product_usage_rule
- activity_product_usage may generate inventory_movements
- activity_product_usage may generate quarantine_periods
- activity may generate suggested task(s)
- problem may link to activity
- weather_events may link to tasks or activities
- AI accepted suggestions may create products, usage rules, or planning notes

---

## 9. Targeting Model

## 9.1 Why a separate target table is necessary
The app must support:
- one target
- many targets
- all targets in a place

A single foreign key on `activities` or `tasks` would break quickly.

## 9.2 Chosen design
Use:
- `activities.target_scope_type` for original user intent
- `activity_targets` for resolved concrete targets
- `tasks.target_scope_type` for original user intent
- `task_targets` for resolved concrete targets

Example:
User selects “all trees in Orchard A”
- `activities.target_scope_type = all_perennials_in_place`
- `activity_targets` contains one row per perennial actually targeted

That preserves:
- auditability
- future reporting
- stable downstream processing

---

## 10. Inventory Model and Deduction Logic

## 10.1 Source of truth
Use `inventory_movements` as the ledger truth.
`inventory_lots.quantity_remaining` is a convenience field maintained transactionally.

## 10.2 Consumption workflow
When saving an activity with product usage:
1. create activity
2. resolve and save targets
3. create activity_product_usage
4. allocate consumption against lots using FEFO by default:
   - earliest expiry first
   - then oldest purchase date
5. create one or more consumption inventory_movements
6. update affected lots.quantity_remaining
7. if applicable, create quarantine_period
8. if applicable, create suggested future task

## 10.3 Inventory shortage policy
Recommended v1:
- reject if available stock < requested usage and `allowInventoryShortage = false`
- allow only when the user explicitly sets the shortage override
- do not create movements for uncovered stock

Recommended implementation:
- create consumption movements only for quantities covered by existing lots
- reduce covered lots to zero as needed
- return an explicit warning with uncovered quantity

Do not create fake stock or shortage-backed consumption movements for uncovered quantity.

---

## 11. Task and Reminder Model

## 11.1 Suggested vs planned
A suggestion is still a task row:
- `status = suggested`

When user confirms:
- update to `planned`
- generate reminders

## 11.2 Reminder generation
When task becomes planned:
- create `day_before` reminder at local place/account timezone
- create `same_day` reminder

## 11.3 Task completion
When user marks task done:
- set status = done
- optionally create linked activity via dedicated workflow

Do not silently auto-create activity on reminder firing.

---

## 12. Quarantine Model

## 12.1 Generation
Generated only when:
- activity type is treatment/fertilizing where applicable
- applied rule has `quarantine_period_days`

## 12.2 Date calculation
- `starts_on = performed_at::date`
- `ends_on = starts_on + quarantine_period_days`

## 12.3 Calendar behavior
Expose quarantine periods as read-only calendar overlays with linked activity/product context.

---

## 13. Weather Integration Design

## 13.1 Scope
Weather is informational and workflow-supporting, not autonomous control.

## 13.2 Selected provider abstraction
Open-Meteo is the selected weather provider.
All weather access goes through the backend `WeatherPort`:

- `getForecastForPlace(placeId, dateRange)`
- `getRainRiskForTask(taskId)`
- `captureForecastSnapshot(placeId, entityRef)`

## 13.3 Rain confirmation flow
For relevant treatment task/activity:
1. fetch forecast around due/performed date
2. if rain likely, create/update `weather_events` with pending confirmation
3. surface prompt to user
4. user response updates:
   - confirmed_yes
   - confirmed_no
   - ignored

Optional future:
- if confirmed_yes, suggest follow-up task

## 13.4 Important rule
Never auto-mark treatment ineffective.

---

## 14. AI Integration Boundaries

## 14.1 Architecture
AI requests should go through backend orchestration, not directly from client to model provider.

Reasons:
- key security
- payload normalization
- auditability
- provider isolation behind `AiPort`

## 14.2 Supported AI workflows

### Product ingestion
Input:
- product name
- label text
- uploaded label photo

Output:
- suggested product fields
- suggested rules
- extracted notes

### Bed planning
Input:
- bed dimensions
- current yearly plantings
- persistent plants

Output:
- spacing suggestions
- coexistence notes
- rough quantities
- incompatibility warnings

### Problem assist
Input:
- problem text and optional context
Output:
- category suggestions
- summary
- follow-up questions

## 14.3 Save boundary
AI output is stored in `ai_suggestions`.
Business records are only created after explicit acceptance.

## 14.4 Suggested API contract shape
Return:
- structured payload
- confidence notes
- warnings
- editable fields

---

## 15. File/Photo Handling

## 15.1 Supported file type in v1
- problem photos only

## 15.2 Upload pattern
Recommended:
1. client requests upload URL/token from backend
2. uploads file through a backend-mediated Supabase Storage flow
3. backend finalizes metadata row in `problem_photos`

Or, for simpler backend-managed flow:
- multipart upload directly to API
- API streams to storage
- API saves metadata

## 15.3 Image processing
Optional in v1:
- strip overly large dimensions
- generate web-sized preview
- keep original if storage budget allows

---

## 16. API Design

## 16.1 API style
REST JSON API.

Base path:
`/api/v1`

## 16.2 Response conventions
Success:
```json
{ "data": ... }
```

Validation failure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "field": ["message"] }
  }
}
```

---

## 17. Core API Surface

## 17.1 Places

### GET /places
List active places.

### POST /places
Create place.

Body:
```json
{
  "name": "Home Garden",
  "description": "Back yard and orchard",
  "notes": "",
  "weatherEnabled": true,
  "weatherLocationLabel": "Ruse, Bulgaria",
  "latitude": 43.84,
  "longitude": 25.95,
  "timezone": "Europe/Sofia"
}
```

### GET /places/:id
Get place detail.

### PATCH /places/:id
Update place.

### POST /places/:id/archive
Archive place.

Weather forecast context is exposed by:
- `GET /places/:placeId/weather/forecast`

---

## 17.2 Plants

### GET /plants
Search/list plant definitions.

### POST /plants
Create plant.

### GET /plants/:id
Get plant.

### PATCH /plants/:id
Update plant.

### POST /plants/:id/archive
Archive plant.

---

## 17.3 Perennials

### GET /places/:placeId/perennials
List perennials for place.

### POST /places/:placeId/perennials
Create perennial.

### GET /perennials/:id
Get perennial.

### PATCH /perennials/:id
Update perennial.

### POST /perennials/:id/archive
Archive perennial.

---

## 17.4 Beds

### GET /places/:placeId/beds
List beds.

### POST /places/:placeId/beds
Create bed.

### GET /beds/:id
Get bed detail including active persistent plants and yearly plantings.

### PATCH /beds/:id
Update bed.

### POST /beds/:id/archive
Archive bed.

---

## 17.5 Persistent bed plants

### POST /beds/:bedId/persistent-plants
Add persistent plant.

### PATCH /persistent-bed-plants/:id
Update persistent plant.

### POST /persistent-bed-plants/:id/archive
Archive/remove persistent plant.

---

## 17.6 Yearly bed plantings

### GET /beds/:bedId/plantings?year=2026
List bed plantings by year.

### POST /beds/:bedId/plantings
Create yearly planting.

### PATCH /plantings/:id
Update planting.

### POST /plantings/:id/archive
Archive planting.

---

## 17.7 Products

### GET /products
List/search products.

### POST /products
Create product manually.

### GET /products/:id
Get product with rules and inventory summary.

### PATCH /products/:id
Update product.

### POST /products/:id/archive
Archive product.

---

## 17.8 Product usage rules

### POST /products/:productId/rules
Create usage rule.

### PATCH /product-rules/:id
Update rule.

### POST /product-rules/:id/archive
Archive rule.

---

## 17.9 Inventory

### GET /inventory
Get inventory summary.

### GET /products/:productId/inventory-lots
List lots.

### POST /products/:productId/inventory-lots
Create purchase lot.

### GET /products/:productId/inventory-movements
List movement history.

### POST /inventory/adjustments
Manual stock adjustment.

Body:
```json
{
  "productId": "uuid",
  "inventoryLotId": "uuid-or-null",
  "quantity": 100,
  "unit": "ml",
  "notes": "Corrected remaining amount after measuring"
}
```

---

## 17.10 Activities

### GET /activities
List activities with filters:
- placeId
- type
- from
- to
- targetType
- targetId

### POST /activities
Create activity.

Example body:
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
  "allowInventoryShortage": true
}
```

### GET /activities/:id
Get activity detail with targets, products, generated effects.

### POST /activities/:id/correct
Create correction workflow if activity was wrong.

Recommended:
- do not mutate history invisibly
- correction endpoint can reverse inventory and derived effects explicitly

---

## 17.11 Problems

### GET /problems
List problems/observations with filters.

### POST /problems
Create problem or observation.

### GET /problems/:id
Get problem with photos.

### PATCH /problems/:id
Update status/details.

### POST /problems/:id/photos
Upload or attach photo metadata.

---

## 17.12 Tasks

### GET /tasks
List tasks with filters:
- status
- dueFrom
- dueTo
- placeId

### POST /tasks
Create manual task.

Use `targetScopeType` plus structured `targetSelection`; backend resolves and persists `task_targets`.

### GET /tasks/:id
Get task detail.

### PATCH /tasks/:id
Update editable fields.

### POST /tasks/:id/confirm
Confirm suggested task -> planned.

### POST /tasks/:id/dismiss
Dismiss suggested task -> canceled.

### POST /tasks/:id/complete
Mark done.

### POST /tasks/:id/skip
Mark skipped.

---

## 17.13 Calendar

### GET /calendar
Return merged calendar feed.

Query:
- placeId optional
- from required
- to required

Response sections:
- activities
- tasks
- quarantinePeriods
- weatherEvents optional

---

## 17.14 Weather

### GET /places/:placeId/weather/forecast
Get forecast for place.

### POST /weather/events/:id/confirm-rain
Confirm rain status.

Body:
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

## 17.15 AI

### POST /ai/product-ingestion
Input:
- productName optional
- labelText optional
- imageFile optional

Returns:
- aiSession
- suggestions

### POST /ai/bed-planning
Input:
- bedId
- year
- candidatePlantIds optional
- notes optional

Returns:
- spacing/coexistence suggestion payload

### POST /ai/problem-assist
Input:
- problemId or ad hoc text

### POST /ai/suggestions/:id/accept
Accept AI suggestion and create/update business record as applicable.

### POST /ai/suggestions/:id/reject
Reject suggestion.

---

## 18. Request Validation Rules

## 18.1 Cross-entity account safety
All referenced entities in a request must belong to the same account/workspace.

## 18.2 Place consistency
If an activity specifies `placeId`, every resolved target must belong to that place.

## 18.3 Product usage consistency
If `productUsageRuleId` is supplied, it must belong to `productId`.

## 18.4 Reminder generation
Only `planned` tasks receive reminders.

## 18.5 Photo attachment
Problem photo upload only allowed for `type = problem` in v1, not observation.

---

## 19. Transaction Boundaries

## 19.1 Create activity transaction
The following should be one database transaction:

- insert activities row
- insert activity_targets
- insert activity_product_usages
- create inventory_movements
- update inventory_lots
- create quarantine_periods
- create suggested tasks

If any step fails:
- entire transaction rolls back

## 19.2 Why this matters
This is the highest integrity workflow in the system.

---

## 20. Read Models / Derived Queries

Recommended DB views or backend read models:

- `inventory_product_balances`
- `bed_current_contents`
- `calendar_items_view`
- `activity_detail_view`
- `task_detail_view`

Do not store denormalized truth unless operationally necessary.

---

## 21. Reporting Queries Needed Early

Recommended early reporting endpoints or internal queries:

- current place overview
- bed contents by year
- perennial history
- recent activities by place
- open problems
- low stock products
- upcoming tasks
- active quarantine periods
- products used over time on target plant

---

## 22. Authentication and Security

## 22.1 v1 auth
Selected:
- self-hosted Supabase Auth through `AuthPort`
- session/JWT verification is backend-owned

## 22.2 Authorization
Even for v1 single-user:
- enforce account scoping in backend on every query

## 22.3 File security
- signed access URLs or protected proxy
- no public bucket listing

## 22.4 AI and weather keys
- keep provider secrets server-side only
- keep Supabase service role key backend-only

---

## 23. PWA and Notification Architecture

## 23.1 PWA requirements
- installable
- responsive
- offline shell
- push-capable
- route caching for basic navigation

## 23.2 Notification flow
1. client registers push subscription
2. backend stores endpoint + keys
3. scheduled reminder job scans due reminders
4. backend sends push
5. reminder row updated to sent/failed

## 23.3 Offline support
For v1:
- focus on read caching and graceful failure
- do not promise full offline write sync unless explicitly built

---

## 24. Suggested Background Jobs

## 24.1 Reminder scheduler
Runs periodically:
- create reminder rows for newly planned tasks if not already created
- send due reminders

## 24.2 Weather checker
Runs periodically or on-demand:
- fetch relevant forecast snapshots for upcoming tasks
- create/update weather_events for rain checks

## 24.3 Cleanup jobs
- remove stale upload tokens
- prune failed transient AI sessions if needed

---

## 25. Error and Correction Strategy

## 25.1 Activities
Do not silently overwrite activities that already triggered inventory/quarantine/task side effects.

Hybrid correction model:
- fresh records without side effects may be edited through normal validated update flows
- records with side effects require explicit correction workflow
- correction workflow uses reverse/adjust operations for inventory and derived effects

## 25.2 Inventory
Corrections should append movements rather than rewriting history when possible.

## 25.3 AI accepted suggestions
Once accepted and converted to real records, later edits happen on the real records, not by mutating AI history.

---

## 26. Recommended Initial Implementation Order

## Phase 1
- auth/account boundary
- places
- plants
- perennials
- beds
- persistent plants
- yearly plantings

## Phase 2
- products
- rules
- inventory lots/movements
- activity logging with targets and product usage

## Phase 3
- problems + photo upload
- tasks + suggestions + calendar
- quarantine

## Phase 4
- notifications
- weather integration
- AI integrations

This order reduces risk because activity + inventory is the hardest integrity path.

---

## 27. Minimum Acceptance for Technical Readiness

Implementation can begin safely with these fixed decisions:

- modular monolith architecture
- self-hosted Supabase Postgres with PostgreSQL relational schema
- explicit target resolution tables
- immutable-ish inventory ledger model
- suggested-task workflow instead of silent automation
- backend-mediated AI integration
- Open-Meteo through backend-mediated `WeatherPort`
- PWA-first frontend with raw Web Push/VAPID notifications

---

## 28. Final Infrastructure and Provider Decisions

These decisions are fixed for Gardening Helper v1:

1. **Deployment**: Hetzner VPS + Docker Compose
2. **Database**: self-hosted Supabase Postgres
3. **Auth**: self-hosted Supabase Auth through `AuthPort`
4. **Object storage**: self-hosted Supabase Storage through `StoragePort`
5. **Weather provider**: Open-Meteo through `WeatherPort`
6. **Push infrastructure**: raw Web Push with VAPID through `PushPort`
7. **Correction workflow**: hybrid correction model

These decisions do not change the backend-owned architecture. Application data access still goes through the Fastify API, and business logic stays in services.

---

## 29. Summary

This technical specification keeps the system aligned with the already approved scope:

- structured but practical
- safe for bulk actions
- auditable around inventory and activities
- flexible enough for weather and AI
- simple enough to ship as a v1 modular monolith

The most important design choices are:

- explicit target resolution tables
- inventory as ledger + lots
- AI suggestions stored separately from accepted truth
- weather used as context, not automatic control
- suggested tasks instead of silent auto-created final tasks
