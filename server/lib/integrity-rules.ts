/**
 * Módulo de Regras de Integridade
 * Implementa regras de negócio críticas do sistema legado
 * - Soft Delete (marcar como deletado sem remover do banco)
 * - Período Fechado (não permitir edição após período finalizado)\n * - Duplicação de Planejamentos (validar conflitos)
 * - Rastreabilidade (quem, quando, por quê)
 */

// ============================================================
// TIPOS
// ============================================================

export interface AuditLog {
  id: number;
  entityType: string; // "schedule", "employee", "client", etc.
  entityId: number;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  changedBy: number; // userId
  changedAt: Date;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
}

export interface ClosedPeriod {
  id: number;
  startDate: Date;
  endDate: Date;
  reason: string;
  createdBy: number;
  createdAt: Date;
}

// ============================================================
// SOFT DELETE - Marcar como Deletado
// ============================================================

/**
 * Valida se uma entidade pode ser deletada
 * Regras:
 * - Não deletar se período está fechado
 * - Não deletar se há dependências ativas
 */
export function canDeleteEntity(
  entityType: string,
  entityId: number,
  currentDate: Date,
  closedPeriods: ClosedPeriod[]
): { canDelete: boolean; reason?: string } {
  // Verificar se período está fechado
  const isPeriodClosed = closedPeriods.some(
    (period) => currentDate >= period.startDate && currentDate <= period.endDate
  );

  if (isPeriodClosed) {
    return {
      canDelete: false,
      reason: "Não é possível deletar registros em período fechado",
    };
  }

  return { canDelete: true };
}

/**
 * Soft delete: marca entidade como deletada sem remover do banco
 * Mantém rastreabilidade e permite restauração
 */
export function softDeleteEntity(
  entityType: string,
  entityId: number,
  userId: number,
  reason?: string
): AuditLog {
  return {
    id: 0, // Será preenchido pelo banco
    entityType,
    entityId,
    action: "DELETE",
    changedBy: userId,
    changedAt: new Date(),
    reason: reason || "Deletado pelo usuário",
  };
}

/**
 * Restaura entidade deletada (soft delete reversal)
 */
export function restoreEntity(
  entityType: string,
  entityId: number,
  userId: number,
  reason?: string
): AuditLog {
  return {
    id: 0,
    entityType,
    entityId,
    action: "RESTORE",
    changedBy: userId,
    changedAt: new Date(),
    reason: reason || "Restaurado pelo usuário",
  };
}

// ============================================================
// PERÍODO FECHADO - Bloquear Edições
// ============================================================

/**
 * Valida se uma data está dentro de um período fechado
 */
export function isDateInClosedPeriod(
  date: Date,
  closedPeriods: ClosedPeriod[]
): boolean {
  return closedPeriods.some(
    (period) => date >= period.startDate && date <= period.endDate
  );
}

/**
 * Valida se é permitido editar um registro
 * Regras:
 * - Não editar se data do registro está em período fechado
 * - Não editar se período atual está fechado
 */
export function canEditEntity(
  recordDate: Date,
  currentDate: Date,
  closedPeriods: ClosedPeriod[]
): { canEdit: boolean; reason?: string } {
  // Verificar se data do registro está em período fechado
  if (isDateInClosedPeriod(recordDate, closedPeriods)) {
    return {
      canEdit: false,
      reason: "Não é possível editar registros em período fechado",
    };
  }

  // Verificar se período atual está fechado
  if (isDateInClosedPeriod(currentDate, closedPeriods)) {
    return {
      canEdit: false,
      reason: "Período atual está fechado para edições",
    };
  }

  return { canEdit: true };
}

/**
 * Cria um período fechado (ex: mês finalizado, não permite mais edições)
 */
export function createClosedPeriod(
  startDate: Date,
  endDate: Date,
  reason: string,
  userId: number
): ClosedPeriod {
  // Validar que startDate <= endDate
  if (startDate > endDate) {
    throw new Error("Data de início não pode ser maior que data de fim");
  }

  return {
    id: 0,
    startDate,
    endDate,
    reason,
    createdBy: userId,
    createdAt: new Date(),
  };
}

// ============================================================
// DUPLICAÇÃO DE PLANEJAMENTOS
// ============================================================

/**
 * Valida se um planejamento é duplicado
 * Regras:
 * - Mesma data + turno + cliente + local = duplicação
 */
export interface ScheduleConflictCheck {
  date: Date;
  shiftId: number;
  clientId: number;
  locationId: number;
}

export function isScheduleDuplicate(
  newSchedule: ScheduleConflictCheck,
  existingSchedules: ScheduleConflictCheck[]
): boolean {
  return existingSchedules.some(
    (existing) =>
      existing.date.toDateString() === newSchedule.date.toDateString() &&
      existing.shiftId === newSchedule.shiftId &&
      existing.clientId === newSchedule.clientId &&
      existing.locationId === newSchedule.locationId
  );
}

/**
 * Valida se há conflito de horário (turnos sobrepostos)
 */
export interface TimeRange {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export function doTimesOverlap(time1: TimeRange, time2: TimeRange): boolean {
  const [start1Hour, start1Min] = time1.startTime.split(":").map(Number);
  const [end1Hour, end1Min] = time1.endTime.split(":").map(Number);
  const [start2Hour, start2Min] = time2.startTime.split(":").map(Number);
  const [end2Hour, end2Min] = time2.endTime.split(":").map(Number);

  const start1 = start1Hour * 60 + start1Min;
  const end1 = end1Hour * 60 + end1Min;
  const start2 = start2Hour * 60 + start2Min;
  const end2 = end2Hour * 60 + end2Min;

  const time1CrossesMidnight = end1 < start1;
  const time2CrossesMidnight = end2 < start2;

  // Ambos cruzam meia-noite: sempre sobrepõem (ambos cobrem madrugada)
  if (time1CrossesMidnight && time2CrossesMidnight) {
    return true;
  }

  // time1 cruza meia-noite, time2 não
  if (time1CrossesMidnight && !time2CrossesMidnight) {
    // time1: 22:00-07:00 (noturno), time2: 08:00-17:00 (diurno)
    // Sobrepõem se: time2 começa antes de time1 terminar (end1) OU time2 termina depois de time1 começar (start1)
    // Não sobrepõem se: time2 termina antes de time1 começar (end2 <= start1) E time2 começa depois de time1 terminar (start2 >= end1)
    return !(end2 <= end1 || start2 >= start1);
  }

  // time2 cruza meia-noite, time1 não
  if (!time1CrossesMidnight && time2CrossesMidnight) {
    // time1: 08:00-17:00 (diurno), time2: 22:00-07:00 (noturno)
    // Sobrepõem se: time1 começa antes de time2 terminar (end2) OU time1 termina depois de time2 começar (start2)
    return !(end1 <= end2 || start1 >= start2);
  }

  // Ambos no mesmo dia (nenhum cruza meia-noite)
  return !(end1 <= start2 || end2 <= start1);
}

// ============================================================
// RASTREABILIDADE - Audit Log
// ============================================================

/**
 * Cria log de auditoria para criação de entidade
 */
export function createAuditLogForCreate(
  entityType: string,
  entityId: number,
  userId: number,
  newValues: Record<string, unknown>
): AuditLog {
  return {
    id: 0,
    entityType,
    entityId,
    action: "CREATE",
    changedBy: userId,
    changedAt: new Date(),
    newValues,
  };
}

/**
 * Cria log de auditoria para atualização de entidade
 */
export function createAuditLogForUpdate(
  entityType: string,
  entityId: number,
  userId: number,
  previousValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): AuditLog {
  return {
    id: 0,
    entityType,
    entityId,
    action: "UPDATE",
    changedBy: userId,
    changedAt: new Date(),
    previousValues,
    newValues,
  };
}

/**
 * Filtra campos sensíveis que não devem ser registrados
 */
export function sanitizeAuditValues(
  values: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveFields = ["password", "token", "secret", "apiKey"];
  const sanitized = { ...values };

  sensitiveFields.forEach((field) => {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
}

// ============================================================
// VALIDAÇÃO DE INTEGRIDADE
// ============================================================

/**
 * Valida integridade de dados antes de persistir
 */
export interface IntegrityCheckResult {
  isValid: boolean;
  errors: string[];
}

export function validateDataIntegrity(
  entityType: string,
  data: Record<string, unknown>
): IntegrityCheckResult {
  const errors: string[] = [];

  // Validações genéricas
  if (!data.createdAt) {
    errors.push("createdAt é obrigatório");
  }

  if (!data.updatedAt) {
    errors.push("updatedAt é obrigatório");
  }

  // Validações específicas por tipo
  if (entityType === "schedule") {
    if (!data.date) errors.push("date é obrigatório para schedule");
    if (!data.shiftId) errors.push("shiftId é obrigatório para schedule");
    if (!data.clientId) errors.push("clientId é obrigatório para schedule");
    if (!data.locationId) errors.push("locationId é obrigatório para schedule");
  }

  if (entityType === "employee") {
    if (!data.cpf) errors.push("cpf é obrigatório para employee");
    if (!data.name) errors.push("name é obrigatório para employee");
  }

  if (entityType === "client") {
    if (!data.cnpj) errors.push("cnpj é obrigatório para client");
    if (!data.name) errors.push("name é obrigatório para client");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================
// CASCATA DE DELETAÇÃO
// ============================================================

/**
 * Define dependências entre entidades para cascata
 */
export const ENTITY_DEPENDENCIES: Record<string, string[]> = {
  client: ["client_units", "client_functions", "schedules"],
  client_unit: ["schedules"],
  client_function: ["shift_exceptions", "schedule_functions"],
  shift: ["schedules", "shift_exceptions"],
  employee: ["schedule_allocations", "payments"],
  schedule: ["schedule_functions", "schedule_allocations"],
};

/**
 * Valida se entidade pode ser deletada (sem dependências ativas)
 */
export function canDeleteWithoutDependencies(
  entityType: string,
  dependentCounts: Record<string, number>
): { canDelete: boolean; reason?: string } {
  const dependencies = ENTITY_DEPENDENCIES[entityType] || [];

  for (const dep of dependencies) {
    if ((dependentCounts[dep] || 0) > 0) {
      return {
        canDelete: false,
        reason: `Não é possível deletar: existem ${dependentCounts[dep]} registros dependentes em ${dep}`,
      };
    }
  }

  return { canDelete: true };
}

// ============================================================
// VALIDAÇÃO DE PERÍODO
// ============================================================

/**
 * Valida se uma data está dentro de um intervalo
 */
export function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date
): boolean {
  return date >= startDate && date <= endDate;
}

/**
 * Calcula dias entre duas datas (útil para cálculos de pagamento)
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Valida se período é válido (startDate <= endDate)
 */
export function isValidPeriod(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate;
}
