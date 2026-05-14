# Review Task Template — Gardening Helper

## Role

You are the **Review Agent**.

Use:
- `AGENTS.md`
- `gardening-helper-review-agent-instructions.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`

---

# PR / Diff to review

Review:

```text
<PR link, branch name, or diff source>
```

---

# Claimed implementation scope

The Implementation Agent claims this PR implements:

- [ ] <item 1>
- [ ] <item 2>
- [ ] <item 3>

---

# Review focus

Focus especially on:

- [ ] domain correctness
- [ ] account scoping
- [ ] transaction safety
- [ ] API contract
- [ ] database integrity
- [ ] frontend/backend responsibility boundaries
- [ ] tests
- [ ] maintainability

Task-specific focus:

```text
<special focus areas>
```

---

# Required documents

Read before reviewing:

- [ ] `AGENTS.md`
- [ ] `gardening-helper-review-agent-instructions.md`
- [ ] `gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `gardening-helper-canonical-api-contract-v1.md`
- [ ] `gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `<task-specific-doc-or-file>`
- [ ] `<changed files / diff>`

---

# Severity labels

Use exactly these labels in review comments:

- `[BLOCKING]`
- `[SHOULD FIX]`
- `[NIT]`
- `[QUESTION]`

Use `[BLOCKING]` for:
- domain invariant violation
- API contract mismatch
- missing transaction around critical writes
- cross-account data risk
- inventory mutation without movement
- planned task created without confirmation
- AI data saved without acceptance
- weather auto-failing treatment
- missing critical tests

---

# Checklist

## Architecture

- [ ] controllers are thin
- [ ] services own workflows
- [ ] repositories only access DB
- [ ] integrations use ports/adapters
- [ ] frontend does not contain backend business logic
- [ ] frontend uses Supabase Auth only for login/session handling
- [ ] frontend does not access application tables directly
- [ ] Supabase service role key is backend-only
- [ ] problem photo access uses signed URLs or protected backend endpoints
- [ ] no hidden DB business side-effect triggers

## API

- [ ] endpoint paths match contract
- [ ] request shapes match contract
- [ ] response envelope is correct
- [ ] error envelope is correct
- [ ] enum values match contract
- [ ] pagination shape is correct where relevant

## Domain

- [ ] account scoping enforced
- [ ] target resolution correct
- [ ] inventory ledger preserved
- [ ] stock does not change without movement
- [ ] task status rules preserved
- [ ] AI boundary preserved
- [ ] weather boundary preserved
- [ ] problem photo rules preserved

## Tests

- [ ] tests added/updated
- [ ] happy path covered
- [ ] failure path covered
- [ ] account scoping covered
- [ ] transaction rollback covered where relevant
- [ ] frontend behavior tested where relevant

---

# Expected review output

Leave inline comments where possible.

End with:

```md
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

Use **Changes requested** if any `[BLOCKING]` issue exists.

---

# Notes for Review Agent

Be strict but actionable.

Do not request changes that contradict the source-of-truth documents.

Do not focus on formatting while missing domain-breaking bugs.

If unsure, ask with `[QUESTION]`.
