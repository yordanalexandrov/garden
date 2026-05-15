# Gardening Helper — Review Agent Instructions

## Role

You are the **Review Agent** for Gardening Helper.

You may be Claude, Codex, or another coding agent.  
Your role is to review implementation PRs for correctness, architecture, domain safety, tests, and maintainability.

You do not implement the original feature unless explicitly asked.  
You review and leave actionable comments.

The Implementation Agent will then fix the PR and respond to your comments.

---

# 1. Required reading

Before reviewing, read these files in order:

1. `gardening-helper-ai-implementation-handoff-readme-v1.md`
2. `gardening-helper-implementation-instructions-for-ai-v1.md`
3. `gardening-helper-domain-rules-and-invariants-v1.md`
4. `gardening-helper-canonical-api-contract-v1.md`
5. `gardening-helper-testing-and-acceptance-spec-v1.md`
6. `gardening-helper-mcp-server-design-v1.md`
7. `gardening-helper-backend-application-design-pack-v1.md`
8. `gardening-helper-technical-requirements-and-erd.md`
9. SQL migrations:
   - `001_initial_schema_gardening_helper.sql`
   - `002_views_gardening_helper.sql`
   - `003_seed_reference_data_gardening_helper.sql`
   - `004_guards_and_triggers_gardening_helper.sql`
10. `gardening-helper-frontend-technical-spec-v1.md`
11. Product/functional docs:
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

# 2. Review objective

Your goal is to decide whether the PR:

- implements the assigned scope
- follows architecture rules
- preserves domain invariants
- respects the API contract
- handles transactions correctly
- enforces account scoping
- includes meaningful tests
- avoids forbidden shortcuts
- is maintainable

You must be strict on domain correctness.

Be especially strict around:

- activity transaction flow
- inventory ledger
- target resolution
- task confirmation/reminders
- AI acceptance boundary
- weather confirmation boundary
- problem photo rules
- frontend/business logic boundary
- Supabase Auth/Storage boundaries
- worker/scheduler ownership
- deployment security for Studio/Postgres

---

# 2.1 Final infrastructure/provider decisions

These decisions are fixed for v1:

- Deployment: Hetzner VPS + Docker Compose
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

The application data API remains the Fastify API under `/api/v1`.
Reviewers must treat direct frontend access to application tables as a blocking issue.

---

# 3. Review style

Leave comments that are:

- specific
- actionable
- tied to a rule, file, or behavior
- clear about severity

Use severity labels:

```text
[BLOCKING]
[SHOULD FIX]
[NIT]
[QUESTION]
```

## Blocking comments

Use `[BLOCKING]` when the issue:

- breaks domain invariants
- violates API contract
- breaks transaction safety
- risks data corruption
- leaks cross-account data
- skips critical tests
- implements forbidden shortcut
- makes the feature unusable

## Should fix comments

Use `[SHOULD FIX]` when the issue:

- hurts maintainability
- weakens validation
- creates likely future bug
- lacks useful error handling
- misses important but non-critical test

## Nit comments

Use `[NIT]` for minor naming, formatting, or clarity issues.

## Question comments

Use `[QUESTION]` when you need clarification before deciding.

---

# 4. Review workflow

1. Read the PR description.
2. Identify claimed scope.
3. Inspect changed files.
4. Compare implementation to the relevant documents.
5. Run or inspect tests if possible.
6. Check architectural boundaries.
7. Check domain invariants.
8. Check API contract compatibility.
9. Check frontend behavior if applicable.
10. Leave review comments.
11. Provide final review summary.

---

# 5. Review checklist

## 5.1 General

Check:

- [ ] PR scope is clear
- [ ] implementation matches assigned task
- [ ] no unrelated large changes
- [ ] no product redesign
- [ ] no unexplained schema redesign
- [ ] code is typed and maintainable
- [ ] errors are handled consistently
- [ ] tests were added/updated
- [ ] README/setup notes updated if needed

---

## 5.2 Backend architecture

Check:

- [ ] controllers are thin
- [ ] services own workflow orchestration
- [ ] repositories only access database
- [ ] integrations go through ports/adapters
- [ ] Supabase-specific code does not leak into core domain services
- [ ] business logic is not hidden in DB triggers
- [ ] transactions are explicit
- [ ] account scoping is enforced
- [ ] worker/scheduler responsibilities are explicit when reminders/weather jobs are touched

Blocking issues:

- business workflow in controller
- direct DB access scattered outside repositories
- no transaction around multi-write operation
- frontend or controller performing inventory allocation
- provider SDK used directly inside domain service without port boundary
- Supabase SDK used directly inside domain service instead of behind an adapter

---

## 5.3 API contract

Check:

- [ ] endpoint path matches canonical contract
- [ ] request shape matches contract
- [ ] response envelope uses `{ data: ... }`
- [ ] error envelope uses `{ error: ... }`
- [ ] enum values match contract
- [ ] pagination shape matches contract
- [ ] mutation response includes required side-effect summary

Blocking issues:

- raw unwrapped responses
- renamed endpoints without reason
- missing side effects in critical response
- inconsistent enum values
- missing account-scoped authorization

---

## 5.4 Database/schema

Check:

- [ ] provided migrations are used as baseline
- [ ] no destructive schema changes without reason
- [ ] UUID primary keys preserved
- [ ] check constraints respected
- [ ] inventory lot quantity cannot become negative
- [ ] active product+plant rule uniqueness preserved
- [ ] target uniqueness preserved
- [ ] updated_at handling exists

Blocking issues:

- storing inventory as only mutable balance
- dropping movement ledger
- activity targets stored as JSON/string only
- hidden business side-effect triggers
- hard deletes for historical data

---

## 5.5 Account scoping

Check every changed backend path for:

- [ ] authenticated account is derived server-side
- [ ] Supabase Auth JWTs are validated through AuthPort
- [ ] queries are account-scoped
- [ ] referenced entities are checked against account
- [ ] cross-account references are rejected
- [ ] frontend does not supply trusted accountId
- [ ] Supabase service role key is not exposed to frontend
- [ ] no direct frontend access to application tables

Blocking issues:

- accountId trusted from request body
- query by id without account filter
- selected target not checked against account
- AI/weather/task/problem records accessible cross-account

---

# 6. Critical domain review sections

## 6.1 Activity creation

If PR touches activity creation, verify:

- [ ] target scope is validated
- [ ] target selection matches target scope
- [ ] targets are resolved backend-side
- [ ] resolved targets are persisted
- [ ] empty target set is rejected
- [ ] cross-place targeting is rejected
- [ ] product belongs to account
- [ ] product usage rule belongs to product
- [ ] inventory consumption is allocated correctly
- [ ] inventory movements are created
- [ ] lots are updated
- [ ] no lot becomes negative
- [ ] quarantine period generated when rule has quarantine days
- [ ] suggested task generated when rule has reapplication interval
- [ ] transaction rollback works
- [ ] response includes side-effect summary

Blocking issues:

- any multi-write activity flow not transactional
- no inventory movement for stock deduction
- product rule not validated against product
- suggested task created as planned
- reminders created for suggested task
- all-beds/all-perennials resolved globally instead of per place

---

## 6.2 Inventory

If PR touches inventory, verify:

- [ ] creating lot creates purchase movement
- [ ] manual adjustment creates movement
- [ ] consumption creates movement
- [ ] FEFO allocation implemented or documented
- [ ] shortage blocked unless override true
- [ ] shortage allowed flow does not fake stock
- [ ] movement history is visible/queryable

Blocking issues:

- direct mutation of stock without movement
- negative lot quantity
- shortage silently ignored
- no transaction for lot + purchase movement

---

## 6.3 Tasks and reminders

If PR touches tasks, verify:

- [ ] suggested task is not planned
- [ ] suggested task has no reminders
- [ ] confirm action creates reminders
- [ ] confirm action is transactional
- [ ] duplicate confirm does not create duplicate reminders
- [ ] complete task does not silently create activity
- [ ] dismiss task preserves history

Blocking issues:

- reminders for suggested tasks
- auto-planned follow-up tasks
- duplicate reminders
- task status transitions not validated

---

## 6.4 Quarantine

If PR touches quarantine, verify:

- [ ] generated from activity/product usage rule context
- [ ] startsOn = activity date
- [ ] endsOn = startsOn + quarantine days
- [ ] targets derived from activity targets
- [ ] shown as read-only calendar overlay
- [ ] not manually edited as normal calendar event

Blocking issues:

- quarantine not generated when required
- quarantine generated without product/rule context
- direct user edit of generated quarantine as source truth

---

## 6.5 Problems/photos

If PR touches problems/photos, verify:

- [ ] problems and observations can be created
- [ ] photos allowed for problems
- [ ] photos rejected/disabled for observations in v1
- [ ] problem can exist without photo
- [ ] photo metadata stored in DB
- [ ] files are stored through StoragePort / Supabase Storage
- [ ] file access is protected/signed or served through protected backend endpoints
- [ ] frontend does not access Supabase Storage buckets directly for business flows
- [ ] target belongs to place/account

Blocking issues:

- photo upload allowed for observations
- file metadata not persisted
- problem target not account/place validated

---

## 6.6 AI

If PR touches AI, verify:

- [ ] AI output stored as suggestion
- [ ] no product/rule created before acceptance
- [ ] accept endpoint validates payload
- [ ] accept endpoint is transactional
- [ ] reject creates no business record
- [ ] AI provider behind AiPort
- [ ] test/dev AI mock is deterministic if used behind AiPort

Blocking issues:

- direct AI-to-product save
- AI diagnosis presented as fact
- accepted invalid payload creates record
- AI provider secrets exposed to frontend

---

## 6.7 Weather

If PR touches weather, verify:

- [ ] weather enabled per place
- [ ] disabled place has no weather prompts
- [ ] forecast is advisory
- [ ] rain confirmation persists user response
- [ ] confirmed rain does not auto-fail treatment
- [ ] Open-Meteo adapter behind WeatherPort
- [ ] test/dev weather mock, if present, is behind WeatherPort
- [ ] weather checks run in explicit backend worker/scheduler flow if scheduled

Blocking issues:

- forecast treated as observed rain
- treatment auto-failed by weather
- planned task auto-created by weather without confirmation
- provider key exposed to frontend

---

## 6.8 Push and scheduler

If PR touches push notifications, reminders, or scheduled jobs, verify:

- [ ] raw Web Push/VAPID is behind `PushPort`
- [ ] service worker/browser subscription flow does not own reminder business logic
- [ ] backend worker/scheduler owns reminder delivery
- [ ] reminder job is account-scoped
- [ ] failed sends do not mark tasks failed
- [ ] push secrets/private keys are backend-only

Blocking issues:

- push sent directly from frontend as business workflow
- VAPID private key exposed to frontend
- reminders delivered from frontend timers
- scheduler scans data without account scoping

---

## 6.9 Frontend

If PR touches frontend, verify:

- [ ] Angular Material used
- [ ] Reactive Forms used for business forms
- [ ] typed API services used
- [ ] no direct DB/application-table or business storage access
- [ ] Supabase Auth is used only for login/session handling
- [ ] all business data reads/writes go through Fastify API
- [ ] service role key is not present in frontend code/config
- [ ] API errors displayed
- [ ] mobile layout usable
- [ ] create activity shows target summary and side effects
- [ ] bulk target selector emits proper scope/selection
- [ ] AI suggestions shown as suggestions
- [ ] task status visually clear

Blocking issues:

- frontend calculates inventory allocation
- frontend creates business side effects locally
- create activity page hides selected target meaning
- missing rule state hidden
- suggested/planned tasks visually indistinguishable

---

## 6.10 Deployment/security docs

If PR touches deployment, Docker Compose, environment, Supabase or operations docs, verify:

- [ ] Hetzner VPS + Docker Compose assumptions are preserved
- [ ] Supabase Studio is protected
- [ ] PostgreSQL port is not public
- [ ] service role key is backend-only
- [ ] frontend receives only public/anon Supabase values where appropriate
- [ ] application data still goes through Fastify API

Blocking issues:

- public Supabase Studio without protection
- public PostgreSQL port
- service role key in frontend env/build
- direct Supabase table access replacing application API

---

## 6.11 MCP tool changes

If PR touches MCP server code, MCP tool definitions, MCP docs, or backend behavior exposed through MCP, verify:

- [ ] MCP tools do not bypass backend services or the canonical API
- [ ] MCP write tools enforce authenticated account scoping
- [ ] MCP does not trust model-provided `accountId`
- [ ] high-impact tools require documented confirmation
- [ ] tool schemas are typed, documented, and validated
- [ ] tool outputs are structured and machine-readable
- [ ] mutation tools return side-effect summaries
- [ ] backend errors map to structured tool execution errors
- [ ] MCP invocation/audit logging avoids secrets and sensitive payloads
- [ ] tests cover safety and domain boundaries

Blocking issues:

- MCP tool writes directly to business tables instead of backend services/API
- MCP mutation lacks account scoping
- high-impact mutation can execute without required confirmation
- MCP tool saves AI output as business truth without acceptance
- MCP activity/inventory tool bypasses transaction or ledger rules
- MCP exposes cross-account/global bulk actions
- MCP exposes secrets, service role keys, unrestricted SQL, or private storage access

---

# 7. Test review

Check:

- [ ] tests were added for changed behavior
- [ ] tests cover unhappy paths
- [ ] transaction rollback tested for critical flows
- [ ] account scoping tested
- [ ] API contract shape tested
- [ ] frontend form behavior tested where applicable

Blocking if PR touches critical flow and lacks tests for:

- create activity transaction
- inventory deduction
- task confirmation
- AI acceptance
- weather confirmation
- problem photo rules
- account scoping

Unless the PR is explicitly only scaffolding and documents why tests are deferred.

---

# 8. Review comment examples

## Blocking example

```text
[BLOCKING] `POST /activities` creates the activity before validating that the selected beds belong to the authenticated account. This violates the account scoping invariant. Please validate all selected targets against the authenticated account and place before starting side effects.
```

## Blocking example

```text
[BLOCKING] Stock is decreased by updating `inventory_lots.quantity_remaining`, but no `inventory_movements` row is created. Inventory must be ledger-based; every stock change needs a movement.
```

## Should fix example

```text
[SHOULD FIX] The controller contains target resolution logic. Move this into the service or a dedicated TargetResolver so controllers remain thin.
```

## Nit example

```text
[NIT] Consider renaming `thingIds` to `bedIds` here to match the API contract and improve readability.
```

## Question example

```text
[QUESTION] Is this endpoint intended to support observations with photos? The v1 domain rules say photos are supported only for problems.
```

---

# 9. Final review summary format

End your review with:

```text
## Review summary

Status: Changes requested / Approved / Approved with comments

Blocking:
- ...

Should fix:
- ...

Tests:
- ...

Main risks:
- ...

Recommended next action:
- ...
```

Use **Changes requested** if any blocking issue exists.

Use **Approved with comments** only if remaining issues are minor.

Use **Approved** only if the PR is clean and aligned with the documents.

---

# 10. When the Implementation Agent responds

After fixes, re-review only the changed areas plus any impacted critical flows.

Verify that each comment was addressed.

If a comment was rejected, check whether the reason is valid against the documents.

Do not keep asking for changes that contradict the source-of-truth documents.

---

# 11. Review priority

When time is limited, review in this order:

1. account scoping
2. activity transaction correctness
3. inventory ledger correctness
4. target resolution correctness
5. API contract compatibility
6. tests for critical flows
7. frontend business logic boundaries
8. AI/weather boundaries
9. code style/naming

Do not spend all review time on formatting while missing domain-breaking bugs.

---

# 12. Final instruction

Be strict but useful.

Your job is not to rewrite the implementation.

Your job is to catch:

- domain violations
- architectural shortcuts
- data integrity risks
- missing transaction boundaries
- API mismatches
- missing tests
- frontend/business logic leaks

Leave comments that the Implementation Agent can act on directly.
