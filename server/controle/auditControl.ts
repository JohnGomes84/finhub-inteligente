import { auditLogs } from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * Audit Control Module - Rastreamento de operações financeiras sensíveis
 * Conformidade com LGPD: registro de todas as operações críticas
 * Alta coesão: operações de auditoria
 * Baixo acoplamento: usa getDb() injetado
 */

export interface AuditLogEntry {
  userId: number;
  action: string; // CREATE, UPDATE, DELETE, RECONCILE, etc
  entityType: string; // transaction, document, account, etc
  entityId?: number;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  status?: "success" | "failure";
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registrar operação de auditoria
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
  userAgent?: string,
  errorMessage?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[AuditControl] Database not available");
    return false;
  }

  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId: entityId || undefined,
      oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
      newValues: newValues ? JSON.stringify(newValues) : undefined,
      status,
      errorMessage,
      ipAddress,
      userAgent,
    });

    return true;
  } catch (error) {
    console.error("[AuditControl] Failed to log audit:", error);
    return false;
  }
}

/**
 * Obter histórico de auditoria de um usuário
 */
export async function getAuditHistory(
  userId: number,
  entityType?: string,
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const { eq, and } = await import("drizzle-orm");
    
    let whereConditions: any[] = [eq(auditLogs.userId, userId)];
    if (entityType) {
      whereConditions.push(eq(auditLogs.entityType, entityType));
    }

    const results = await db
      .select()
      .from(auditLogs)
      .where(and(...whereConditions))
      .orderBy(auditLogs.createdAt)
      .limit(limit)
      .offset(offset);

    return results.map((log) => ({
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
    }));
  } catch (error) {
    console.error("[AuditControl] Failed to get audit history:", error);
    return [];
  }
}

/**
 * Obter auditoria de uma entidade específica
 */
export async function getEntityAuditTrail(userId: number, entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const { eq, and } = await import("drizzle-orm");
    
    const results = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.userId, userId),
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId)
        )
      )
      .orderBy(auditLogs.createdAt);

    return results.map((log) => ({
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
    }));
  } catch (error) {
    console.error("[AuditControl] Failed to get entity audit trail:", error);
    return [];
  }
}

/**
 * Verificar atividade suspeita (múltiplas falhas de operação)
 */
export async function checkSuspiciousActivity(userId: number, timeWindowMinutes: number = 15): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const { eq, and, gte } = await import("drizzle-orm");
    
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    const results = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.userId, userId),
          eq(auditLogs.status, "failure"),
          gte(auditLogs.createdAt, timeThreshold)
        )
      );

    return results.length;
  } catch (error) {
    console.error("[AuditControl] Failed to check suspicious activity:", error);
    return 0;
  }
}
