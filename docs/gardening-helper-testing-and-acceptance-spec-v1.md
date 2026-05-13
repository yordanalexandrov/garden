# Gardening Helper — Testing and Acceptance Specification v1

## 1. Purpose

This document defines the testing and acceptance specification for Gardening Helper v1.

It is intended for:

- implementation AI agents
- developers
- reviewers
- QA
- future maintainers

The purpose is to verify that the generated implementation is not only compiling, but also respects the domain rules, transaction boundaries, API contracts, and frontend behavior required for the product.

This document covers:

- backend unit tests
- backend integration tests
- API contract tests
- database integrity tests
- frontend component/page acceptance tests
- end-to-end user flows
- critical edge cases
- transaction rollback expectations
- minimum v1 acceptance criteria

---

# 2. Testing philosophy

Gardening Helper has a broad feature set, but the highest-risk areas are:

1. account scoping
2. target resolution
3. activity creation transaction
4. inventory deduction and movement history
5. quarantine generation
6. suggested task generation and confirmation
7. AI suggestion acceptance
8. weather rain confirmation
9. problem photo handling
10. calendar aggregation

The implementation should prioritize correctness and auditability over clever UI shortcuts.

## Core principle

If a test fails in one of the critical transaction flows, the implementation should not be considered v1-ready.

---

# 3. Test levels

## 3.1 Unit tests

Use unit tests for:

- pure validation functions
- target resolver logic
- inventory allocator
- reminder scheduler
- date/quarantine calculations
- DTO transformation helpers
- API error mapping
- frontend form validators

## 3.2 Backend integration tests

Use backend integration tests with a real test PostgreSQL database for:

- repository behavior
- service workflows
- transaction rollback
- database constraints
- API endpoints

## 3.3 API contract tests

Use API-level tests against Express routes for:

- request validation
- response shape
- status codes
- error envelope
- pagination
- filtering
- transactional side effects

## 3.4 Frontend tests

Use frontend tests for:

- core form behavior
- reusable selector behavior
- target selection UI
- error rendering
- route/page rendering
- API service typing/mapping
- user-visible side effect summaries

## 3.5 End-to-end tests

Use E2E tests for a small number of critical flows:

- create place -> add plants/beds -> log treatment -> see inventory/quarantine/task effects
- record problem with photo
- confirm suggested task
- AI product suggestion review/accept mock flow
- weather rain confirmation mock flow

---

# 4. Test data principles

## 4.1 Use deterministic fixtures

Test fixtures should include:

- account A
- account B
- place A1
- place B1
- plants:
  - tomato
  - pepper
  - pear
  - strawberry
- beds:
  - Bed A
  - Bed B
- perennials:
  - Pear 1
  - Cherry 1
- products:
  - fungicide
  - fertilizer
- product usage rules:
  - fungicide for tomato
  - fertilizer for pepper
- inventory lots:
  - one with sufficient stock
  - one with low stock
  - one expired or near expiry
- tasks:
  - suggested task
  - planned task
- problem records:
  - one problem with photo
  - one observation without photo

## 4.2 Cross-account fixtures are mandatory

Tests must include account B data to verify account scoping.

No endpoint or service should accidentally access account B data while authenticated as account A.

---

# 5. Backend unit test specifications

## 5.1 TargetResolver tests

### Test: resolves whole place
Given:
- placeId = Place A

When:
- targetScopeType = `whole_place`

Then:
- returns exactly one target
- targetType = `place`
- targetId = placeId

### Test: resolves all perennials in place
Given:
- Place A has 2 active perennials and 1 archived perennial

When:
- targetScopeType = `all_perennials_in_place`

Then:
- returns only 2 active perennials
- archived perennial is excluded

### Test: resolves selected perennials
Given:
- selected IDs belong to Place A

Then:
- returns those exact IDs
- targetType = `perennial`

### Test: rejects missing selected perennial
Given:
- one selected ID does not exist

Then:
- throws `NOT_FOUND` or `VALIDATION_ERROR`

### Test: rejects cross-place selected beds
Given:
- Place A request
- selected bed belongs to Place B

Then:
- throws `BUSINESS_RULE_VIOLATION` or `FORBIDDEN`

### Test: rejects empty target result
Given:
- Place A has no active beds

When:
- targetScopeType = `all_beds_in_place`

Then:
- throws validation/business error for empty resolved target set

### Test: selected yearly plantings must belong to same place through bed
Given:
- selected planting belongs to bed in different place

Then:
- reject

### Test: selected persistent bed plants must belong to same place through bed
Given:
- selected persistent plant belongs to bed in different place

Then:
- reject

---

## 5.2 InventoryAllocator tests

### Test: allocates from earliest expiry first
Given:
- lot 1 expires later
- lot 2 expires earlier
- both have stock

When:
- consuming quantity less than lot 2 remaining

Then:
- allocation uses lot 2 first

### Test: allocates across multiple lots
Given:
- lot 1 remaining = 20 ml
- lot 2 remaining = 50 ml

When:
- consuming 40 ml

Then:
- allocation:
  - 20 ml from lot 1
  - 20 ml from lot 2

### Test: detects uncovered quantity
Given:
- total available = 20 ml

When:
- consuming 30 ml

Then:
- coveredQuantity = 20
- uncoveredQuantity = 10

### Test: rejects unsupported unit conversion
Given:
- stock unit = g
- requested usage unit = ml

Then:
- allocator or service rejects unless conversion support is explicitly implemented

### Test: zero quantity is invalid
Given:
- requested quantity = 0

Then:
- validation error

### Test: negative quantity is invalid
Given:
- requested quantity = -1

Then:
- validation error

---

## 5.3 ReminderScheduler tests

### Test: creates day-before and same-day reminders
Given:
- task due date = 2026-05-20
- timezone = Europe/Sofia

Then:
- returns 2 reminders:
  - day_before
  - same_day

### Test: does not create reminders for suggested task
Given:
- task status = suggested

Then:
- scheduler should not be invoked or should reject

### Test: timezone fallback
Given:
- task place has no timezone
- account has timezone

Then:
- uses account timezone

---

## 5.4 Quarantine calculation tests

### Test: calculates quarantine dates
Given:
- activity date = 2026-05-13
- quarantine days = 14

Then:
- startsOn = 2026-05-13
- endsOn = 2026-05-27

### Test: no quarantine when rule has null quarantine days
Given:
- product rule quarantinePeriodDays = null

Then:
- no quarantine period is generated

### Test: zero quarantine days
Given:
- quarantinePeriodDays = 0

Then:
- either no quarantine period or same-day period depending on chosen policy
- implementation must be consistent and documented

Recommended:
- if 0, do not create quarantine period

---

# 6. Backend service integration tests

## 6.1 CreateActivity — basic watering

### Scenario
User logs watering for all beds in a place.

Given:
- account A
- place A
- 2 active beds

Request:
- type = watering
- targetScopeType = all_beds_in_place
- no product usages

Expected:
- one activity row created
- two activity target rows created
- no inventory movements
- no quarantine periods
- no suggested tasks
- response includes activity id and empty side effects

---

## 6.2 CreateActivity — treatment with product usage

### Scenario
User logs treatment for selected beds using a product rule.

Given:
- account A
- place A
- 2 selected beds
- product exists
- usage rule exists with:
  - reapplicationIntervalDays = 10
  - quarantinePeriodDays = 14
- inventory lot has enough stock

Request:
- type = treatment
- targetScopeType = selected_beds
- productUsages includes quantityUsed = 30 ml

Expected DB result:
- activity created
- 2 activity targets created
- activity_product_usage created
- inventory movement created
- inventory lot quantity_remaining decreased
- quarantine period created
- suggested task created
- task targets created matching activity targets
- audit log created if audit enabled

Expected API response:
- activity id
- inventoryEffects array
- quarantinePeriods array
- suggestedTasks array
- warnings empty

---

## 6.3 CreateActivity — treatment without product rule

### Scenario
User logs product usage without selecting a rule.

Given:
- product exists
- no productUsageRuleId

Expected:
- activity succeeds if product usage is otherwise valid
- activity_product_usage.product_usage_rule_id is null
- inventory deduction still happens
- no quarantine period unless quarantine info exists elsewhere
- no follow-up task unless reapplication interval exists elsewhere
- response includes warning:
  - no structured product rule applied

---

## 6.4 CreateActivity — inventory shortage blocked

### Scenario
User consumes more than available stock.

Given:
- total available stock = 20 ml

Request:
- quantityUsed = 30 ml
- allowInventoryShortage = false

Expected:
- endpoint returns `INVENTORY_SHORTAGE`
- no activity row created
- no targets created
- no product usage created
- no inventory movement created
- no lot quantity changed
- no quarantine period created
- no suggested task created

This must verify full transaction rollback.

---

## 6.5 CreateActivity — inventory shortage allowed

### Scenario
User explicitly allows shortage.

Given:
- total available stock = 20 ml

Request:
- quantityUsed = 30 ml
- allowInventoryShortage = true

Expected:
- activity is created
- consumption movement created only for covered quantity according to policy
- lot quantity_remaining becomes 0
- response includes warning with uncovered quantity = 10 ml
- no lot quantity becomes negative

---

## 6.6 CreateActivity — product rule belongs to different product

Given:
- product A
- product rule for product B

Request:
- productId = product A
- productUsageRuleId = rule for product B

Expected:
- request rejected
- no database side effects

---

## 6.7 CreateActivity — target belongs to another account

Given:
- authenticated as account A
- selected bed belongs to account B

Expected:
- request rejected with `FORBIDDEN` or `NOT_FOUND`
- no database side effects

---

## 6.8 ConfirmSuggestedTask

Given:
- task status = suggested

When:
- confirm endpoint called

Expected:
- task status becomes planned
- confirmed_at set
- two reminder rows created
- reminders have correct types:
  - day_before
  - same_day
- operation is transactional

---

## 6.9 Confirm already planned task

Given:
- task status = planned

When:
- confirm endpoint called

Expected:
- request rejected with `BUSINESS_RULE_VIOLATION`
- no duplicate reminders created

---

## 6.10 Dismiss suggested task

Given:
- task status = suggested

When:
- dismiss endpoint called

Expected:
- task status becomes canceled
- no reminders created

---

## 6.11 Complete planned task

Given:
- task status = planned

When:
- complete endpoint called

Expected:
- task status becomes done
- completed_at set
- no activity is auto-created unless explicit workflow exists

---

## 6.12 CreateInventoryLot

Given:
- product exists

Request:
- quantityInitial = 250 g

Expected:
- inventory lot created
- purchase inventory movement created
- both in one transaction
- movement quantity = lot initial quantity

---

## 6.13 ManualInventoryAdjustment increase

Given:
- lot quantity_remaining = 100 g

Request:
- direction = increase
- quantity = 20 g

Expected:
- adjustment movement created
- lot quantity_remaining = 120 g

---

## 6.14 ManualInventoryAdjustment decrease

Given:
- lot quantity_remaining = 100 g

Request:
- direction = decrease
- quantity = 20 g

Expected:
- adjustment movement created
- lot quantity_remaining = 80 g

---

## 6.15 ManualInventoryAdjustment cannot make negative lot

Given:
- lot quantity_remaining = 10 g

Request:
- direction = decrease
- quantity = 20 g

Expected:
- request rejected
- no movement created
- lot unchanged

---

## 6.16 CreateProblem without photo

Given:
- valid target

Request:
- type = problem
- no photo

Expected:
- problem created successfully
- photos list empty

---

## 6.17 Create observation with photo rejected

Given:
- problem record type = observation

When:
- upload photo endpoint called

Expected:
- request rejected
- no photo metadata created

---

## 6.18 Create problem photo

Given:
- problem exists and type = problem
- valid image file

Expected:
- file uploaded/stored
- problem_photos metadata created
- detail endpoint returns photo metadata or URL

---

## 6.19 Accept AI product suggestion

Given:
- AI suggestion belongs to account A
- suggestionType = product
- valid payload

When:
- accept endpoint called

Expected:
- suggestion marked accepted
- product created
- created entity returned
- audit log created if enabled

---

## 6.20 Accept AI suggestion from another account rejected

Given:
- authenticated account A
- suggestion belongs to account B

Expected:
- reject with NOT_FOUND or FORBIDDEN
- no business records created

---

## 6.21 Accept invalid AI payload rejected

Given:
- AI suggestion payload missing required product name

Expected:
- validation error
- suggestion not marked accepted
- no product created

---

## 6.22 Rain confirmation

Given:
- weather event status = pending

When:
- confirm rain = confirmed_yes

Expected:
- user_confirmation_status = confirmed_yes
- observed_rain = true
- no treatment is auto-marked failed
- no planned task is auto-created

---

## 6.23 Rain confirmation no

When:
- confirm rain = confirmed_no

Expected:
- user_confirmation_status = confirmed_no
- observed_rain = false

---

## 6.24 Rain confirmation ignored

When:
- response = ignored

Expected:
- user_confirmation_status = ignored
- observed_rain = null

---

# 7. Database integrity tests

## 7.1 Required timestamps

For every business table:
- created_at must be set
- updated_at must be set where applicable

## 7.2 updated_at trigger

When a mutable record is updated:
- updated_at changes

Tables:
- accounts
- places
- plants
- perennials
- beds
- persistent_bed_plants
- yearly_bed_plantings
- products
- product_usage_rules
- inventory_lots
- activities
- problems
- tasks
- weather_events
- ai_sessions
- push_subscriptions

## 7.3 Check constraints reject invalid enum

Examples:
- invalid product category rejected
- invalid unit rejected
- invalid activity type rejected
- invalid task status rejected
- invalid target type rejected

## 7.4 Unique active product usage rule

Given:
- active product usage rule exists for product+plant

When:
- create second active rule for same product+plant

Expected:
- conflict

When:
- first rule is archived

Then:
- new active rule can be created

## 7.5 Inventory lot quantity cannot be negative

Direct DB update/insert should reject negative quantity_remaining.

## 7.6 Activity target uniqueness

Same target should not be duplicated for same activity.

## 7.7 Task target uniqueness

Same target should not be duplicated for same task.

## 7.8 Push endpoint active uniqueness

Same active push endpoint should not be duplicated for same account.

---

# 8. API contract tests

## 8.1 Standard success envelope

Every successful endpoint returns:

```json
{
  "data": ...
}
```

## 8.2 Standard error envelope

Every failed endpoint returns:

```json
{
  "error": {
    "code": "...",
    "message": "...",
    "details": {}
  }
}
```

## 8.3 Auth required

All business endpoints reject missing token with 401.

Exception:
- health endpoint

## 8.4 Account scoping

For each major resource:
- account A cannot read account B records
- expected result should be NOT_FOUND or FORBIDDEN consistently

Test:
- places
- plants
- beds
- products
- activities
- problems
- tasks
- AI suggestions
- weather events

## 8.5 Pagination shape

List endpoints return:
- items
- page
- pageSize
- total

Test:
- /places
- /plants
- /products
- /activities
- /problems
- /tasks
- /inventory

## 8.6 Filtering

Test filters:
- activities by place/type/date
- problems by place/status/category
- products by category/search
- tasks by status/due range
- inventory by low stock/expiry if implemented

## 8.7 POST /activities response side effects

Create activity response must include:
- activity
- inventoryEffects
- quarantinePeriods
- suggestedTasks
- warnings

Even if arrays are empty.

## 8.8 POST /tasks/:id/confirm response

Confirm task response must include:
- status planned
- confirmedAt
- reminders

## 8.9 POST /ai/suggestions/:id/accept response

Must include:
- acceptedSuggestionId
- createdEntities
- updatedEntities

## 8.10 Multipart photo upload

Photo upload endpoint must:
- accept valid image multipart upload
- reject non-image file
- reject oversized file according to config
- reject upload to observation

---

# 9. Frontend acceptance tests

## 9.1 App shell

Acceptance:
- app loads authenticated shell
- primary navigation visible
- mobile layout collapses navigation
- route outlet displays selected page
- global API errors shown consistently

## 9.2 Places page

Acceptance:
- user can list places
- create place form validates required name
- weather enabled requires location data
- place archive requires confirmation

## 9.3 Plants page

Acceptance:
- user can search plants
- user can create plant
- lifecycle/growing style values are limited to allowed options
- archived plants are not shown by default

## 9.4 Place detail page

Acceptance:
- shows place overview
- shows counts/summary
- tabs/subnavigation work:
  - overview
  - trees/perennials
  - beds
  - activities
  - problems
  - calendar
  - weather

## 9.5 Beds page

Acceptance:
- user can create bed
- dimensions validate positive numbers
- current year plantings shown
- year selector changes yearly planting view
- persistent plants shown separately from yearly plantings

## 9.6 Product detail page

Acceptance:
- product metadata shown
- usage rules shown
- inventory summary shown
- inventory lots/movement history accessible
- add rule action available
- add lot action available

## 9.7 Create activity page

Acceptance:
- user must select place
- target scope selector changes available target UI
- all beds scope shows target count
- selected beds scope allows multi-select
- product usage section supports adding/removing rows
- missing product rule warning is visible
- submit disabled while saving
- after success, side effects summary is shown

## 9.8 Bulk target selector component

Acceptance:
- disabled until place is selected if scope requires place
- shows empty state when no targets exist
- shows selected count
- emits targetScopeType and targetSelection
- works on mobile

## 9.9 Create problem page

Acceptance:
- type problem shows photo uploader
- type observation hides/disables photo uploader
- problem can be saved without photo
- invalid required fields show errors
- selected target summary is visible before save

## 9.10 Calendar page

Acceptance:
- calendar displays activities, tasks, quarantine, weather markers distinctly
- place filter works
- mobile agenda view is usable
- clicking item opens correct detail page/dialog

## 9.11 Task detail page

Acceptance:
- suggested task shows confirm/dismiss actions
- planned task shows mark done/skip actions
- done/canceled tasks are mostly read-only
- confirming suggested task updates UI to planned and shows reminders

## 9.12 AI product ingestion page

Acceptance:
- user can provide product name/text/image input
- AI suggestions shown as structured editable cards
- accepting suggestion shows created entity link
- rejecting suggestion removes/dismisses suggestion
- AI output is not displayed as already saved before acceptance

## 9.13 Weather rain prompt

Acceptance:
- pending rain confirmation shows prompt
- user can answer yes/no/ignore
- response updates UI
- prompt does not say treatment automatically failed

## 9.14 Notifications settings page

Acceptance:
- shows browser permission state
- user can request permission
- push subscription sent to backend
- disabled/browser-blocked state shown clearly
- tasks/calendar still work without notifications

---

# 10. End-to-end acceptance scenarios

## 10.1 Full garden setup flow

Steps:
1. Create place
2. Create plants:
   - tomato
   - pear
3. Add perennial pear tree to place
4. Add bed
5. Add yearly tomato planting to bed
6. Add persistent strawberry plant to bed

Expected:
- all records visible in place detail
- bed shows persistent and yearly contents separately
- plant database reused across entities

---

## 10.2 Treatment with full side effects

Steps:
1. Create product
2. Add product usage rule with:
   - reapplication interval = 10 days
   - quarantine = 14 days
3. Add inventory lot with enough stock
4. Log treatment against selected bed
5. Open activity detail
6. Open inventory detail
7. Open calendar
8. Open tasks list

Expected:
- activity exists
- inventory decreased
- inventory movement exists
- quarantine appears on calendar
- suggested task appears
- suggested task is not planned
- no reminders yet

---

## 10.3 Confirm suggested task

Steps:
1. From treatment flow, open suggested task
2. Confirm task

Expected:
- task status becomes planned
- reminders created:
  - day before
  - same day
- calendar shows task as planned
- dashboard upcoming tasks includes it

---

## 10.4 Inventory shortage flow

Steps:
1. Product has 10 ml stock
2. User logs treatment consuming 20 ml
3. First attempt without shortage override
4. Second attempt with shortage override

Expected first attempt:
- blocked with inventory shortage error
- no activity created

Expected second attempt:
- activity created
- stock reduced to zero
- no negative lot
- warning shown for uncovered quantity

---

## 10.5 Problem with photo

Steps:
1. Create problem for bed
2. Attach photo
3. Open problem detail

Expected:
- problem saved
- photo visible
- problem appears in problems list
- target summary correct

---

## 10.6 Observation without photo

Steps:
1. Create observation
2. Try to attach photo

Expected:
- observation saved
- photo upload not available or rejected
- no problem_photos row created

---

## 10.7 AI product ingestion

Steps:
1. Open AI product ingestion
2. Provide product name/label text
3. Receive suggestions
4. Accept product suggestion
5. Accept product rule suggestion

Expected:
- suggestions stored
- accepted state stored
- product created only after acceptance
- rule created only after acceptance
- product detail shows created records

---

## 10.8 Weather rain confirmation

Steps:
1. Place has weather enabled
2. Treatment task has rain-check event pending
3. User confirms rain

Expected:
- weather event updated
- observedRain true
- no treatment auto-deleted
- no planned task auto-created without confirmation

---

## 10.9 Cross-account safety

Steps:
1. Authenticate as account A
2. Try to access account B product/activity/problem/task

Expected:
- access denied
- no leaked record data

---

# 11. Transaction rollback test scenarios

## 11.1 Failure during inventory movement creation

Simulate:
- activity inserted
- targets inserted
- product usage inserted
- inventory movement fails

Expected:
- no activity remains
- no targets remain
- no product usage remains
- no lot quantity changed

## 11.2 Failure during quarantine creation

Simulate:
- stock movement succeeded
- quarantine insert fails

Expected:
- whole transaction rolls back
- lot quantity restored
- no inventory movement remains
- no activity remains

## 11.3 Failure during suggested task creation

Simulate:
- quarantine succeeded
- suggested task creation fails

Expected:
- whole transaction rolls back
- no partial records remain

## 11.4 Failure during reminder creation on task confirm

Simulate:
- task status update succeeds
- reminder insert fails

Expected:
- transaction rolls back
- task remains suggested
- no reminders created

## 11.5 Failure during AI acceptance

Simulate:
- suggestion marked accepted
- product creation fails

Expected:
- transaction rolls back
- suggestion remains unaccepted
- no product created

---

# 12. Non-functional acceptance criteria

## 12.1 Performance

Minimum expectations for v1:
- dashboard loads within acceptable time on normal home network
- list pages support pagination
- create activity transaction completes reliably for normal target counts
- calendar month feed does not require excessive frontend stitching

Suggested practical targets:
- most API list requests under 500ms locally/dev
- create activity under 1s locally/dev for normal use
- calendar month under 1s locally/dev with moderate data

These are development targets, not hard production SLAs.

## 12.2 Mobile usability

Acceptance:
- create activity usable on phone width
- create problem with photo usable on phone width
- navigation usable on phone
- no critical workflow depends on hover
- forms do not require horizontal scrolling

## 12.3 Accessibility

Acceptance:
- forms have labels
- validation errors readable
- keyboard navigation works for main forms/dialogs
- destructive actions require confirmation
- icon-only buttons have aria labels

## 12.4 Security

Acceptance:
- no frontend direct DB access
- no provider secrets exposed in frontend
- account scoping enforced
- upload endpoint validates file type/size
- push subscription endpoints require auth

---

# 13. Test coverage priorities

## P0 — must test before v1
- account scoping
- create activity transaction
- inventory deduction and shortage
- target resolution
- product rule consistency
- task confirmation/reminders
- problem photo rules
- AI acceptance boundary
- weather rain confirmation boundary

## P1 — should test before v1
- calendar aggregation
- dashboard aggregation
- product CRUD
- plant CRUD
- bed/yearly planting CRUD
- persistent plant CRUD
- frontend create activity UX
- frontend create problem UX

## P2 — useful but can be later
- advanced filtering combinations
- audit log detail checks
- notification send job provider behavior
- image resizing/preview generation
- AI confidence/warning display details

---

# 14. Minimum v1 acceptance checklist

The implementation is v1-acceptable only if all of the following work:

## Garden structure
- [ ] Create/list/update/archive places
- [ ] Enable/disable weather per place
- [ ] Create/list/update/archive plants
- [ ] Create/list/update/archive perennials
- [ ] Create/list/update/archive beds
- [ ] Add persistent bed plants
- [ ] Add yearly bed plantings by year

## Products and inventory
- [ ] Create/list/update/archive products
- [ ] Add product usage rules by plant
- [ ] Enforce one active product+plant rule in v1
- [ ] Add inventory lot
- [ ] Purchase movement created with inventory lot
- [ ] Manual adjustment creates movement
- [ ] Inventory movement history visible

## Activities
- [ ] Log watering without product
- [ ] Log treatment/fertilizing with product
- [ ] Select multiple beds/trees
- [ ] Use all beds/all trees scope
- [ ] Persist resolved targets
- [ ] Deduct inventory automatically
- [ ] Generate quarantine if rule has quarantine days
- [ ] Generate suggested task if rule has reapplication interval
- [ ] Roll back all side effects on failure

## Problems
- [ ] Create problem
- [ ] Create observation
- [ ] Upload problem photo
- [ ] Reject/disable photo upload for observation
- [ ] Update problem status

## Tasks/calendar
- [ ] Suggested tasks visible
- [ ] Confirm suggested task
- [ ] Create reminders on confirmation
- [ ] Calendar shows activities/tasks/quarantine
- [ ] Suggested and planned tasks visually distinct

## Weather
- [ ] Place weather disabled means no weather prompts
- [ ] Place weather enabled can show forecast context
- [ ] Pending rain confirmation can be answered
- [ ] Rain confirmation does not auto-fail treatment

## AI
- [ ] Product ingestion suggestion can be created
- [ ] AI suggestion is not saved as business data automatically
- [ ] Accepting suggestion creates business record
- [ ] Rejected suggestion does not create business record
- [ ] Bed planning suggestion is guidance only

## Frontend
- [ ] App shell/navigation works desktop and mobile
- [ ] Create activity page is usable on mobile
- [ ] Bulk target selector works
- [ ] Create problem with photo works
- [ ] API errors are displayed clearly
- [ ] Notifications settings page can register push subscription if browser allows

## Security/integrity
- [ ] Account A cannot access Account B data
- [ ] Frontend does not access DB directly
- [ ] Business logic is backend-owned
- [ ] No hidden DB side-effect triggers create business records
- [ ] Critical writes are transactional

---

# 15. Implementation AI testing instructions

Any implementation AI should be instructed to:

1. Generate tests together with implementation.
2. Prioritize service integration tests over superficial component tests.
3. Use a real PostgreSQL test database for repository/service tests where possible.
4. Mock external providers:
   - AI
   - weather
   - storage
   - push
5. Verify transaction rollback explicitly.
6. Verify account scoping explicitly.
7. Avoid tests that only check happy paths.
8. Keep test fixtures deterministic.
9. Use API contract response shapes exactly.
10. Treat this document as acceptance authority.

---

# 16. Final acceptance rule

A generated implementation should not be considered complete if it only:

- compiles
- displays screens
- inserts simple CRUD records

It must also prove that:

- domain invariants hold
- critical flows are transactional
- inventory is auditable
- automation is controlled
- AI and weather stay assistive
- frontend shows user intent and side effects clearly
- account boundaries are enforced

This document is the canonical testing and acceptance specification for Gardening Helper v1.
