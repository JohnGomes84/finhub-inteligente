import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  findMatchingTransactions,
  createReconciliationMatch,
  getUserReconciliationMatches,
  approveReconciliationMatch,
  rejectReconciliationMatch,
  getReconciliationSummary,
  calculateMatchScore,
} from "../controle/reconciliationControl";

/**
 * Reconciliation Router - Procedimentos tRPC para conciliação bancária
 */

export const reconciliationRouter = router({
  /**
   * Encontrar transações para conciliação
   */
  findMatching: protectedProcedure
    .input(
      z.object({
        amount: z.string().or(z.number()),
        description: z.string(),
        tolerance: z.number().default(0.01),
      })
    )
    .query(async ({ input, ctx }) => {
      return findMatchingTransactions(ctx.user.id, input.amount, input.description, input.tolerance);
    }),

  /**
   * Criar correspondência de conciliação
   */
  createMatch: protectedProcedure
    .input(
      z.object({
        transactionId: z.number(),
        bankStatementId: z.number(),
        confidence: z.number().min(0).max(100),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const matchId = await createReconciliationMatch(
        ctx.user.id,
        input.transactionId,
        input.bankStatementId,
        input.confidence,
        input.notes,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!matchId) {
        throw new Error("Failed to create reconciliation match");
      }

      return { id: matchId, success: true };
    }),

  /**
   * Listar correspondências de conciliação
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["matched", "disputed", "unmatched"]).optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return getUserReconciliationMatches(ctx.user.id, input.status, input.limit, input.offset);
    }),

  /**
   * Aprovar correspondência
   */
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const success = await approveReconciliationMatch(
        ctx.user.id,
        input.id,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to approve reconciliation match");
      }

      return { success: true };
    }),

  /**
   * Rejeitar correspondência
   */
  reject: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = await rejectReconciliationMatch(
        ctx.user.id,
        input.id,
        input.reason,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to reject reconciliation match");
      }

      return { success: true };
    }),

  /**
   * Obter resumo de conciliação
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const summary = await getReconciliationSummary(ctx.user.id);

    if (!summary) {
      throw new Error("Failed to get reconciliation summary");
    }

    return summary;
  }),

  /**
   * Calcular score de correspondência
   */
  calculateScore: protectedProcedure
    .input(
      z.object({
        transactionAmount: z.string().or(z.number()),
        statementAmount: z.string().or(z.number()),
        transactionDate: z.coerce.date(),
        statementDate: z.coerce.date(),
        descriptionSimilarity: z.number().default(0.8),
      })
    )
    .query(async ({ input }) => {
      const score = calculateMatchScore(
        input.transactionAmount,
        input.statementAmount,
        input.transactionDate,
        input.statementDate,
        input.descriptionSimilarity
      );

      return { score };
    }),
});
