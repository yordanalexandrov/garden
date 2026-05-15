# MCP Tool Definition Template

## Tool name

`<namespace.action>`

## Classification

- [ ] Safe read
- [ ] Low-risk mutation
- [ ] High-impact mutation
- [ ] Forbidden/deferred

## Purpose

Describe what the tool allows an AI agent to do and why it is safe to expose.

## Backend dependency

Service/API called:

```text
<service method or canonical /api/v1 endpoint>
```

The tool must not bypass the documented backend service/API boundary.

## Required permissions

```text
<required auth scope / account context / user permission>
```

The tool must not trust a model-provided `accountId`.

## Input schema

Document the JSON Schema shape.

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {},
  "required": []
}
```

## Output schema

Document the `structuredContent` shape.

```json
{
  "oneOf": [
    {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "ok": { "const": true },
        "tool": { "type": "string" },
        "correlationId": { "type": "string" },
        "data": { "type": "object" },
        "sideEffects": { "type": "array", "items": { "type": "object" } },
        "warnings": { "type": "array", "items": { "type": "object" } }
      },
      "required": ["ok", "tool", "correlationId", "data", "sideEffects", "warnings"]
    },
    {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "ok": { "const": false },
        "tool": { "type": "string" },
        "correlationId": { "type": "string" },
        "error": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "code": { "type": "string" },
            "message": { "type": "string" },
            "details": { "type": "object" },
            "retryable": { "type": "boolean" }
          },
          "required": ["code", "message", "retryable"]
        },
        "sideEffects": { "type": "array", "items": { "type": "object" } },
        "warnings": { "type": "array", "items": { "type": "object" } }
      },
      "required": ["ok", "tool", "correlationId", "error", "sideEffects", "warnings"]
    }
  ]
}
```

Return `sideEffects` and `warnings` as arrays in both success and error results. Use empty arrays when there are no entries.

## Domain rules affected

List the exact Gardening Helper domain invariants touched by this tool.

```text
<domain rules>
```

## Confirmation requirements

State one:

- no confirmation required
- explicit user request required
- high-impact confirmation required
- forbidden/deferred

For high-impact tools, document how confirmation is represented and enforced.

## Audit / observability

Document:

- tool invocation log fields
- backend audit event linkage
- side-effect summary fields
- sensitive fields that must not be logged

## Errors

List expected tool execution error codes.

```text
VALIDATION_ERROR
UNAUTHORIZED
NOT_FOUND
FORBIDDEN
CONFLICT
BUSINESS_RULE_VIOLATION
INVENTORY_SHORTAGE
EXTERNAL_SERVICE_ERROR
INTERNAL_ERROR
```

## Tests required

List required tests before exposing the tool.

- [ ] input schema validation
- [ ] output schema/envelope shape
- [ ] auth/account scoping
- [ ] backend error propagation
- [ ] confirmation behavior if mutation
- [ ] no direct DB/repository bypass
- [ ] audit/observability behavior if mutation
- [ ] domain-specific edge cases
