# Gardening Helper — Технически изисквания, Database Schema и ERD

## 1. Цел на документа

Този документ описва техническите изисквания и началния database design за **Gardening Helper** на база вече фиксирания Product Scope и Functional Specification v1.

Документът е предназначен да служи като implementation handoff за разработката.

---

# 2. Избран стек

## Frontend
- **Angular**
- **Angular Material**
- **PWA**
- Standalone components
- Reactive Forms
- Signals за локален UI state
- RxJS за async/data flows

## Backend
- **Node.js**
- **Fastify**
- **TypeScript**

## Database
- **Self-hosted Supabase Postgres**

## Storage
- **Self-hosted Supabase Storage** за problem photos, през `StoragePort`

## External integrations
- Self-hosted Supabase Auth през `AuthPort`
- Open-Meteo през `WeatherPort`
- AI / LLM provider
- Raw Web Push with VAPID през `PushPort`

## Deployment
- **Hetzner VPS**
- **Docker Compose**

---

# 3. Архитектурни принципи

## 3.1 Backend-owned business logic
Frontend-ът говори **само** с Fastify API.
Няма директен достъп от Angular до базата.

## 3.2 Self-hosted Supabase Postgres, не vendor-first domain
Схемата и домейнът се проектират като **чист PostgreSQL domain model**, изпълняван върху self-hosted Supabase Postgres.

## 3.3 Supabase services, но не Supabase-coupled domain
Gardening Helper v1 използва self-hosted Supabase за Postgres, Auth и Storage.
Това не променя backend-owned architecture и не означава директен frontend достъп до application tables.

Затова:
- не вкарваме Supabase SDK в core domain logic
- не зависим от Supabase-specific query patterns
- Supabase Auth минава през `AuthPort`
- Supabase Storage минава през `StoragePort`
- Open-Meteo минава през `WeatherPort`
- raw Web Push with VAPID минава през `PushPort`
- DB access е backend-only
- Supabase service role key е backend-only

## 3.4 No hidden truth
Не държим derived state като основна истина, ако може да се изчисли надеждно.

Примери:
- не пазим `is_low_stock` като source of truth
- не пазим `is_quarantine_active` като source of truth
- не пазим “all beds affected” като string/list в activity header без resolved targets

## 3.5 Auditability first
Следните неща трябва да останат traceable:
- activity history
- stock movements
- problems
- yearly plantings
- persistent plants
- suggested tasks
- quarantine periods
- AI suggestions

## 3.6 Bulk actions are first-class
Activity и Task моделът трябва да поддържат нормално:
- multiple trees
- multiple beds
- all trees in place
- all beds in place
- whole place

---

# 4. High-Level Architecture

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

---

# 4.1 Infrastructure Decision — Hetzner + Self-hosted Supabase

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
- Preserve source-of-truth priority from `docs_INDEX.md`.

---

# 5. Backend структура

## 5.1 Архитектурен стил
**Modular monolith**

Причини:
- v1 е достатъчно голям, но не оправдава microservices
- много свързани transaction-heavy модули
- по-лесно гарантиране на консистентност между activities, inventory, tasks и quarantine

## 5.2 Препоръчителна структура

```text
src/
  app/
  config/
  db/
    db.ts
    types.ts
    migrations/
  modules/
    auth/
    places/
    plants/
    perennials/
    beds/
    plantings/
    activities/
    problems/
    products/
    inventory/
    tasks/
    calendar/
    weather/
    ai/
    files/
    notifications/
  integrations/
    storage/
    auth/
    weather/
    ai/
    push/
  shared/
    errors/
    validation/
    plugins/
    utils/
```

---

# 6. DB Access Layer — self-hosted Supabase Postgres

## 6.1 Основен принцип
Domain services не трябва да зависят от Supabase client patterns, Studio, REST generated endpoints или конкретния deployment layout.

Те трябва да зависят от:
- repositories
- transaction abstraction

## 6.2 Препоръчителен подход
- `Kysely` като query builder / type-safe DB access layer
- PostgreSQL schema-first
- repositories по feature
- explicit transaction manager

## 6.3 Защо не Supabase-first access за application data
Ако backend-ът се върже директно за Supabase client patterns:
- transaction orchestration става по-неудобно
- domain layer се vendor-lock-ва
- сложни inventory/activity flows стават по-крехки

Self-hosted Supabase Postgres е избраната database runtime, но application data access остава backend-owned през repository + transaction abstraction.

## 6.4 Абстракции

### DbClient
Централен database entry point.

### DbTransaction
Transaction wrapper, подаван към repositories при complex write flows.

### Repository layer
Примерни repositories:
- PlaceRepository
- PlantRepository
- BedRepository
- ActivityRepository
- InventoryRepository
- TaskRepository
- ProductRepository

### Integration ports
Отделни interfaces за:
- auth
- storage
- weather
- ai
- notifications

---

# 7. Ключови модули и отговорности

## 7.1 Places
- CRUD за places
- weather enable/disable
- weather location config

## 7.2 Plants
- user-maintained plant database
- reusable plant references

## 7.3 Perennials
- individually tracked trees/shrubs/vines/perennials

## 7.4 Beds + Plantings
- beds
- persistent bed plants
- yearly bed plantings

## 7.5 Activities
- logging with bulk targets
- product usage linkage
- stock deduction
- quarantine generation
- follow-up task suggestions

## 7.6 Problems
- problem / observation records
- photo attachments

## 7.7 Products + Inventory
- product definitions
- plant-specific usage rules
- inventory lots
- inventory movements

## 7.8 Tasks + Calendar
- suggested / planned / done / skipped / canceled
- reminders
- calendar aggregation

## 7.9 Weather
- per-place weather support
- rain risk context
- user rain confirmation

## 7.10 AI
- product ingestion suggestions
- bed spacing/coexistence suggestions
- optional problem assistance

---

# 8. Database Design Principles

## 8.1 UUID keys
Всички основни таблици използват UUID primary keys.

## 8.2 Timestamps
Всички business entities имат:
- `created_at`
- `updated_at`
- при нужда `archived_at`

## 8.3 Archive over delete
За business data предпочитаме:
- `status`
- `archived_at`

вместо hard delete.

## 8.4 Strong constraints
Използваме:
- foreign keys
- check constraints
- unique constraints
- not null constraints

## 8.5 Transaction-safe side effects
Complex flows като create activity трябва да бъдат една транзакция.

---

# 9. Основни domain entities

## 9.1 Foundation
- accounts
- places
- plants

## 9.2 Growing structure
- perennials
- beds
- persistent_bed_plants
- yearly_bed_plantings

## 9.3 Operations
- activities
- activity_targets
- activity_product_usages

## 9.4 Problems
- problems
- problem_photos

## 9.5 Products and inventory
- products
- product_usage_rules
- inventory_lots
- inventory_movements

## 9.6 Planning
- tasks
- task_targets
- task_reminders
- quarantine_periods

## 9.7 Integrations / support
- weather_events
- ai_sessions
- ai_suggestions
- push_subscriptions
- audit_logs

---

# 10. ERD — логически изглед

```text
accounts
  ├── places
  │     ├── perennials
  │     │      └── activities (via activity_targets)
  │     ├── beds
  │     │    ├── persistent_bed_plants
  │     │    ├── yearly_bed_plantings
  │     │    ├── activities (via activity_targets)
  │     │    └── problems
  │     ├── tasks
  │     ├── quarantine_periods
  │     └── weather_events
  │
  ├── plants
  │     ├── perennials
  │     ├── persistent_bed_plants
  │     ├── yearly_bed_plantings
  │     └── product_usage_rules
  │
  ├── products
  │     ├── product_usage_rules
  │     ├── inventory_lots
  │     ├── inventory_movements
  │     └── activity_product_usages
  │
  ├── activities
  │     ├── activity_targets
  │     └── activity_product_usages
  │
  ├── problems
  │     └── problem_photos
  │
  ├── tasks
  │     ├── task_targets
  │     └── task_reminders
  │
  └── ai_sessions
        └── ai_suggestions
```

---

# 11. Database Schema

## 11.1 accounts
Boundary table за single-user v1 и future multi-user growth.

### Fields
- id UUID PK
- email text unique nullable
- display_name text nullable
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

---

## 11.2 places

### Fields
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

### Indexes
- (account_id, archived_at)

### Notes
Weather е optional per place.

---

## 11.3 plants

### Fields
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

### Constraints
- lifecycle_type in ('annual', 'biennial', 'perennial')
- growing_style in ('tree', 'shrub', 'vine', 'herb', 'vegetable', 'berry', 'flower', 'other')

### Indexes
- (account_id, common_name)

---

## 11.4 perennials

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- place_id UUID FK -> places.id
- plant_id UUID FK -> plants.id
- label text nullable
- planted_year int nullable
- notes text nullable
- status text not null
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

### Constraints
- status in ('active', 'removed', 'dead', 'archived')

### Indexes
- (place_id, status)

---

## 11.5 beds

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- place_id UUID FK -> places.id
- name text not null
- description text nullable
- notes text nullable
- width_m numeric nullable
- length_m numeric nullable
- area_m2 numeric nullable
- status text not null
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

### Constraints
- status in ('active', 'removed', 'archived')
- width_m is null or width_m > 0
- length_m is null or length_m > 0
- area_m2 is null or area_m2 > 0

### Indexes
- (place_id, status)

---

## 11.6 persistent_bed_plants

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- bed_id UUID FK -> beds.id
- plant_id UUID FK -> plants.id
- planted_year int nullable
- quantity numeric nullable
- notes text nullable
- status text not null
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

### Constraints
- status in ('active', 'removed', 'archived')

### Indexes
- (bed_id, status)

---

## 11.7 yearly_bed_plantings

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- bed_id UUID FK -> beds.id
- plant_id UUID FK -> plants.id
- year int not null
- quantity numeric nullable
- notes text nullable
- status text not null
- created_at timestamptz not null
- updated_at timestamptz not null
- archived_at timestamptz nullable

### Constraints
- status in ('planned', 'planted', 'removed', 'harvested', 'archived')

### Indexes
- (bed_id, year)
- (account_id, year)

### Notes
Позволяваме повече от един planting row за един и същ plant в същия bed/year.

---

## 11.8 products

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
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

### Constraints
- category in (
  'insecticide',
  'fungicide',
  'pesticide',
  'fertilizer',
  'foliar_fertilizer',
  'biostimulant',
  'soil_amendment',
  'other_preparation'
)
- default_unit in ('ml', 'l', 'g', 'kg')

### Indexes
- (account_id, name)

---

## 11.9 product_usage_rules

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
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

### Constraints
- dose_value > 0
- dose_unit in ('ml', 'l', 'g', 'kg')
- reapplication_interval_days is null or reapplication_interval_days >= 0
- quarantine_period_days is null or quarantine_period_days >= 0

### Indexes
- (product_id, plant_id)

---

## 11.10 inventory_lots

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
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

### Constraints
- unit in ('ml', 'l', 'g', 'kg')
- quantity_initial > 0
- quantity_remaining >= 0

### Indexes
- (product_id, archived_at)
- (expiry_date)

---

## 11.11 inventory_movements

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- product_id UUID FK -> products.id
- inventory_lot_id UUID FK -> inventory_lots.id nullable
- movement_type text not null
- quantity numeric not null
- unit text not null
- activity_id UUID FK -> activities.id nullable
- occurred_at timestamptz not null
- notes text nullable
- created_at timestamptz not null

### Constraints
- movement_type in ('purchase', 'manual_adjustment', 'consumption', 'correction')
- quantity > 0
- unit in ('ml', 'l', 'g', 'kg')

### Indexes
- (product_id, occurred_at)
- (activity_id)

### Important
Това е stock ledger-ът. Не се mutat-ва history silently.

---

## 11.12 activities

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- place_id UUID FK -> places.id nullable
- type text not null
- performed_at timestamptz not null
- target_scope_type text not null
- notes text nullable
- created_at timestamptz not null
- updated_at timestamptz not null

### Constraints
- type in (
  'watering',
  'treatment',
  'fertilizing',
  'pruning',
  'planting',
  'transplanting',
  'harvesting',
  'observation',
  'maintenance',
  'soil_work',
  'custom'
)
- target_scope_type in (
  'whole_place',
  'all_perennials_in_place',
  'selected_perennials',
  'all_beds_in_place',
  'selected_beds',
  'single_bed',
  'selected_yearly_plantings',
  'selected_persistent_bed_plants'
)

### Indexes
- (account_id, performed_at desc)
- (place_id, performed_at desc)

### Notes
`place_id` трябва да е попълнено, когато може да се определи.

---

## 11.13 activity_targets

### Fields
- id UUID PK
- activity_id UUID FK -> activities.id
- target_type text not null
- target_id UUID not null
- created_at timestamptz not null

### Constraints
- target_type in ('place', 'perennial', 'bed', 'yearly_bed_planting', 'persistent_bed_plant')

### Indexes
- (activity_id)
- (target_type, target_id)

### Important
Дори ако user избере “all beds”, тук се записват реално resolved bed rows.

---

## 11.14 activity_product_usages

### Fields
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

### Constraints
- quantity_used > 0
- unit in ('ml', 'l', 'g', 'kg')

### Indexes
- (activity_id)
- (product_id)

---

## 11.15 problems

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
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

### Constraints
- type in ('problem', 'observation')
- target_type in ('place', 'perennial', 'bed', 'yearly_bed_planting', 'persistent_bed_plant')
- status in ('open', 'monitoring', 'resolved')
- category in (
  'insect',
  'fungus',
  'bacteria',
  'nutrient_deficiency',
  'watering_issue',
  'weather_damage',
  'growth_issue',
  'unknown',
  'other'
) or null

### Indexes
- (place_id, observed_at desc)
- (target_type, target_id)
- (status, observed_at desc)

---

## 11.16 problem_photos

### Fields
- id UUID PK
- problem_id UUID FK -> problems.id
- storage_key text not null
- original_filename text nullable
- mime_type text nullable
- file_size_bytes bigint nullable
- width_px int nullable
- height_px int nullable
- created_at timestamptz not null

### Indexes
- (problem_id)

---

## 11.17 tasks

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
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

### Constraints
- type in ('spraying', 'fertilizing', 'pruning', 'planting', 'harvest_reminder', 'custom')
- status in ('suggested', 'planned', 'done', 'skipped', 'canceled')
- source_type in ('activity', 'manual', 'weather', 'ai') or null
- target_scope_type in (
  'whole_place',
  'all_perennials_in_place',
  'selected_perennials',
  'all_beds_in_place',
  'selected_beds',
  'single_bed',
  'selected_yearly_plantings',
  'selected_persistent_bed_plants'
)

### Indexes
- (account_id, due_date)
- (status, due_date)
- (place_id, due_date)

---

## 11.18 task_targets

### Fields
- id UUID PK
- task_id UUID FK -> tasks.id
- target_type text not null
- target_id UUID not null
- created_at timestamptz not null

### Constraints
- target_type in ('place', 'perennial', 'bed', 'yearly_bed_planting', 'persistent_bed_plant')

### Indexes
- (task_id)
- (target_type, target_id)

---

## 11.19 task_reminders

### Fields
- id UUID PK
- task_id UUID FK -> tasks.id
- reminder_type text not null
- scheduled_for timestamptz not null
- sent_at timestamptz nullable
- status text not null
- created_at timestamptz not null

### Constraints
- reminder_type in ('day_before', 'same_day')
- status in ('scheduled', 'sent', 'failed', 'canceled')

### Indexes
- (scheduled_for, status)

---

## 11.20 quarantine_periods

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- place_id UUID FK -> places.id nullable
- activity_id UUID FK -> activities.id
- activity_product_usage_id UUID FK -> activity_product_usages.id
- product_id UUID FK -> products.id
- starts_on date not null
- ends_on date not null
- notes text nullable
- created_at timestamptz not null

### Indexes
- (place_id, starts_on, ends_on)
- (activity_id)

### Notes
Targets се извличат през activity_targets на свързаното activity.

---

## 11.21 weather_events

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
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

### Constraints
- related_entity_type in ('task', 'activity')
- event_type in ('rain_check', 'forecast_snapshot')
- user_confirmation_status in ('pending', 'confirmed_yes', 'confirmed_no', 'ignored') or null

### Indexes
- (place_id, related_entity_type, related_entity_id)

---

## 11.22 ai_sessions

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- kind text not null
- input_mode text not null
- status text not null
- raw_input_text text nullable
- related_entity_type text nullable
- related_entity_id UUID nullable
- created_at timestamptz not null
- updated_at timestamptz not null

### Constraints
- kind in ('product_ingestion', 'bed_planning', 'problem_assist')
- input_mode in ('name', 'text', 'image', 'mixed')
- status in ('pending', 'completed', 'failed', 'dismissed', 'accepted')

### Indexes
- (account_id, created_at desc)

---

## 11.23 ai_suggestions

### Fields
- id UUID PK
- ai_session_id UUID FK -> ai_sessions.id
- suggestion_type text not null
- payload jsonb not null
- accepted boolean nullable
- accepted_at timestamptz nullable
- created_at timestamptz not null

### Constraints
- suggestion_type in ('product', 'product_rule', 'bed_plan', 'problem_summary', 'followup_questions')

---

## 11.24 push_subscriptions

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- endpoint text not null
- p256dh text not null
- auth text not null
- user_agent text nullable
- is_active boolean not null default true
- created_at timestamptz not null
- updated_at timestamptz not null

### Indexes
- (account_id, is_active)

---

## 11.25 audit_logs

### Fields
- id UUID PK
- account_id UUID FK -> accounts.id
- actor_type text not null
- actor_id UUID nullable
- entity_type text not null
- entity_id UUID not null
- action text not null
- before_json jsonb nullable
- after_json jsonb nullable
- created_at timestamptz not null

### Indexes
- (entity_type, entity_id)
- (created_at desc)

---

# 12. Relationship Summary

## Main 1:N relationships
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

## Cross-module relationships
- activity_product_usage -> product_usage_rule
- activity_product_usage -> product
- inventory_movements -> activity optional
- quarantine_periods -> activity + product usage
- problems -> linked activity optional
- weather_events -> task or activity
- AI accepted suggestions -> create/update products or rules

---

# 13. Най-важните transaction flows

## 13.1 Create activity
Това трябва да е една транзакция:

1. insert `activities`
2. insert `activity_targets`
3. insert `activity_product_usages`
4. create `inventory_movements`
5. update `inventory_lots.quantity_remaining`
6. create `quarantine_periods` if needed
7. create suggested `tasks` if needed

Ако някоя стъпка fail-не:
- rollback на всичко

## 13.2 Confirm suggested task
1. update task status -> planned
2. set confirmed_at
3. create `task_reminders`

## 13.3 Accept AI suggestion
1. mark suggestion accepted
2. create/update real business records
3. keep AI suggestion history

---

# 14. API layer — технически изисквания

## 14.1 Style
- REST JSON API
- base path: `/api/v1`

## 14.2 Validation
- server-side validation for all inputs
- account consistency checks
- place/target consistency checks
- product/rule consistency checks

## 14.3 Error model
Стандартизиран error response, напр.:

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

---

# 15. Интеграции

## 15.1 Storage
Проблемните снимки минават през `StoragePort`, backed by self-hosted Supabase Storage.
Frontend-ът не достъпва storage buckets или Supabase Storage APIs директно за business flows.

Примерни методи:
- `uploadProblemPhoto`
- `deleteObject`
- `getSignedUrl`

## 15.2 Auth
Self-hosted Supabase Auth е избраният auth provider.
Backend-ът го използва през `AuthPort`, за да резолвне authenticated actor/account.
Supabase service role key остава backend-only.

## 15.3 Weather
Open-Meteo е избраният weather provider и минава през `WeatherPort`, напр.:
- `getForecastForPlace`
- `getRainRiskForDate`
- `captureForecastSnapshot`

## 15.4 AI
Да има `AiPort`, напр.:
- `ingestProduct`
- `suggestBedPlan`
- `assistProblem`

## 15.5 Notifications
Raw Web Push with VAPID е избраният push mechanism и минава през `PushPort`, напр.:
- `registerSubscription`
- `sendReminder`

---

# 16. PWA и notifications

## Изисквания
- installable PWA
- service worker
- push registration
- notifications for tasks:
  - day_before
  - same_day

## Ограничения за v1
- no full offline write sync promised
- graceful degradation if notifications are disabled

---

# 17. Supabase boundary rules

Self-hosted Supabase е избрана infrastructure dependency за v1, но не е application architecture shortcut.

## Какво НЕ трябва да се заобикаля
- Fastify API като application data API
- repository + transaction abstraction
- services като owner на workflows and side effects
- account scoping in backend
- ports/adapters for auth/storage/weather/push

## Какво НЕ трябва да се променя
- domain entities
- business rules
- transaction semantics
- REST API contracts

## Извод
Supabase Postgres/Auth/Storage са operational providers.
Те не дават permission за:
- direct frontend access to application tables
- exposing Supabase service role key outside backend
- placing business side effects in DB triggers
- replacing service-layer transactions with generated REST/table operations

---

# 18. Препоръчителен implementation order

## Phase 1
- accounts
- places
- plants
- perennials
- beds
- persistent bed plants
- yearly bed plantings

## Phase 2
- products
- product rules
- inventory lots
- inventory movements

## Phase 3
- activities
- activity targets
- activity product usage
- quarantine periods

## Phase 4
- problems
- problem photos
- tasks
- reminders
- calendar

## Phase 5
- weather
- AI
- push notifications
- audit logs

---

# 19. Финални архитектурни решения

Заключваме следното:

- **Angular + Angular Material** за frontend
- **Fastify + TypeScript** за backend
- **Hetzner VPS + Docker Compose** за deployment
- **Self-hosted Supabase Postgres** за database
- **Self-hosted Supabase Auth** през `AuthPort`
- **Self-hosted Supabase Storage** през `StoragePort`
- **Open-Meteo** през `WeatherPort`
- **Raw Web Push with VAPID** през `PushPort`
- **Modular monolith**
- **Repository + transaction abstraction**
- **PostgreSQL domain model**
- **Supabase-backed adapters**, но без Supabase coupling в core logic
- **Bulk-target model** чрез header + resolved target rows
- **Inventory ledger model** чрез lots + movements
- **AI suggestions отделно от business truth**
- **Weather as context, not automatic control**
- **Hybrid correction model**

---

# 20. Резюме

Тази архитектура дава:

- чист domain model
- добър transaction control
- auditability
- лесна поддръжка
- нисък vendor lock-in
- ясна operational deployment форма за v1

Най-важните решения са:
- backend owns all business logic
- data access layer е абстрахиран
- schema е чист PostgreSQL върху self-hosted Supabase Postgres
- integrations са зад interfaces
- activities/tasks използват resolved target tables
- inventory е ledger, не само current balance
