import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  extractInvoiceData,
  extractBankStatementData,
  categorizeTransaction,
} from "../controle/aiExtractionControl";

/**
 * AI Extraction Router - Procedimentos tRPC para extração inteligente de dados
 */

export const aiExtractionRouter = router({
  /**
   * Extrair dados de nota fiscal
   */
  extractInvoice: protectedProcedure
    .input(
      z.object({
        fileUrl: z.string().url(),
        mimeType: z.string(),
        documentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const extractedData = await extractInvoiceData(
        input.fileUrl,
        input.mimeType,
        ctx.user.id,
        input.documentId,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!extractedData) {
        throw new Error("Failed to extract invoice data");
      }

      return extractedData;
    }),

  /**
   * Extrair dados de extrato bancário
   */
  extractBankStatement: protectedProcedure
    .input(
      z.object({
        fileUrl: z.string().url(),
        mimeType: z.string(),
        statementId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const extractedData = await extractBankStatementData(
        input.fileUrl,
        input.mimeType,
        ctx.user.id,
        input.statementId,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!extractedData) {
        throw new Error("Failed to extract bank statement data");
      }

      return extractedData;
    }),

  /**
   * Categorizar transação automaticamente
   */
  categorizeTransaction: protectedProcedure
    .input(
      z.object({
        description: z.string(),
        amount: z.string(),
        type: z.enum(["income", "expense"]),
      })
    )
    .query(async ({ input }) => {
      const categorization = await categorizeTransaction(
        input.description,
        input.amount,
        input.type
      );

      return categorization;
    }),
});
