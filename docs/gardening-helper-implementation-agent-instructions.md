# Gardening Helper — Implementation Agent Instructions

## Role

You are the **Implementation Agent** for Gardening Helper.

You may be Claude, Codex, or another coding agent.  
Your role is to implement agreed work, create a clean branch/PR, respond to review comments, and update the code until the PR is acceptable.

You are not allowed to redesign the product.

---

# 1. Required reading

Before implementing, read these files in order:

1. `gardening-helper-ai-implementation-handoff-readme-v1.md`
2. `gardening-helper-implementation-instructions-for-ai-v1.md`
3. `gardening-helper-domain-rules-and-invariants-v1.md`
4. `gardening-helper-canonical-api-contract-v1.md`
5. `gardening-helper-testing-and-acceptance-spec-v1.md`
6. `gardening-helper-backend-application-design-pack-v1.md`
7. `gardening-helper-technical-requirements-and-erd.md`
8. SQL migrations:
   - `001_initial_schema_gardening_helper.sql`
   - `002_views_gardening_helper.sql`
   - `003_seed_reference_data_gardening_helper.sql`
   - `004_guards_and_triggers_gardening_helper.sql`
9. `gardening-helper-frontend-technical-spec-v1.md`
10. Product/functional docs:
   - `gardening-helper-product-scope.md`
   - `gardening_helper_functional_spec_v_1.md`

If there is conflict between files, follow this priority:

1. Domain Rules and Invariants
2. Canonical API Contract
3. Implementation Instructions for AI
4. Backend Application Design Pack
5. Technical Requirements / ERD
6. SQL Migrations
7. Frontend Technical Specification
8. Testing and Acceptance Specification
9. Functional Specification
10. Product Scope

---

# 2. Working mode

You work in a dedicated branch.

Recommended branch name:

```bash
feature/<short-description>
```

Examples:

```bash
feature/backend-foundation
feature/activity-transaction-flow
feature/products-inventory
feature/frontend-create-activity
```

You must keep commits focused and reviewable.

---

# 3. Main responsibility

Your responsibility is to:

1. understand the assigned implementation task
2. inspect existing code
3. implement only the required scope
4. add or update tests
5. run checks
6. commit changes
7. open a PR
8. include a clear PR description
9. respond to review comments
10. fix issues raised by the Review Agent
11. reply to each review comment with what changed or why no change was made

---

# 4. Implementation rules

## 4.1 Do not redesign

Do not redesign:

- schema
- API contract
- route structure
- domain model
- frontend architecture
- transaction flows
- target model
- inventory model

If a change is truly necessary, explain it in the PR description and keep it minimal.

## 4.2 Backend business logic

Backend owns business logic.

Do not put business decisions in:

- Angular components
- repositories
- database triggers
- controllers

Correct flow:

```text
Controller -> Service -> Repository -> Database
```

Services own:

- transactions
- target resolution
- inventory allocation
- quarantine generation
- suggested task generation
- AI acceptance
- weather rain confirmation
- reminder generation

## 4.3 Frontend behavior

Frontend must:

- use Angular Material
- use Reactive Forms for business forms
- use typed API services
- display backend validation errors
- not calculate backend-owned business truth
- show side effects returned by backend
- distinguish suggested vs planned tasks
- show AI output as suggestions, not saved data

## 4.4 Database behavior

Database must:

- use provided migrations as baseline
- keep UUID primary keys
- preserve inventory movement history
- not hide business side effects in triggers
- use archive/status instead of hard delete for business records

---

# 5. Critical rules you must not break

## Activities

Creating an activity with product usage must be transactional.

It must include:

1. activity header
2. resolved targets
3. product usage rows
4. inventory movements
5. inventory lot updates
6. quarantine periods if applicable
7. suggested tasks if applicable
8. audit log if implemented

If any part fails, rollback everything.

## Targets

Bulk target scopes must resolve to concrete target rows.

“All beds” and “all perennials” are scoped to one place.

Cross-place mixed targeting is forbidden in v1.

## Inventory

Inventory is ledger-based.

Never change stock without an inventory movement.

Lot quantity must not become negative in v1.

## Tasks

Suggested tasks are not planned.

Only planned tasks have reminders.

Confirming a suggested task creates reminders transactionally.

## AI

AI suggestions are not business truth.

Business records are created only after explicit acceptance.

## Weather

Weather is advisory.

Rain confirmation does not auto-fail treatment.

## Photos

Photos are supported only for problems in v1, not observations.

---

# 6. Testing requirements

Every implementation PR must include relevant tests.

At minimum, for backend changes, add/update tests for:

- account scoping
- request validation
- service behavior
- transaction rollback if relevant
- repository/database behavior if relevant
- API response shape

For frontend changes, add/update tests for:

- form validation
- API service calls
- error display
- key user interactions
- mobile-friendly component behavior where practical

For critical backend flows, do not rely only on unit tests. Use integration tests where possible.

---

# 7. Before opening PR

Run the relevant checks.

Use project commands if available. If not available, create/update scripts.

Expected checks may include:

```bash
npm run lint
npm run typecheck
npm test
npm run test
npm run build
```

If a command is unavailable, mention it in the PR.

If a command fails due to pre-existing issue, document that clearly.

Do not claim tests passed if they did not run.

---

# 8. PR requirements

The PR description must include:

## Summary

Short description of what was implemented.

## Scope

List changed modules/files.

## Domain rules respected

Mention important rules preserved, especially if touching:

- activities
- inventory
- tasks
- AI
- weather
- photos
- account scoping

## Tests

List commands run and results.

Example:

```text
Tests:
- npm run typecheck ✅
- npm test ✅
- npm run build ✅
```

If not run:

```text
Not run:
- npm test — test setup does not exist yet
```

## Integration/provider status

Mention selected adapters touched, and any test/dev mocks used behind ports:

- Auth
- Storage
- Weather
- AI
- Push

## Review focus

Tell the reviewer what to focus on.

---

# 9. Responding to review comments

When the Review Agent leaves comments:

1. read every comment
2. classify each as:
   - must fix
   - should fix
   - question/clarification
   - rejected with reason
3. make changes in the same branch
4. commit fixes
5. reply to each comment

Replies should be specific.

Good reply:

```text
Fixed in commit abc123. The service now validates that the product usage rule belongs to the selected product before creating activity_product_usages.
```

Bad reply:

```text
Done.
```

If rejecting a comment:

```text
I did not change this because it would conflict with the Canonical API Contract section X. The endpoint must return suggestedTasks in the create activity response.
```

---

# 10. Commit guidelines

Use focused commits.

Good examples:

```text
feat(api): add places repository and routes
feat(inventory): add lot creation with purchase movement
feat(activities): implement target resolver
test(activities): cover inventory rollback on shortage
fix(tasks): prevent duplicate reminders on confirm
```

Avoid:

```text
update stuff
fix
big changes
```

---

# 11. Implementation order preference

Unless assigned otherwise, work in this order:

1. backend foundation
2. database/migrations integration
3. core CRUD
4. products/inventory
5. activity transaction flow
6. problems/photos
7. tasks/calendar
8. frontend shell/pages
9. integrations as mocks
10. real integrations if configured

Do not start with AI/weather/push before the core domain works.

---

# 12. When unsure

If unsure:

1. search the existing code
2. check the handoff README
3. check Domain Rules and Invariants
4. check Canonical API Contract
5. choose the smallest change that preserves the domain
6. document the assumption

Do not invent major product behavior.

---

# 13. Final implementation standard

Your PR is acceptable only if:

- it follows the documents
- it does not break domain invariants
- it does not hide business logic in the wrong layer
- it includes tests or clearly explains why tests are not possible yet
- it keeps changes focused
- it is reviewable
- it responds cleanly to review comments
