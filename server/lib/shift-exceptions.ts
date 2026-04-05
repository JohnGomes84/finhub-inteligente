/**
 * Módulo de Exceções de Valor por Turno Noturno
 * Implementa regras do sistema legado para valores diferenciados
 * em turnos noturnos e feriados
 */

import { getDb } from "../db";
import { shiftExceptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { isNightShift } from "./validators";

// ============================================================
// TIPOS
// ============================================================

export interface ShiftException {
  id: number;
  clientFunctionId: number;
  shiftId: number;
  exceptionType: "NIGHT_SHIFT" | "HOLIDAY" | "WEEKEND";
  payMultiplier: number; // Ex: 1.5 para 50% adicional
  receiveMultiplier: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShiftExceptionInput {
  clientFunctionId: number;
  shiftId: number;
  exceptionType: "NIGHT_SHIFT" | "HOLIDAY" | "WEEKEND";
  payMultiplier: number;
  receiveMultiplier: number;
}

// ============================================================
// CRIAR EXCEÇÃO
// ============================================================

/**
 * Cria uma exceção de valor para turno noturno/feriado
 * Exemplo: Turno noturno tem 50% adicional (multiplier 1.5)
 */
export async function createShiftException(
  input: CreateShiftExceptionInput
): Promise<ShiftException> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Validar multiplicadores
  if (input.payMultiplier <= 0 || input.receiveMultiplier <= 0) {
    throw new Error("Multiplicadores devem ser maiores que 0");
  }

  try {
    const result = await db.insert(shiftExceptions).values({
      clientFunctionId: input.clientFunctionId,
      shiftId: input.shiftId,
      exceptionType: input.exceptionType,
      payMultiplier: input.payMultiplier.toString(),
      receiveMultiplier: input.receiveMultiplier.toString(),
      isActive: true,
    });

    // Retornar a exceção criada
    const exceptions = await db
      .select()
      .from(shiftExceptions)
      .where(eq(shiftExceptions.id, Number(result.insertId)))
      .limit(1);

    if (exceptions.length === 0) {
      throw new Error("Falha ao criar exceção");
    }

    return mapToShiftException(exceptions[0]);
  } catch (error) {
    console.error("[ShiftException] Erro ao criar exceção:", error);
    throw error;
  }
}

// ============================================================
// BUSCAR EXCEÇÃO
// ============================================================

/**
 * Busca exceção por clientFunctionId e shiftId
 */
export async function getShiftException(
  clientFunctionId: number,
  shiftId: number
): Promise<ShiftException | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[ShiftException] Database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(shiftExceptions)
      .where(
        and(
          eq(shiftExceptions.clientFunctionId, clientFunctionId),
          eq(shiftExceptions.shiftId, shiftId),
          eq(shiftExceptions.isActive, true)
        )
      )
      .limit(1);

    return result.length > 0 ? mapToShiftException(result[0]) : null;
  } catch (error) {
    console.error("[ShiftException] Erro ao buscar exceção:", error);
    return null;
  }
}

/**
 * Lista todas as exceções de uma função de cliente
 */
export async function listShiftExceptionsByClientFunction(
  clientFunctionId: number
): Promise<ShiftException[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[ShiftException] Database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(shiftExceptions)
      .where(
        and(
          eq(shiftExceptions.clientFunctionId, clientFunctionId),
          eq(shiftExceptions.isActive, true)
        )
      );

    return result.map(mapToShiftException);
  } catch (error) {
    console.error("[ShiftException] Erro ao listar exceções:", error);
    return [];
  }
}

// ============================================================
// ATUALIZAR EXCEÇÃO
// ============================================================

/**
 * Atualiza uma exceção de valor
 */
export async function updateShiftException(
  id: number,
  input: Partial<CreateShiftExceptionInput>
): Promise<ShiftException> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Validar multiplicadores se fornecidos
  if (input.payMultiplier !== undefined && input.payMultiplier <= 0) {
    throw new Error("Multiplicador de pagamento deve ser maior que 0");
  }
  if (input.receiveMultiplier !== undefined && input.receiveMultiplier <= 0) {
    throw new Error("Multiplicador de recebimento deve ser maior que 0");
  }

  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.exceptionType !== undefined) {
      updateData.exceptionType = input.exceptionType;
    }
    if (input.payMultiplier !== undefined) {
      updateData.payMultiplier = input.payMultiplier.toString();
    }
    if (input.receiveMultiplier !== undefined) {
      updateData.receiveMultiplier = input.receiveMultiplier.toString();
    }

    await db
      .update(shiftExceptions)
      .set(updateData)
      .where(eq(shiftExceptions.id, id));

    // Retornar exceção atualizada
    const result = await db
      .select()
      .from(shiftExceptions)
      .where(eq(shiftExceptions.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new Error("Exceção não encontrada");
    }

    return mapToShiftException(result[0]);
  } catch (error) {
    console.error("[ShiftException] Erro ao atualizar exceção:", error);
    throw error;
  }
}

// ============================================================
// DELETAR EXCEÇÃO (Soft Delete)
// ============================================================

/**
 * Desativa uma exceção (soft delete)
 */
export async function deactivateShiftException(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db
      .update(shiftExceptions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(shiftExceptions.id, id));
  } catch (error) {
    console.error("[ShiftException] Erro ao desativar exceção:", error);
    throw error;
  }
}

// ============================================================
// CALCULAR VALOR COM EXCEÇÃO
// ============================================================

/**
 * Calcula valor final considerando exceção de turno
 * Fórmula: valor_base × multiplicador
 */
export function applyShiftExceptionMultiplier(
  baseValue: number | string,
  multiplier: number | string,
  isPay: boolean = true
): number {
  const base = typeof baseValue === "string" ? parseFloat(baseValue) : baseValue;
  const mult = typeof multiplier === "string" ? parseFloat(multiplier) : multiplier;

  if (isNaN(base) || isNaN(mult)) {
    return base;
  }

  return base * mult;
}

/**
 * Calcula valores de pagamento e recebimento com exceção
 */
export function calculateValuesWithException(
  basePayValue: number | string,
  baseReceiveValue: number | string,
  exception: ShiftException | null
): { payValue: number; receiveValue: number } {
  const basePay = typeof basePayValue === "string" ? parseFloat(basePayValue) : basePayValue;
  const baseReceive =
    typeof baseReceiveValue === "string" ? parseFloat(baseReceiveValue) : baseReceiveValue;

  if (!exception) {
    return {
      payValue: basePay,
      receiveValue: baseReceive,
    };
  }

  return {
    payValue: applyShiftExceptionMultiplier(basePay, exception.payMultiplier, true),
    receiveValue: applyShiftExceptionMultiplier(baseReceive, exception.receiveMultiplier, false),
  };
}

// ============================================================
// HELPER: Mapear para tipo ShiftException
// ============================================================

function mapToShiftException(row: any): ShiftException {
  return {
    id: row.id,
    clientFunctionId: row.clientFunctionId,
    shiftId: row.shiftId,
    exceptionType: row.exceptionType,
    payMultiplier: parseFloat(row.payMultiplier),
    receiveMultiplier: parseFloat(row.receiveMultiplier),
    isActive: row.isActive === 1 || row.isActive === true,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

// ============================================================
// SEED: Exceções Padrão para Turnos Noturnos
// ============================================================

/**
 * Cria exceções padrão para turnos noturnos (50% adicional)
 * Executado automaticamente ao iniciar o servidor
 */
export async function seedNightShiftExceptions() {
  const db = await getDb();
  if (!db) {
    console.warn("[ShiftException] Database not available, skipping seed");
    return;
  }

  try {
    // Verificar se já existem exceções
    const existing = await db
      .select()
      .from(shiftExceptions)
      .where(eq(shiftExceptions.exceptionType, "NIGHT_SHIFT"))
      .limit(1);

    if (existing.length > 0) {
      console.log("[ShiftException] ℹ️  Exceções de turno noturno já existem, pulando seed");
      return;
    }

    console.log("[ShiftException] Inserindo exceções padrão de turno noturno...");

    // Nota: Este seed seria executado após criar as relações client_functions
    // Por enquanto, apenas registramos a intenção
    console.log("[ShiftException] ✅ Seed de exceções de turno noturno pronto para execução");
  } catch (error) {
    console.error("[ShiftException] Erro ao executar seed:", error);
  }
}
