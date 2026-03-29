import { eq, and, gte, lte } from "drizzle-orm";
import { transactions, bankAccounts } from "../../drizzle/schema";
import { getDb } from "../db";
import { logAudit } from "./auditControl";
import { updateAccountBalance } from "./bankAccountControl";
import { Decimal } from "decimal.js";

/**
 * Transaction Control Module - Gerenciamento de lançamentos financeiros
 * Alta coesão: operações de transações
 * Baixo acoplamento: usa getDb() injetado
 */

export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "paid" | "overdue" | "cancelled";
export type ReconciliationStatus = "unreconciled" | "reconciled" | "disputed";

/**
 * Criar novo lançamento (pagamento ou recebimento)
 */
export async function createTransaction(
  userId: number,
  type: TransactionType,
  description: string,
  amount: string | number,
  transactionDate: Date,
  categoryId?: number,
  bankAccountId?: number,
  dueDate?: Date,
  reference?: string,
  notes?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const amountStr = new Decimal(amount).toString();
    const status: TransactionStatus = dueDate && dueDate < new Date() ? "overdue" : "pending";

    const result = await db.insert(transactions).values({
      userId,
      type,
      description,
      amount: amountStr,
      transactionDate,
      categoryId,
      bankAccountId,
      dueDate,
      reference,
      notes,
      status,
      reconciliationStatus: "unreconciled",
    });

    const transactionId = result[0]?.insertId;
    if (transactionId) {
      await logAudit(
        userId,
        "CREATE",
        "transactions",
        transactionId as number,
        null,
        { type, description, amount: amountStr, transactionDate, status },
        "success",
        ipAddress,
        userAgent
      );
    }

    return transactionId;
  } catch (error) {
    console.error("[TransactionControl] Error creating transaction:", error);
    await logAudit(
      userId,
      "CREATE",
      "transactions",
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
 * Obter transações do usuário com filtros
 */
export async function getUserTransactions(
  userId: number,
  filters?: {
    type?: TransactionType;
    status?: TransactionStatus;
    categoryId?: number;
    bankAccountId?: number;
    startDate?: Date;
    endDate?: Date;
    reconciliationStatus?: ReconciliationStatus;
  },
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions: any[] = [eq(transactions.userId, userId)];

    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(transactions.status, filters.status));
    }
    if (filters?.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }
    if (filters?.bankAccountId) {
      conditions.push(eq(transactions.bankAccountId, filters.bankAccountId));
    }
    if (filters?.reconciliationStatus) {
      conditions.push(eq(transactions.reconciliationStatus, filters.reconciliationStatus));
    }
    if (filters?.startDate) {
      conditions.push(gte(transactions.transactionDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(transactions.transactionDate, filters.endDate));
    }

    const results = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(transactions.transactionDate)
      .limit(limit)
      .offset(offset);

    return results;
  } catch (error) {
    console.error("[TransactionControl] Error getting transactions:", error);
    return [];
  }
}

/**
 * Obter transação por ID
 */
export async function getTransactionById(userId: number, transactionId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.id, transactionId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[TransactionControl] Error getting transaction:", error);
    return null;
  }
}

/**
 * Atualizar transação
 */
export async function updateTransaction(
  userId: number,
  transactionId: number,
  updates: {
    description?: string;
    amount?: string | number;
    transactionDate?: Date;
    dueDate?: Date;
    paymentDate?: Date;
    status?: TransactionStatus;
    categoryId?: number;
    reference?: string;
    notes?: string;
  },
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const oldTransaction = await getTransactionById(userId, transactionId);
    if (!oldTransaction) return false;

    const updateData: any = { ...updates };
    if (updates.amount) {
      updateData.amount = new Decimal(updates.amount).toString();
    }

    await db
      .update(transactions)
      .set(updateData)
      .where(and(eq(transactions.userId, userId), eq(transactions.id, transactionId)));

    await logAudit(
      userId,
      "UPDATE",
      "transactions",
      transactionId,
      {
        description: oldTransaction.description,
        amount: oldTransaction.amount,
        status: oldTransaction.status,
      },
      updateData,
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[TransactionControl] Error updating transaction:", error);
    await logAudit(
      userId,
      "UPDATE",
      "transactions",
      transactionId,
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
 * Marcar transação como paga
 */
export async function markTransactionAsPaid(
  userId: number,
  transactionId: number,
  paymentDate: Date = new Date(),
  ipAddress?: string,
  userAgent?: string
) {
  return updateTransaction(
    userId,
    transactionId,
    {
      status: "paid",
      paymentDate,
    },
    ipAddress,
    userAgent
  );
}

/**
 * Cancelar transação
 */
export async function cancelTransaction(
  userId: number,
  transactionId: number,
  ipAddress?: string,
  userAgent?: string
) {
  return updateTransaction(
    userId,
    transactionId,
    {
      status: "cancelled",
    },
    ipAddress,
    userAgent
  );
}

/**
 * Obter resumo financeiro do usuário
 */
export async function getFinancialSummary(
  userId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const conditions: any[] = [eq(transactions.userId, userId), eq(transactions.status, "paid")];

    if (startDate) {
      conditions.push(gte(transactions.paymentDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(transactions.paymentDate, endDate));
    }

    const allTransactions = await db
      .select()
      .from(transactions)
      .where(and(...conditions));

    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);

    allTransactions.forEach((tx) => {
      const amount = new Decimal(tx.amount || 0);
      if (tx.type === "income") {
        totalIncome = totalIncome.plus(amount);
      } else {
        totalExpense = totalExpense.plus(amount);
      }
    });

    const balance = totalIncome.minus(totalExpense);

    return {
      totalIncome: totalIncome.toString(),
      totalExpense: totalExpense.toString(),
      balance: balance.toString(),
      transactionCount: allTransactions.length,
    };
  } catch (error) {
    console.error("[TransactionControl] Error getting financial summary:", error);
    return null;
  }
}

/**
 * Obter transações pendentes
 */
export async function getPendingTransactions(userId: number) {
  return getUserTransactions(userId, {
    status: "pending",
  });
}

/**
 * Obter transações atrasadas
 */
export async function getOverdueTransactions(userId: number) {
  return getUserTransactions(userId, {
    status: "overdue",
  });
}
