import type { JsonValue } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { AuditLog, AuditLogsRepository } from "./audit.types.js";

const SECRET_FIELD_PATTERNS = [
  "authorization",
  "access_token",
  "refresh_token",
  "token",
  "password",
  "secret",
  "servicerole",
  "service_role",
  "service_role_key",
  "apikey",
  "api_key",
  "p256dh"
] as const;

const EXACT_SECRET_FIELDS = ["auth"] as const;

export type AuditEventInput = {
  actor: AuthenticatedActor;
  entityType: string;
  entityId: UUID;
  action: string;
  beforeJson?: JsonValue | null;
  afterJson?: JsonValue | null;
};

export class AuditService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async logActorEvent(input: AuditEventInput, db?: DbHandle): Promise<AuditLog> {
    if (input.actor.accountId.trim().length === 0 || input.actor.userId.trim().length === 0) {
      throw new AppError("INTERNAL_ERROR", "Audit event requires authenticated actor context");
    }

    return this.auditLogsRepository.log(
      {
        accountId: input.actor.accountId,
        actorType: "user",
        actorId: input.actor.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: normalizeAuditAction(input.action),
        beforeJson: sanitizeAuditJson(input.beforeJson ?? null),
        afterJson: sanitizeAuditJson(input.afterJson ?? null)
      },
      db
    );
  }
}

export function normalizeAuditAction(action: string): string {
  return action.trim().toLowerCase().replaceAll(/[^a-z0-9._-]+/g, "_");
}

export function sanitizeAuditJson(value: JsonValue | null): JsonValue | null {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditJson(item));
  }

  const sanitized: Record<string, JsonValue> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (isSecretField(key)) {
      continue;
    }

    sanitized[key] = sanitizeAuditJson(nestedValue);
  }

  return sanitized;
}

function isSecretField(key: string): boolean {
  const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_");
  const compact = normalized.replaceAll("_", "");

  return (
    EXACT_SECRET_FIELDS.some((field) => normalized === field) ||
    SECRET_FIELD_PATTERNS.some((pattern) => normalized.includes(pattern) || compact.includes(pattern.replaceAll("_", "")))
  );
}
