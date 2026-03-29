import { eq, and } from "drizzle-orm";
import { fiscalDocuments, bankStatements } from "../../drizzle/schema";
import { getDb } from "../db";
import { logAudit } from "./auditControl";
import { storagePut } from "../storage";

/**
 * Document Control Module - Gerenciamento de documentos fiscais e extratos
 * Alta coesão: operações de documentos
 * Baixo acoplamento: usa getDb() e S3 injetados
 */

export type DocumentType = "invoice" | "receipt" | "bill" | "proof";
export type DocumentStatus = "pending" | "processed" | "verified" | "archived";

/**
 * Upload e armazenar documento fiscal em S3
 */
export async function uploadFiscalDocument(
  userId: number,
  file: Buffer,
  fileName: string,
  mimeType: string,
  documentType: DocumentType,
  documentNumber?: string,
  issuerName?: string,
  issuerCNPJ?: string,
  amount?: string | number,
  issueDate?: Date,
  dueDate?: Date,
  description?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Gerar chave única para S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const s3Key = `fiscal-documents/${userId}/${timestamp}-${randomSuffix}-${fileName}`;

    // Upload para S3
    const { url: s3Url } = await storagePut(s3Key, file, mimeType);

    // Salvar referência no banco
    const result = await db.insert(fiscalDocuments).values({
      userId,
      documentType,
      documentNumber,
      issuerName,
      issuerCNPJ,
      amount: amount ? amount.toString() : undefined,
      issueDate,
      dueDate,
      description,
      s3Key,
      s3Url,
      mimeType,
      fileSize: file.length,
      status: "pending",
    });

    const documentId = result[0]?.insertId;
    if (documentId) {
      await logAudit(
        userId,
        "CREATE",
        "fiscal_documents",
        documentId as number,
        null,
        { documentType, documentNumber, s3Key },
        "success",
        ipAddress,
        userAgent
      );
    }

    return documentId;
  } catch (error) {
    console.error("[DocumentControl] Error uploading document:", error);
    await logAudit(
      userId,
      "CREATE",
      "fiscal_documents",
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
 * Obter documentos do usuário
 */
export async function getUserDocuments(
  userId: number,
  documentType?: DocumentType,
  status?: DocumentStatus,
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions: any[] = [eq(fiscalDocuments.userId, userId)];

    if (documentType) {
      conditions.push(eq(fiscalDocuments.documentType, documentType));
    }
    if (status) {
      conditions.push(eq(fiscalDocuments.status, status));
    }

    const results = await db
      .select()
      .from(fiscalDocuments)
      .where(and(...conditions))
      .orderBy(fiscalDocuments.createdAt)
      .limit(limit)
      .offset(offset);

    return results;
  } catch (error) {
    console.error("[DocumentControl] Error getting documents:", error);
    return [];
  }
}

/**
 * Obter documento por ID
 */
export async function getDocumentById(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(fiscalDocuments)
      .where(and(eq(fiscalDocuments.userId, userId), eq(fiscalDocuments.id, documentId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DocumentControl] Error getting document:", error);
    return null;
  }
}

/**
 * Atualizar status do documento
 */
export async function updateDocumentStatus(
  userId: number,
  documentId: number,
  status: DocumentStatus,
  extractedData?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const oldDocument = await getDocumentById(userId, documentId);
    if (!oldDocument) return false;

    const updateData: any = { status };
    if (extractedData) {
      updateData.extractedData = JSON.stringify(extractedData);
    }

    await db
      .update(fiscalDocuments)
      .set(updateData)
      .where(and(eq(fiscalDocuments.userId, userId), eq(fiscalDocuments.id, documentId)));

    await logAudit(
      userId,
      "UPDATE",
      "fiscal_documents",
      documentId,
      { status: oldDocument.status },
      { status },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[DocumentControl] Error updating document status:", error);
    await logAudit(
      userId,
      "UPDATE",
      "fiscal_documents",
      documentId,
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
 * Upload e armazenar extrato bancário (OFX)
 */
export async function uploadBankStatement(
  userId: number,
  bankAccountId: number,
  file: Buffer,
  fileName: string,
  statementDate: Date,
  startDate?: Date,
  endDate?: Date,
  openingBalance?: string | number,
  closingBalance?: string | number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Gerar chave única para S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const s3Key = `bank-statements/${userId}/${timestamp}-${randomSuffix}-${fileName}`;

    // Upload para S3
    const { url: s3Url } = await storagePut(s3Key, file, "application/x-ofx");

    // Salvar referência no banco
    const result = await db.insert(bankStatements).values({
      userId,
      bankAccountId,
      statementDate,
      startDate,
      endDate,
      openingBalance: openingBalance ? openingBalance.toString() : undefined,
      closingBalance: closingBalance ? closingBalance.toString() : undefined,
      s3Key,
      s3Url,
      status: "pending",
    });

    const statementId = result[0]?.insertId;
    if (statementId) {
      await logAudit(
        userId,
        "CREATE",
        "bank_statements",
        statementId as number,
        null,
        { bankAccountId, s3Key },
        "success",
        ipAddress,
        userAgent
      );
    }

    return statementId;
  } catch (error) {
    console.error("[DocumentControl] Error uploading bank statement:", error);
    await logAudit(
      userId,
      "CREATE",
      "bank_statements",
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
 * Obter extratos bancários do usuário
 */
export async function getUserBankStatements(
  userId: number,
  bankAccountId?: number,
  status?: "pending" | "processing" | "completed" | "error",
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions: any[] = [eq(bankStatements.userId, userId)];

    if (bankAccountId) {
      conditions.push(eq(bankStatements.bankAccountId, bankAccountId));
    }
    if (status) {
      conditions.push(eq(bankStatements.status, status));
    }

    const results = await db
      .select()
      .from(bankStatements)
      .where(and(...conditions))
      .orderBy(bankStatements.statementDate)
      .limit(limit)
      .offset(offset);

    return results;
  } catch (error) {
    console.error("[DocumentControl] Error getting bank statements:", error);
    return [];
  }
}

/**
 * Obter extrato bancário por ID
 */
export async function getBankStatementById(userId: number, statementId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(bankStatements)
      .where(and(eq(bankStatements.userId, userId), eq(bankStatements.id, statementId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DocumentControl] Error getting bank statement:", error);
    return null;
  }
}

/**
 * Atualizar status do extrato bancário
 */
export async function updateBankStatementStatus(
  userId: number,
  statementId: number,
  status: "pending" | "processing" | "completed" | "error",
  totalTransactions?: number,
  processedTransactions?: number,
  errorMessage?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const oldStatement = await getBankStatementById(userId, statementId);
    if (!oldStatement) return false;

    const updateData: any = { status };
    if (totalTransactions !== undefined) {
      updateData.totalTransactions = totalTransactions;
    }
    if (processedTransactions !== undefined) {
      updateData.processedTransactions = processedTransactions;
    }
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    await db
      .update(bankStatements)
      .set(updateData)
      .where(and(eq(bankStatements.userId, userId), eq(bankStatements.id, statementId)));

    await logAudit(
      userId,
      "UPDATE",
      "bank_statements",
      statementId,
      { status: oldStatement.status },
      { status },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[DocumentControl] Error updating bank statement status:", error);
    await logAudit(
      userId,
      "UPDATE",
      "bank_statements",
      statementId,
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
