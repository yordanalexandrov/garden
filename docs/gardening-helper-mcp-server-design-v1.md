# Gardening Helper — MCP Server Design v1

## 1. Purpose

The MCP server exposes a controlled set of Gardening Helper capabilities to AI agents so they can inspect garden data, prepare suggestions, and execute approved actions while preserving account scoping, auditability, transaction safety, and human control.

This document is a planning and contract layer only. It does not implement the MCP server.

The MCP server is part of the application architecture from the beginning, but its capability set must grow incrementally as backend modules, service workflows, API contracts, and tests become stable.

---

# 2. External MCP Reference Checked

This design was written against the official Model Context Protocol documentation/specification available on 2026-05-15:

- Tools: `https://modelcontextprotocol.io/specification/draft/server/tools`
- Resources: `https://modelcontextprotocol.io/specification/2025-03-26/server/resources`
- Prompts: `https://modelcontextprotocol.io/specification/2024-11-05/server/prompts`
- Transport: `https://modelcontextprotocol.io/specification/2025-06-18/basic/transports`
- Authorization: `https://modelcontextprotocol.io/specification/draft/basic/authorization`
- Overview/schema guidance: `https://modelcontextprotocol.io/specification/draft/basic`

Relevant MCP constraints for this project:

- Tools are model-invoked capabilities and each tool has a unique name plus `inputSchema`.
- Tool names may use dot-separated namespaces.
- MCP uses JSON Schema for validation; JSON Schema 2020-12 is the default when no `$schema` is supplied.
- Tool results may include `content` for human-readable output and `structuredContent` for machine-readable output.
- Tools may define `outputSchema` for structured results.
- Tool execution errors that agents can act on should be returned as tool results with `isError: true`; malformed requests and unknown tools are protocol errors.
- Resources are application-driven, URI-identified context items.
- Prompts are user-controlled templates.
- Standard transports include stdio and Streamable HTTP.
- HTTP MCP deployments should use proper authentication, validate origins, and avoid exposing local servers broadly.
- HTTP authorization should follow the MCP authorization profile based on OAuth 2.1 / bearer token use. Stdio deployments normally retrieve credentials from local configuration or environment.
- Sensitive operations should keep a human in the loop with a visible approval/deny opportunity.

---

# 3. Source-of-Truth Priority

MCP documentation does not override the existing Gardening Helper source-of-truth order.

If MCP design conflicts with existing project documents, follow:

1. `gardening-helper-domain-rules-and-invariants-v1.md`
2. `gardening-helper-canonical-api-contract-v1.md`
3. implementation instructions / agent instructions
4. `gardening-helper-backend-application-design-pack-v1.md`
5. `gardening-helper-technical-requirements-and-erd.md`
6. SQL migrations
7. `gardening-helper-frontend-technical-spec-v1.md`
8. testing/acceptance specification
9. `gardening_helper_functional_spec_v_1.md`
10. `gardening-helper-product-scope.md`

MCP tools must not weaken any domain invariant.

---

# 4. Design Principles

- MCP is an agent interface, not a second business backend.
- MCP tools call existing backend services or the canonical backend API.
- MCP tools must not bypass service-layer domain rules, transactions, validation, or audit behavior.
- MCP tools are scoped to an authenticated user/account/workspace.
- MCP must not accept a model-supplied `accountId` as authority.
- Write tools require explicit confirmation where domain rules require confirmation.
- Dangerous or destructive actions are excluded in v1 or confirmation-gated.
- Every mutation must return a clear side-effect summary.
- Tool results must be structured and machine-readable through `structuredContent`.
- Tool text output is a short human-readable summary, not the authoritative result.
- MCP capability grows incrementally with implemented application modules.
- MCP tools must not invent API endpoints or backend behavior outside the canonical contract.
- MCP-originated actions are auditable and distinguishable from normal UI actions where the audit model supports that metadata.

---

# 5. Architecture

## 5.1 Intended Flow

```text
AI Agent / MCP Client
        |
        v
Gardening Helper MCP Server
        |
        v
Gardening Helper Backend API / Application Services
        |
        v
PostgreSQL + Object Storage + Integrations
```

Preferred execution pattern:

```text
AI Agent
  -> MCP Server Tool
  -> Gardening Helper Backend API / Application Service
  -> Repositories / Transaction Layer
  -> PostgreSQL
```

Forbidden execution pattern for business mutations:

```text
AI Agent
  -> MCP Server Tool
  -> Direct SQL writes
```

## 5.2 Deployment Options

### Option A — separate package/app

```text
apps/
  api/
  web/
  mcp-server/
```

Recommended initial option.

Reasons:

- keeps MCP separate from core API request handling
- makes it harder to accidentally import repositories and create a second backend
- supports stdio for local agent usage and later Streamable HTTP for internal/remote usage
- allows independent deployment, transport, and rate-limit policies

### Option B — same repo package inside backend source

```text
src/
  mcp/
    server.ts
    context.ts
    tools/
```

Acceptable only if tool handlers still call services/API through explicit adapters and do not access repositories directly.

### Option C — same Fastify process

Possible later, but not preferred initially. If used, MCP handlers still must call service-layer methods, never repositories directly, and must preserve the same auth/account context rules as REST controllers.

## 5.3 Initial Recommendation

Start with:

- a separate `apps/mcp-server` Node/TypeScript package
- stdio transport for local/dev coding-agent use
- a typed internal API client that calls `/api/v1`
- read-only tools plus `health.check` and documentation tools first
- no direct repository imports
- no direct SQL mutation
- high-impact mutation tools added only after backend workflows and tests exist

This keeps the MCP server from becoming a second backend and prevents AI agents from bypassing domain rules.

---

# 6. Authentication and Authorization

## 6.1 Required Rules

- Tool execution must be tied to an authenticated account/user.
- Account context must come from auth/session/config, not from model-provided arguments.
- MCP must not accept trusted `accountId` from the model as authority.
- Every backend API call must use authenticated actor context.
- Every tool must enforce account scoping through backend services/API.
- Write actions must be auditable.
- Tool lists may vary by granted authorization scopes, but must be deterministic for a given authorization context.

## 6.2 Local Stdio Auth

For the initial local/dev MCP server, credentials may come from local environment or config.

Acceptable initial inputs:

- a user access token obtained from the normal auth flow
- a backend-issued MCP token bound to one account/user and limited scopes
- local development credentials documented outside committed secrets

Hard rules:

- do not store secrets in committed docs, examples, or config
- do not expose Supabase service role key to MCP clients
- do not use a model-supplied account id to switch context

## 6.3 Remote/Internal HTTP Auth

For remote/internal MCP later:

- use Streamable HTTP over HTTPS
- follow MCP HTTP authorization guidance
- use bearer tokens issued for the MCP server audience
- validate token issuer, audience, expiration, and scopes
- validate `Origin` for browser-reachable transports
- bind local HTTP development servers to `127.0.0.1` unless explicitly secured

## 6.4 Open Decisions

- exact token type for initial local MCP use
- whether remote MCP uses the existing Supabase Auth identity directly or a separate app-issued MCP token
- whether high-impact approvals are handled by the MCP client, server confirmation token, or app UI approval queue

---

# 7. Tool Result Contract

Each tool should return:

- MCP `content`: short text summary for humans
- MCP `structuredContent`: machine-readable result matching the documented output schema
- `isError: true` only for tool execution errors that the model can act on

Recommended structured success envelope:

```json
{
  "ok": true,
  "tool": "places.list",
  "correlationId": "request-id",
  "data": {},
  "sideEffects": [],
  "warnings": []
}
```

Recommended structured error envelope:

```json
{
  "ok": false,
  "tool": "activities.create",
  "correlationId": "request-id",
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Product usage rule does not belong to product.",
    "details": {},
    "retryable": false
  },
  "sideEffects": [],
  "warnings": []
}
```

`sideEffects` and `warnings` should always be arrays in structured results, using empty arrays when none apply.

MCP protocol errors are reserved for:

- unknown tool
- malformed MCP request
- server failure before the tool can execute

Backend validation, domain, auth, and provider failures should map into structured tool execution errors where possible.

---

# 8. Tool Categories

## 8.1 Read/query Tools

Read tools inspect already-committed Gardening Helper state. They must be account-scoped and must not change business data.

Examples:

- `places.list`
- `places.get`
- `plants.search`
- `beds.list`
- `beds.get`
- `perennials.list`
- `products.search`
- `products.get`
- `inventory.summary`
- `activities.search`
- `problems.search`
- `tasks.upcoming`
- `calendar.feed`

Confirmation:
- none required

Audit:
- normal request/tool invocation logs; business audit log optional unless policy later requires read audit for sensitive data

## 8.2 Draft/suggestion Tools

Draft tools prepare data but do not commit business truth directly.

Examples:

- `activities.prepare_create`
- `products.prepare_from_label`
- `beds.prepare_ai_plan`
- `tasks.prepare_followup`
- `problems.prepare_summary`

Rules:

- draft output is not business truth
- prepared data must still be reviewed
- any later save must use a mutation tool or normal app/API flow
- AI-generated data follows the same AI suggestion acceptance rules

## 8.3 Mutation Tools

Mutation tools change committed business data only through existing backend workflows.

Examples:

- `activities.create`
- `tasks.confirm`
- `tasks.dismiss`
- `inventory.create_lot`
- `inventory.adjust`
- `problems.create`
- `products.create`
- `product_rules.create`
- `ai_suggestions.accept`
- `weather.confirm_rain`

Rules:

- must call canonical API or service-layer method
- must return side-effect summaries
- must enforce confirmation classes below
- must preserve auditability
- must not directly mutate database tables

## 8.4 Admin/dev Tools

Admin/dev tools are optional and should initially be read-only.

Examples:

- `health.check`
- `docs.search`
- `schema.describe`
- `api.contract.get`

Rules:

- do not expose secrets
- do not expose raw production database connection strings
- do not expose unrestricted SQL execution
- any diagnostic SQL-like capability must be separately documented, read-only, restricted, and excluded from v1 by default

---

# 9. Initial v1 MCP Tool Set

Do not expose every backend capability at once.

## 9.1 Safe Read Tools First

Initial read tools:

- `health.check`
- `docs.search`
- `api.contract.get`
- `places.list`
- `places.get_overview`
- `plants.search`
- `beds.list_by_place`
- `perennials.list_by_place`
- `products.search`
- `inventory.summary`
- `tasks.upcoming`
- `calendar.feed`

## 9.2 Controlled Write Tools

Add only after the matching backend workflows and tests exist:

- `tasks.confirm`
- `tasks.dismiss`
- `weather.confirm_rain`

Add later, after service-level transaction coverage is strong:

- `activities.create`

Do not expose inventory adjustments, AI suggestion acceptance, product/rule creation, or problem photo upload in the first MCP implementation unless a task explicitly expands scope and includes the required review/tests.

---

# 10. Initial Tool Catalog

All schemas below are planning contracts. Implementation must encode them as JSON Schema and align exact DTO fields with `gardening-helper-canonical-api-contract-v1.md`.

Common fields:

- API-backed paginated tools use canonical `page` and `pageSize` query fields. `page` defaults to `1`, `pageSize` defaults to `20`, and `pageSize` must not exceed the backend maximum of `100`.
- Non-API helper tools such as `docs.search` may use `limit`; each tool schema must define its own default and maximum.
- tools must not accept `accountId`
- `correlationId` is generated by the MCP server or backend, not trusted from the model

## 10.1 Read and Dev Tools

| Tool | Classification | Purpose | Input schema summary | Output schema summary | Must call | Domain rules | Confirmation | Audit/logging | Common errors | Tests required |
|---|---|---|---|---|---|---|---|---|---|---|
| `health.check` | Safe read | Check MCP server and backend API reachability | `{}` | status, backend status, timestamp | `GET /health` | no business data | none | invocation log | `EXTERNAL_SERVICE_ERROR`, `INTERNAL_ERROR` | schema, backend error propagation |
| `docs.search` | Safe read / dev | Search project docs for implementation context | `query`, optional `limit` | matching docs/sections | local docs index or read-only doc search adapter | docs are guidance, not DB truth | none | invocation log | `VALIDATION_ERROR`, `INTERNAL_ERROR` | schema, no secret exposure |
| `api.contract.get` | Safe read / dev | Return relevant canonical API contract sections | optional `endpoint`, `section` | contract excerpt metadata and text | local docs reader | cannot invent endpoints | none | invocation log | `NOT_FOUND`, `VALIDATION_ERROR` | endpoint mapping, no mutation |
| `places.list` | Safe read | List account-scoped places | optional `q`, `includeArchived`, `page`, `pageSize` | paginated place summaries | `GET /places` | account scoping | none | invocation log | `FORBIDDEN`, `VALIDATION_ERROR` | account scoping, output envelope |
| `places.get_overview` | Safe read | Fetch place detail/overview | `placeId` | place detail with counts | `GET /places/:placeId` | place ownership | none | invocation log | `NOT_FOUND`, `FORBIDDEN` | cross-account rejection |
| `plants.search` | Safe read | Search reusable plant records | optional `q`, `lifecycleType`, `growingStyle`, `page`, `pageSize` | paginated plant summaries | `GET /plants` | account scoping | none | invocation log | `VALIDATION_ERROR`, `FORBIDDEN` | filters, account scoping |
| `beds.list_by_place` | Safe read | List beds in one place | `placeId`, optional `year`, `q`, `page`, `pageSize` | paginated bed summaries | `GET /places/:placeId/beds` | all-beds scoped by place | none | invocation log | `NOT_FOUND`, `FORBIDDEN` | place/account scoping |
| `perennials.list_by_place` | Safe read | List perennials in one place | `placeId`, optional `q`, `status`, `page`, `pageSize` | paginated perennial summaries | `GET /places/:placeId/perennials` | all-perennials scoped by place | none | invocation log | `NOT_FOUND`, `FORBIDDEN` | place/account scoping |
| `products.search` | Safe read | Search products and stock summaries | optional `q`, `category`, `includeArchived`, `page`, `pageSize` | paginated product summaries | `GET /products` | account scoping | none | invocation log | `VALIDATION_ERROR`, `FORBIDDEN` | filters, output shape |
| `inventory.summary` | Safe read | Summarize inventory across products | optional `q`, `category`, `lowStockOnly`, `expiringBefore`, `page`, `pageSize` | paginated inventory items | `GET /inventory` | ledger remains source of stock truth | none | invocation log | `VALIDATION_ERROR`, `FORBIDDEN` | account scoping, pagination |
| `tasks.upcoming` | Safe read | List upcoming/suggested tasks | optional `placeId`, `status`, `dueFrom`, `dueTo`, `page`, `pageSize` | paginated task summaries | `GET /tasks` | suggested vs planned distinction | none | invocation log | `VALIDATION_ERROR`, `FORBIDDEN` | status filters, account scoping |
| `calendar.feed` | Safe read | Fetch calendar feed | required `from`, `to`; optional `placeId` | activities, tasks, quarantine, weather events | `GET /calendar` | calendar is read model | none | invocation log | `VALIDATION_ERROR`, `FORBIDDEN` | date validation, item type preservation |

## 10.2 Planned Controlled Mutation Tools

| Tool | Classification | Purpose | Input schema summary | Output schema summary | Must call | Domain rules | Confirmation | Audit/logging | Common errors | Tests required |
|---|---|---|---|---|---|---|---|---|---|---|
| `tasks.confirm` | High-impact mutation | Confirm a suggested task as planned | `taskId`, confirmation metadata | planned task, reminders, side effects | `POST /tasks/:taskId/confirm` or `TasksService.confirmSuggestedTask` | suggested task becomes planned only explicitly; reminders only for planned | Class C | backend audit plus MCP invocation | `NOT_FOUND`, `FORBIDDEN`, `BUSINESS_RULE_VIOLATION`, `CONFLICT` | confirmation required, duplicate confirm blocked, reminders transaction |
| `tasks.dismiss` | High-impact mutation | Dismiss a suggested task | `taskId`, confirmation metadata, optional reason | canceled task summary | `POST /tasks/:taskId/dismiss` | dismissal explicit; no reminders | Class C | backend audit plus MCP invocation | `NOT_FOUND`, `FORBIDDEN`, `BUSINESS_RULE_VIOLATION` | confirmation required, no reminders created |
| `weather.confirm_rain` | High-impact mutation | Record user rain confirmation | `weatherEventId`, `response`, confirmation metadata | weather event confirmation status | `POST /weather/events/:weatherEventId/confirm-rain` | weather advisory; no auto-fail treatment | Class C | backend audit plus MCP invocation | `NOT_FOUND`, `FORBIDDEN`, `VALIDATION_ERROR` | yes/no/ignore mapping, no treatment auto-fail |
| `activities.create` | High-impact mutation | Create activity through backend workflow | canonical create activity payload plus confirmation metadata | activity, inventory effects, quarantine, suggested tasks, warnings | `POST /activities` or `ActivitiesService.createActivity` | target resolution, inventory ledger, transaction, suggested tasks | Class C | backend audit plus MCP invocation | `VALIDATION_ERROR`, `INVENTORY_SHORTAGE`, `BUSINESS_RULE_VIOLATION`, `FORBIDDEN` | transaction rollback, shortage behavior, target/account scoping |

## 10.3 Deferred Mutation Tools

These are valid future candidates but are deferred beyond the first MCP implementation:

- `inventory.create_lot`
- `inventory.adjust`
- `problems.create`
- `products.create`
- `product_rules.create`
- `ai_suggestions.accept`
- `products.prepare_from_label`
- `beds.prepare_ai_plan`
- `problems.prepare_summary`

Each must receive a full tool definition before implementation.

---

# 11. Tool Specification Template

Every MCP tool must be documented with:

- name
- purpose
- read/write classification
- required permissions
- input schema
- output schema
- backend API/service called
- domain rules affected
- required confirmation behavior
- audit behavior
- common error codes
- tests required

Use `MCP_TOOL_TEMPLATE.md` for new tools.

---

# 12. Detailed Example: `activities.create`

## Tool: `activities.create`

### Classification

Mutation / high-impact

### Purpose

Create a gardening activity through the existing backend activity creation workflow.

### Must call

`ActivitiesService.createActivity` or the canonical `POST /activities` endpoint.

### Must not

- write directly to `activities`
- write directly to `activity_targets`
- calculate final inventory allocation inside MCP
- update `inventory_lots` directly
- create inventory movements directly
- create planned follow-up tasks directly
- create quarantine periods directly

### Input schema

Must match canonical `POST /activities` request fields, plus explicit confirmation metadata for high-impact execution.

Required business fields:

- `placeId`
- `type`
- `performedAt`
- `targetScopeType`
- `targetSelection`

Optional business fields:

- `notes`
- `productUsages`
- `allowInventoryShortage`

Required confirmation fields for Class C execution:

- `confirmation.confirmed`
- `confirmation.summaryShownToUser`
- `confirmation.confirmedAt`

MCP must not accept `accountId`.

### Output schema

Must include:

- created activity summary
- `inventoryEffects`
- `quarantinePeriods`
- `suggestedTasks`
- `warnings`
- `sideEffects` summary
- backend request/correlation id where available

### Required domain rules

- target resolution backend-owned
- target rows store resolved truth
- all-beds/all-perennials scoped to one place
- no cross-place mixed targeting in v1
- activity creation with product usage is transactional
- inventory ledger preserved
- suggested tasks remain suggested
- quarantine generated only through backend workflow
- product rule consistency enforced by backend service

### Confirmation

Required before execution.

Extra confirmation is required when:

- inventory shortage override is requested
- product usage is submitted without an applicable product rule
- action has a large bulk target count, if such threshold is later defined

### Audit

Use existing backend audit behavior.

MCP invocation log should include:

- tool name
- actor/account context
- target scope metadata
- product usage count, not full sensitive payload where avoidable
- backend request id
- success/failure
- side-effect counts

### Common errors

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `FORBIDDEN`
- `BUSINESS_RULE_VIOLATION`
- `INVENTORY_SHORTAGE`
- `CONFLICT`
- `INTERNAL_ERROR`

### Tests required

- input schema validation
- account scoping
- target resolution through backend only
- transaction rollback
- inventory shortage blocked
- inventory shortage explicitly allowed
- product rule mismatch rejected
- output side-effect envelope
- confirmation required
- no direct DB/repository bypass

---

# 13. Confirmation and Safety Model

## Class A — Safe Read

No confirmation required.

Examples:

- `places.list`
- `plants.search`
- `calendar.feed`
- `health.check`

## Class B — Low-risk Mutation

May execute if the user explicitly requested the action in the current interaction and the action has limited impact.

Examples may be added later only when the domain rules support them.

Initial v1 recommendation:
- avoid Class B mutation tools until the approval model is implemented

## Class C — High-impact Mutation

Requires explicit confirmation or an approval workflow.

Examples:

- creating activity with product usage
- allowing inventory shortage
- inventory adjustment
- accepting AI suggestion as business data
- confirming tasks
- dismissing tasks
- weather/rain confirmation

Class C tool calls must not rely solely on the model saying the user approved. The implementation must use one of:

- MCP client approval with visible tool input summary and server-side confirmation metadata
- server-issued confirmation token from a prepare step
- app UI approval queue

The exact mechanism is an open decision.

## Class D — Forbidden in v1

Must not be exposed through MCP initially.

Examples:

- hard delete business records
- direct SQL mutation
- bypassing inventory ledger
- marking treatment failed automatically
- saving AI output without acceptance
- cross-account operations
- bulk global actions across all places
- unrestricted admin SQL execution
- direct Supabase Storage bucket access
- use of Supabase service role key from MCP client context

---

# 14. Error Model

MCP tool errors should map backend errors where possible.

Standard tool error codes:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `NOT_FOUND`
- `FORBIDDEN`
- `CONFLICT`
- `BUSINESS_RULE_VIOLATION`
- `INVENTORY_SHORTAGE`
- `EXTERNAL_SERVICE_ERROR`
- `INTERNAL_ERROR`

Rules:

- preserve backend error code when available
- include actionable `details` when safe
- never leak secrets, tokens, connection strings, service-role keys, or inaccessible record contents
- return tool execution errors as structured results with `isError: true`
- use MCP protocol errors only for malformed MCP requests, unknown tools, or server-level protocol failure

---

# 15. Resources and Prompts

## Resources

MCP resources may be useful for:

- `docs://gardening-helper/domain-rules`
- `docs://gardening-helper/api-contract`
- `docs://gardening-helper/testing-spec`
- `api://gardening-helper/openapi-or-contract`

Initial recommendation:

- expose documentation through read-only dev tools first
- add MCP resources later if client support and discoverability justify it

Resource rules:

- validate all resource URIs
- enforce access controls for any account-specific resources
- do not expose secrets or raw database dumps
- do not expose arbitrary filesystem access

## Prompts

MCP prompts may be useful later for:

- "Review a Gardening Helper PR"
- "Plan an MCP tool implementation"
- "Investigate an activity transaction bug"

Initial recommendation:

- do not implement prompts in the first MCP server
- keep agent workflows in task/review templates until prompt support is explicitly planned

---

# 16. Observability and Audit

Every MCP tool invocation should log:

- tool name
- actor/user/account context
- transport type
- authorization scope metadata
- request id / correlation id
- backend request id if available
- sanitized input metadata
- success/failure
- error code if failed
- latency
- side-effect counts for mutations

Mutation tools should link to backend audit logs where possible.

Avoid logging:

- access tokens
- refresh tokens
- service role keys
- raw uploaded files
- full provider payloads unless explicitly needed and safe
- sensitive notes beyond what the backend audit policy allows

---

# 17. Testing Strategy

MCP implementation must include tests for:

- tool input schema validation
- output schema/envelope shape
- auth and account context derivation
- account scoping on every read
- backend error propagation
- tool execution error mapping with `isError: true`
- mutation confirmation behavior
- no direct DB writes or repository bypass
- no forbidden automation
- side-effect summaries for mutation tools
- audit/logging metadata for mutation tools
- rate limit or abuse guard behavior where implemented

Critical workflow integration tests:

- at least one safe read tool happy path
- at least one cross-account read rejection
- at least one high-impact tool rejects missing confirmation
- at least one high-impact tool succeeds through backend service/API after confirmation
- `activities.create` must test transaction rollback before MCP exposes it

---

# 18. Implementation Phases

## Phase MCP-0 — Documentation and contracts

- add MCP design doc
- update docs index
- update agent instructions
- add tool template
- define first tool catalog

## Phase MCP-1 — Server foundation

Goal: bootstrap an MCP server foundation without exposing business mutations or broad read access yet.

Bootstrap steps:

1. Create `apps/mcp-server` as a Node/TypeScript package aligned with the repo package manager and TypeScript conventions.
2. Add the MCP SDK and a minimal stdio server entrypoint.
3. Add config validation for:
   - backend API base URL
   - selected transport
   - local auth/token source
   - log level
4. Do not commit credentials, user tokens, service tokens, Supabase service role keys, or example secrets.
5. Implement `McpToolContext` creation.
6. Derive actor/account context from the selected auth/session/config mechanism, not from tool input.
7. Reject or ignore any model-provided `accountId` fields.
8. Implement a typed `GardeningApiClient` with only the endpoints needed for bootstrap:
   - `GET /health`
9. Implement backend response envelope parsing and backend error envelope parsing.
10. Implement MCP structured result helpers:
    - success envelope
    - tool execution error envelope
    - correlation/request id propagation
11. Implement sanitized logging for tool invocation metadata.
12. Register only bootstrap-safe tools:
    - `health.check`
    - optionally `docs.search` / `api.contract.get` if the task explicitly includes local documentation tooling
13. Add package scripts for:
    - typecheck
    - test
    - local stdio run/dev
14. Add tests for:
    - config validation
    - tool input schema validation
    - `health.check` success
    - backend error mapping
    - structured output shape
    - no accepted `accountId` tool input
    - no secret values in logs
15. Document exact local run instructions and auth assumptions.

Phase MCP-1 must not expose:

- `activities.create`
- `tasks.confirm`
- `tasks.dismiss`
- `weather.confirm_rain`
- inventory mutation tools
- AI suggestion acceptance tools
- direct SQL/admin mutation tools
- broad dynamic endpoint-to-tool mapping

## Phase MCP-2 — Read tools

- implement `places.list`
- implement `places.get_overview`
- implement `plants.search`
- implement `beds.list_by_place`
- implement `perennials.list_by_place`
- implement `products.search`
- implement `inventory.summary`
- implement `tasks.upcoming`
- implement `calendar.feed`
- add read tool account-scoping tests

## Phase MCP-3 — Controlled mutation tools

- implement `tasks.confirm`
- implement `tasks.dismiss`
- implement `weather.confirm_rain`
- implement `problems.create` without photo only if explicitly approved
- implement `activities.create` only after backend workflow and tests are stable

## Phase MCP-4 — AI-assisted workflows

- implement product ingestion suggestion tools
- implement bed planning tools
- implement problem summary tools
- implement `ai_suggestions.accept` through backend only

## Phase MCP-5 — Hardening

- audit/observability
- rate limiting
- permission policies
- broader test coverage
- transport/deployment decision
- remote/internal deployment readiness

---

# 19. Backend Integration Pattern

Recommended structure for separate package:

```text
apps/
  mcp-server/
    src/
      server.ts
      context.ts
      api/
        gardening-api-client.ts
      tools/
        health.tools.ts
        docs.tools.ts
        places.tools.ts
        plants.tools.ts
        beds.tools.ts
        inventory.tools.ts
        tasks.tools.ts
        activities.tools.ts
        weather.tools.ts
      schemas/
      errors/
      observability/
      tests/
```

Core context shape:

```ts
interface McpToolContext {
  actor: {
    userId: string;
    accountId: string;
    scopes: string[];
  };
  requestId: string;
  transport: 'stdio' | 'streamable_http';
  apiClient: GardeningApiClient;
  logger: Logger;
}
```

Rules:

- `McpToolContext.accountId` is derived from authentication, never from model arguments.
- Tool handlers call `GardeningApiClient` or service adapter.
- Tool handlers do not import repositories.
- Tool handlers do not open database transactions.
- Tool handlers do not calculate final business side effects.
- Tool handlers map backend envelopes into MCP structured tool results.

---

# 20. Open Decisions

## 20.1 MCP server deployment

Options:

- same process as API
- separate Node process
- separate package/app

Recommendation:
- separate `apps/mcp-server` package/app initially

Status:
- open until implementation task confirms repo structure

## 20.2 Transport

Options:

- stdio for local/dev
- Streamable HTTP for remote/internal
- older HTTP/SSE only for compatibility if required

Recommendation:
- stdio first, Streamable HTTP later

Status:
- open for remote/internal deployment

## 20.3 Authentication

Options:

- local config token
- user session token
- service token plus scoped account context

Recommendation:
- local/dev: user or app-issued MCP token bound to one account
- remote/internal: OAuth/bearer token flow aligned with MCP auth guidance

Status:
- open

## 20.4 Tool approval

Options:

- MCP client approval
- server-side confirmation token
- app UI approval queue

Recommendation:
- server-enforced confirmation metadata initially; app UI approval queue later if app-user agents need remote action approval

Status:
- open

## 20.5 Tool naming convention

Options:

- `places.list`
- `gardening.places.list`
- another namespace

Recommendation:
- use `places.list` style inside the Gardening Helper MCP server; rely on MCP client/server names for disambiguation

Status:
- open but recommended

## 20.6 API-backed vs in-process services

Options:

- API-backed tools only
- in-process service calls
- mixed

Recommendation:
- API-backed first; in-process service calls only if MCP is deliberately embedded in the API process and still service-mediated

Status:
- open for future optimization

## 20.7 Agent audience

Options:

- coding agents only
- app-user agents only
- both

Recommendation:
- support coding/dev agents first with read/dev tools; expand to app-user agents only after approval, auth, audit, and transport decisions are stable

Status:
- open

---

# 21. Final MCP Rule Summary

The Gardening Helper MCP server is acceptable only if:

- it remains an agent interface, not a second backend
- all tools are authenticated and account-scoped
- model-supplied account ids are never authority
- read tools return structured, scoped data
- mutation tools call existing backend workflows
- high-impact actions require explicit approval
- tool outputs summarize side effects clearly
- AI-generated data remains suggestion-only until accepted through backend
- weather remains advisory and user-confirmed
- inventory remains ledger-based
- activity creation remains transactional
- no tool performs direct SQL writes for business mutations
- no tool exposes secrets or provider keys
- tests prove safety boundaries before tools are exposed
