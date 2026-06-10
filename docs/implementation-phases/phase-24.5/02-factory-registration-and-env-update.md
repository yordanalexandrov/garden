# Implementation Task — Phase 24.5 Step 2: Factory Registration and Env Update

## Role

You are the **Implementation Agent**.

---

# Task

## Goal

Implement:

```text
Register OpenAiAdapter in ai-provider.factory.ts for AI_PROVIDER=openai.
Update env.example with OpenAI-specific comments and supported model examples.
```

## Branch

```text
feature/openai-ai-adapter
```

---

# Scope

Implement only:

- [ ] Inspect `backend/src/integrations/ai/ai-provider.factory.ts` before editing.
- [ ] Add an `openai` branch to `createAiAdapter`: instantiate `OpenAiAdapter` when `config.integrations.aiProvider === 'openai'`.
- [ ] Pass `config.integrations.aiApiKey` and `config.integrations.aiModel` to `OpenAiAdapter` constructor.
- [ ] Keep the existing fallback: if `AI_PROVIDER` is set but not `openai`, still throw `AppError('INTERNAL_ERROR', ...)`.
- [ ] If `AI_PROVIDER` is undefined, still return `TestAiAdapter` (existing behavior for dev/test).
- [ ] Update `docs/env.example` comments under the `# AI` section to document:
  - `AI_PROVIDER=openai` as the supported production value.
  - `AI_MODEL=gpt-4o-mini` as the recommended default.
  - Note that `AI_API_KEY` is backend-only and must never appear in frontend config.

---

# Out of Scope

Do not implement:

- [ ] Changes to `OpenAiAdapter` internals — that is Step 1.
- [ ] Schema/migration changes.
- [ ] Frontend changes.
- [ ] Other AI providers.

---

# Required Documents

Read before coding:

- [ ] `backend/src/integrations/ai/ai-provider.factory.ts`
- [ ] `backend/src/integrations/ai/openai-ai.adapter.ts` (from Step 1)
- [ ] `docs/env.example`

---

# Domain Rules Affected

- [ ] provider adapter boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
AI provider config is backend-only.
Production adapter selection is explicit — no silent fallbacks to TestAiAdapter when a provider is misconfigured.
```

---

# MCP Impact

- [ ] has no MCP impact

---

# Tests Required

No new tests needed in this step — factory behavior is covered by existing integration tests that inject adapters directly.

---

# Acceptance Criteria

- [ ] `createAiAdapter` returns `OpenAiAdapter` when `AI_PROVIDER=openai`.
- [ ] `createAiAdapter` still returns `TestAiAdapter` when `AI_PROVIDER` is undefined.
- [ ] `createAiAdapter` still throws for unknown providers.
- [ ] `env.example` documents `openai` as a valid provider value with model examples.

---

# Commands to Run

```bash
cd backend && npm run typecheck
cd backend && npm run lint
cd backend && npm test
```
