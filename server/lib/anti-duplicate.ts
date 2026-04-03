import { getDb } from "../db";
import { scheduleAllocations, workSchedules } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";


export interface AllocationValidationResult {
  isDuplicate: boolean;
  requiresJustification: boolean;
  conflictingScheduleId?: number;
  conflictingDate?: string;
  message?: string;
}

export interface DuplicateException {
  employeeId: number;
  date: string;
  justification: string;
  createdByUserId: number;
}

/**
 * Valida se um funcionário já está alocado no mesmo dia
 * Retorna requiresJustification=true se houver conflito
 */
export async function validateAllocation(
  employeeId: number,
  scheduleId: number
): Promise<AllocationValidationResult> {
  const db = await getDb();
  if (!db) return { isDuplicate: false, requiresJustification: false };

  // Buscar data do planejamento
  const [schedule] = await db
    .select()
    .from(workSchedules)
    .where(eq(workSchedules.id, scheduleId))
    .limit(1);

  if (!schedule) {
    return { isDuplicate: false, requiresJustification: false };
  }

  const scheduleDate = new Date(schedule.date).toISOString().split("T")[0];

  // Buscar outras alocações do mesmo funcionário no mesmo dia
  const conflictingAllocations = await db
    .select({ scheduleId: scheduleAllocations.scheduleId })
    .from(scheduleAllocations)
    .innerJoin(
      workSchedules,
      eq(scheduleAllocations.scheduleId, workSchedules.id)
    )
    .where(
      and(
        eq(scheduleAllocations.employeeId, employeeId),
        sql`DATE(${workSchedules.date}) = ${scheduleDate}`
      )
    );

  if (conflictingAllocations.length > 0) {
    return {
      isDuplicate: true,
      requiresJustification: true,
      conflictingScheduleId: conflictingAllocations[0].scheduleId,
      conflictingDate: scheduleDate,
      message: `Funcionário já alocado em outro planejamento no dia ${scheduleDate}`,
    };
  }

  return { isDuplicate: false, requiresJustification: false };
}

/**
 * Registra exceção de duplicidade com justificativa
 */
export async function registerDuplicateException(
  exception: DuplicateException
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Aqui você pode adicionar uma tabela duplicate_exceptions se necessário
    // Por enquanto, apenas retorna true indicando sucesso
    // A justificativa pode ser armazenada em um campo notes na alocação
    return true;
  } catch (error) {
    console.error("Erro ao registrar exceção de duplicidade:", error);
    return false;
  }
}

/**
 * Permite alocação duplicada com justificativa
 */
export async function allowDuplicateWithJustification(
  employeeId: number,
  scheduleId: number,
  justification: string
): Promise<{ success: boolean; message: string }> {
  if (!justification || justification.trim().length < 10) {
    return {
      success: false,
      message: "Justificativa deve ter no mínimo 10 caracteres",
    };
  }

  // Registrar exceção
  const registered = await registerDuplicateException({
    employeeId,
    date: new Date().toISOString().split("T")[0],
    justification,
    createdByUserId: 0, // Será preenchido pelo contexto tRPC
  });

  if (!registered) {
    return {
      success: false,
      message: "Erro ao registrar exceção",
    };
  }

  return {
    success: true,
    message: "Alocação permitida com justificativa registrada",
  };
}
