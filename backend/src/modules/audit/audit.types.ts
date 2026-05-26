import type { Selectable } from "kysely";

import type { AuditLogsTable, JsonValue } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";

export type AuditActorType = "user" | "system";
export type AuditLogRow = Selectable<AuditLogsTable>;

export type AuditLog = {
  id: UUID;
  accountId: UUID;
  actorType: AuditActorType;
  actorId: UUID | null;
  entityType: string;
  entityId: UUID;
  action: string;
  beforeJson: JsonValue | null;
  afterJson: JsonValue | null;
  createdAt: Date;
};

export type CreateAuditLogInput = {
  accountId: UUID;
  actorType: AuditActorType;
  actorId?: UUID | null;
  entityType: string;
  entityId: UUID;
  action: string;
  beforeJson?: JsonValue | null;
  afterJson?: JsonValue | null;
};

export interface AuditLogsRepository {
  log(input: CreateAuditLogInput, db?: DbHandle): Promise<AuditLog>;
}
