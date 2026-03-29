import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createCategory,
  getUserCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controle/categoryControl";

/**
 * Categories Router - Procedimentos tRPC para categorias de lançamentos
 */

const categoryInputSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["income", "expense"]),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const categoriesRouter = router({
  /**
   * Criar nova categoria
   */
  create: protectedProcedure
    .input(categoryInputSchema)
    .mutation(async ({ input, ctx }) => {
      const categoryId = await createCategory(
        ctx.user.id,
        input.name,
        input.type,
        input.description,
        input.color,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!categoryId) {
        throw new Error("Failed to create category");
      }

      return { id: categoryId, success: true };
    }),

  /**
   * Listar categorias do usuário
   */
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(["income", "expense"]).optional(),
        activeOnly: z.boolean().default(true),
      })
    )
    .query(async ({ input, ctx }) => {
      return getUserCategories(ctx.user.id, input.type, input.activeOnly);
    }),

  /**
   * Obter categoria por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const category = await getCategoryById(ctx.user.id, input.id);

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    }),

  /**
   * Atualizar categoria
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = await updateCategory(
        ctx.user.id,
        input.id,
        input.data,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to update category");
      }

      return { success: true };
    }),

  /**
   * Deletar categoria (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const success = await deleteCategory(
        ctx.user.id,
        input.id,
        ctx.req.ip,
        ctx.req.headers["user-agent"] as string
      );

      if (!success) {
        throw new Error("Failed to delete category");
      }

      return { success: true };
    }),
});
