import { getDb } from "../db";
import { scheduleAllocations, accountsReceivable } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface AccountReceivableRecord {
  description: string;
  value: number;
  clientId: number;
  type: "order_of_service" | "invoice" | "other";
  status: "pending" | "paid" | "overdue" | "canceled";
  dueDate: Date;
  issueDate: Date;
  scheduleId?: number;
}

/**
 * Gera conta a receber automática para um planejamento validado
 * Descrição: "OS - [Cliente] - [Data do Planejamento]"
 * Valor: soma de todos os receiveValue das alocações
 * Vencimento: data do planejamento + 30 dias
 */
export async function generateAccountsReceivable(
  scheduleId: number,
  clientId: number,
  scheduleDate: Date
): Promise<{
  success: boolean;
  record?: AccountReceivableRecord;
  totalValue?: number;
  error?: string;
}> {
  try {
    const db = await getDb();

    // Buscar alocações do planejamento
    const allocations = await db
      .select()
      .from(scheduleAllocations)
      .where(eq(scheduleAllocations.scheduleId, scheduleId));

    if (allocations.length === 0) {
      return {
        success: false,
        error: "Planejamento não tem nenhuma alocação",
      };
    }

    // Calcular total a receber
    const totalValue = allocations.reduce((sum, alloc) => sum + alloc.receiveValue, 0);

    if (totalValue <= 0) {
      return {
        success: false,
        error: "Valor total a receber é zero ou negativo",
      };
    }

    // Calcular data de vencimento (30 dias após a data do planejamento)
    const dueDate = new Date(scheduleDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Formatar descrição
    const description = `OS - Cliente ${clientId} - ${scheduleDate.toLocaleDateString("pt-BR")}`;

    const record: AccountReceivableRecord = {
      description,
      value: totalValue,
      clientId,
      type: "order_of_service",
      status: "pending",
      dueDate,
      issueDate: new Date(),
      scheduleId,
    };

    return {
      success: true,
      record,
      totalValue,
    };
  } catch (error) {
    console.error("[ACCOUNTS RECEIVABLE GENERATION] Erro:", error);
    return {
      success: false,
      error: `Erro ao gerar conta a receber: ${error instanceof Error ? error.message : "Desconhecido"}`,
    };
  }
}

/**
 * Valida se uma conta a receber pode ser criada
 */
export function validateAccountsReceivable(record: AccountReceivableRecord): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!record.description || record.description.trim().length === 0) {
    errors.push("Descrição é obrigatória");
  }

  if (record.value <= 0) {
    errors.push("Valor deve ser maior que zero");
  }

  if (!record.clientId || record.clientId <= 0) {
    errors.push("Cliente inválido");
  }

  if (!record.dueDate || !(record.dueDate instanceof Date)) {
    errors.push("Data de vencimento inválida");
  }

  if (record.dueDate < record.issueDate) {
    errors.push("Data de vencimento não pode ser anterior à data de emissão");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calcula dias até o vencimento
 */
export function calculateDaysUntilDue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determina se uma conta está vencida
 */
export function isOverdue(dueDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

/**
 * Agrupa contas a receber por cliente
 */
export function groupByClient(
  records: AccountReceivableRecord[]
): Map<number, AccountReceivableRecord[]> {
  const grouped = new Map<number, AccountReceivableRecord[]>();

  for (const record of records) {
    if (!grouped.has(record.clientId)) {
      grouped.set(record.clientId, []);
    }
    grouped.get(record.clientId)!.push(record);
  }

  return grouped;
}

/**
 * Calcula total a receber por cliente
 */
export function calculateTotalByClient(
  records: AccountReceivableRecord[]
): Map<number, number> {
  const totals = new Map<number, number>();

  for (const record of records) {
    const current = totals.get(record.clientId) || 0;
    totals.set(record.clientId, current + record.value);
  }

  return totals;
}

/**
 * Filtra contas pendentes
 */
export function filterPending(records: AccountReceivableRecord[]): AccountReceivableRecord[] {
  return records.filter((r) => r.status === "pending");
}

/**
 * Filtra contas vencidas
 */
export function filterOverdue(records: AccountReceivableRecord[]): AccountReceivableRecord[] {
  return records.filter((r) => isOverdue(r.dueDate));
}
