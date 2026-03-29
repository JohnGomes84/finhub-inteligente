import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  uploadFiscalDocument,
  getUserDocuments,
  getDocumentById,
  updateDocumentStatus,
  uploadBankStatement,
  getUserBankStatements,
  getBankStatementById,
  updateBankStatementStatus,
} from "../controle/documentControl";

/**
 * Documents Router - Procedimentos tRPC para upload e gerenciamento de documentos
 */

export const documentsRouter = router({
  /**
   * Upload de documento fiscal
   */
  uploadFiscal: protectedProcedure
    .input(
      z.object({
        file: z.instanceof(Buffer),
        fileName: z.string(),
        mimeType: z.string(),
        documentType: z.enum(["invoice", "receipt", "bill", "proof"]),
        documentNumber: z.string().optional(),
        issuerName: z.string().optional(),
        issuerCNPJ: z.string().optional(),
        amount: z.string().or(z.number()).optional(),
        issueDate: z.date().optional(),
        dueDate: z.date().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const documentId = await uploadFiscalDocument(
        ctx.user.id,
        input.file,
        input.fileName,
        input.mimeType,
        input.documentType,
        input.documentNumber,
        input.issuerName,
        input.issuerCNPJ,
        input.amount,
        input.issueDate,
        input.dueDate,
        input.description,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!documentId) {
        throw new Error("Failed to upload document");
      }

      return { id: documentId, success: true };
    }),

  /**
   * Listar documentos fiscais
   */
  listFiscal: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["invoice", "receipt", "bill", "proof"]).optional(),
        status: z.enum(["pending", "processed", "verified", "archived"]).optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return getUserDocuments(
        ctx.user.id,
        input.documentType,
        input.status,
        input.limit,
        input.offset
      );
    }),

  /**
   * Obter documento fiscal por ID
   */
  getFiscal: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const document = await getDocumentById(ctx.user.id, input.id);

      if (!document) {
        throw new Error("Document not found");
      }

      return document;
    }),

  /**
   * Atualizar status do documento
   */
  updateFiscalStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "processed", "verified", "archived"]),
        extractedData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = await updateDocumentStatus(
        ctx.user.id,
        input.id,
        input.status,
        input.extractedData,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to update document status");
      }

      return { success: true };
    }),

  /**
   * Upload de extrato bancário (OFX)
   */
  uploadBankStatement: protectedProcedure
    .input(
      z.object({
        file: z.instanceof(Buffer),
        fileName: z.string(),
        bankAccountId: z.number(),
        statementDate: z.coerce.date(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        openingBalance: z.string().or(z.number()).optional(),
        closingBalance: z.string().or(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const statementId = await uploadBankStatement(
        ctx.user.id,
        input.bankAccountId,
        input.file,
        input.fileName,
        input.statementDate,
        input.startDate,
        input.endDate,
        input.openingBalance,
        input.closingBalance,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!statementId) {
        throw new Error("Failed to upload bank statement");
      }

      return { id: statementId, success: true };
    }),

  /**
   * Listar extratos bancários
   */
  listBankStatements: protectedProcedure
    .input(
      z.object({
        bankAccountId: z.number().optional(),
        status: z.enum(["pending", "processing", "completed", "error"]).optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return getUserBankStatements(
        ctx.user.id,
        input.bankAccountId,
        input.status,
        input.limit,
        input.offset
      );
    }),

  /**
   * Obter extrato bancário por ID
   */
  getBankStatement: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const statement = await getBankStatementById(ctx.user.id, input.id);

      if (!statement) {
        throw new Error("Bank statement not found");
      }

      return statement;
    }),

  /**
   * Atualizar status do extrato bancário
   */
  updateBankStatementStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "completed", "error"]),
        totalTransactions: z.number().optional(),
        processedTransactions: z.number().optional(),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = await updateBankStatementStatus(
        ctx.user.id,
        input.id,
        input.status,
        input.totalTransactions,
        input.processedTransactions,
        input.errorMessage,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to update bank statement status");
      }

      return { success: true };
    }),
});
