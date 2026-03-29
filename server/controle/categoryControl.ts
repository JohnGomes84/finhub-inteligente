import { eq, and } from "drizzle-orm";
import { categories } from "../../drizzle/schema";
import { getDb } from "../db";
import { logAudit } from "./auditControl";

/**
 * Category Control Module - Gerenciamento de categorias de lançamentos
 * Alta coesão: operações de categorias
 * Baixo acoplamento: usa getDb() injetado
 */

/**
 * Criar nova categoria
 */
export async function createCategory(
  userId: number,
  name: string,
  type: "income" | "expense",
  description?: string,
  color?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(categories).values({
      userId,
      name,
      type,
      description,
      color,
    });

    const categoryId = result[0]?.insertId;
    if (categoryId) {
      await logAudit(
        userId,
        "CREATE",
        "categories",
        categoryId as number,
        null,
        { name, type, description, color },
        "success",
        ipAddress,
        userAgent
      );
    }

    return categoryId;
  } catch (error) {
    console.error("[CategoryControl] Error creating category:", error);
    await logAudit(
      userId,
      "CREATE",
      "categories",
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
 * Obter categorias do usuário
 */
export async function getUserCategories(userId: number, type?: "income" | "expense", activeOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions: any[] = [eq(categories.userId, userId)];

    if (type) {
      conditions.push(eq(categories.type, type));
    }

    if (activeOnly) {
      conditions.push(eq(categories.isActive, true));
    }

    const results = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(categories.name);
    return results;
  } catch (error) {
    console.error("[CategoryControl] Error getting categories:", error);
    return [];
  }
}

/**
 * Obter categoria por ID
 */
export async function getCategoryById(userId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[CategoryControl] Error getting category:", error);
    return null;
  }
}

/**
 * Atualizar categoria
 */
export async function updateCategory(
  userId: number,
  categoryId: number,
  updates: {
    name?: string;
    description?: string;
    color?: string;
    isActive?: boolean;
  },
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    // Obter valores antigos
    const oldCategory = await getCategoryById(userId, categoryId);
    if (!oldCategory) return false;

    await db
      .update(categories)
      .set(updates)
      .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)));

    await logAudit(
      userId,
      "UPDATE",
      "categories",
      categoryId,
      {
        name: oldCategory.name,
        description: oldCategory.description,
        color: oldCategory.color,
        isActive: oldCategory.isActive,
      },
      updates,
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[CategoryControl] Error updating category:", error);
    await logAudit(
      userId,
      "UPDATE",
      "categories",
      categoryId,
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
 * Deletar categoria (soft delete - apenas marca como inativa)
 */
export async function deleteCategory(
  userId: number,
  categoryId: number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const oldCategory = await getCategoryById(userId, categoryId);
    if (!oldCategory) return false;

    await db
      .update(categories)
      .set({ isActive: false })
      .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)));

    await logAudit(
      userId,
      "DELETE",
      "categories",
      categoryId,
      { isActive: oldCategory.isActive },
      { isActive: false },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[CategoryControl] Error deleting category:", error);
    await logAudit(
      userId,
      "DELETE",
      "categories",
      categoryId,
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
