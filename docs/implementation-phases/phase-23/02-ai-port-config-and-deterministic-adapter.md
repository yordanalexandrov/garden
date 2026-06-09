# Implementation Task - Phase 23 Step 2: AI Port, Config, and Deterministic Adapter

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task.

---

# Task

## Goal

Implement:

```text
Create the AiPort contract, backend-only provider configuration, deterministic test/dev AI adapter, and provider registry boundary needed by Phase 23.
```

## Branch

Use branch:

```text
feature/backend-ai-suggestions
```

---

# Scope

Implement only:

- [ ] Inspect existing backend config, integration port, provider registry, deterministic adapter, logger, error, and test patterns.
- [ ] Define `AiPort` methods needed by Phase 23:
  - [ ] `ingestProduct`
  - [ ] `suggestBedPlan`
  - [ ] `assistProblem`
- [ ] Define typed port inputs/results for provider prompts, normalized suggestions, warnings, uncertainty/confidence metadata if represented locally, and provider failure metadata.
- [ ] Add backend-only config for `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL` using existing config conventions.
- [ ] Ensure AI provider secrets never appear in frontend code, public config, logs, build output, or client-visible errors.
- [ ] Implement deterministic test/dev adapter behind `AiPort` that returns stable product, product rule, bed plan, and problem-assist suggestions without network access.
- [ ] Ensure the deterministic adapter can simulate provider failures for tests.
- [ ] Add a production provider registry/factory boundary. If no concrete provider is explicitly selected, document production adapter status honestly and fail closed with canonical provider configuration errors.
- [ ] Normalize provider output into backend suggestion payloads before it reaches AI services.
- [ ] Map provider timeouts/errors to internal errors that routes expose as canonical `EXTERNAL_SERVICE_ERROR`.
- [ ] Add focused unit tests for config parsing, adapter results, failure simulation, normalization, and secret-safe errors/logging where local patterns support it.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/integrations/ai/ai.port.ts
backend/src/integrations/ai/ai.types.ts
backend/src/integrations/ai/test-ai.adapter.ts
backend/src/integrations/ai/ai-provider.factory.ts
backend/src/config/
backend/test/ai/
```

---

# Out of Scope

Do not implement:

- [ ] AI session/suggestion database persistence; that belongs to Step 3.
- [ ] AI route service workflows; that belongs to Step 4.
- [ ] Accept/reject business workflows; that belongs to Step 5.
- [ ] Direct product, product rule, problem, bed, task, inventory, or planting writes from an AI adapter.
- [ ] Frontend AI provider calls or UI.
- [ ] Push notifications.
- [ ] MCP tools.
- [ ] Real network-dependent AI tests.
- [ ] Provider-specific production adapter unless explicitly assigned/configured.
- [ ] Schema changes or migrations.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI and provider invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 22 and provider error codes
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI provider/acceptance sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` `AiPort` sections
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] Existing backend config, provider adapter, logger, error, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] AI suggestions
- [ ] provider adapter boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
External integrations go through ports/adapters.
AI is assistive only.
AI adapters return suggestions only and must not write business records.
AI provider config is backend-only.
Provider failures map to canonical EXTERNAL_SERVICE_ERROR without leaking secrets.
Tests use deterministic adapters and do not require real AI provider network access.
```

---

# MCP Impact

This task:

- [ ] has no MCP impact

MCP tools affected:

```text
None.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] provider adapter through port
- [ ] backend config validation
- [ ] deterministic test/dev adapter
- [ ] provider result normalization
- [ ] provider error mapping
- [ ] tests
- [ ] docs/update notes only if AI provider configuration or production adapter status changes

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct provider calls inside domain services except through `AiPort`
- [ ] backend-only AI provider configuration
- [ ] provider failures do not leak secrets or raw credentials

---

# API Contract

Endpoints involved:

```text
None directly in this step.
```

This step prepares the provider boundary used later by:

```text
POST /api/v1/ai/product-ingestion
POST /api/v1/ai/bed-planning
POST /api/v1/ai/problem-assist
```

Provider failures must be mappable to canonical `EXTERNAL_SERVICE_ERROR`.

---

# Tests Required

Add or update tests for:

- [ ] provider adapter boundary
- [ ] validation errors
- [ ] edge cases

Specific test cases:

1. AI config accepts deterministic/test provider settings without `AI_API_KEY`.
2. Production provider config requires credentials only when a real provider is selected.
3. Deterministic adapter returns stable product and product-rule suggestions.
4. Deterministic adapter returns stable bed-plan suggestions.
5. Deterministic adapter returns stable problem-assist suggestions without diagnosis-as-fact fields.
6. Deterministic adapter can simulate provider failure.
7. Provider errors map to an internal error that the route layer can expose as `EXTERNAL_SERVICE_ERROR`.
8. Static or unit guard confirms provider calls are confined to the AI adapter layer.

---

# Acceptance Criteria

The task is complete when:

- [ ] `AiPort` and typed AI inputs/results exist.
- [ ] A deterministic test/dev adapter exists and needs no provider credentials or network access.
- [ ] Provider registry/config exists and is backend-only.
- [ ] Production adapter status is explicitly documented if no concrete provider is implemented.
- [ ] Provider output is normalized before services persist suggestions.
- [ ] No route workflow, persistence, acceptance, frontend, push, MCP, or schema scope is included.

---

# Commands to Run

Run relevant backend commands:

```bash
npm run typecheck
npm run lint
npm test
```

If any command does not exist or fails due to pre-existing setup, report it clearly.
