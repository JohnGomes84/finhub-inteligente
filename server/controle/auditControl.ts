import { eq, and, gte, desc } from "drizzle-orm";
import { auditLogs } from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * Audit Control Module - Rastreamento de operações sensíveis
 * Conformidade com LGPD: registro de todas as operações críticas
 */

export async function logAudit(
  userId: number,
  action: string,
  entityType: string,
  entityId?: number | null,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null,
  status: "success" | "failure" = "success",
  ipAddress?: string,
  _userAgent?: string,
  _errorMessage?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId: entityId || undefined,
      oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
      newValues: newValues ? JSON.stringify(newValues) : undefined,
      status,
      ipAddress,
    });
    return true;
  } catch (error) {
    console.error("[AuditControl] Failed to log audit:", error);
    return false;
  }
}

export async function getAuditHistory(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return results.map(log => ({
    ...log,
    oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
    newValues: log.newValues ? JSON.parse(log.newValues) : null,
  }));
}
