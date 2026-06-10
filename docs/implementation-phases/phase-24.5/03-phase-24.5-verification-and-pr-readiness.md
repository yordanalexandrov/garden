# Implementation Task — Phase 24.5 Step 3: Verification and PR Readiness

## Role

You are the **Implementation Agent**.

---

# Task

## Goal

Implement:

```text
Run all backend checks, confirm Phase 24.5 is complete, update the implementation
status handoff, and prepare a PR.
```

## Branch

```text
feature/openai-ai-adapter
```

---

# Scope

- [ ] Run `cd backend && npm run typecheck` — must pass with no errors.
- [ ] Run `cd backend && npm run lint` — must pass.
- [ ] Run `cd backend && npm test` — all tests must pass including new OpenAI adapter unit tests.
- [ ] Confirm `OpenAiAdapter` implements all three `AiPort` methods with correct return types.
- [ ] Confirm factory correctly selects `OpenAiAdapter` for `AI_PROVIDER=openai`.
- [ ] Confirm `AI_API_KEY` is not logged or exposed in error messages.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md`:
  - Set last implemented phase to Phase 24.5.
  - Set last implemented step to Phase 24.5 Step 3.
  - Record what was implemented.
  - Update next recommended phase.

---

# Acceptance Criteria

- [ ] All backend checks pass.
- [ ] Status handoff updated.
- [ ] PR description includes: summary, scope, domain rules, security notes, test results.

---

# Commands to Run

```bash
cd backend && npm run typecheck
cd backend && npm run lint
cd backend && npm test
```

# PR Requirements

PR description must include:

- Summary: OpenAI production adapter behind AiPort
- Scope: `openai-ai.adapter.ts`, factory update, env.example update, unit tests
- Domain rules: provider adapter boundary, backend-only config, no secret leakage
- Security notes: `AI_API_KEY` never logged; errors mapped to generic `AiProviderError`
- Tests run: unit tests with mocked OpenAI SDK
- Integration status: requires `AI_PROVIDER=openai`, `AI_API_KEY`, `AI_MODEL` env vars on the server
