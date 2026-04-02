/**
 * FINHUB — Soft Delete (Exclusão Lógica)
 * 
 * Implementa exclusão lógica com preservação de histórico.
 * Atende LGPD: dados não são destruídos, apenas marcados como deletados.
 * 
 * Uso:
 * - Adicionar coluna `deletedAt` (datetime nullable) nas tabelas
 * - Usar `markAsDeleted()` em vez de DELETE
 * - Usar `filterActive()` nas queries para não mostrar deletados
 */

import { eq, isNull } from 'drizzle-orm';

/**
 * Marca um registro como deletado (soft delete)
 * @param db Database connection
 * @param table Tabela (ex: employees)
 * @param id ID do registro
 * @returns true se marcado, false se não encontrado
 */
export async function markAsDeleted(
  db: any,
  table: any,
  id: number | string
): Promise<boolean> {
  const now = new Date();
  const result = await db
    .update(table)
    .set({ deletedAt: now })
    .where(eq(table.id, id));
  
  return result.rowsAffected > 0;
}

/**
 * Filtra apenas registros ativos (não deletados)
 * @param table Tabela com coluna deletedAt
 * @returns Condição para usar em WHERE
 */
export function filterActive(table: any) {
  return isNull(table.deletedAt);
}

/**
 * Restaura um registro deletado
 * @param db Database connection
 * @param table Tabela
 * @param id ID do registro
 * @returns true se restaurado
 */
export async function restoreDeleted(
  db: any,
  table: any,
  id: number | string
): Promise<boolean> {
  const result = await db
    .update(table)
    .set({ deletedAt: null })
    .where(eq(table.id, id));
  
  return result.rowsAffected > 0;
}

/**
 * Conta registros ativos
 * @param db Database connection
 * @param table Tabela
 * @returns Número de registros ativos
 */
export async function countActive(db: any, table: any): Promise<number> {
  const result = await db
    .select({ count: db.fn.count() })
    .from(table)
    .where(filterActive(table));
  
  return result[0]?.count || 0;
}
