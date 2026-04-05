/**
 * Testes para Regras de Integridade
 * Valida soft delete, período fechado, duplicação, rastreabilidade
 */

import { describe, it, expect } from "vitest";
import {
  canDeleteEntity,
  isDateInClosedPeriod,
  canEditEntity,
  isScheduleDuplicate,
  doTimesOverlap,
  createAuditLogForCreate,
  createAuditLogForUpdate,
  sanitizeAuditValues,
  validateDataIntegrity,
  canDeleteWithoutDependencies,
  isDateInRange,
  daysBetween,
  isValidPeriod,
} from "./integrity-rules";

// ============================================================
// TESTES: Soft Delete
// ============================================================

describe("canDeleteEntity", () => {
  it("deve permitir deletar fora de período fechado", () => {
    const result = canDeleteEntity("schedule", 1, new Date("2026-04-05"), []);
    expect(result.canDelete).toBe(true);
  });

  it("deve bloquear deletar dentro de período fechado", () => {
    const closedPeriods = [
      {
        id: 1,
        startDate: new Date("2026-04-01"),
        endDate: new Date("2026-04-30"),
        reason: "Mês fechado",
        createdBy: 1,
        createdAt: new Date(),
      },
    ];

    const result = canDeleteEntity("schedule", 1, new Date("2026-04-15"), closedPeriods);
    expect(result.canDelete).toBe(false);
    expect(result.reason).toContain("período fechado");
  });
});

// ============================================================
// TESTES: Período Fechado
// ============================================================

describe("isDateInClosedPeriod", () => {
  const closedPeriods = [
    {
      id: 1,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-30"),
      reason: "Abril fechado",
      createdBy: 1,
      createdAt: new Date(),
    },
  ];

  it("deve detectar data dentro de período fechado", () => {
    expect(isDateInClosedPeriod(new Date("2026-04-15"), closedPeriods)).toBe(true);
  });

  it("deve detectar data na data de início", () => {
    expect(isDateInClosedPeriod(new Date("2026-04-01"), closedPeriods)).toBe(true);
  });

  it("deve detectar data na data de fim", () => {
    expect(isDateInClosedPeriod(new Date("2026-04-30"), closedPeriods)).toBe(true);
  });

  it("deve rejeitar data fora de período fechado", () => {
    expect(isDateInClosedPeriod(new Date("2026-05-01"), closedPeriods)).toBe(false);
  });
});

describe("canEditEntity", () => {
  const closedPeriods = [
    {
      id: 1,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-30"),
      reason: "Abril fechado",
      createdBy: 1,
      createdAt: new Date(),
    },
  ];

  it("deve permitir editar fora de período fechado", () => {
    const result = canEditEntity(
      new Date("2026-05-01"),
      new Date("2026-05-05"),
      closedPeriods
    );
    expect(result.canEdit).toBe(true);
  });

  it("deve bloquear editar se registro está em período fechado", () => {
    const result = canEditEntity(
      new Date("2026-04-15"),
      new Date("2026-05-05"),
      closedPeriods
    );
    expect(result.canEdit).toBe(false);
  });

  it("deve bloquear editar se período atual está fechado", () => {
    const result = canEditEntity(
      new Date("2026-05-01"),
      new Date("2026-04-15"),
      closedPeriods
    );
    expect(result.canEdit).toBe(false);
  });
});

// ============================================================
// TESTES: Duplicação de Planejamentos
// ============================================================

describe("isScheduleDuplicate", () => {
  const existingSchedules = [
    {
      date: new Date("2026-04-05"),
      shiftId: 1,
      clientId: 1,
      locationId: 1,
    },
  ];

  it("deve detectar duplicação exata", () => {
    const newSchedule = {
      date: new Date("2026-04-05"),
      shiftId: 1,
      clientId: 1,
      locationId: 1,
    };

    expect(isScheduleDuplicate(newSchedule, existingSchedules)).toBe(true);
  });

  it("deve permitir mesmo cliente/local com turno diferente", () => {
    const newSchedule = {
      date: new Date("2026-04-05"),
      shiftId: 2, // Turno diferente
      clientId: 1,
      locationId: 1,
    };

    expect(isScheduleDuplicate(newSchedule, existingSchedules)).toBe(false);
  });

  it("deve permitir mesmo cliente/turno com local diferente", () => {
    const newSchedule = {
      date: new Date("2026-04-05"),
      shiftId: 1,
      clientId: 1,
      locationId: 2, // Local diferente
    };

    expect(isScheduleDuplicate(newSchedule, existingSchedules)).toBe(false);
  });

  it("deve permitir mesma data/turno/local com cliente diferente", () => {
    const newSchedule = {
      date: new Date("2026-04-05"),
      shiftId: 1,
      clientId: 2, // Cliente diferente
      locationId: 1,
    };

    expect(isScheduleDuplicate(newSchedule, existingSchedules)).toBe(false);
  });
});

// ============================================================
// TESTES: Sobreposição de Horários
// ============================================================

describe("doTimesOverlap", () => {
  it("deve detectar sobreposição: 06:00-15:00 vs 14:00-23:00", () => {
    const time1 = { startTime: "06:00", endTime: "15:00" };
    const time2 = { startTime: "14:00", endTime: "23:00" };
    expect(doTimesOverlap(time1, time2)).toBe(true);
  });

  it("deve detectar sobreposição: 06:00-15:00 vs 16:00-01:00 (time2 cruza meia-noite)", () => {
    const time1 = { startTime: "06:00", endTime: "15:00" };
    const time2 = { startTime: "16:00", endTime: "01:00" }; // Cruza meia-noite, sobrepõe 06:00-01:00
    expect(doTimesOverlap(time1, time2)).toBe(true);
  });

  it("deve detectar sobreposição com virada de meia-noite: 22:00-07:00 vs 06:00-15:00", () => {
    const time1 = { startTime: "22:00", endTime: "07:00" };
    const time2 = { startTime: "06:00", endTime: "15:00" };
    expect(doTimesOverlap(time1, time2)).toBe(true);
  });

  it("deve detectar sobreposição: 22:00-07:00 vs 08:00-17:00 (ambos cobrem madrugada)", () => {
    const time1 = { startTime: "22:00", endTime: "07:00" }; // 22:00-07:00 (noturno)
    const time2 = { startTime: "08:00", endTime: "17:00" }; // 08:00-17:00 (diurno, mas começa antes de time1 terminar)
    // Sobrepõem: time2 começa às 08:00, time1 termina às 07:00, ambos cobrem a madrugada (00:00-07:00)
    expect(doTimesOverlap(time1, time2)).toBe(true);
  });

  it("deve detectar sobreposição exata", () => {
    const time1 = { startTime: "06:00", endTime: "15:00" };
    const time2 = { startTime: "06:00", endTime: "15:00" };
    expect(doTimesOverlap(time1, time2)).toBe(true);
  });

  it("deve detectar sem sobreposição: 06:00-15:00 vs 15:00-23:00", () => {
    const time1 = { startTime: "06:00", endTime: "15:00" };
    const time2 = { startTime: "15:00", endTime: "23:00" }; // Começa exatamente quando o outro termina
    expect(doTimesOverlap(time1, time2)).toBe(false);
  });
});

// ============================================================
// TESTES: Audit Log
// ============================================================

describe("createAuditLogForCreate", () => {
  it("deve criar log de auditoria para criação", () => {
    const log = createAuditLogForCreate(
      "schedule",
      1,
      1,
      { date: "2026-04-05", shiftId: 1 }
    );

    expect(log.entityType).toBe("schedule");
    expect(log.entityId).toBe(1);
    expect(log.action).toBe("CREATE");
    expect(log.changedBy).toBe(1);
    expect(log.newValues).toEqual({ date: "2026-04-05", shiftId: 1 });
  });
});

describe("createAuditLogForUpdate", () => {
  it("deve criar log de auditoria para atualização", () => {
    const log = createAuditLogForUpdate(
      "schedule",
      1,
      1,
      { status: "pending" },
      { status: "validated" }
    );

    expect(log.entityType).toBe("schedule");
    expect(log.action).toBe("UPDATE");
    expect(log.previousValues).toEqual({ status: "pending" });
    expect(log.newValues).toEqual({ status: "validated" });
  });
});

describe("sanitizeAuditValues", () => {
  it("deve remover campos sensíveis", () => {
    const values = {
      name: "John",
      password: "secret123",
      email: "john@example.com",
      apiKey: "key123",
    };

    const sanitized = sanitizeAuditValues(values);
    expect(sanitized.name).toBe("John");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.email).toBe("john@example.com");
    expect(sanitized.apiKey).toBe("[REDACTED]");
  });
});

// ============================================================
// TESTES: Validação de Integridade
// ============================================================

describe("validateDataIntegrity", () => {
  it("deve validar schedule com dados completos", () => {
    const data = {
      date: new Date("2026-04-05"),
      shiftId: 1,
      clientId: 1,
      locationId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = validateDataIntegrity("schedule", data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("deve rejeitar schedule sem campos obrigatórios", () => {
    const data = {
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = validateDataIntegrity("schedule", data);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("deve validar employee com dados completos", () => {
    const data = {
      cpf: "12345678909",
      name: "John Doe",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = validateDataIntegrity("employee", data);
    expect(result.isValid).toBe(true);
  });
});

// ============================================================
// TESTES: Cascata de Deletação
// ============================================================

describe("canDeleteWithoutDependencies", () => {
  it("deve permitir deletar sem dependências", () => {
    const result = canDeleteWithoutDependencies("client", {
      client_units: 0,
      client_functions: 0,
      schedules: 0,
    });

    expect(result.canDelete).toBe(true);
  });

  it("deve bloquear deletar com dependências", () => {
    const result = canDeleteWithoutDependencies("client", {
      client_units: 0,
      client_functions: 0,
      schedules: 5, // 5 planejamentos dependentes
    });

    expect(result.canDelete).toBe(false);
    expect(result.reason).toContain("5 registros dependentes");
  });
});

// ============================================================
// TESTES: Validação de Período
// ============================================================

describe("isDateInRange", () => {
  it("deve detectar data dentro de intervalo", () => {
    expect(
      isDateInRange(
        new Date("2026-04-15"),
        new Date("2026-04-01"),
        new Date("2026-04-30")
      )
    ).toBe(true);
  });

  it("deve detectar data na data de início", () => {
    expect(
      isDateInRange(
        new Date("2026-04-01"),
        new Date("2026-04-01"),
        new Date("2026-04-30")
      )
    ).toBe(true);
  });

  it("deve rejeitar data fora de intervalo", () => {
    expect(
      isDateInRange(
        new Date("2026-05-01"),
        new Date("2026-04-01"),
        new Date("2026-04-30")
      )
    ).toBe(false);
  });
});

describe("daysBetween", () => {
  it("deve calcular dias entre datas", () => {
    const days = daysBetween(new Date("2026-04-01"), new Date("2026-04-05"));
    expect(days).toBe(4);
  });

  it("deve calcular 0 dias para mesma data", () => {
    const days = daysBetween(new Date("2026-04-05"), new Date("2026-04-05"));
    expect(days).toBe(0);
  });

  it("deve calcular 30 dias para mês completo", () => {
    const days = daysBetween(new Date("2026-04-01"), new Date("2026-05-01"));
    expect(days).toBe(30);
  });
});

describe("isValidPeriod", () => {
  it("deve validar período válido", () => {
    expect(
      isValidPeriod(new Date("2026-04-01"), new Date("2026-04-30"))
    ).toBe(true);
  });

  it("deve validar período com mesma data", () => {
    expect(isValidPeriod(new Date("2026-04-05"), new Date("2026-04-05"))).toBe(
      true
    );
  });

  it("deve rejeitar período inválido", () => {
    expect(
      isValidPeriod(new Date("2026-04-30"), new Date("2026-04-01"))
    ).toBe(false);
  });
});
