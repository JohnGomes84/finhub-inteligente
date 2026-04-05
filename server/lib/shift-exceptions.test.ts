/**
 * Testes para Exceções de Turno Noturno
 * Valida cálculos de valores diferenciados em turnos noturnos
 */

import { describe, it, expect } from "vitest";
import {
  applyShiftExceptionMultiplier,
  calculateValuesWithException,
} from "./shift-exceptions";

// ============================================================
// TESTES: Aplicar Multiplicador de Exceção
// ============================================================

describe("applyShiftExceptionMultiplier", () => {
  it("deve aplicar multiplicador corretamente", () => {
    // 100 × 1.5 = 150
    expect(applyShiftExceptionMultiplier(100, 1.5)).toBe(150);
  });

  it("deve aplicar multiplicador com strings", () => {
    // "100.50" × "1.5" = 150.75
    expect(applyShiftExceptionMultiplier("100.50", "1.5")).toBe(150.75);
  });

  it("deve aplicar multiplicador 2x (turno dobrado)", () => {
    // 100 × 2 = 200
    expect(applyShiftExceptionMultiplier(100, 2)).toBe(200);
  });

  it("deve aplicar multiplicador 1.25 (25% adicional)", () => {
    // 100 × 1.25 = 125
    expect(applyShiftExceptionMultiplier(100, 1.25)).toBe(125);
  });

  it("deve retornar valor base se multiplicador for 1", () => {
    // 100 × 1 = 100 (sem exceção)
    expect(applyShiftExceptionMultiplier(100, 1)).toBe(100);
  });

  it("deve retornar valor base se multiplicador for inválido", () => {
    // NaN × 1.5 = NaN, retorna base
    expect(applyShiftExceptionMultiplier(NaN, 1.5)).toBeNaN();
  });
});

// ============================================================
// TESTES: Calcular Valores com Exceção
// ============================================================

describe("calculateValuesWithException", () => {
  it("deve retornar valores base se não houver exceção", () => {
    const result = calculateValuesWithException(100, 150, null);
    expect(result.payValue).toBe(100);
    expect(result.receiveValue).toBe(150);
  });

  it("deve aplicar multiplicadores de exceção", () => {
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 9, // MLT-9: Turno noturno
      exceptionType: "NIGHT_SHIFT" as const,
      payMultiplier: 1.5, // 50% adicional
      receiveMultiplier: 1.3, // 30% adicional
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = calculateValuesWithException(100, 150, exception);
    expect(result.payValue).toBe(150); // 100 × 1.5
    expect(result.receiveValue).toBe(195); // 150 × 1.3
  });

  it("deve aplicar multiplicadores com strings", () => {
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 9,
      exceptionType: "NIGHT_SHIFT" as const,
      payMultiplier: 1.5,
      receiveMultiplier: 1.3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = calculateValuesWithException("100.50", "150.75", exception);
    expect(result.payValue).toBe(150.75); // 100.50 × 1.5
    expect(result.receiveValue).toBeCloseTo(195.975); // 150.75 × 1.3
  });

  it("deve calcular corretamente para turno dobrado (2x)", () => {
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 13, // MLT-13: Turno noturno especial
      exceptionType: "HOLIDAY" as const,
      payMultiplier: 2, // Dobro
      receiveMultiplier: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = calculateValuesWithException(100, 150, exception);
    expect(result.payValue).toBe(200); // 100 × 2
    expect(result.receiveValue).toBe(300); // 150 × 2
  });

  it("deve calcular corretamente para fim de semana (1.5x)", () => {
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 1,
      exceptionType: "WEEKEND" as const,
      payMultiplier: 1.5,
      receiveMultiplier: 1.5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = calculateValuesWithException(100, 150, exception);
    expect(result.payValue).toBe(150); // 100 × 1.5
    expect(result.receiveValue).toBe(225); // 150 × 1.5
  });

  it("deve manter proporção de margem com exceção", () => {
    // Sem exceção: margem = 150 - 100 = 50
    const resultWithout = calculateValuesWithException(100, 150, null);
    const marginWithout = resultWithout.receiveValue - resultWithout.payValue;

    // Com exceção 1.5x: margem = 225 - 150 = 75 (proporção mantida)
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 9,
      exceptionType: "NIGHT_SHIFT" as const,
      payMultiplier: 1.5,
      receiveMultiplier: 1.5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const resultWith = calculateValuesWithException(100, 150, exception);
    const marginWith = resultWith.receiveValue - resultWith.payValue;

    // Margem deve ser proporcional (50 × 1.5 = 75)
    expect(marginWith).toBe(marginWithout * 1.5);
  });

  it("deve permitir multiplicadores diferentes para paga e recebe", () => {
    // Caso real: empresa paga 50% a mais, mas recebe apenas 30% a mais
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 9,
      exceptionType: "NIGHT_SHIFT" as const,
      payMultiplier: 1.5, // Paga 50% a mais
      receiveMultiplier: 1.3, // Recebe 30% a mais
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = calculateValuesWithException(100, 150, exception);
    expect(result.payValue).toBe(150); // 100 × 1.5
    expect(result.receiveValue).toBe(195); // 150 × 1.3

    // Margem reduz: de 50 para 45 (195 - 150)
    const margin = result.receiveValue - result.payValue;
    expect(margin).toBe(45);
  });
});

// ============================================================
// TESTES: Casos de Uso Reais
// ============================================================

describe("Casos de Uso Reais - Exceções de Turno", () => {
  it("deve calcular corretamente para turno noturno MLT-9", () => {
    // Turno noturno: 22:00 - 07:00
    // Multiplicador: 1.5x (50% adicional)
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 9,
      exceptionType: "NIGHT_SHIFT" as const,
      payMultiplier: 1.5,
      receiveMultiplier: 1.5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Aux. Carga e Descarga: R$ 100 paga, R$ 150 recebe
    const result = calculateValuesWithException(100, 150, exception);
    expect(result.payValue).toBe(150); // ML paga R$ 150
    expect(result.receiveValue).toBe(225); // ML recebe R$ 225
    expect(result.receiveValue - result.payValue).toBe(75); // Margem: R$ 75
  });

  it("deve calcular corretamente para feriado (dobro)", () => {
    // Feriado: 2x (100% adicional)
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 1,
      exceptionType: "HOLIDAY" as const,
      payMultiplier: 2,
      receiveMultiplier: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Conferente: R$ 120 paga, R$ 200 recebe
    const result = calculateValuesWithException(120, 200, exception);
    expect(result.payValue).toBe(240); // ML paga R$ 240
    expect(result.receiveValue).toBe(400); // ML recebe R$ 400
    expect(result.receiveValue - result.payValue).toBe(160); // Margem: R$ 160
  });

  it("deve calcular corretamente para fim de semana (1.5x)", () => {
    // Fim de semana: 1.5x (50% adicional)
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 1,
      exceptionType: "WEEKEND" as const,
      payMultiplier: 1.5,
      receiveMultiplier: 1.5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Supervisor: R$ 180 paga, R$ 300 recebe
    const result = calculateValuesWithException(180, 300, exception);
    expect(result.payValue).toBe(270); // ML paga R$ 270
    expect(result.receiveValue).toBe(450); // ML recebe R$ 450
    expect(result.receiveValue - result.payValue).toBe(180); // Margem: R$ 180
  });

  it("deve calcular corretamente para turno noturno com multiplicadores diferentes", () => {
    // Turno noturno: ML paga 50%, ML recebe 30%
    const exception = {
      id: 1,
      clientFunctionId: 1,
      shiftId: 9,
      exceptionType: "NIGHT_SHIFT" as const,
      payMultiplier: 1.5,
      receiveMultiplier: 1.3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Aux. Carga: R$ 100 paga, R$ 150 recebe
    const result = calculateValuesWithException(100, 150, exception);
    expect(result.payValue).toBe(150); // ML paga R$ 150
    expect(result.receiveValue).toBe(195); // ML recebe R$ 195
    expect(result.receiveValue - result.payValue).toBe(45); // Margem: R$ 45 (reduzida)
  });
});
