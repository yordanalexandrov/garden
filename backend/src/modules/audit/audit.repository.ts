import type { Selectable } from "kysely";

import type { AuditLogsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { AuditLog, AuditLogsRepository, CreateAuditLogInput } from "./audit.types.js";

const AUDIT_LOG_COLUMNS = [
  "id",
  "account_id",
  "actor_type",
  "actor_id",
  "entity_type",
  "entity_id",
  "action",
  "before_json",
  "after_json",
  "created_at"
] as const;

type SelectedAuditLog = Pick<Selectable<AuditLogsTable>, (typeof AUDIT_LOG_COLUMNS)[number]>;

export class KyselyAuditLogsRepository implements AuditLogsRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async log(input: CreateAuditLogInput, db: DbHandle = this.dbHandle): Promise<AuditLog> {
    const row = await db.db
      .insertInto("audit_logs")
      .values({
        account_id: input.accountId,
        actor_type: input.actorType,
        actor_id: input.actorId ?? null,
        entity_type: input.entityType,
        entity_id: input.entityId,
        action: input.action,
        before_json: input.beforeJson ?? null,
        after_json: input.afterJson ?? null
      })
      .returning(AUDIT_LOG_COLUMNS)
      .executeTakeFirstOrThrow();

    return toAuditLog(row);
  }
}

function toAuditLog(row: SelectedAuditLog): AuditLog {
  return {
    id: row.id,
    accountId: row.account_id,
    actorType: row.actor_type as AuditLog["actorType"],
    actorId: row.actor_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    beforeJson: row.before_json,
    afterJson: row.after_json,
    createdAt: row.created_at
  };
}
