# Gardening Helper — Domain Rules and Invariants v1

## 1. Purpose

This document defines the non-negotiable domain rules and invariants for Gardening Helper v1.

It is intended for developers and AI implementation agents.

The goal is to prevent implementation drift, hidden assumptions, duplicated business logic, and inconsistent behavior across backend, frontend, database, AI, weather, inventory, and task flows.

This document answers:

- what must always be true
- what must never happen
- what may happen only with explicit user confirmation
- what is backend responsibility
- what is database responsibility
- what is frontend responsibility
- which data is source of truth
- which data is derived/read-only

---

# 2. Core philosophy

Gardening Helper is a structured garden operations system.

The system must prioritize:

- explicit user intent
- preserved history
- traceable inventory changes
- controlled automation
- backend-owned business logic
- AI as assistant, not authority
- weather as context, not autonomous decision maker

## Short version

- **No hidden truth**
- **No silent critical automation**
- **No business logic in frontend**
- **No untraceable stock changes**
- **No AI-generated data saved without confirmation**
- **No weather-based automatic treatment invalidation**
- **Every bulk action resolves to concrete targets**

---

# 2.1 Infrastructure provider boundary invariants

Gardening Helper v1 runs on a Hetzner VPS using Docker Compose with self-hosted Supabase services.

Provider decisions:
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`

These providers do not change domain ownership:
- Angular does not access application tables directly.
- The Fastify API owns business logic, validation, transactions, account scoping and side effects.
- Supabase service role key is backend-only.
- All application data access goes through the Fastify API.
- Integrations remain behind ports/adapters.

Hard rules:
- Do not replace the Fastify API with direct Supabase table access.
- Do not move business logic to frontend.
- Do not move business side effects to database triggers.
- Keep repository + transaction abstraction.
- Keep provider access behind ports/adapters.

---

# 3. Source of truth rules

## 3.1 Database is the persistence source of truth
Self-hosted Supabase Postgres is the persistence source of truth for:

- places
- plants
- perennials
- beds
- plantings
- activities
- problems
- products
- product rules
- inventory lots
- inventory movements
- tasks
- quarantine periods
- weather event confirmations
- AI suggestion history
- push subscriptions
- audit logs

## 3.2 Backend service layer is the business logic source of truth
The backend service layer is responsible for deciding and orchestrating:

- target resolution
- activity creation effects
- inventory deduction
- follow-up task suggestion
- quarantine generation
- task confirmation and reminders
- AI suggestion acceptance
- rain confirmation behavior
- validation across related entities

## 3.3 Frontend is not business truth
The frontend may display, preview, validate basic input, and submit user intent.

The frontend must not decide:

- concrete resolved target rows as final truth
- inventory allocation across lots
- quarantine creation
- suggested task creation
- whether a treatment failed
- whether an AI suggestion becomes business data
- cross-account or cross-place validity

## 3.4 AI is never business truth
AI output is a suggestion.

AI output becomes business data only after explicit user acceptance through the backend.

## 3.5 Weather is never business truth
Weather data informs the user.

Weather forecast does not automatically mean:
- treatment failed
- task must be canceled
- follow-up task must be created
- rain definitely happened

The user confirms observed rain.

---

# 4. Account and access invariants

## 4.1 All business records belong to an account
Every business record must be scoped to the authenticated account either directly or through its parent entity.

Direct account ownership should exist on major tables where already defined:
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
- weather events
- AI sessions
- push subscriptions
- audit logs

## 4.2 Cross-account access is forbidden
A user must never be able to:
- read another account's data
- reference another account's entity in a write operation
- create relationships across accounts

## 4.3 Account consistency is mandatory
If an entity references another entity, both must belong to the same account.

Examples:
- perennial.account_id must match place.account_id and plant.account_id
- bed.account_id must match place.account_id
- product_usage_rule.account_id must match product.account_id and plant.account_id
- inventory_lot.account_id must match product.account_id
- activity_product_usage.product_id must belong to same account as activity
- problem target must belong to same account as problem
- AI suggestion acceptance must operate only inside the owning account

## 4.4 Frontend must not submit accountId for normal flows
The backend derives account scope from the authenticated actor.

If the frontend submits accountId for normal CRUD, backend should ignore it or reject it depending on implementation policy.

---

# 5. Place invariants

## 5.1 Places are top-level garden locations
A place is the top-level operational context for:
- perennials
- beds
- place-scoped activities
- place-scoped problems
- place-scoped tasks
- weather configuration

## 5.2 Weather is optional per place
A place may have weather enabled or disabled.

If weather is disabled:
- no forecast context is required
- no rain prompt is required
- no weather events should be generated automatically for that place

## 5.3 Weather location must be explicit
If weather is enabled, the place must have enough weather location information:
- location label, or
- latitude and longitude

## 5.4 Archive over delete
Places should not be hard-deleted if related history exists.

Archive instead.

---

# 6. Plant database invariants

## 6.1 Plants are reusable user-maintained references
The plant database is not a global catalog in v1.

A plant record can be reused by:
- perennials
- persistent bed plants
- yearly bed plantings
- product usage rules
- AI planning context

## 6.2 Plant records should not be duplicated unnecessarily
The UI should encourage selecting existing plant definitions before creating new ones.

However, database should not over-enforce uniqueness because varieties and local naming may differ.

## 6.3 Archive over destructive delete
If a plant is used historically, archive instead of deleting.

Historical plantings and activities must remain readable.

---

# 7. Growing structure invariants

## 7.1 Perennials are individually tracked growing units
Perennials include:
- fruit trees
- shrubs
- vines
- berry bushes
- other long-lived individual plants

## 7.2 Beds are physical growing areas
A bed is a physical area and can contain:
- persistent bed plants
- yearly bed plantings

## 7.3 Persistent bed plants stay until removed
Persistent bed plants remain active across years until explicitly:
- removed
- archived

They must not be automatically removed when year changes.

## 7.4 Yearly bed plantings are year-based
Yearly bed plantings belong to:
- one bed
- one plant
- one year

The system uses **calendar year only**, not named seasons.

## 7.5 A bed can contain multiple plantings in the same year
A bed may have:
- multiple different plants in same year
- multiple rows for the same plant in same bed/year if needed

Duplicate same plant/bed/year rows are allowed.

## 7.6 Historical bed occupancy must remain readable
Changing current bed contents must not destroy historical records.

Removing or archiving a planting should preserve past visibility.

---

# 8. Targeting invariants

## 8.1 Bulk actions are first-class
The system must treat bulk targeting as normal, not exceptional.

Supported scopes:
- whole place
- all perennials in place
- selected perennials
- all beds in place
- selected beds
- single bed
- selected yearly plantings
- selected persistent bed plants

## 8.2 Scope records user intent
The activity/task header stores the original target scope selected by the user.

Example:
- `target_scope_type = all_beds_in_place`

## 8.3 Target rows store resolved truth
The resolved target table stores the concrete target rows affected.

Example:
If the user selects “all beds in place”, backend must resolve and store each actual bed target row.

## 8.4 Resolved targets must not be empty
Creating an activity or task with no resolved target is invalid.

## 8.5 Whole-group targeting is scoped to one place
“All beds” and “all perennials” always mean:
- all within the selected place

They must never mean all globally across all places.

## 8.6 Cross-place mixed targeting is not allowed in v1
One activity/task should not target entities from multiple places.

If future requirements demand it, the model can be extended, but v1 should reject it.

## 8.7 Target ownership must be validated backend-side
Frontend selection is not trusted.

Backend must validate:
- every selected ID exists
- every selected ID belongs to account
- every selected ID belongs to requested place where applicable
- every selected target is active unless archived targets are explicitly allowed for historical correction

## 8.8 Target labels are read models
Target labels returned to frontend are display helpers.

They are not source of truth.

---

# 9. Activity invariants

## 9.1 Activities are historical records
Activities represent work that happened.

They should generally not be silently overwritten after creation, especially if they generated side effects.

## 9.2 Activity creation is transactional
Creating an activity with product usage must be one transaction including:

1. activity header
2. resolved activity targets
3. product usage rows
4. inventory movements
5. inventory lot updates
6. quarantine periods
7. suggested follow-up tasks
8. audit log where applicable

If any step fails, the entire transaction fails.

## 9.3 Watering is simple in v1
Watering tracks:
- happened
- date/time
- target(s)
- optional notes

No water quantity/duration is required in v1.

## 9.4 Product usage is optional only where domain allows it
Activity types like treatment/fertilizing usually support product usage.

If a treatment is created without product usage, the backend may allow it only if the user clearly chose that flow.

## 9.5 Product usage rule is optional but must be consistent if provided
A product can be used without a structured plant-specific rule.

But if `productUsageRuleId` is provided:
- it must belong to the selected product
- it must belong to the authenticated account

## 9.6 Missing product rule must be visible
If a product is used without a rule, the frontend should display that no structured rule was applied.

The backend should preserve this by allowing nullable rule reference.

## 9.7 Activity place_id should be filled when resolvable
Even if target rows identify the place indirectly, `activities.place_id` should be populated whenever possible for filtering and reporting.

## 9.8 Activity correction should be explicit
Gardening Helper v1 uses a hybrid correction model.

Fresh records that have not created business side effects may be edited through normal validated update flows.
If an activity created side effects, later correction should not silently mutate:
- inventory ledger
- quarantine periods
- suggested tasks

Corrections for side-effecting records should be explicit and auditable.
They must append or create reverse/adjust operations rather than hiding prior business history.

---

# 10. Product invariants

## 10.1 Products are user-owned definitions
Products are the user’s personal product database, not a global catalog in v1.

## 10.2 Product default unit must be simple
Supported units:
- ml
- l
- g
- kg

No complex unit conversion in v1.

## 10.3 Product category must be controlled
Product category must be one of the approved enum values.

## 10.4 Products may exist without inventory
A product definition may exist even if no stock is currently owned.

## 10.5 Archive over delete
Products with usage history should be archived, not hard-deleted.

---

# 11. Product usage rule invariants

## 11.1 Usage rules are plant-specific product instructions
A product may have different usage rules for different plants.

Usage rule data can include:
- dose
- unit
- dilution text
- application method
- reapplication interval
- quarantine period
- notes

## 11.2 One active product+plant rule in v1
For v1, there should be at most one active rule for a given:
- product
- plant

Archived rules do not count as active.

## 11.3 Reapplication interval drives suggested tasks
If a treatment/fertilizing activity uses a rule with `reapplication_interval_days`, the backend may create a suggested future task.

The task must be `suggested`, not automatically planned.

## 11.4 Quarantine period drives calendar restriction overlay
If a treatment uses a rule with `quarantine_period_days`, the backend creates a quarantine period.

## 11.5 Rule changes do not rewrite history
Changing a product rule later must not rewrite historical activity records.

Historical activities keep their original product usage context and generated side effects.

---

# 12. Inventory invariants

## 12.1 Inventory movement ledger is mandatory
Every stock change must have an inventory movement.

Stock must never change silently.

## 12.2 Current lot quantity is derived/convenience state
`inventory_lots.quantity_remaining` is maintained for operational convenience.

But history and auditability rely on `inventory_movements`.

## 12.3 Purchase lot creation creates purchase movement
Creating a new inventory lot must also create a `purchase` movement in the same transaction.

## 12.4 Product usage creates consumption movement
When an activity consumes a product, the backend must create one or more `consumption` movements.

## 12.5 Manual changes create adjustment/correction movements
Manual stock changes must create:
- `manual_adjustment`, or
- `correction`

They must not directly update remaining quantity without movement history.

## 12.6 No negative lot quantity in v1
Inventory lots should not have negative `quantity_remaining`.

If stock is insufficient, use the shortage policy.

## 12.7 Shortage policy must be explicit
If requested consumption exceeds available stock:
- backend must warn/fail by default
- operation may continue only if request explicitly allows shortage according to policy

## 12.8 Recommended shortage behavior
For v1:
- if `allowInventoryShortage = false`, reject with `INVENTORY_SHORTAGE`
- if `allowInventoryShortage = true`, allow activity creation but only create consumption movements for covered stock
- return a warning with uncovered quantity

Do not invent fake stock.

## 12.9 FEFO allocation is default
Inventory consumption should allocate from lots using:
1. earliest expiry date
2. oldest purchase date
3. oldest created_at

## 12.10 Unit conversion is limited
Do not implement complex conversions in v1.

If product stock and usage unit differ in unsupported ways, backend should reject or require same unit.

---

# 13. Problem and observation invariants

## 13.1 Problems and observations are historical records
They should remain readable even if the target is later archived.

## 13.2 Problems require place context
A problem or observation must belong to a place.

## 13.3 Target must belong to place
The target of a problem/observation must belong to the same place.

## 13.4 Photos are supported only for problems in v1
Photos are allowed for:
- type = problem

Photos are not required.

For observations:
- no photo upload in v1 unless explicitly expanded later

## 13.5 Problem photo metadata is database truth
The file itself lives in object storage.

Database stores metadata:
- storage key
- file name
- MIME type
- size
- dimensions if available

## 13.6 Photo upload must not block problem creation unless required by UI flow
Problem creation should work without photos.

## 13.7 Linked treatment is optional
A problem may link to an activity, but it is not required.

---

# 14. Task invariants

## 14.1 Tasks represent planned or suggested future work
Tasks are separate from completed activities.

## 14.2 Suggested task is not planned
A task with `status = suggested` is only a recommendation.

It must not trigger reminders until confirmed.

## 14.3 Planned task can have reminders
Only `planned` tasks should receive reminder rows.

## 14.4 Confirming task is transactional
Confirming a suggested task must:
1. update status to `planned`
2. set confirmed_at
3. create reminder rows

All in one transaction.

## 14.5 Task reminders are generated from planned status
Reminder rows must not exist for:
- suggested tasks
- canceled tasks
- skipped tasks
- done tasks unless they were created while task was planned before completion

## 14.6 Task completion does not automatically create activity in v1
Marking a task done should not silently create an activity unless a dedicated explicit workflow is implemented.

The user should remain in control.

## 14.7 Dismissing suggested task is explicit
Dismissing a suggested task should set status to `canceled` or equivalent.

It should remain historically visible if needed.

## 14.8 Task targets use resolved target rows
Tasks must follow the same header + resolved target model as activities.

---

# 15. Calendar invariants

## 15.1 Calendar is a read model
Calendar feed merges:
- completed activities
- tasks
- quarantine periods
- weather events

Calendar itself is not a separate source of truth.

## 15.2 Calendar item types must remain distinguishable
Frontend must visually distinguish:
- activity
- planned task
- suggested task
- quarantine period
- weather marker

## 15.3 Quarantine periods are read-only overlays
Users should not edit quarantine directly as calendar events.

They are generated from treatment/product rule context.

## 15.4 Calendar filters must not change business data
Changing calendar filters only changes display.

---

# 16. Quarantine invariants

## 16.1 Quarantine is generated from product usage context
A quarantine period exists because an activity used a product/rule with quarantine days.

## 16.2 Date calculation
Default calculation:
- starts_on = activity performed date
- ends_on = starts_on + quarantine_period_days

## 16.3 Quarantine targets are derived from activity targets
Quarantine period does not need its own target table in v1.

Affected targets are derived through linked activity.

## 16.4 Quarantine does not prevent data entry
The app may warn before harvest-related actions, but should not necessarily block the user unless future requirements demand hard enforcement.

## 16.5 Quarantine history should not be silently deleted
If a related activity is corrected, quarantine change should be auditable.

---

# 17. Weather invariants

## 17.1 Weather is enabled per place
No weather behavior should occur for a place where weather is disabled.

## 17.2 Weather forecast is advisory
Forecasted rain does not mean rain happened.

## 17.3 User confirms observed rain
If rain confirmation is needed, user responses are:
- confirmed_yes
- confirmed_no
- ignored

## 17.4 Rain confirmation does not automatically invalidate treatment
Even if the user confirms rain, the system should not silently declare treatment failed.

Allowed behavior:
- show warning
- suggest possible follow-up task
- record observed rain

Disallowed behavior:
- auto-delete treatment
- auto-mark treatment ineffective
- auto-create planned task without confirmation

## 17.5 Weather events are persisted context
Weather events capture:
- related task/activity
- forecast snapshot or rain check
- user confirmation state
- provider payload if stored

## 17.6 Provider payload is not core domain truth
Provider payload may be stored for audit/debugging, but business logic should use normalized fields.

---

# 18. AI invariants

## 18.1 AI is assistive only
AI can:
- parse product data
- suggest product rules
- suggest bed spacing/coexistence
- assist with problem summaries/questions

AI cannot:
- silently create products
- silently create rules
- silently create tasks
- silently diagnose disease as fact
- silently change inventory
- silently alter plantings

## 18.2 AI output must be reviewable
AI suggestions must be stored and shown to the user before acceptance.

## 18.3 AI acceptance is explicit
A suggestion becomes business data only through an explicit accept endpoint/action.

## 18.4 AI suggestions remain auditable
Accepted/rejected state should be stored.

## 18.5 AI uncertainty must be visible
If the AI provider returns uncertainty/warnings, the frontend should show them.

## 18.6 AI does not replace validation
Accepted AI payload must still pass normal backend validation before creating business records.

## 18.7 AI problem assistance is not diagnosis
AI may suggest possible categories and follow-up questions.

The UI and API should avoid wording that presents AI output as guaranteed diagnosis.

---

# 19. Notification invariants

## 19.1 Notifications are optional
The app must function without push notifications.

## 19.2 Push subscription belongs to account
Push subscriptions are scoped to account and should be revocable/deactivatable.

## 19.3 Reminder rows drive notification sending
Push jobs should send notifications based on `task_reminders`.

## 19.4 Notifications only for planned tasks
Reminder rows should be created only for planned tasks.

## 19.5 Notification failure must not break task state
If sending a push notification fails:
- record failed status
- do not change the task itself to failed

---

# 20. File/storage invariants

## 20.1 Object storage is behind backend abstraction
Frontend must not depend directly on Supabase Storage behavior.
Business flows use backend APIs and `StoragePort`.

## 20.2 Database stores metadata, not image binary
Problem photo files live in self-hosted Supabase Storage.

Database stores:
- storage key
- original filename
- MIME type
- file size
- dimensions if available

## 20.3 File access must be controlled
Use:
- signed URLs, or
- protected API endpoints

Do not expose public bucket listing.

## 20.4 Orphaned uploads should be cleanable
If file upload succeeds but DB metadata creation fails, the system should have cleanup strategy.

This may be manual/job-based in v1.

---

# 21. Audit invariants

## 21.1 Critical operations should be auditable
Audit logs should be created for:
- product changes
- product rule changes
- inventory adjustments
- activity creation
- task confirmation/dismissal
- AI suggestion acceptance
- weather rain confirmation
- archive operations

## 21.2 Audit logs are append-only
Audit logs should not be edited by normal application flows.

## 21.3 Audit logging must not replace domain records
Audit logs are secondary traceability.

They do not replace:
- inventory movements
- activity records
- task status
- AI suggestion state

---

# 22. Validation invariants

## 22.1 Validation exists at multiple layers
Validation should exist in:
- frontend for user experience
- backend controller for request shape
- backend service for domain rules
- database constraints for integrity

## 22.2 Backend validation is authoritative
Frontend validation is not trusted.

## 22.3 Database constraints are final safety net
Database must prevent invalid structural data even if service code has a bug.

## 22.4 Cross-entity validation belongs in service layer
Examples:
- target belongs to place
- rule belongs to product
- lot belongs to product
- AI suggestion belongs to session/account

These should be checked explicitly by backend services.

---

# 23. API invariants

## 23.1 API uses standard envelope
Success:
```json
{ "data": {} }
```

Error:
```json
{ "error": { "code": "...", "message": "...", "details": {} } }
```

## 23.2 API responses must not leak inaccessible data
All list/detail endpoints must be account-scoped.

## 23.3 Mutation responses should summarize side effects
Especially:
- create activity
- confirm task
- accept AI suggestion
- inventory adjustment

## 23.4 Critical mutation endpoints should be transaction-safe
Required transactional endpoints:
- create activity
- confirm suggested task
- create inventory lot
- manual inventory adjustment
- accept AI suggestion
- create planned task with reminders

## 23.5 Frontend must not depend on internal DB table names
API DTO naming can follow camelCase while DB uses snake_case.

---

# 24. Frontend invariants

## 24.1 Frontend must show user intent clearly
Before saving activity/task/problem, user must be able to see:
- selected place
- selected target scope
- selected targets or target count
- selected product/rule if relevant
- quantity used if relevant

## 24.2 Frontend must not hide automation side effects
After create activity, show:
- stock deduction summary
- quarantine period generated
- suggested task generated
- warnings

## 24.3 Frontend must show missing rule state
If product has no applicable rule, show that clearly.

## 24.4 Frontend must distinguish suggested vs planned tasks
Suggested task must not look like a confirmed scheduled task.

## 24.5 AI suggestions must be visibly suggestions
AI output should be displayed as editable/reviewable cards or forms, not as final saved data.

## 24.6 Weather prompts must ask for confirmation
Rain prompt wording must make clear the user is confirming observed rain.

---

# 25. Database invariants

## 25.1 UUID primary keys
All major entities use UUID primary keys.

## 25.2 Timestamps are required
Business entities should have:
- created_at
- updated_at where mutable
- archived_at where archivable

## 25.3 Archive over delete
Hard delete is allowed only for:
- transient technical records
- records with no meaningful history
- explicit cleanup cases

## 25.4 Check constraints enforce enums
Use check constraints for allowed values.

## 25.5 Foreign keys enforce structural relationships
FKs should exist for normal relational references.

## 25.6 Polymorphic targets require service/trigger guards
Because `target_type + target_id` cannot be enforced by normal FK, backend and optional DB guards must validate target existence and scope.

## 25.7 No hidden business side-effect triggers
Database triggers should not secretly create:
- inventory movements
- tasks
- reminders
- quarantine periods
- AI records

Those are service-layer responsibilities.

Allowed triggers:
- updated_at maintenance
- guard/validation triggers
- audit helpers if explicitly designed

---

# 26. Allowed vs forbidden automation

## 26.1 Allowed automation
The system may automatically:
- resolve selected target scope into concrete target rows
- calculate quarantine period after accepted activity save
- create suggested follow-up task after accepted activity save
- create reminders when user confirms task
- decrement stock after user saves product usage activity
- show rain confirmation prompt after weather/rain check

## 26.2 Automation requiring explicit confirmation
The system must require user confirmation before:
- suggested task becomes planned
- AI suggestion becomes product/rule/record
- inventory shortage is allowed
- rain is recorded as actually observed

## 26.3 Forbidden automation
The system must not automatically:
- save AI product/rule data as truth
- mark treatment failed because rain was forecast
- create planned tasks from rules without confirmation
- delete historical activities
- mutate inventory without movement
- remove persistent plants at year boundary
- assume all places share same weather configuration
- apply all-beds/all-trees globally across places

---

# 27. Business warnings vs hard blockers

## 27.1 Hard blockers
The system must block:
- cross-account references
- missing required fields
- invalid enum values
- invalid target scope/selection mismatch
- empty resolved target set
- product rule not belonging to product
- inventory shortage when shortage override is false
- photo upload for observation if v1 only allows problem photos

## 27.2 Warnings
The system may warn but allow:
- product used without rule
- inventory shortage when override is explicitly true
- harvest action during quarantine if hard blocking is not implemented
- weather forecast rain near treatment
- AI uncertainty
- expired product lot use if user explicitly proceeds, depending on policy

## 27.3 Warnings must be visible
Warnings returned by backend must be shown in the frontend.

---

# 28. Implementation anti-patterns

The implementation must avoid:

## 28.1 God components
Do not implement large pages like Place Detail or Create Activity as one unstructured component.

## 28.2 Business logic in controllers
Controllers should validate request shape and call services.

## 28.3 Business logic in repositories
Repositories should not orchestrate workflows.

## 28.4 Business logic in frontend
Frontend must not duplicate service-layer domain decisions.

## 28.5 Hidden DB side effects
Do not use triggers for critical business orchestration.

## 28.6 Untyped API contracts
Use typed DTOs.

## 28.7 AI direct-to-database writes
AI outputs must pass through suggestion acceptance.

## 28.8 Inventory as only current balance
Do not model stock as only one mutable quantity.

## 28.9 Treating calendar as source table
Calendar is a read aggregation.

---

# 29. Priority invariants for v1 implementation

If implementation time is limited, protect these first:

1. Account scoping
2. Target resolution correctness
3. Create activity transaction
4. Inventory ledger correctness
5. Product/rule consistency
6. Quarantine generation correctness
7. Suggested task confirmation flow
8. Problem photos only for problems
9. AI acceptance boundary
10. Weather confirmation boundary

Everything else is secondary compared to these.

---

# 30. Final rule summary

The Gardening Helper v1 implementation is correct only if:

- all records are account-scoped
- all bulk actions resolve to concrete targets
- activities preserve historical work
- product use creates traceable inventory movements
- stock never changes silently
- quarantine is generated from treatment/product rule context
- follow-up tasks are suggested, not silently planned
- reminders exist only for planned tasks
- weather prompts for confirmation, never decides alone
- AI suggests, user accepts, backend validates
- frontend displays intent and side effects clearly
- database protects structural integrity
- backend services own domain workflows

This document should be treated as the domain law for all Gardening Helper v1 implementation work.
