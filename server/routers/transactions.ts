import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransaction,
  markTransactionAsPaid,
  cancelTransaction,
  getFinancialSummary,
  getPendingTransactions,
  getOverdueTransactions,
} from "../controle/transactionControl";
import { logAudit } from "../controle/auditControl";

/**
 * Transactions Router - Procedimentos tRPC para lançamentos financeiros
 */

const transactionInputSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().min(1).max(255),
  amount: z.string().or(z.number()).refine((val) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return num > 0;
  }, "Amount must be greater than 0"),
  transactionDate: z.date(),
  categoryId: z.number().optional(),
  bankAccountId: z.number().optional(),
  dueDate: z.date().optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
});

const transactionFilterSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
  categoryId: z.number().optional(),
  bankAccountId: z.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  reconciliationStatus: z.enum(["unreconciled", "reconciled", "disputed"]).optional(),
  limit: z.number().default(100),
  offset: z.number().default(0),
});

export const transactionsRouter = router({
  /**
   * Criar novo lançamento
   */
  create: protectedProcedure
    .input(transactionInputSchema)
    .mutation(async ({ input, ctx }) => {
      const transactionId = await createTransaction(
        ctx.user.id,
        input.type,
        input.description,
        input.amount,
        input.transactionDate,
        input.categoryId,
        input.bankAccountId,
        input.dueDate,
        input.reference,
        input.notes,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!transactionId) {
        throw new Error("Failed to create transaction");
      }

      return { id: transactionId, success: true };
    }),

  /**
   * Listar lançamentos com filtros
   */
  list: protectedProcedure
    .input(transactionFilterSchema)
    .query(async ({ input, ctx }) => {
      const transactions = await getUserTransactions(
        ctx.user.id,
        {
          type: input.type,
          status: input.status,
          categoryId: input.categoryId,
          bankAccountId: input.bankAccountId,
          startDate: input.startDate,
          endDate: input.endDate,
          reconciliationStatus: input.reconciliationStatus,
        },
        input.limit,
        input.offset
      );

      return transactions;
    }),

  /**
   * Obter transação por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const transaction = await getTransactionById(ctx.user.id, input.id);

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      return transaction;
    }),

  /**
   * Atualizar transação
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          description: z.string().optional(),
          amount: z.string().or(z.number()).optional(),
          transactionDate: z.date().optional(),
          dueDate: z.date().optional(),
          paymentDate: z.date().optional(),
          status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
          categoryId: z.number().optional(),
          reference: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = await updateTransaction(
        ctx.user.id,
        input.id,
        input.data,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to update transaction");
      }

      return { success: true };
    }),

  /**
   * Marcar transação como paga
   */
  markAsPaid: protectedProcedure
    .input(z.object({ id: z.number(), paymentDate: z.date().optional() }))
    .mutation(async ({ input, ctx }) => {
      const success = await markTransactionAsPaid(
        ctx.user.id,
        input.id,
        input.paymentDate,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to mark transaction as paid");
      }

      return { success: true };
    }),

  /**
   * Cancelar transação
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const success = await cancelTransaction(
        ctx.user.id,
        input.id,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to cancel transaction");
      }

      return { success: true };
    }),

  /**
   * Obter resumo financeiro
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const summary = await getFinancialSummary(ctx.user.id, input.startDate, input.endDate);

      if (!summary) {
        throw new Error("Failed to get financial summary");
      }

      return summary;
    }),

  /**
   * Obter transações pendentes
   */
  getPending: protectedProcedure.query(async ({ ctx }) => {
    return getPendingTransactions(ctx.user.id);
  }),

  /**
   * Obter transações atrasadas
   */
  getOverdue: protectedProcedure.query(async ({ ctx }) => {
    return getOverdueTransactions(ctx.user.id);
  }),
});
