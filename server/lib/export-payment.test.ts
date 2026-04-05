import { describe, it, expect } from "vitest";
import {
  formatPaymentRecordsForExcel,
  formatPaymentRecordsForCNAB,
  createPaymentBatch,
  markBatchAsPaid,
  generatePaymentSummary,
  generateOrderOfServicePDF,
  validateBatchForProcessing,
} from "./export-payment";

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
];

describe("Export Payment", () => {
  describe("formatPaymentRecordsForExcel", () => {
    it("deve gerar CSV com headers", () => {
      const csv = formatPaymentRecordsForExcel(mockRecords);
      expect(csv).toContain("Funcionário");
      expect(csv).toContain("CPF");
      expect(csv).toContain("PIX");
      expect(csv).toContain("Total a Pagar");
    });

    it("deve incluir todos os registros", () => {
      const csv = formatPaymentRecordsForExcel(mockRecords);
      const lines = csv.split("\n");
      expect(lines.length).toBe(3); // Header + 2 registros
    });

    it("deve formatar valores corretamente", () => {
      const csv = formatPaymentRecordsForExcel(mockRecords);
      expect(csv).toContain("105.00");
      expect(csv).toContain("125.00");
    });

    it("deve retornar CSV vazio para array vazio", () => {
      const csv = formatPaymentRecordsForExcel([]);
      const lines = csv.split("\n");
      expect(lines.length).toBe(1); // Apenas header
    });
  });

  describe("formatPaymentRecordsForCNAB", () => {
    it("deve gerar CNAB apenas com registros pendentes", () => {
      const cnab = formatPaymentRecordsForCNAB(mockRecords);
      const lines = cnab.split("\n").filter((l) => l.length > 0);
      expect(lines.length).toBe(1); // Apenas 1 com PIX
    });

    it("deve incluir PIX e valor", () => {
      const cnab = formatPaymentRecordsForCNAB(mockRecords);
      expect(cnab).toContain("12345678901234");
      expect(cnab).toContain("105.00");
    });

    it("deve retornar vazio para registros sem PIX", () => {
      const records = mockRecords.filter((r) => r.status === "no_pix");
      const cnab = formatPaymentRecordsForCNAB(records);
      expect(cnab).toBe("");
    });
  });

  describe("createPaymentBatch", () => {
    it("deve criar lote com dados corretos", () => {
      const batch = createPaymentBatch(mockRecords);
      expect(batch.totalRecords).toBe(2);
      expect(batch.totalAmount).toBe(230); // 105 + 125
      expect(batch.totalEmployees).toBe(2);
      expect(batch.noPix).toBe(1);
      expect(batch.status).toBe("draft");
    });

    it("deve gerar ID único", () => {
      const batch1 = createPaymentBatch(mockRecords);
      const batch2 = createPaymentBatch(mockRecords);
      await new Promise(r => setTimeout(r, 10));
      const batch2b = createPaymentBatch(mockRecords);
      expect(batch1.id).not.toBe(batch2b.id);
    });

    it("deve incluir período", () => {
      const batch = createPaymentBatch(mockRecords);
      expect(batch.period).toBe("2026-04");
    });
  });

  describe("markBatchAsPaid", () => {
    it("deve marcar lote como completed", () => {
      const batch = createPaymentBatch(mockRecords);
      const marked = markBatchAsPaid(batch);
      expect(marked.status).toBe("completed");
    });

    it("deve preservar outros dados", () => {
      const batch = createPaymentBatch(mockRecords);
      const marked = markBatchAsPaid(batch);
      expect(marked.totalAmount).toBe(batch.totalAmount);
      expect(marked.totalRecords).toBe(batch.totalRecords);
    });
  });

  describe("generatePaymentSummary", () => {
    it("deve gerar resumo correto", () => {
      const summary = generatePaymentSummary(mockRecords);
      expect(summary.totalToPay).toBe(230);
      expect(summary.totalEmployees).toBe(2);
      expect(summary.totalDaysWorked).toBe(2);
      expect(summary.noPix).toBe(1);
    });

    it("deve calcular média por funcionário", () => {
      const summary = generatePaymentSummary(mockRecords);
      expect(summary.averagePayPerEmployee).toBe(115); // 230 / 2
    });

    it("deve calcular média por dia", () => {
      const summary = generatePaymentSummary(mockRecords);
      expect(summary.averagePayPerDay).toBe(115); // 230 / 2
    });
  });

  describe("generateOrderOfServicePDF", () => {
    it("deve gerar conteúdo com dados corretos", () => {
      const pdf = generateOrderOfServicePDF("Cliente X", new Date("2026-04-05"), 1500, "Serviço");
      expect(pdf).toContain("Cliente X");
      expect(pdf).toContain("1500.00");
      expect(pdf).toContain("Serviço");
    });

    it("deve incluir data formatada", () => {
      const pdf = generateOrderOfServicePDF("Cliente X", new Date("2026-04-05"), 1500, "Serviço");
      expect(pdf).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe("validateBatchForProcessing", () => {
    it("deve validar lote correto", () => {
      const batch = createPaymentBatch(mockRecords.filter((r) => r.status === "pending"));
      const result = validateBatchForProcessing(batch, mockRecords.filter((r) => r.status === "pending"));
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("deve rejeitar lote não em rascunho", () => {
      const batch = createPaymentBatch(mockRecords);
      batch.status = "completed";
      const result = validateBatchForProcessing(batch, mockRecords);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Lote não está em rascunho");
    });

    it("deve rejeitar lote vazio", () => {
      const batch = createPaymentBatch([]);
      const result = validateBatchForProcessing(batch, []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Lote não tem registros");
    });

    it("deve alertar sobre funcionários sem PIX", () => {
      const batch = createPaymentBatch(mockRecords);
      const result = validateBatchForProcessing(batch, mockRecords);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("sem PIX");
    });
  });

  describe("Fluxo Completo de Exportação", () => {
    it("deve exportar para Excel e CNAB", () => {
      const excel = formatPaymentRecordsForExcel(mockRecords);
      const cnab = formatPaymentRecordsForCNAB(mockRecords);
      expect(excel.length).toBeGreaterThan(0);
      expect(cnab.length).toBeGreaterThan(0);
    });

    it("deve criar lote e marcar como pago", () => {
      const batch = createPaymentBatch(mockRecords);
      expect(batch.status).toBe("draft");
      const marked = markBatchAsPaid(batch);
      expect(marked.status).toBe("completed");
    });

    it("deve gerar resumo de pagamento", () => {
      const summary = generatePaymentSummary(mockRecords);
      expect(summary.period).toBe("2026-04");
      expect(summary.totalToPay).toBeGreaterThan(0);
    });
  });

  describe("Validação de Lote", () => {
    it("deve validar lote com todos os requisitos", () => {
      const validRecords = mockRecords.filter((r) => r.status === "pending");
      const batch = createPaymentBatch(validRecords);
      const result = validateBatchForProcessing(batch, validRecords);
      expect(result.isValid).toBe(true);
    });

    it("deve listar todos os erros", () => {
      const batch = createPaymentBatch(mockRecords);
      batch.status = "completed";
      const result = validateBatchForProcessing(batch, []);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
