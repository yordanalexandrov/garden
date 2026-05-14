# Gardening Helper — Frontend Technical Specification v1

## 1. Purpose

This document defines the **frontend implementation specification** for Gardening Helper.

It is intended as an implementation handoff for an AI or developer who will generate or build the Angular frontend.

This document specifies:

- application shell and navigation
- route structure
- page responsibilities
- container/component boundaries
- shared UI patterns
- forms and validation behavior
- state management expectations
- API integration strategy
- mobile/desktop behavior
- UX rules for bulk actions, calendar, AI, weather, and notifications

This document assumes the already approved:
- Product Scope
- Functional Specification v1
- Technical Requirements / ERD
- SQL migration pack
- Backend Application Design Pack

---

# 2. Frontend architecture baseline

## 2.1 Stack
The frontend must use:

- **Angular**
- **Angular Material**
- **PWA**
- Standalone components
- Reactive Forms
- Signals for local UI state
- RxJS for async/API flows

## 2.2 Architectural style
The frontend should follow a **feature-based modular SPA** architecture.

Use:
- route-level feature pages
- smart/container components for page orchestration
- presentational components for reusable UI sections
- form-focused subcomponents where forms are large
- API services separated from UI logic

## 2.3 Frontend boundaries
Frontend is responsible for:
- rendering
- local interaction state
- user input collection
- client-side validation
- optimistic UI only where low risk
- invoking backend API
- Supabase Auth login/session UI only
- push subscription registration
- file selection/upload UI

Frontend is **not** responsible for:
- business truth
- inventory calculation
- target resolution semantics
- weather decision logic
- AI acceptance semantics
- side-effect orchestration across entities
- reading or writing application tables directly
- using the Supabase service role key
- calling Supabase Storage directly for business file flows

All business logic remains backend-owned.

## 2.4 Frontend auth boundary
The Angular PWA may use self-hosted Supabase Auth for authentication and session handling.

Allowed frontend Supabase usage:
- sign in / sign out
- session refresh
- reading the current auth session/access token

Forbidden frontend Supabase usage:
- direct reads or writes to application tables
- direct application-data queries through Supabase REST/PostgREST
- direct business file access to Supabase Storage buckets
- use or exposure of the Supabase service role key

All business data reads/writes go through the Fastify API.
The frontend sends the user access token to the Fastify API; backend validates it, derives the authenticated actor/account server-side and owns authorization for application data.

---

# 3. App shell and global layout

## 3.1 Main shell
The app should use a stable shell with:

- top app bar
- left navigation rail/drawer on desktop
- bottom nav or compact menu on mobile if needed
- main router outlet
- global notification/snackbar layer
- global loading overlay only for major blocking flows

## 3.2 Layout behavior
### Desktop
- persistent side navigation or expanded drawer
- content area centered with page max width for forms
- split layouts allowed on detail screens

### Mobile
- compact header
- temporary drawer or menu
- single-column layout
- sticky primary actions where useful
- bottom-sheet/dialog patterns for selection-heavy flows

## 3.3 Global shell responsibilities
- Supabase Auth login/session bootstrap
- current account/app context
- notification permission prompt entry point
- route-level loading boundary
- offline/PWA install hints later if needed

---

# 4. Navigation structure

## 4.1 Primary navigation
Main navigation items:

- Dashboard
- Places
- Calendar
- Activities
- Problems
- Plants
- Products
- Inventory
- AI Assistant
- Settings

## 4.2 Route map
Recommended route structure:

```text
/
  dashboard

/places
/places/:placeId
/places/:placeId/overview
/places/:placeId/perennials
/places/:placeId/beds
/places/:placeId/activities
/places/:placeId/problems
/places/:placeId/calendar
/places/:placeId/weather

/plants
/plants/new
/plants/:plantId

/products
/products/new
/products/:productId
/products/:productId/edit
/products/:productId/rules/new
/product-rules/:ruleId/edit

/inventory
/inventory/products/:productId
/inventory/products/:productId/lots/new
/inventory/adjustments/new

/activities
/activities/new
/activities/:activityId

/problems
/problems/new
/problems/:problemId

/calendar

/tasks/:taskId

/ai
/ai/product-ingestion
/ai/bed-planning
/ai/problem-assist

/settings
/settings/notifications
/settings/account
```

## 4.3 Route philosophy
- use dedicated pages for complex list/detail flows
- use dialogs for quick create/edit where high-frequency
- do not overload one mega-page with all garden functions

---

# 5. Page-level specification

## 5.1 Dashboard page

### Purpose
Provide quick overview of the most important current information.

### Must show
- upcoming planned tasks
- suggested tasks awaiting confirmation
- active quarantine periods
- recent activities
- open problems
- low stock products
- places summary cards

### UX rules
- dashboard is summary-oriented, not full CRUD
- every block links to the relevant full module
- cards should remain scannable on mobile

### Suggested widgets
- upcoming tasks list
- suggested tasks card
- open problems card
- low stock card
- recent activity feed
- per-place quick entry buttons

---

## 5.2 Places list page

### Purpose
List and manage places.

### Must support
- list active places
- create place
- archive place
- show whether weather is enabled

### UI structure
- header with page title and primary action
- cards or list rows
- weather-enabled badge
- place card actions:
  - open
  - edit
  - archive

### Mobile behavior
Prefer stacked cards.

---

## 5.3 Place detail shell

### Purpose
Acts as the hub for one place.

### Sub-navigation
Within a place:
- Overview
- Trees / Perennials
- Beds
- Activities
- Problems
- Calendar
- Weather

### Overview tab should show
- place metadata
- weather status
- counts:
  - perennials
  - beds
  - open problems
  - upcoming tasks
- quick actions:
  - add perennial
  - add bed
  - log activity
  - record problem

---

## 5.4 Perennials page

### Purpose
Manage individually tracked trees/perennials in a place.

### Must support
- list perennials
- create perennial
- edit perennial
- archive perennial
- quick search/filter

### Suggested UI
- table on desktop
- cards on mobile
- per row/card:
  - plant name
  - label/nickname
  - planted year
  - status

### Primary actions
- Add perennial
- Bulk select only if later needed; not required for v1 page actions

---

## 5.5 Beds page

### Purpose
Manage beds and see their current contents.

### Must support
- list beds
- create/edit/archive bed
- see current bed composition:
  - persistent plants
  - yearly plantings for selected year
- open bed detail

### Suggested UI
Desktop:
- cards or rows with expandable contents
Mobile:
- stacked cards

### Bed card should show
- name
- dimensions if available
- persistent plant summary
- yearly planting summary for selected year
- quick actions:
  - add yearly planting
  - add persistent plant
  - ask AI about bed planning
  - log activity for this bed
  - record problem

### Year selection
A year switcher should be visible for yearly planting views.

---

## 5.6 Bed detail page

### Purpose
Focused view for one bed.

### Sections
- bed metadata
- persistent plants
- yearly plantings (for selected year)
- recent activities
- open problems
- AI planning assistant entry

### Actions
- edit bed
- add persistent plant
- add yearly planting
- log activity
- record problem
- ask AI for spacing/coexistence suggestions

---

## 5.7 Plants page

### Purpose
Manage reusable plant definitions.

### Must support
- list/search plants
- create/edit/archive plant definitions

### UI
- searchable list
- compact form for create/edit
- filters:
  - lifecycle type
  - growing style

### Rule
Plant database is reusable reference data, so selection speed matters more than rich visuals.

---

## 5.8 Products list page

### Purpose
Manage product database.

### Must support
- list products
- search/filter by category
- create manually
- start AI-assisted product ingestion
- open detail page

### Product card/list row should show
- name
- category
- active substance if present
- stock summary
- rules count

---

## 5.9 Product detail page

### Purpose
Show one product with full structured context.

### Must show
- product metadata
- plant-specific rules
- inventory summary
- lots
- movement history
- recent activities that used this product

### Actions
- edit product
- add usage rule
- add inventory lot
- manual inventory adjustment
- archive product

### Layout
Desktop:
- two-column layout recommended
  - left: product details + rules
  - right: inventory summary + recent movements
Mobile:
- stacked sections

---

## 5.10 Inventory page

### Purpose
Inventory overview across products.

### Must show
- current stock per product
- low stock indicators
- lots nearing expiry
- recent stock movements

### Actions
- add inventory lot
- manual adjustment
- open product inventory detail

### Suggested UI
Desktop:
- table with filters
Mobile:
- card list

---

## 5.11 Activities list page

### Purpose
Show operational history.

### Must support
- filtering by place, date range, type
- viewing activity detail
- create new activity

### List item should show
- type
- performedAt
- place
- target summary
- products used if any
- generated effects summary if relevant
  - stock deduction
  - quarantine
  - suggested tasks

---

## 5.12 Create activity page

### Purpose
This is one of the most important screens in the app.

### Workflow sections
1. select place
2. select activity type
3. select target scope
4. select targets if required
5. add notes
6. optionally add product usage(s)
7. review generated warnings/effects
8. save

### Critical UX rule
The targeting flow must be explicit and easy.

### Supported target scopes in UI
- whole place
- all trees in place
- selected trees
- all beds in place
- selected beds
- single bed
- selected yearly plantings
- selected persistent bed plants

### Target selection UX
Use a dedicated reusable component:
- `bulk-target-selector`

It should support:
- target scope dropdown/radio
- search/filterable selection list when IDs must be selected
- selection chips
- count summary
- empty-state/error display

### Product usage subform
If activity type supports products:
- add one or multiple product usage blocks
- choose product
- optionally auto-suggest rule based on selected targets/plants
- enter quantity used
- show unit
- show visible warning if no applicable rule selected

### Save result UX
After save, show:
- success summary
- created quarantine periods if any
- suggested task cards if any
- inventory warning summary if any

### Mobile behavior
Must remain single-column and usable in field conditions.

---

## 5.13 Problems list page

### Purpose
List problems and observations.

### Must support
- filter by place
- filter by status
- filter by type/category
- create problem
- open detail

### Item should show
- type
- title
- target summary
- category
- status
- observedAt
- photo indicator

---

## 5.14 Create problem page

### Purpose
Record a problem or observation with optional photo(s).

### Sections
1. choose place
2. choose target type
3. choose target
4. enter problem/observation data
5. attach photos if problem
6. save

### Important UX rules
- photo upload is available only for problem records in v1
- do not require photo to save
- target selection should reuse target pickers where possible

### Form behavior
- if type = observation, photo section may be hidden or disabled
- if type = problem, photo section visible

---

## 5.15 Problem detail page

### Purpose
Show problem history clearly.

### Must show
- full metadata
- linked target
- photo gallery
- status
- linked activity if present
- timestamps

### Actions
- update status
- edit text/category/severity
- add more photos optionally if supported later

---

## 5.16 Calendar page

### Purpose
Unified time-based view across activities, tasks, quarantine, weather context.

### Must support
- month view as default
- agenda/list fallback for mobile
- filter by place
- show:
  - completed activities
  - planned tasks
  - suggested tasks
  - quarantine periods
  - weather indicators if available

### Important UI rule
Different item types must be visually distinct.

Suggested:
- activities: neutral/completed styling
- planned tasks: primary/accent styling
- suggested tasks: outlined/warning styling
- quarantine: range bar / highlighted period
- weather marker: icon-level indicator only

### Click behavior
Selecting an item opens:
- task detail
- activity detail
- quarantine detail modal or linked activity
- weather info popover optional

### Mobile behavior
Use agenda/list view first if calendar grid becomes cramped.

---

## 5.17 Task detail page

### Purpose
Review and act on a task.

### Must show
- type
- due date
- place
- targets
- source type
- notes
- status
- reminder summary
- related weather warnings if any

### Actions by status
If `suggested`:
- confirm
- edit
- dismiss

If `planned`:
- mark done
- skip
- edit

If `done/skipped/canceled`:
- read-only mostly

---

## 5.18 AI Assistant pages

## 5.18.1 AI product ingestion page
### Purpose
Help create products/rules from product name, text, or image.

### Workflow
1. choose input mode
2. enter product name and/or paste label text and/or upload image
3. submit
4. view structured AI suggestions
5. review/edit
6. accept selected suggestions

### UI rule
AI output must look like **editable structured data**, not chat-only text.

### Suggested layout
- input panel
- results panel
- suggestion cards:
  - product suggestion
  - rule suggestion(s)
  - extracted notes

### Actions
- accept
- reject
- manually edit before acceptance where supported

---

## 5.18.2 AI bed planning page
### Purpose
Provide spacing/coexistence guidance for a bed.

### Inputs
- place / bed
- year
- current yearly plantings
- persistent plants
- optional notes

### Outputs
- spacing suggestions
- coexistence notes
- incompatibility warnings
- rough quantity guidance

### UI rule
Output is guidance, not auto-applied truth.

---

## 5.18.3 AI problem assist page
### Purpose
Optional assistance only when requested.

### Inputs
- existing problem record or ad hoc text

### Outputs
- summary
- possible category suggestions
- possible follow-up questions/actions

### Rule
No autonomous diagnosis wording.

---

## 5.19 Settings page

### Must include
- notification settings / prompt state
- app/account basics
- place weather settings exposed by backend, if implemented

### Notifications settings section
- current push permission status
- enable/register action
- re-register action if needed

---

# 6. Shared UI components

## 6.1 Core reusable components
Recommended reusable component set:

- `app-page-header`
- `app-empty-state`
- `app-confirm-dialog`
- `app-status-chip`
- `app-place-selector`
- `app-plant-selector`
- `app-product-selector`
- `app-target-summary`
- `app-photo-uploader`
- `app-date-range-filter`
- `app-year-selector`
- `app-calendar-legend`
- `app-ai-suggestion-card`

## 6.2 Bulk target selector
This is a critical shared component.

### Component name
`app-bulk-target-selector`

### Responsibilities
- choose target scope
- render appropriate selector UI
- fetch selectable items based on place/scope
- summarize selected target count and names

### Inputs
- placeId
- activityType or taskType optional
- allowed target scopes
- initial value

### Outputs
- `targetScopeType`
- structured `targetSelection`

### UX rules
- disable invalid scopes until place is chosen if place context is required
- show count summary for selected items
- show empty-state if place has no eligible targets
- must work well on mobile

---

## 6.3 Product usage form component
### Component name
`app-product-usage-form-array`

### Responsibilities
- manage one or more product usage rows
- product selection
- optional rule suggestion
- quantity + unit entry
- inline warnings if rule missing or inconsistent

### Important rule
Do not hide missing-rule state. Show it explicitly.

---

## 6.4 Photo uploader
### Component name
`app-problem-photo-uploader`

### Responsibilities
- file select / camera capture where available
- preview thumbnails
- remove before submit
- size/type validation on client side
- upload progress if applicable

---

## 6.5 Calendar item cards / overlays
Use dedicated rendering components per item type:
- activity calendar item
- task calendar item
- quarantine range item
- weather marker

Do not use one generic blob renderer for all item types.

---

# 7. Forms and validation behavior

## 7.1 General rules
- use Reactive Forms everywhere for business forms
- validation messages should appear:
  - on submit
  - and on blur/touched for invalid fields
- disable submit while request is in-flight
- do not clear user input on failed submit

## 7.2 Validation layers
### Client-side validation
For:
- required fields
- enum values
- positive numbers
- basic file type/size checks
- date format checks

### Server-side validation
Backend remains source of truth.
Frontend should display backend validation errors cleanly.

## 7.3 Error presentation
Preferred:
- field-level messages for field-specific issues
- form-level alert for cross-field or business-rule errors
- snackbar only for non-blocking informational success/failure

## 7.4 Dirty state protection
For large forms:
- warn before navigation away when form is dirty
- especially for:
  - create activity
  - AI product ingestion review
  - product edit
  - create problem

---

# 8. State management strategy

## 8.1 Principles
Use the simplest state model that remains predictable.

Recommended:
- Signals for page-local state
- RxJS for API streams / async pipelines
- no heavy global state library unless truly needed

## 8.2 State buckets
### Global shell state
- authenticated actor
- app init state
- notification permission/subscription status
- current route metadata

### Feature-local state
Examples:
- place list
- current place detail
- activity form state
- product detail state
- calendar filters
- AI suggestion review state

## 8.3 Caching strategy
Use lightweight in-memory caching in feature services for:
- places
- plants
- products selectors

Do not over-cache mutable transactional data like:
- inventory balances
- task statuses
- recent activities

Those should refresh after writes.

---

# 9. API integration strategy

## 9.1 API service structure
Each feature should have an API service, for example:
- `PlacesApiService`
- `PlantsApiService`
- `ProductsApiService`
- `ActivitiesApiService`
- `ProblemsApiService`
- `TasksApiService`
- `CalendarApiService`
- `AiApiService`
- `NotificationsApiService`

## 9.2 HTTP rules
- use typed request/response DTOs
- centralize base URL and auth headers
- centralize error mapping/interceptor
- do not scatter raw `HttpClient` calls inside components
- attach Supabase Auth access token to Fastify API requests when authenticated
- do not call Supabase application table endpoints from Angular services

## 9.2.1 Application data API boundary
All application data access goes through the Fastify API under `/api/v1`.

The frontend may use Supabase Auth for login/session handling only.
It must not use Supabase generated REST, SQL, or table APIs for Gardening Helper application data.
Account scoping, authorization, validation, transactions and side effects are backend responsibilities.

## 9.2.2 Problem photo access boundary
Problem photo UI uses backend APIs.
Files are stored in self-hosted Supabase Storage through backend `StoragePort`.
The database stores photo metadata only.

Photo display/download must use:
- signed URLs returned by the backend, or
- protected backend endpoints.

The frontend must not list buckets, construct private storage keys into public URLs, or use the Supabase service role key.

## 9.3 Refresh rules after write actions
After important mutations:
- refetch relevant detail/list data
- update local UI state deterministically

Examples:
- after confirming suggested task -> refresh task detail + calendar snippets
- after creating activity -> refresh activity detail, calendar, inventory summary for affected products if visible
- after accepting AI product suggestion -> refresh products list/detail

---

# 10. Notifications and PWA behavior

## 10.1 Notification UX
The app should expose:
- current permission status
- explicit enable notifications action
- helpful explanation if browser blocks notifications

## 10.2 Registration flow
Frontend should:
1. request browser permission
2. obtain push subscription
3. send subscription to backend
4. show success/failure feedback

## 10.3 Graceful degradation
If notifications are not enabled:
- tasks still work
- calendar still works
- show informative state, not hard failure

---

# 11. Weather UX rules

## 11.1 Place weather visibility
Weather should appear only where enabled for a place.

## 11.2 Weather in place detail
Weather tab/page should show:
- current summary if available
- short forecast
- upcoming weather-sensitive tasks context

## 11.3 Rain confirmation UX
If backend returns a pending rain confirmation:
- show clear prompt in task/activity context
- actions:
  - Yes, it rained
  - No, it did not
  - Ignore for now

### Important rule
Do not phrase this as automatic treatment failure.
Phrase as user confirmation request.

---

# 12. AI UX rules

## 12.1 AI output presentation
AI results should be shown as:
- structured sections
- editable fields/cards
- explicit suggestion status

Not as unstructured chat text only.

## 12.2 Acceptance rule
Accepted AI suggestions should transition visually into:
- created product/rule confirmation
- link to created entity

## 12.3 Rejection rule
Rejected suggestions should be dismissible without damaging manual flow.

## 12.4 Uncertainty presentation
Where backend provides warnings/confidence notes, surface them visibly but compactly.

---

# 13. Mobile-first behavior rules

## 13.1 Field use priorities
The app must remain usable in the garden on a phone.

Priorities:
- fast target selection
- fast activity logging
- quick problem recording with photo
- readable task list
- minimal typing where selection is possible

## 13.2 Mobile interaction patterns
Prefer:
- bottom sheets for selection
- step-like forms for long workflows if needed
- sticky submit button for long forms
- compact chips and summaries

Avoid:
- giant dense tables
- multi-column complex layouts
- hover-dependent interactions

---

# 14. Desktop behavior rules

## 14.1 Desktop priorities
Use desktop to give:
- richer visibility
- denser information where helpful
- faster cross-navigation
- side-by-side detail panels where useful

## 14.2 Appropriate desktop patterns
- tables for inventory/activities/products where useful
- split panes for detail pages
- side drawers/dialogs for quick create/edit
- richer filter panels

---

# 15. Accessibility and UX quality requirements

## 15.1 Accessibility baseline
- keyboard reachable navigation
- visible focus states
- proper form labels
- error messages associated with fields
- sufficient contrast
- icon + text, not icon-only critical actions

## 15.2 UX quality rules
- primary actions must be visually obvious
- destructive actions require confirmation
- empty states should guide next action
- no silent loss of form data
- user must always understand:
  - what target they selected
  - what product/rule is applied
  - what will happen after save

---

# 16. Screen-by-screen action priorities

## High-priority quick actions
These should be very easy to reach:
- add place
- add bed
- add perennial
- add planting
- log activity
- record problem
- add product
- add inventory lot
- confirm suggested task

## Low-priority actions
These can live deeper:
- archive rarely used items
- advanced AI problem assist
- manual inventory correction notes/history details

---

# 17. Frontend implementation constraints for AI/developer

These are hard rules.

## 17.1 Architecture rules
- use standalone Angular components
- use Angular Material as base UI library
- use Reactive Forms for business forms
- use Signals for local page state
- keep components thin and typed
- keep API calls in dedicated services

## 17.2 Forbidden shortcuts
- no business logic duplication from backend
- no direct DB/application-table access from frontend
- no Supabase Storage bucket access for business file flows
- no service role key in frontend code, build config, logs, or docs
- no giant god-component for place detail or activity creation
- no hidden auto-selection that changes business meaning silently
- no raw untyped API responses in components
- no form built only with `ngModel` for core workflows

## 17.3 Required reusable abstractions
At minimum, implementation should create reusable abstractions for:
- target selection
- product selection
- plant selection
- photo upload
- API error mapping
- page header/action layout

---

# 18. Recommended implementation order

## Phase 1
- app shell
- routing
- places
- plants
- perennials
- beds
- yearly plantings
- persistent bed plants

## Phase 2
- products
- product rules
- inventory overview

## Phase 3
- create activity flow
- activities list/detail
- create problem flow
- problems list/detail

## Phase 4
- tasks
- calendar
- quarantine display

## Phase 5
- AI pages
- weather pages/prompts
- notifications settings/registration

This order matches backend risk and product value.

---

# 19. Best immediate frontend implementation target

The most important frontend flow to design and build correctly first is:

## Create Activity page

Because it exercises:
- place context
- bulk target selection
- product selection
- rule visibility
- quantity entry
- warnings
- transactional result display

If this flow is clean, much of the rest of the product becomes easier.

---

# 20. Final recommendation

The frontend implementation should be guided by these principles:

- mobile-friendly field use first
- desktop clarity second, not at the expense of mobile
- reusable selectors and form sections
- backend remains the source of business truth
- AI output always presented as structured suggestion
- calendar is unified but item types stay visually distinct
- activity creation and problem recording are the two highest-frequency field workflows

This document should be treated as the canonical frontend implementation handoff for Gardening Helper v1.
