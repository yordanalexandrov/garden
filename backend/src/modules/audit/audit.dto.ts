import type { AuditLog } from "./audit.types.js";

export type AuditLogReferenceDto = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export function toAuditLogReferenceDto(auditLog: AuditLog): AuditLogReferenceDto {
  return {
    id: auditLog.id,
    action: auditLog.action,
    entityType: auditLog.entityType,
    entityId: auditLog.entityId,
    createdAt: auditLog.createdAt.toISOString()
  };
}
