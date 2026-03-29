import type { Express, Request, Response } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { getDb } from "../db";
import { accountsPayable, accountsReceivable } from "../../drizzle/schema";
import { desc } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { checkPermission } from "../controle/permissionControl";

// Autenticar request Express usando o mesmo SDK do tRPC
async function authenticateExpress(req: Request, res: Response): Promise<number | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "Não autenticado" });
      return null;
    }
    return user.id;
  } catch {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
}

// Formatar valor em BRL
function formatBRL(val: string | number): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num || 0);
}

// Formatar data pt-BR
function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

// Traduzir status
function translateStatus(s: string): string {
  const map: Record<string, string> = {
    pendente: "Pendente", pago: "Pago", vencido: "Vencido",
    cancelado: "Cancelado", recebido: "Recebido",
  };
  return map[s] || s;
}

// ============================================================
// EXCEL EXPORT
// ============================================================

async function generatePayableExcel(res: Response, data: any[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FinHub Inteligente - ML Serviços";
  wb.created = new Date();

  const ws = wb.addWorksheet("Contas a Pagar");

  // Cabeçalho da empresa
  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "ML SERVIÇOS ECO - Relatório de Contas a Pagar";
  titleCell.font = { bold: true, size: 14, color: { argb: "FF1A1A2E" } };
  titleCell.alignment = { horizontal: "center" };

  ws.mergeCells("A2:F2");
  const dateCell = ws.getCell("A2");
  dateCell.value = `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`;
  dateCell.font = { size: 9, italic: true, color: { argb: "FF666666" } };
  dateCell.alignment = { horizontal: "center" };

  // Linha vazia
  ws.addRow([]);

  // Cabeçalhos da tabela
  const headerRow = ws.addRow(["#", "Descrição", "Valor (R$)", "Vencimento", "Pagamento", "Status"]);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A2E" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FF333333" } } };
    cell.alignment = { horizontal: "center" };
  });

  // Larguras
  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 40;
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 14;

  // Dados
  let totalGeral = 0;
  let totalPendente = 0;
  let totalPago = 0;

  data.forEach((item, idx) => {
    const amount = parseFloat(item.amount || "0");
    totalGeral += amount;
    if (item.status === "pago") totalPago += amount;
    if (item.status === "pendente" || item.status === "vencido") totalPendente += amount;

    const row = ws.addRow([
      idx + 1,
      item.description,
      formatBRL(amount),
      formatDate(item.dueDate),
      formatDate(item.paymentDate),
      translateStatus(item.status),
    ]);
    row.getCell(3).alignment = { horizontal: "right" };
    row.getCell(4).alignment = { horizontal: "center" };
    row.getCell(5).alignment = { horizontal: "center" };
    row.getCell(6).alignment = { horizontal: "center" };

    // Cor por status
    if (item.status === "vencido") {
      row.getCell(6).font = { color: { argb: "FFDC2626" }, bold: true };
    } else if (item.status === "pago") {
      row.getCell(6).font = { color: { argb: "FF16A34A" } };
    }

    // Zebra
    if (idx % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
      });
    }
  });

  // Resumo
  ws.addRow([]);
  const summaryHeader = ws.addRow(["", "RESUMO", "", "", "", ""]);
  summaryHeader.font = { bold: true, size: 11 };
  ws.addRow(["", "Total Geral:", formatBRL(totalGeral), "", "", ""]).getCell(3).font = { bold: true };
  ws.addRow(["", "Total Pago:", formatBRL(totalPago), "", "", ""]).getCell(3).font = { color: { argb: "FF16A34A" } };
  ws.addRow(["", "Total Pendente/Vencido:", formatBRL(totalPendente), "", "", ""]).getCell(3).font = { color: { argb: "FFDC2626" } };

  // Gerar buffer
  const buffer = await wb.xlsx.writeBuffer();
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=contas_a_pagar_${new Date().toISOString().slice(0, 10)}.xlsx`);
  res.send(Buffer.from(buffer as ArrayBuffer));
}

async function generateReceivableExcel(res: Response, data: any[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FinHub Inteligente - ML Serviços";
  wb.created = new Date();

  const ws = wb.addWorksheet("Contas a Receber");

  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "ML SERVIÇOS ECO - Relatório de Contas a Receber";
  titleCell.font = { bold: true, size: 14, color: { argb: "FF1A1A2E" } };
  titleCell.alignment = { horizontal: "center" };

  ws.mergeCells("A2:F2");
  const dateCell = ws.getCell("A2");
  dateCell.value = `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`;
  dateCell.font = { size: 9, italic: true, color: { argb: "FF666666" } };
  dateCell.alignment = { horizontal: "center" };

  ws.addRow([]);

  const headerRow = ws.addRow(["#", "Descrição", "Valor (R$)", "Vencimento", "Recebimento", "Status"]);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FF333333" } } };
    cell.alignment = { horizontal: "center" };
  });

  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 40;
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 14;

  let totalGeral = 0;
  let totalPendente = 0;
  let totalRecebido = 0;

  data.forEach((item, idx) => {
    const amount = parseFloat(item.amount || "0");
    totalGeral += amount;
    if (item.status === "recebido") totalRecebido += amount;
    if (item.status === "pendente" || item.status === "vencido") totalPendente += amount;

    const row = ws.addRow([
      idx + 1,
      item.description,
      formatBRL(amount),
      formatDate(item.dueDate),
      formatDate(item.receiveDate),
      translateStatus(item.status),
    ]);
    row.getCell(3).alignment = { horizontal: "right" };
    row.getCell(4).alignment = { horizontal: "center" };
    row.getCell(5).alignment = { horizontal: "center" };
    row.getCell(6).alignment = { horizontal: "center" };

    if (item.status === "vencido") {
      row.getCell(6).font = { color: { argb: "FFDC2626" }, bold: true };
    } else if (item.status === "recebido") {
      row.getCell(6).font = { color: { argb: "FF16A34A" } };
    }

    if (idx % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
      });
    }
  });

  ws.addRow([]);
  const summaryHeader = ws.addRow(["", "RESUMO", "", "", "", ""]);
  summaryHeader.font = { bold: true, size: 11 };
  ws.addRow(["", "Total Geral:", formatBRL(totalGeral), "", "", ""]).getCell(3).font = { bold: true };
  ws.addRow(["", "Total Recebido:", formatBRL(totalRecebido), "", "", ""]).getCell(3).font = { color: { argb: "FF16A34A" } };
  ws.addRow(["", "Total Pendente/Vencido:", formatBRL(totalPendente), "", "", ""]).getCell(3).font = { color: { argb: "FFDC2626" } };

  const buffer = await wb.xlsx.writeBuffer();
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=contas_a_receber_${new Date().toISOString().slice(0, 10)}.xlsx`);
  res.send(Buffer.from(buffer as ArrayBuffer));
}

// ============================================================
// PDF EXPORT
// ============================================================

function generatePayablePDF(res: Response, data: any[]) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=contas_a_pagar_${new Date().toISOString().slice(0, 10)}.pdf`);
  doc.pipe(res);

  // Cabeçalho
  doc.fontSize(16).font("Helvetica-Bold").text("ML SERVIÇOS ECO", { align: "center" });
  doc.fontSize(12).font("Helvetica").text("Relatório de Contas a Pagar", { align: "center" });
  doc.fontSize(8).fillColor("#666666")
    .text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, { align: "center" });
  doc.moveDown(1);

  // Tabela
  const colWidths = [30, 180, 90, 80, 80, 60];
  const headers = ["#", "Descrição", "Valor (R$)", "Vencimento", "Pagamento", "Status"];
  const startX = 40;
  let y = doc.y;

  // Header row
  doc.fillColor("#1A1A2E").rect(startX, y, 520, 20).fill();
  doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
  let x = startX + 4;
  headers.forEach((h, i) => {
    doc.text(h, x, y + 5, { width: colWidths[i], align: "center" });
    x += colWidths[i];
  });
  y += 22;

  // Data rows
  let totalGeral = 0;
  let totalPago = 0;
  let totalPendente = 0;

  doc.font("Helvetica").fontSize(7).fillColor("#333333");

  data.forEach((item, idx) => {
    if (y > 760) {
      doc.addPage();
      y = 40;
    }

    const amount = parseFloat(item.amount || "0");
    totalGeral += amount;
    if (item.status === "pago") totalPago += amount;
    if (item.status === "pendente" || item.status === "vencido") totalPendente += amount;

    // Zebra
    if (idx % 2 === 1) {
      doc.fillColor("#F5F5F5").rect(startX, y, 520, 16).fill();
    }

    doc.fillColor("#333333");
    x = startX + 4;
    const rowData = [
      String(idx + 1),
      item.description?.substring(0, 40) || "",
      formatBRL(amount),
      formatDate(item.dueDate),
      formatDate(item.paymentDate),
      translateStatus(item.status),
    ];
    rowData.forEach((val, i) => {
      doc.text(val, x, y + 4, { width: colWidths[i], align: i === 2 ? "right" : "center" });
      x += colWidths[i];
    });
    y += 16;
  });

  // Resumo
  y += 10;
  if (y > 720) { doc.addPage(); y = 40; }
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#1A1A2E");
  doc.text("RESUMO", startX, y);
  y += 16;
  doc.fontSize(9).font("Helvetica").fillColor("#333333");
  doc.text(`Total Geral: ${formatBRL(totalGeral)}`, startX, y); y += 14;
  doc.fillColor("#16A34A").text(`Total Pago: ${formatBRL(totalPago)}`, startX, y); y += 14;
  doc.fillColor("#DC2626").text(`Total Pendente/Vencido: ${formatBRL(totalPendente)}`, startX, y);

  // Rodapé
  doc.fontSize(7).fillColor("#999999");
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    doc.text(
      `FinHub Inteligente - ML Serviços | www.mlservicoseco.com.br | Página ${i + 1} de ${pages.count}`,
      40, 800, { align: "center", width: 520 }
    );
  }

  doc.end();
}

function generateReceivablePDF(res: Response, data: any[]) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=contas_a_receber_${new Date().toISOString().slice(0, 10)}.pdf`);
  doc.pipe(res);

  doc.fontSize(16).font("Helvetica-Bold").text("ML SERVIÇOS ECO", { align: "center" });
  doc.fontSize(12).font("Helvetica").text("Relatório de Contas a Receber", { align: "center" });
  doc.fontSize(8).fillColor("#666666")
    .text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, { align: "center" });
  doc.moveDown(1);

  const colWidths = [30, 180, 90, 80, 80, 60];
  const headers = ["#", "Descrição", "Valor (R$)", "Vencimento", "Recebimento", "Status"];
  const startX = 40;
  let y = doc.y;

  doc.fillColor("#0F766E").rect(startX, y, 520, 20).fill();
  doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
  let x = startX + 4;
  headers.forEach((h, i) => {
    doc.text(h, x, y + 5, { width: colWidths[i], align: "center" });
    x += colWidths[i];
  });
  y += 22;

  let totalGeral = 0;
  let totalRecebido = 0;
  let totalPendente = 0;

  doc.font("Helvetica").fontSize(7).fillColor("#333333");

  data.forEach((item, idx) => {
    if (y > 760) {
      doc.addPage();
      y = 40;
    }

    const amount = parseFloat(item.amount || "0");
    totalGeral += amount;
    if (item.status === "recebido") totalRecebido += amount;
    if (item.status === "pendente" || item.status === "vencido") totalPendente += amount;

    if (idx % 2 === 1) {
      doc.fillColor("#F5F5F5").rect(startX, y, 520, 16).fill();
    }

    doc.fillColor("#333333");
    x = startX + 4;
    const rowData = [
      String(idx + 1),
      item.description?.substring(0, 40) || "",
      formatBRL(amount),
      formatDate(item.dueDate),
      formatDate(item.receiveDate),
      translateStatus(item.status),
    ];
    rowData.forEach((val, i) => {
      doc.text(val, x, y + 4, { width: colWidths[i], align: i === 2 ? "right" : "center" });
      x += colWidths[i];
    });
    y += 16;
  });

  y += 10;
  if (y > 720) { doc.addPage(); y = 40; }
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#0F766E");
  doc.text("RESUMO", startX, y);
  y += 16;
  doc.fontSize(9).font("Helvetica").fillColor("#333333");
  doc.text(`Total Geral: ${formatBRL(totalGeral)}`, startX, y); y += 14;
  doc.fillColor("#16A34A").text(`Total Recebido: ${formatBRL(totalRecebido)}`, startX, y); y += 14;
  doc.fillColor("#DC2626").text(`Total Pendente/Vencido: ${formatBRL(totalPendente)}`, startX, y);

  doc.fontSize(7).fillColor("#999999");
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    doc.text(
      `FinHub Inteligente - ML Serviços | www.mlservicoseco.com.br | Página ${i + 1} de ${pages.count}`,
      40, 800, { align: "center", width: 520 }
    );
  }

  doc.end();
}

// ============================================================
// REGISTER ROUTES
// ============================================================

export function registerExportRoutes(app: Express) {
  // Contas a Pagar - Excel
  app.get("/api/reports/payable/excel", async (req: Request, res: Response) => {
    const userId = await authenticateExpress(req, res);
    if (!userId) return;
    const allowed = await checkPermission(userId, "accounts_payable", "canView");
    if (!allowed) return res.status(403).json({ error: "Sem permissão" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "DB indisponível" });
    const data = await db.select().from(accountsPayable).orderBy(desc(accountsPayable.dueDate));
    await generatePayableExcel(res, data);
  });

  // Contas a Pagar - PDF
  app.get("/api/reports/payable/pdf", async (req: Request, res: Response) => {
    const userId = await authenticateExpress(req, res);
    if (!userId) return;
    const allowed = await checkPermission(userId, "accounts_payable", "canView");
    if (!allowed) return res.status(403).json({ error: "Sem permissão" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "DB indisponível" });
    const data = await db.select().from(accountsPayable).orderBy(desc(accountsPayable.dueDate));
    generatePayablePDF(res, data);
  });

  // Contas a Receber - Excel
  app.get("/api/reports/receivable/excel", async (req: Request, res: Response) => {
    const userId = await authenticateExpress(req, res);
    if (!userId) return;
    const allowed = await checkPermission(userId, "accounts_receivable", "canView");
    if (!allowed) return res.status(403).json({ error: "Sem permissão" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "DB indisponível" });
    const data = await db.select().from(accountsReceivable).orderBy(desc(accountsReceivable.dueDate));
    await generateReceivableExcel(res, data);
  });

  // Contas a Receber - PDF
  app.get("/api/reports/receivable/pdf", async (req: Request, res: Response) => {
    const userId = await authenticateExpress(req, res);
    if (!userId) return;
    const allowed = await checkPermission(userId, "accounts_receivable", "canView");
    if (!allowed) return res.status(403).json({ error: "Sem permissão" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "DB indisponível" });
    const data = await db.select().from(accountsReceivable).orderBy(desc(accountsReceivable.dueDate));
    generateReceivablePDF(res, data);
  });
}
