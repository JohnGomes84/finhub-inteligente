import { PaymentRecord } from "./payment-generation";

/**
 * Formata registros de pagamento para exportação em Excel (CSV)
 * Formato: Funcionário, CPF, PIX, Valor Base, Marmita, Vale, Bônus, Total a Pagar
 */
export function formatPaymentRecordsForExcel(records: PaymentRecord[]): string {
  const headers = [
    "Funcionário",
    "CPF",
    "PIX",
    "Tipo PIX",
    "Valor Base",
    "Marmita",
    "Vale",
    "Bônus",
    "Total a Pagar",
    "Status",
  ];

  const rows = records.map((record) => [
    `"Funcionário ${record.employeeId}"`, // Mock: será substituído por nome real
    '"123.456.789-00"', // Mock: será substituído por CPF real
    record.pixKey ? `"${record.pixKey}"` : '""',
    record.pixType || "",
    record.baseValue.toFixed(2),
    record.mealAllowance.toFixed(2),
    record.voucher.toFixed(2),
    record.bonus.toFixed(2),
    record.totalToPay.toFixed(2),
    record.status,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Formata registros de pagamento para exportação em CNAB (Transferência Bancária)
 * Formato simplificado: Banco, Agência, Conta, PIX, Valor
 */
export function formatPaymentRecordsForCNAB(records: PaymentRecord[]): string {
  const lines = records
    .filter((r) => r.status === "pending" && r.pixKey)
    .map((record) => {
      // Formato CNAB simplificado
      return `${record.employeeId}|${record.pixKey}|${record.totalToPay.toFixed(2)}|${record.period}`;
    });

  return lines.join("\n");
}

/**
 * Cria um lote de pagamento com informações consolidadas
 */
export interface PaymentBatch {
  id: string;
  period: string;
  createdAt: Date;
  totalRecords: number;
  totalAmount: number;
  totalEmployees: number;
  noPix: number;
  status: "draft" | "pending" | "processing" | "completed" | "failed";
}

export function createPaymentBatch(records: PaymentRecord[]): PaymentBatch {
  const uniqueEmployees = new Set(records.map((r) => r.employeeId));
  const noPix = records.filter((r) => r.status === "no_pix").length;
  const totalAmount = records.reduce((sum, r) => sum + r.totalToPay, 0);

  return {
    id: `BATCH-${Date.now()}`,
    period: records[0]?.period || new Date().toISOString().slice(0, 7),
    createdAt: new Date(),
    totalRecords: records.length,
    totalAmount,
    totalEmployees: uniqueEmployees.size,
    noPix,
    status: "draft",
  };
}

/**
 * Marca um lote como pago
 */
export function markBatchAsPaid(batch: PaymentBatch): PaymentBatch {
  return {
    ...batch,
    status: "completed",
  };
}

/**
 * Gera relatório de resumo de pagamento
 */
export interface PaymentSummary {
  period: string;
  totalToPay: number;
  totalEmployees: number;
  totalDaysWorked: number;
  noPix: number;
  averagePayPerEmployee: number;
  averagePayPerDay: number;
}

export function generatePaymentSummary(records: PaymentRecord[]): PaymentSummary {
  const uniqueEmployees = new Set(records.map((r) => r.employeeId));
  const totalToPay = records.reduce((sum, r) => sum + r.totalToPay, 0);
  const totalDaysWorked = records.reduce((sum, r) => sum + r.daysWorked, 0);
  const noPix = records.filter((r) => r.status === "no_pix").length;

  return {
    period: records[0]?.period || new Date().toISOString().slice(0, 7),
    totalToPay,
    totalEmployees: uniqueEmployees.size,
    totalDaysWorked,
    noPix,
    averagePayPerEmployee: totalToPay / uniqueEmployees.size,
    averagePayPerDay: totalToPay / totalDaysWorked,
  };
}

/**
 * Gera PDF de ordem de serviço (mock)
 * Em produção, usar biblioteca como pdfkit ou reportlab
 */
export function generateOrderOfServicePDF(
  clientName: string,
  date: Date,
  totalValue: number,
  description: string
): string {
  // Mock: retorna conteúdo que seria um PDF
  const content = `
ORDEM DE SERVIÇO

Cliente: ${clientName}
Data: ${date.toLocaleDateString("pt-BR")}
Descrição: ${description}
Valor Total: R$ ${totalValue.toFixed(2)}

Gerado em: ${new Date().toLocaleString("pt-BR")}
  `.trim();

  return content;
}

/**
 * Valida se um lote pode ser processado
 */
export function validateBatchForProcessing(batch: PaymentBatch, records: PaymentRecord[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (batch.status !== "draft") {
    errors.push("Lote não está em rascunho");
  }

  if (records.length === 0) {
    errors.push("Lote não tem registros");
  }

  const noPix = records.filter((r) => r.status === "no_pix");
  if (noPix.length > 0) {
    errors.push(`${noPix.length} funcionário(s) sem PIX cadastrado`);
  }

  if (batch.totalAmount <= 0) {
    errors.push("Valor total deve ser maior que zero");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
