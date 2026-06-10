# Phase 24.5 — OpenAI Production AI Provider Adapter

## 1. Purpose

This phase implements a concrete production AI provider adapter using the OpenAI API behind the existing `AiPort` contract. The factory registered a `TestAiAdapter` for dev/test and explicitly failed closed for any unrecognized `AI_PROVIDER` value. Phase 24.5 adds `openai` as the first real production provider.

## 2. Position in the sequence

Phase 23 must be complete (AiPort, TestAiAdapter, factory boundary, session/suggestion persistence, accept/reject workflows). Phase 24 must be complete (frontend AI pages). This phase requires no schema changes and no frontend changes. It is a pure backend integration layer addition.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` — AI assistive-only behavior, no diagnosis as fact, provider failure mapping.
- `docs/gardening-helper-canonical-api-contract-v1.md` — `EXTERNAL_SERVICE_ERROR` mapping.
- `docs/gardening-helper-backend-application-design-pack-v1.md` — `AiPort` contract and adapter boundary.
- `docs/env.example` — `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`.
- `backend/src/integrations/ai/ai.port.ts` — interface to implement.
- `backend/src/integrations/ai/ai.types.ts` — normalized suggestion types.
- `backend/src/integrations/ai/ai-provider.factory.ts` — factory to update.

## 4. Scope

### Integration scope

- Install `openai` npm package in the backend.
- Implement `OpenAiAdapter` class behind `AiPort`:
  - `ingestProduct` — returns `product` and `product_rule` normalized suggestions.
  - `suggestBedPlan` — returns `bed_plan` normalized suggestion.
  - `assistProblem` — returns `problem_summary` normalized suggestion.
- Use OpenAI Chat Completions API with `response_format: { type: 'json_object' }` for structured JSON responses.
- Normalize OpenAI response JSON into `NormalizedSuggestion[]`.
- Map OpenAI SDK errors (timeouts, auth failures, rate limits) to `AiProviderError`.
- Never log or expose `AI_API_KEY` in errors or adapter output.
- Register `openai` provider in `ai-provider.factory.ts`.
- Document `AI_PROVIDER=openai` and supported models in `env.example` comments.

### Testing scope

- Unit tests for `OpenAiAdapter` using mocked `openai` SDK responses.
- Test happy path for all three methods.
- Test OpenAI API error mapping to `AiProviderError`.

## 5. Out of scope

- Frontend changes.
- Schema/migration changes.
- Accept/reject workflow changes.
- Other AI providers (Anthropic, etc.).
- Streaming responses.
- Fine-tuning or embeddings.

## 6. Steps

| Step | File | Summary |
|------|------|---------|
| 1 | `01-openai-adapter-implementation.md` | Install openai, implement OpenAiAdapter, prompts, normalization, error mapping |
| 2 | `02-factory-registration-and-env-update.md` | Register openai in factory, update env.example comments |
| 3 | `03-phase-24.5-verification-and-pr-readiness.md` | Typecheck, lint, tests, status handoff update, PR |

## 7. Security constraints

- `AI_API_KEY` must never appear in logs, error messages, or response bodies.
- Provider config is backend-only — not in frontend safe config.
- OpenAI SDK must only be called from inside `OpenAiAdapter` — not from services, repositories, or routes.
