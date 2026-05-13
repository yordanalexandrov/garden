# Implementation Task Template — Gardening Helper

## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `gardening-helper-implementation-agent-instructions.md`
- `gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

---

# Task

## Goal

Implement:

```text
<short description of feature/work>
```

## Branch

Use branch:

```text
feature/<task-name>
```

---

# Scope

Implement only:

- [ ] <item 1>
- [ ] <item 2>
- [ ] <item 3>

---

# Out of scope

Do not implement:

- [ ] <item 1>
- [ ] <item 2>
- [ ] <item 3>

---

# Required documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `gardening-helper-implementation-agent-instructions.md`
- [ ] `gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `gardening-helper-canonical-api-contract-v1.md`
- [ ] `gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `<task-specific-doc-or-file>`
- [ ] `<existing-code-files-to-inspect>`

---

# Domain rules affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] weather/rain confirmation
- [ ] frontend forms
- [ ] API contract
- [ ] database/migrations

Important rules to preserve:

```text
<list exact rules relevant to this task>
```

---

# Required implementation details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend service method
- [ ] repository methods
- [ ] transaction handling
- [ ] frontend API service
- [ ] frontend page/component
- [ ] frontend form validation
- [ ] tests
- [ ] docs/update notes

Remove unchecked items that are not relevant.

---

# API contract

Endpoints involved:

```text
<GET/POST/PATCH endpoint list>
```

Request/response must follow:

- `gardening-helper-canonical-api-contract-v1.md`

---

# Tests required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] frontend form behavior
- [ ] edge cases

Specific test cases:

1. `<test case>`
2. `<test case>`
3. `<test case>`

---

# Acceptance criteria

The task is complete when:

- [ ] feature works according to spec
- [ ] API contract is respected
- [ ] domain rules are preserved
- [ ] tests are added/updated
- [ ] relevant checks pass
- [ ] no unrelated changes are included
- [ ] PR description is complete

---

# Commands to run

Run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

If any command does not exist or fails due to pre-existing setup, report it clearly.

---

# PR requirements

PR description must include:

- Summary
- Scope
- Domain rules affected
- API changes
- Database changes
- Tests run
- Mocked/deferred integrations
- Review focus

---

# Notes for Implementation Agent

Do not redesign the product.

Do not skip critical tests.

Do not claim tests passed unless they were actually run.

If unsure, stop and explain the ambiguity before making a major assumption.
