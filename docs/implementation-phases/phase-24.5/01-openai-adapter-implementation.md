# Implementation Task — Phase 24.5 Step 1: OpenAI Adapter Implementation

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, and all relevant specs for this task.

---

# Task

## Goal

Implement:

```text
Install the openai npm package and implement OpenAiAdapter behind AiPort with
ingestProduct, suggestBedPlan, and assistProblem using the Chat Completions API
with JSON mode. Normalize OpenAI responses into NormalizedSuggestion[]. Map SDK
errors to AiProviderError.
```

## Branch

Use branch:

```text
feature/openai-ai-adapter
```

---

# Scope

Implement only:

- [ ] Run `npm install openai` inside `backend/`.
- [ ] Inspect existing `ai.port.ts`, `ai.types.ts`, and `test-ai.adapter.ts` before writing any code.
- [ ] Create `backend/src/integrations/ai/openai-ai.adapter.ts` implementing `AiPort`.
- [ ] `ingestProduct(input)`:
  - System prompt instructs model to extract product metadata from a product name or label text.
  - Return a JSON object with `product` and optionally `product_rule` fields.
  - Normalize into `NormalizedSuggestion[]` of types `product` and `product_rule`.
  - Include a `warnings` string array when the model signals uncertainty.
- [ ] `suggestBedPlan(input)`:
  - System prompt instructs model to suggest plant spacing, coexistence notes, and rough quantity guidance for the given candidate plants.
  - Return a JSON object with `spacingSuggestions`, `coexistenceNotes`, `warnings`, `roughQuantityGuidance`.
  - Normalize into a single `NormalizedSuggestion` of type `bed_plan`.
- [ ] `assistProblem(input)`:
  - System prompt instructs model to describe possible categories, ask follow-up questions, and summarize the problem without diagnosing as fact.
  - Return a JSON object with `summary`, `possibleCategories`, `followUpQuestions`.
  - Normalize into a single `NormalizedSuggestion` of type `problem_summary`.
- [ ] Use `response_format: { type: 'json_object' }` on all Chat Completions calls.
- [ ] Use model from config (`AI_MODEL`) with a safe fallback (`gpt-4o-mini`).
- [ ] Catch OpenAI SDK errors (`APIError`, `APIConnectionError`, `RateLimitError`, `AuthenticationError`) and rethrow as `AiProviderError` with a generic message that does not include the API key or raw SDK error internals.
- [ ] Do not log `AI_API_KEY` anywhere in the adapter.
- [ ] Add focused unit tests in `backend/test/ai/openai-adapter.test.ts` using `vi.mock('openai')` or equivalent vitest mocking.

Expected paths:

```text
backend/src/integrations/ai/openai-ai.adapter.ts
backend/test/ai/openai-adapter.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Factory registration — that is Step 2.
- [ ] Accept/reject workflow changes.
- [ ] Schema/migration changes.
- [ ] Frontend changes.
- [ ] Streaming.
- [ ] Embeddings or fine-tuning.

---

# Required Documents

Read before coding:

- [ ] `backend/src/integrations/ai/ai.port.ts`
- [ ] `backend/src/integrations/ai/ai.types.ts`
- [ ] `backend/src/integrations/ai/test-ai.adapter.ts`
- [ ] `backend/src/integrations/ai/ai-provider.factory.ts`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI and provider invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` EXTERNAL_SERVICE_ERROR section

---

# Domain Rules Affected

This task touches:

- [ ] AI suggestions
- [ ] provider adapter boundary

Important rules to preserve:

```text
External integrations go through ports/adapters.
AI adapters return suggestions only — must not write business records.
AI provider config is backend-only.
Provider failures map to canonical EXTERNAL_SERVICE_ERROR without leaking secrets.
Tests use mocked adapters and do not require real AI provider network access.
AI problem assist must not present output as diagnosis-as-fact.
```

---

# MCP Impact

This task:

- [ ] has no MCP impact

---

# Required Implementation Details

Implement:

- [ ] provider adapter through port
- [ ] provider result normalization
- [ ] provider error mapping
- [ ] unit tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no direct OpenAI SDK usage inside domain services except through `AiPort`
- [ ] backend-only AI provider configuration
- [ ] provider failures do not leak `AI_API_KEY` or raw SDK internals

---

# API Contract

Endpoints involved:

```text
None directly in this step.
```

---

# Tests Required

Add or update tests for:

- [ ] provider adapter boundary
- [ ] happy path for each method
- [ ] provider error mapping

Specific test cases:

1. `ingestProduct` with a product name returns `product` and `product_rule` suggestions.
2. `suggestBedPlan` with candidate plants returns a `bed_plan` suggestion.
3. `assistProblem` with problem text returns a `problem_summary` suggestion.
4. OpenAI `APIError` is mapped to `AiProviderError` without leaking the API key.
5. OpenAI `RateLimitError` is mapped to `AiProviderError`.

---

# Acceptance Criteria

The task is complete when:

- [ ] `OpenAiAdapter` implements all three `AiPort` methods.
- [ ] JSON mode is used on all Chat Completions calls.
- [ ] Responses are normalized into `NormalizedSuggestion[]`.
- [ ] SDK errors are mapped to `AiProviderError` with safe messages.
- [ ] Unit tests pass without real network access.
- [ ] No factory registration or env changes are included in this step.

---

# Commands to Run

```bash
cd backend && npm run typecheck
cd backend && npm run lint
cd backend && npm test
```
