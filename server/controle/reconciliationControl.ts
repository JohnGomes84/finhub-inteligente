import { eq, and } from "drizzle-orm";
import { reconciliationMatches, transactions } from "../../drizzle/schema";
import { getDb } from "../db";
import { logAudit } from "./auditControl";
import { Decimal } from "decimal.js";

/**
 * Reconciliation Control Module - Conciliação automática de transações
 * Cruza extratos bancários com notas fiscais e recibos
 */

export type MatchStatus = "matched" | "disputed" | "unmatched";
export type MatchType = "auto" | "manual" | "suggested";

/**
 * Encontrar transações para conciliação
 */
export async function findMatchingTransactions(
  userId: number,
  amount: string | number,
  description: string,
  tolerance: number = 0.01 // 1% de tolerância
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const amountDecimal = new Decimal(amount);
    const lowerBound = amountDecimal.times(new Decimal(1 - tolerance));
    const upperBound = amountDecimal.times(new Decimal(1 + tolerance));

    const results = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.status, "pending"),
          eq(transactions.reconciliationStatus, "unreconciled")
        )
      );

    // Filtrar por valor dentro da tolerância
    const matches = results.filter((tx) => {
      const txAmount = new Decimal(tx.amount || 0);
      return txAmount.greaterThanOrEqualTo(lowerBound) && txAmount.lessThanOrEqualTo(upperBound);
    });

    return matches;
  } catch (error) {
    console.error("[ReconciliationControl] Error finding matching transactions:", error);
    return [];
  }
}

/**
 * Criar correspondência de conciliação
 */
export async function createReconciliationMatch(
  userId: number,
  transactionId: number,
  bankStatementId: number,
  confidence: number,
  notes?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(reconciliationMatches).values({
      userId,
      transactionId,
      bankStatementId,
      confidence,
      notes,
      matchType: confidence >= 95 ? "auto" : "suggested",
      status: confidence >= 95 ? "matched" : "unmatched",
    });

    const matchId = result[0]?.insertId;
    if (matchId) {
      // Atualizar status da transação
      await db
        .update(transactions)
        .set({
          reconciliationStatus: confidence >= 95 ? "reconciled" : "unreconciled",
        })
        .where(eq(transactions.id, transactionId));

      await logAudit(
        userId,
        "RECONCILE",
        "reconciliation_matches",
        matchId as number,
        null,
        { transactionId, bankStatementId, confidence },
        "success",
        ipAddress,
        userAgent
      );
    }

    return matchId;
  } catch (error) {
    console.error("[ReconciliationControl] Error creating reconciliation match:", error);
    await logAudit(
      userId,
      "RECONCILE",
      "reconciliation_matches",
      undefined,
      null,
      null,
      "failure",
      ipAddress,
      userAgent,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

/**
 * Obter correspondências de conciliação do usuário
 */
export async function getUserReconciliationMatches(
  userId: number,
  status?: MatchStatus,
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions: any[] = [eq(reconciliationMatches.userId, userId)];

    if (status) {
      conditions.push(eq(reconciliationMatches.status, status));
    }

    const results = await db
      .select()
      .from(reconciliationMatches)
      .where(and(...conditions))
      .orderBy(reconciliationMatches.createdAt)
      .limit(limit)
      .offset(offset);

    return results;
  } catch (error) {
    console.error("[ReconciliationControl] Error getting reconciliation matches:", error);
    return [];
  }
}

/**
 * Aprovar correspondência de conciliação
 */
export async function approveReconciliationMatch(
  userId: number,
  matchId: number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const match = await db
      .select()
      .from(reconciliationMatches)
      .where(and(eq(reconciliationMatches.userId, userId), eq(reconciliationMatches.id, matchId)))
      .limit(1);

    if (match.length === 0) return false;

    const reconciliationMatch = match[0];

    await db
      .update(reconciliationMatches)
      .set({ status: "matched", matchType: "manual" })
      .where(eq(reconciliationMatches.id, matchId));

    // Atualizar transação
    await db
      .update(transactions)
      .set({ reconciliationStatus: "reconciled" })
      .where(eq(transactions.id, reconciliationMatch.transactionId));

    await logAudit(
      userId,
      "APPROVE",
      "reconciliation_matches",
      matchId,
      { status: reconciliationMatch.status },
      { status: "matched" },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[ReconciliationControl] Error approving reconciliation match:", error);
    await logAudit(
      userId,
      "APPROVE",
      "reconciliation_matches",
      matchId,
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
 * Rejeitar correspondência de conciliação
 */
export async function rejectReconciliationMatch(
  userId: number,
  matchId: number,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const match = await db
      .select()
      .from(reconciliationMatches)
      .where(and(eq(reconciliationMatches.userId, userId), eq(reconciliationMatches.id, matchId)))
      .limit(1);

    if (match.length === 0) return false;

    await db
      .update(reconciliationMatches)
      .set({
        status: "disputed",
        notes: reason,
      })
      .where(eq(reconciliationMatches.id, matchId));

    await logAudit(
      userId,
      "REJECT",
      "reconciliation_matches",
      matchId,
      { status: match[0].status },
      { status: "disputed", reason },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[ReconciliationControl] Error rejecting reconciliation match:", error);
    await logAudit(
      userId,
      "REJECT",
      "reconciliation_matches",
      matchId,
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
 * Obter resumo de conciliação
 */
export async function getReconciliationSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const allMatches = await db
      .select()
      .from(reconciliationMatches)
      .where(eq(reconciliationMatches.userId, userId));

    const unmatchedCount = allMatches.filter((m) => m.status === "unmatched").length;
    const matchedCount = allMatches.filter((m) => m.status === "matched").length;
    const disputedCount = allMatches.filter((m) => m.status === "disputed").length;

    return {
      totalMatches: allMatches.length,
      unmatchedCount,
      matchedCount,
      disputedCount,
      reconciliationRate: allMatches.length > 0 ? (matchedCount / allMatches.length) * 100 : 0,
    };
  } catch (error) {
    console.error("[ReconciliationControl] Error getting reconciliation summary:", error);
    return null;
  }
}

/**
 * Calcular score de correspondência entre transação e extrato
 */
export function calculateMatchScore(
  transactionAmount: string | number,
  statementAmount: string | number,
  transactionDate: Date,
  statementDate: Date,
  descriptionSimilarity: number = 0.8
): number {
  const txAmount = new Decimal(transactionAmount);
  const stmtAmount = new Decimal(statementAmount);

  // Score de valor (máximo 50 pontos)
  const amountDiff = txAmount.minus(stmtAmount).abs();
  const amountScore = Math.max(0, 50 - amountDiff.toNumber() * 100);

  // Score de data (máximo 30 pontos)
  const daysDiff = Math.abs(
    (transactionDate.getTime() - statementDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dateScore = Math.max(0, 30 - daysDiff * 5);

  // Score de descrição (máximo 20 pontos)
  const descriptionScore = descriptionSimilarity * 20;

  return Math.min(100, amountScore + dateScore + descriptionScore);
}
