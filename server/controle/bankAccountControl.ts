import { eq, and } from "drizzle-orm";
import { bankAccounts } from "../../drizzle/schema";
import { getDb } from "../db";
import { logAudit } from "./auditControl";
import { Decimal } from "decimal.js";

/**
 * Bank Account Control Module - Gerenciamento de contas bancárias
 * Alta coesão: operações de contas
 * Baixo acoplamento: usa getDb() injetado
 */

/**
 * Criar nova conta bancária
 */
export async function createBankAccount(
  userId: number,
  name: string,
  bankName: string,
  accountNumber: string,
  accountType: "checking" | "savings" | "investment",
  initialBalance: string | number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const balance = new Decimal(initialBalance).toString();

    const result = await db.insert(bankAccounts).values({
      userId,
      name,
      bankName,
      accountNumber,
      accountType,
      initialBalance: balance,
      currentBalance: balance,
    });

    const accountId = result[0]?.insertId;
    if (accountId) {
      await logAudit(
        userId,
        "CREATE",
        "bank_accounts",
        accountId as number,
        null,
        { name, bankName, accountNumber, accountType, initialBalance: balance },
        "success",
        ipAddress,
        userAgent
      );
    }

    return accountId;
  } catch (error) {
    console.error("[BankAccountControl] Error creating account:", error);
    await logAudit(
      userId,
      "CREATE",
      "bank_accounts",
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
 * Obter contas bancárias do usuário
 */
export async function getUserBankAccounts(userId: number, activeOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions: any[] = [eq(bankAccounts.userId, userId)];

    if (activeOnly) {
      conditions.push(eq(bankAccounts.isActive, true));
    }

    const results = await db
      .select()
      .from(bankAccounts)
      .where(and(...conditions))
      .orderBy(bankAccounts.name);

    return results;
  } catch (error) {
    console.error("[BankAccountControl] Error getting accounts:", error);
    return [];
  }
}

/**
 * Obter conta bancária por ID
 */
export async function getBankAccountById(userId: number, accountId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.id, accountId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[BankAccountControl] Error getting account:", error);
    return null;
  }
}

/**
 * Atualizar saldo da conta
 */
export async function updateAccountBalance(
  userId: number,
  accountId: number,
  newBalance: string | number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const oldAccount = await getBankAccountById(userId, accountId);
    if (!oldAccount) return false;

    const balance = new Decimal(newBalance).toString();

    await db
      .update(bankAccounts)
      .set({ currentBalance: balance })
      .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.id, accountId)));

    await logAudit(
      userId,
      "UPDATE",
      "bank_accounts",
      accountId,
      { currentBalance: oldAccount.currentBalance },
      { currentBalance: balance },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[BankAccountControl] Error updating balance:", error);
    await logAudit(
      userId,
      "UPDATE",
      "bank_accounts",
      accountId,
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
 * Atualizar informações da conta
 */
export async function updateBankAccount(
  userId: number,
  accountId: number,
  updates: {
    name?: string;
    bankName?: string;
    accountNumber?: string;
    accountType?: "checking" | "savings" | "investment";
    isActive?: boolean;
  },
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const oldAccount = await getBankAccountById(userId, accountId);
    if (!oldAccount) return false;

    await db
      .update(bankAccounts)
      .set(updates)
      .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.id, accountId)));

    await logAudit(
      userId,
      "UPDATE",
      "bank_accounts",
      accountId,
      {
        name: oldAccount.name,
        bankName: oldAccount.bankName,
        accountNumber: oldAccount.accountNumber,
        accountType: oldAccount.accountType,
        isActive: oldAccount.isActive,
      },
      updates,
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[BankAccountControl] Error updating account:", error);
    await logAudit(
      userId,
      "UPDATE",
      "bank_accounts",
      accountId,
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
 * Deletar conta bancária (soft delete)
 */
export async function deleteBankAccount(
  userId: number,
  accountId: number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const oldAccount = await getBankAccountById(userId, accountId);
    if (!oldAccount) return false;

    await db
      .update(bankAccounts)
      .set({ isActive: false })
      .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.id, accountId)));

    await logAudit(
      userId,
      "DELETE",
      "bank_accounts",
      accountId,
      { isActive: oldAccount.isActive },
      { isActive: false },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[BankAccountControl] Error deleting account:", error);
    await logAudit(
      userId,
      "DELETE",
      "bank_accounts",
      accountId,
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
 * Obter saldo total do usuário (todas as contas ativas)
 */
export async function getUserTotalBalance(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "0";

  try {
    const accounts = await getUserBankAccounts(userId, true);
    const total = accounts.reduce((sum, account) => {
      return sum.plus(new Decimal(account.currentBalance || 0));
    }, new Decimal(0));

    return total.toString();
  } catch (error) {
    console.error("[BankAccountControl] Error calculating total balance:", error);
    return "0";
  }
}
