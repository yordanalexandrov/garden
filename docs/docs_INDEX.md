# Gardening Helper — Documentation Index

## Start here

- `gardening-helper-ai-implementation-handoff-readme-v1.md`
- `gardening-helper-implementation-status-handoff.md`

The master handoff document defines the AI implementation process. The status handoff tracks current phase/step progress and must be updated whenever implementation progress changes.

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

# MCP / Agent Tooling

- `gardening-helper-mcp-server-design-v1.md`
- `MCP_TOOL_TEMPLATE.md`

The MCP server is a future agent interface to existing Gardening Helper backend capabilities. MCP tools do not replace the required task documents, source-of-truth priority, domain invariants, review process, or test requirements.

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

When MCP tools become available, agents may use them only as documented in `gardening-helper-mcp-server-design-v1.md`. MCP tool output is helper context, not source of truth when it conflicts with the domain rules, canonical API contract, task documents, or changed code under review.

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
