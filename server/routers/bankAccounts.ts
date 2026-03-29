import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createBankAccount,
  getUserBankAccounts,
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount,
  getUserTotalBalance,
} from "../controle/bankAccountControl";

/**
 * Bank Accounts Router - Procedimentos tRPC para contas bancárias
 */

const bankAccountInputSchema = z.object({
  name: z.string().min(1).max(100),
  bankName: z.string().min(1).max(100),
  accountNumber: z.string().min(1).max(50),
  accountType: z.enum(["checking", "savings", "investment"]),
  initialBalance: z.string().or(z.number()),
});

export const bankAccountsRouter = router({
  /**
   * Criar nova conta bancária
   */
  create: protectedProcedure
    .input(bankAccountInputSchema)
    .mutation(async ({ input, ctx }) => {
      const accountId = await createBankAccount(
        ctx.user.id,
        input.name,
        input.bankName,
        input.accountNumber,
        input.accountType,
        input.initialBalance,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!accountId) {
        throw new Error("Failed to create bank account");
      }

      return { id: accountId, success: true };
    }),

  /**
   * Listar contas bancárias do usuário
   */
  list: protectedProcedure
    .input(z.object({ activeOnly: z.boolean().default(true) }))
    .query(async ({ input, ctx }) => {
      return getUserBankAccounts(ctx.user.id, input.activeOnly);
    }),

  /**
   * Obter conta bancária por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const account = await getBankAccountById(ctx.user.id, input.id);

      if (!account) {
        throw new Error("Bank account not found");
      }

      return account;
    }),

  /**
   * Atualizar conta bancária
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          bankName: z.string().optional(),
          accountNumber: z.string().optional(),
          accountType: z.enum(["checking", "savings", "investment"]).optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = await updateBankAccount(
        ctx.user.id,
        input.id,
        input.data,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to update bank account");
      }

      return { success: true };
    }),

  /**
   * Deletar conta bancária (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const success = await deleteBankAccount(
        ctx.user.id,
        input.id,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to delete bank account");
      }

      return { success: true };
    }),

  /**
   * Obter saldo total do usuário
   */
  getTotalBalance: protectedProcedure.query(async ({ ctx }) => {
    const totalBalance = await getUserTotalBalance(ctx.user.id);
    return { totalBalance };
  }),
});
