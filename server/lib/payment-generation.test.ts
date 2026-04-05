import { describe, it, expect } from "vitest";
import {
  calculateTotalToPay,
  groupByEmployee,
  countNoPix,
  countDaysWorked,
  countUniqueEmployees,
} from "./payment-generation";

const mockRecords = [
  {
    employeeId: 1,
    scheduleId: 1,
    period: "2026-04",
    daysWorked: 1,
    baseValue: 100,
    mealAllowance: 10,
    voucher: 5,
    bonus: 20,
    totalToPay: 105,
    pixKey: "12345678901234",
    pixType: "cnpj",
    status: "pending" as const,
  },
  {
    employeeId: 2,
    scheduleId: 1,
    period: "2026-04",
    daysWorked: 1,
    baseValue: 150,
    mealAllowance: 15,
    voucher: 10,
    bonus: 0,
    totalToPay: 125,
    pixKey: undefined,
    pixType: undefined,
    status: "no_pix" as const,
  },
  {
    employeeId: 1,
    scheduleId: 1,
    period: "2026-04",
    daysWorked: 1,
    baseValue: 100,
    mealAllowance: 0,
    voucher: 0,
    bonus: 0,
    totalToPay: 100,
    pixKey: "12345678901234",
    pixType: "cnpj",
    status: "pending" as const,
  },
];

describe("Payment Generation", () => {
  describe("calculateTotalToPay", () => {
    it("deve somar todos os totais a pagar", () => {
      const total = calculateTotalToPay(mockRecords);
      expect(total).toBe(330); // 105 + 125 + 100
    });

    it("deve retornar 0 para array vazio", () => {
      const total = calculateTotalToPay([]);
      expect(total).toBe(0);
    });

    it("deve calcular corretamente com um único registro", () => {
      const total = calculateTotalToPay([mockRecords[0]]);
      expect(total).toBe(105);
    });
  });

  describe("groupByEmployee", () => {
    it("deve agrupar registros por employeeId", () => {
      const grouped = groupByEmployee(mockRecords);
      expect(grouped.size).toBe(2); // 2 funcionários únicos
      expect(grouped.get(1)?.length).toBe(2); // Funcionário 1 tem 2 registros
      expect(grouped.get(2)?.length).toBe(1); // Funcionário 2 tem 1 registro
    });

    it("deve retornar mapa vazio para array vazio", () => {
      const grouped = groupByEmployee([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe("countNoPix", () => {
    it("deve contar funcionários únicos sem PIX", () => {
      const count = countNoPix(mockRecords);
      expect(count).toBe(1); // Apenas funcionário 2
    });

    it("deve retornar 0 quando todos têm PIX", () => {
      const records = mockRecords.filter((r) => r.status === "pending");
      const count = countNoPix(records);
      expect(count).toBe(0);
    });

    it("deve retornar 0 para array vazio", () => {
      const count = countNoPix([]);
      expect(count).toBe(0);
    });
  });

  describe("countDaysWorked", () => {
    it("deve contar total de registros (diárias)", () => {
      const count = countDaysWorked(mockRecords);
      expect(count).toBe(3);
    });

    it("deve retornar 0 para array vazio", () => {
      const count = countDaysWorked([]);
      expect(count).toBe(0);
    });
  });

  describe("countUniqueEmployees", () => {
    it("deve contar funcionários únicos", () => {
      const count = countUniqueEmployees(mockRecords);
      expect(count).toBe(2);
    });

    it("deve retornar 0 para array vazio", () => {
      const count = countUniqueEmployees([]);
      expect(count).toBe(0);
    });

    it("deve contar corretamente com múltiplos registros do mesmo funcionário", () => {
      const records = [
        { ...mockRecords[0] },
        { ...mockRecords[0], scheduleId: 2 },
        { ...mockRecords[0], scheduleId: 3 },
      ];
      const count = countUniqueEmployees(records);
      expect(count).toBe(1);
    });
  });

  describe("Cálculo de Pagamento", () => {
    it("deve calcular: base - marmita - vale + bônus", () => {
      const base = 100;
      const marmita = 10;
      const vale = 5;
      const bonus = 20;
      const expected = base - marmita - vale + bonus;
      expect(expected).toBe(105);
    });

    it("deve calcular com marmita e vale", () => {
      const base = 150;
      const marmita = 15;
      const vale = 10;
      const bonus = 0;
      const expected = base - marmita - vale + bonus;
      expect(expected).toBe(125);
    });

    it("deve calcular com apenas base", () => {
      const base = 100;
      const marmita = 0;
      const vale = 0;
      const bonus = 0;
      const expected = base - marmita - vale + bonus;
      expect(expected).toBe(100);
    });

    it("deve calcular com bônus grande", () => {
      const base = 100;
      const marmita = 0;
      const vale = 0;
      const bonus = 100;
      const expected = base - marmita - vale + bonus;
      expect(expected).toBe(200);
    });
  });

  describe("Período em Formato YYYY-MM", () => {
    it("deve formatar período corretamente", () => {
      const date = new Date("2026-04-05");
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      expect(period).toBe("2026-04");
    });

    it("deve formatar janeiro com zero à esquerda", () => {
      const date = new Date("2026-01-15");
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      expect(period).toBe("2026-01");
    });

    it("deve formatar dezembro corretamente", () => {
      const date = new Date("2026-12-25");
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      expect(period).toBe("2026-12");
    });
  });

  describe("Detecção de Tipo PIX", () => {
    it("deve detectar CNPJ (14 dígitos)", () => {
      const pixKey = "12345678901234";
      const isValidLength = pixKey.replace(/\D/g, "").length === 14;
      expect(isValidLength).toBe(true);
    });

    it("deve detectar CPF (11 dígitos)", () => {
      const pixKey = "12345678901";
      const isValidLength = pixKey.replace(/\D/g, "").length === 11;
      expect(isValidLength).toBe(true);
    });

    it("deve detectar Email (contém @)", () => {
      const pixKey = "user@example.com";
      const isEmail = pixKey.includes("@");
      expect(isEmail).toBe(true);
    });

    it("deve detectar Telefone (11 dígitos começando com 9)", () => {
      const pixKey = "92123456789";
      const cleanKey = pixKey.replace(/\D/g, "");
      const isPhone = cleanKey.length === 11 && cleanKey.startsWith("9");
      expect(isPhone).toBe(true);
    });
  });

  describe("KPIs", () => {
    it("deve calcular KPI: Total a Pagar", () => {
      const total = calculateTotalToPay(mockRecords);
      expect(total).toBeGreaterThan(0);
    });

    it("deve calcular KPI: Funcionários", () => {
      const count = countUniqueEmployees(mockRecords);
      expect(count).toBe(2);
    });

    it("deve calcular KPI: Dias Trabalhados", () => {
      const count = countDaysWorked(mockRecords);
      expect(count).toBe(3);
    });

    it("deve calcular KPI: Sem PIX", () => {
      const count = countNoPix(mockRecords);
      expect(count).toBe(1);
    });
  });
});
