# Gardening Helper — Functional Specification v1

## 1. Project Overview

**Gardening Helper** is a PWA-first application for managing personal gardens, orchards, beds, plants, treatments, problems, products, and seasonal work.

It is designed for a gardener who wants:

- one place to track everything
- structured historical records
- reminders and calendar visibility
- product and stock control
- weather-aware task context
- AI assistance for data entry and planning

The application must be **simple to use in the field**, but **structured enough to support automation and future intelligence**.

---

## 2. Product Goals

### Primary goals
- Track **places**, **trees/perennials**, **beds**, **persistent bed plants**, and **yearly bed plantings**
- Maintain a reusable **plant database**
- Record all important **gardening activities**
- Track **problems and observations** with photos
- Maintain a **personal product database**
- Maintain **inventory and stock history**
- Support **calendar planning**, **future tasks**, and **notifications**
- Add **weather context**
- Use **AI assistance** without allowing uncontrolled data changes

### Non-goals for v1
- full marketplace/product catalog sync
- autonomous disease diagnosis
- advanced agronomic analytics
- native mobile app
- multi-user household collaboration as a core feature
- full crop rotation engine

---

## 3. Core Product Principles

### 3.1 Human-controlled automation
Automation may suggest actions, but it must not silently create critical truth without review.

### 3.2 Structured over free-text
Important domain data should be structured:
- plants
- products
- doses
- rules
- stock
- tasks
- quarantine periods

### 3.3 History must be preserved
Activities, stock usage, problems, bed occupancy, persistent plants, and yearly plantings should remain auditable.

### 3.4 Bulk operations are first-class
Many real gardening actions happen across:
- multiple trees
- multiple beds
- all trees
- all beds
- whole place

### 3.5 Weather informs, user confirms
Weather can indicate likely rain, but the user confirms what actually happened.

### 3.6 AI assists, never silently decides
AI may parse, suggest, and summarize. User confirmation is required before saving AI-generated structured data.

---

## 4. Functional Modules

## 4.1 Places
A **place** is a top-level garden location.

Examples:
- home garden
- orchard
- vineyard area
- greenhouse
- back yard

### Capabilities
- create/edit/archive place
- enable/disable weather integration per place
- associate weather location per place

### Fields
- id
- name
- description optional
- notes optional
- weather_enabled
- weather_location_label or coordinates
- created_at
- archived_at optional

---

## 4.2 Plant Database
The system must have a reusable **plant database** so the user does not re-enter plant definitions every year.

This database is the shared reference for:
- tree/perennial records
- yearly bed plantings
- persistent bed plants
- product usage rules by plant
- AI planting suggestions

### Examples
- tomato
- pepper
- cucumber
- basil
- parsley
- strawberry
- oregano
- apple
- pear
- grape vine

### Capabilities
- create/edit/archive plant definitions
- search and reuse plant definitions
- attach notes and basic planting guidance
- use plants as the standard reference across the app

### Fields
- id
- common_name
- variety optional
- plant_category
- lifecycle_type: annual / biennial / perennial
- growing_style: tree / shrub / vine / herb / vegetable / berry / flower / other
- notes optional
- created_at
- archived_at optional

### Important rule
This is a **user-maintained database**, not a global external catalog in v1.

---

## 4.3 Trees and Perennial Plants
This module represents individually tracked perennial growing units.

Examples:
- apple tree
- pear tree
- grape vine
- currant bush
- lavender shrub

### Capabilities
- create/edit/archive perennial item
- attach to place
- choose plant from plant database
- record variety and notes
- use as activity/problem/task target

### Fields
- id
- place_id
- plant_id
- nickname/label optional
- planted_year optional
- notes optional
- status: active / removed / dead / archived

---

## 4.4 Garden Beds
A **bed** is a defined growing area.

### Capabilities
- create/edit/archive bed
- attach to place
- use as activity/problem/task target
- hold both persistent plants and yearly plantings

### Fields
- id
- place_id
- name/code
- description optional
- notes optional
- dimensions optional
- status

---

## 4.5 Persistent Bed Plants
Some beds can contain plants that stay and continue living there across years, such as:
- strawberries
- herbs
- perennial flowers
- other long-living plants

These should not be forced into a yearly planting model.

### Capabilities
- add persistent plant to a bed
- keep it active across years
- optionally mark it removed later
- use it as context for AI coexistence guidance and activities/problems

### Fields
- id
- bed_id
- plant_id
- planted_year optional
- quantity optional
- notes optional
- status: active / removed / archived

### Rule
Persistent bed plants remain associated with the bed until explicitly removed or archived.

---

## 4.6 Yearly Bed Plantings
A bed may also contain one or more yearly plantings.

This is required for:
- multiple varieties in one bed
- annual crop tracking
- AI spacing suggestions
- coexistence guidance
- future crop rotation support
- historical planting records

### Capabilities
- add planting to a bed for a year
- edit/remove planting
- view current and previous year plantings

### Fields
- id
- bed_id
- plant_id
- year
- quantity optional
- notes optional
- status: planned / planted / removed / harvested / archived

### Rule
A bed can have multiple yearly plantings for the same year.

---

## 5. Activity Log

This is the central operational module.

### 5.1 Supported activity types
- watering
- treatment / spraying
- fertilizing
- pruning
- planting
- transplanting
- harvesting
- observation
- maintenance
- soil work
- custom

### 5.2 Targeting rules
Activity log must support:

- whole place
- all trees in a place
- selected trees
- all beds in a place
- selected beds
- one bed
- selected bed plantings where applicable
- selected persistent bed plants where applicable

### Important rule
The targeting model must support **multi-target actions** as a normal use case.

Examples:
- spray all trees in orchard
- fertilize selected beds
- water all beds in Place A
- prune 3 selected fruit trees

### 5.3 Watering behavior
Watering in v1 tracks only:
- happened
- date/time
- target
- optional note

No volume or duration tracking in v1.

### 5.4 Common activity fields
- id
- type
- performed_at
- target_scope_type
- resolved targets
- notes optional
- created_at

### 5.5 Treatment/fertilizing-specific fields
Where relevant:
- product used
- quantity used
- unit
- applied rule reference optional
- follow-up suggestion generated yes/no
- quarantine period generated yes/no

---

## 6. Problems and Observations

This module tracks issues and notable garden findings.

### 6.1 Capabilities
- record a problem or observation
- attach to plant target
- upload photos for problems
- update status over time
- optionally link to treatment activity

### 6.2 Types
Suggested categories:
- insect
- fungus
- bacteria
- nutrient deficiency
- watering issue
- weather damage
- growth issue
- unknown
- other

### 6.3 Fields
- id
- type: problem / observation
- place_id
- target_type
- target_id
- title
- description
- category optional
- severity optional
- status: open / monitoring / resolved
- observed_at
- created_at

### 6.4 Photos
Photos are supported for **problems** in v1.

### Photo requirements
- upload one or more photos
- attach to problem record
- view later in history

### Rule
Photos are **not required** for every problem.

---

## 7. Product Database

The product module stores the user’s personal garden products and preparations.

### 7.1 Product categories
- insecticide
- fungicide
- pesticide
- fertilizer
- foliar fertilizer
- biostimulant
- soil amendment
- other preparation

### 7.2 Product definition capabilities
- create product manually
- create with AI assistance
- store plant-specific usage rules
- use product in activities
- track inventory against product

### 7.3 Product fields
- id
- name
- category
- active_substance optional
- manufacturer optional
- formulation optional
- default_unit
- notes optional
- created_at

---

## 8. Product Usage Rules by Plant

A product may have different instructions depending on the plant.

This is a key module.

### 8.1 Capabilities
- add multiple usage rules for a product
- target different plants with different settings
- use rules during treatment/fertilizing entry
- use rules to generate task suggestions and quarantine periods

### 8.2 Fields
- id
- product_id
- plant_id
- dose
- dose_unit
- dilution_text or dilution_value
- application_method optional
- reapplication_interval_days optional
- quarantine_period_days optional
- notes optional

### 8.3 Rules
- one product may have many usage rules
- a product may have multiple rules for different plants
- selecting product + target plant should help surface the relevant rule(s)

---

## 9. Inventory

Inventory tracks owned stock and how it changes.

### 9.1 Inventory requirements
- current stock
- purchase entries / lots
- expiry date
- batch/lot number
- automatic decrease when used
- stock history

### 9.2 Inventory model
The app should not only store “remaining quantity”.
It should preserve movement history.

#### Inventory lot
Represents purchased or owned stock.

Fields:
- id
- product_id
- quantity_initial
- quantity_remaining
- unit
- purchase_date optional
- expiry_date optional
- batch_number optional
- notes optional

#### Inventory movement
Represents stock change.

Fields:
- id
- product_id
- inventory_lot_id optional
- movement_type: purchase / manual_adjustment / consumption / correction
- quantity
- unit
- activity_id optional
- occurred_at
- notes optional

### 9.3 Automatic deduction rule
When an activity uses a product, stock should decrease automatically and a consumption movement should be created.

### 9.4 Important rule
Inventory changes must remain traceable and correctable.

---

## 10. Calendar and Tasks

The app includes both past and future time-based planning.

### 10.1 Calendar must show
- completed activities
- planned tasks
- suggested tasks awaiting confirmation
- quarantine periods
- weather-related context where enabled

### 10.2 Task types
- spraying
- fertilizing
- pruning
- planting
- harvest reminder
- custom

No recurring watering or inspection automation in v1.

### 10.3 Task statuses
- suggested
- planned
- done
- skipped
- canceled

### 10.4 Task fields
- id
- type
- due_date
- target_scope_type
- resolved targets
- notes optional
- source_type optional
- source_reference optional
- status

---

## 11. Notifications

The app should provide reminders through PWA notifications.

### v1 notification requirements
For planned tasks:
- reminder the day before
- reminder the same day

### Rules
- notifications apply to scheduled tasks
- user must have enabled notifications in browser/PWA
- reminders are not required for every activity record, only tasks

---

## 12. Suggested Future Tasks

The app should generate future task suggestions based on rules.

### 12.1 Trigger examples
- treatment recorded using product with reapplication interval
- fertilizing activity with follow-up cadence
- pruning schedule logic later if defined

### 12.2 Behavior
System creates a **suggested** future task, not a final task.

User can:
- confirm
- edit
- dismiss

### 12.3 Why
This keeps automation useful without losing user control.

---

## 13. Quarantine Periods

When a treatment includes a quarantine period, the app should generate a visible restricted period.

### Behavior
- calculate start = treatment date
- calculate end = treatment date + quarantine days
- show date range in calendar
- warn before harvest-related actions if within quarantine

### Rule
Quarantine periods are informational constraints linked to treatment events.

---

## 14. Weather Integration

Weather is enabled per place.

### 14.1 v1 weather capabilities
- connect place to weather location
- show relevant weather context for tasks
- especially highlight rain risk around treatment tasks

### 14.2 Rain confirmation flow
If weather indicates rain around a spraying-related event or task:
- the app prompts the user:
  - did it actually rain?

User answers:
- yes
- no
- ignore for now

### 14.3 Rule
The system must not automatically assume treatment failure just from forecast data.

---

## 15. AI Assistance

AI is in scope for v1, but only as an assistant.

### 15.1 AI product ingestion
Inputs:
- product name
- pasted label text
- uploaded label image

Outputs:
- structured product suggestion
- plant-specific usage rules suggestion
- possible reapplication interval
- possible quarantine period
- dose suggestions
- notes extraction

#### Save rule
Nothing is saved automatically. User reviews and confirms.

### 15.2 AI planting suggestions
For a selected bed, AI can suggest:
- plant spacing
- coexistence / companion notes
- possible incompatibilities
- rough quantity guidance based on bed size if dimensions exist
- awareness of persistent plants already living in the bed

### 15.3 AI problem help
Only when explicitly requested:
- summarize observation/problem
- suggest likely categories
- suggest possible follow-up actions/questions

No autonomous diagnosis in v1.

---

## 16. User Flows

### 16.1 Create place
1. User opens Places
2. Creates a place
3. Optionally enables weather and sets location
4. Saves

### 16.2 Add bed and bed contents
1. User opens a place
2. Creates a bed
3. Adds one or more yearly plantings and/or persistent bed plants
4. Saves

### 16.3 Add trees/perennials
1. User opens a place
2. Adds tree/perennial records by choosing from plant database
3. Saves

### 16.4 Log treatment for multiple targets
1. User selects activity type = treatment
2. Chooses target scope:
   - selected trees
   - all trees
   - selected beds
   - all beds
   - whole place
3. Selects product
4. Chooses product rule if applicable
5. Enters quantity used
6. Saves
7. System:
   - creates activity
   - decreases stock
   - creates stock movement
   - calculates quarantine period if applicable
   - creates suggested future task if applicable

### 16.5 Record problem with photo
1. User selects target
2. Enters problem details
3. Uploads photo(s)
4. Saves

### 16.6 Confirm suggested future task
1. System shows new suggestion
2. User reviews
3. User confirms / edits / dismisses

### 16.7 Use AI to create product
1. User starts Add Product
2. Provides product name, text, or image
3. AI returns structured suggestion
4. User reviews and edits
5. User confirms save

### 16.8 Ask AI for bed planning help
1. User opens bed
2. Selects current or planned bed contents
3. Requests AI suggestion
4. AI returns spacing/coexistence advice
5. User keeps as guidance; optionally copies notes into planning

---

## 17. Edge Cases and Rules

### 17.1 Multi-target logging
A single activity may target multiple entities.
The system must preserve what exactly was targeted.

### 17.2 Whole-group targeting
“All trees” and “all beds” must resolve relative to a place, not globally across all places.

### 17.3 Product without rule
User may still use a product even if no plant-specific rule exists, but the system should show that no structured rule was applied.

### 17.4 Inventory shortage
If stock is insufficient:
- warn user
- allow save only according to chosen policy

Recommended v1 policy:
- reject by default
- allow only with explicit shortage confirmation/override
- create consumption movements only for covered stock and show uncovered quantity

### 17.5 Weather disabled
If weather is disabled for a place:
- no forecast context
- no rain-related prompts

### 17.6 AI uncertainty
AI suggestions should be clearly reviewable and editable before save.

### 17.7 Bed occupancy history
A bed can contain persistent plants and also yearly plantings.
Both should remain readable historically.

### 17.8 Problem photos
Problem creation should still work even without photo upload.

---

## 18. Permissions and User Model

### v1 user model
Single user account / personal use.

Design should not block future expansion to:
- family sharing
- multiple user roles

But that is not a core v1 requirement.

---

## 19. UX Requirements

### General UX goals
- fast data entry on mobile
- clear structure on desktop
- minimal friction for repeated actions
- avoid excessive typing where selection is possible

### Important UX patterns
- quick-add actions from place screen
- bulk target selector for activities
- product rule auto-suggestion based on selected targets
- plant selection from plant database
- calendar with clear status badges
- photo upload only where relevant
- AI always presented as suggestion, not automatic truth

---

## 20. Recommended Navigation Structure

### Main navigation
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

### Place detail navigation
Within a place:
- Overview
- Trees / Perennials
- Beds
- Activities
- Problems
- Calendar
- Weather

---

## 21. v1 Acceptance Criteria

The v1 system is acceptable if the user can:

1. Create multiple places
2. Create and reuse plant definitions
3. Add trees/perennials and beds to places
4. Add yearly plantings to beds
5. Add persistent plants to beds
6. Log activities against one, many, or all relevant targets
7. Record problems with photos
8. Create products with plant-specific usage rules
9. Maintain stock and see quantity decrease on use
10. View history of product usage and stock movement
11. Receive task reminders through notifications
12. See quarantine periods in calendar
13. Use weather context per place
14. Confirm whether rain actually happened
15. Use AI to help populate product data
16. Use AI to get spacing/coexistence suggestions for beds

---

## 22. Recommended Next Step

Now that scope is fixed, the correct next deliverable is:

### Technical specification
Including:
- domain entities
- relational data model
- core workflows
- API surface
- PWA/notification architecture
- weather integration shape
- AI integration boundaries

That is the point where we move from product definition into implementation design.
