import { eq, and } from "drizzle-orm";
import { users, userConsent } from "../../drizzle/schema";
import { getDb } from "../db";
import { logAudit } from "./auditControl";

/**
 * User Control Module - Gerenciamento de usuários com RBAC
 * Alta coesão: operações de usuário
 * Baixo acoplamento: usa getDb() injetado
 */

export type UserRole = "user" | "admin";

export interface UserWithConsent {
  user: typeof users.$inferSelect;
  consent: typeof userConsent.$inferSelect | null;
}

/**
 * Obter usuário por ID com consentimento LGPD
 */
export async function getUserWithConsent(userId: number): Promise<UserWithConsent | null> {
  const db = await getDb();
  if (!db) return null;

  const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRecord.length) return null;

  const consentRecord = await db
    .select()
    .from(userConsent)
    .where(eq(userConsent.userId, userId))
    .limit(1);

  return {
    user: userRecord[0],
    consent: consentRecord.length > 0 ? consentRecord[0] : null,
  };
}

/**
 * Verificar se usuário é admin
 */
export async function isUserAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return userRecord.length > 0 && userRecord[0].role === "admin";
}

/**
 * Promover usuário para admin (apenas admin pode fazer)
 */
export async function promoteUserToAdmin(
  userId: number,
  targetUserId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verificar se quem está fazendo é admin
  const isAdmin = await isUserAdmin(userId);
  if (!isAdmin) {
    await logAudit(userId, "UPDATE", "users", targetUserId, null, null, "failure", ipAddress, userAgent, "Unauthorized: user is not admin");
    return false;
  }

  try {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, targetUserId));

    await logAudit(
      userId,
      "UPDATE",
      "users",
      targetUserId,
      { role: "user" },
      { role: "admin" },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[UserControl] Error promoting user:", error);
    await logAudit(
      userId,
      "UPDATE",
      "users",
      targetUserId,
      null,
      null,
      "failure",
      ipAddress,
      userAgent,
      error instanceof Error ? error.message : "Unknown error"
    );
    return false;
  }
}

/**
 * Aceitar política de privacidade e consentimento de dados (LGPD)
 */
export async function acceptUserConsent(
  userId: number,
  privacyPolicyAccepted: boolean,
  dataProcessingAccepted: boolean
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const existing = await db
      .select()
      .from(userConsent)
      .where(eq(userConsent.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userConsent)
        .set({
          privacyPolicyAccepted,
          dataProcessingAccepted,
          acceptedAt: new Date(),
        })
        .where(eq(userConsent.userId, userId));
    } else {
      await db.insert(userConsent).values({
        userId,
        privacyPolicyAccepted,
        dataProcessingAccepted,
        acceptedAt: new Date(),
      });
    }

    return true;
  } catch (error) {
    console.error("[UserControl] Error accepting consent:", error);
    return false;
  }
}

/**
 * Obter consentimento do usuário
 */
export async function getUserConsent(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userConsent)
    .where(eq(userConsent.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Verificar se usuário aceitou consentimento LGPD
 */
export async function hasUserAcceptedConsent(userId: number): Promise<boolean> {
  const consent = await getUserConsent(userId);
  return consent ? consent.privacyPolicyAccepted && consent.dataProcessingAccepted : false;
}
