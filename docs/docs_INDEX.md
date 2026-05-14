# Gardening Helper — Documentation Index

## Start here

- `gardening-helper-ai-implementation-handoff-readme-v1.md`

This is the master handoff document for AI implementation.

---

# Agent instructions

- `AGENTS.md`
- `CLAUDE.md`
- `CODEX.md`
- `gardening-helper-implementation-agent-instructions.md`
- `gardening-helper-review-agent-instructions.md`

Use:
- implementation instructions for coding/PR agents
- review instructions for PR review agents

---

# Product documents

- `gardening-helper-product-scope.md`
- `gardening_helper_functional_spec_v_1.md`

These define what the product is and what v1 must support.

---

# Technical design

- `gardening-helper-technical-requirements-and-erd.md`
- `gardening-helper-backend-application-design-pack-v1.md`
- `gardening-helper-frontend-technical-spec-v1.md`
- `gardening-helper-canonical-api-contract-v1.md`
- `gardening-helper-domain-rules-and-invariants-v1.md`
- `gardening-helper-testing-and-acceptance-spec-v1.md`
- `gardening-helper-implementation-instructions-for-ai-v1.md`

---

# Production / deployment

- `gardening-helper-production-checklist.md`

---

# SQL migrations

- `001_initial_schema_gardening_helper.sql`
- `002_views_gardening_helper.sql`
- `003_seed_reference_data_gardening_helper.sql`
- `004_guards_and_triggers_gardening_helper.sql`

Use these as the schema baseline.

---

# Workflow templates

- `TASK_TEMPLATE.md`
- `REVIEW_TASK_TEMPLATE.md`
- `.github/pull_request_template.md`

---

# Recommended AI workflow

1. Create a small task using `TASK_TEMPLATE.md`.
2. Give the task to Implementation Agent.
3. Implementation Agent creates branch and PR.
4. Give PR/diff to Review Agent using `REVIEW_TASK_TEMPLATE.md`.
5. Review Agent leaves comments.
6. Implementation Agent fixes comments and replies.
7. Repeat until approved.

---

# Source-of-truth priority

If documents conflict:

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
