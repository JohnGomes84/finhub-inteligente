import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { PDFDocument, PDFPage, rgb } from "pdf-lib";

export const reportGenerationRouter = router({
  /**
   * Gera relatório PDF do mês selecionado
   * Retorna: buffer do PDF para download
   */
  generateMonthlyReport: protectedProcedure
    .input(
      z.object({
        year: z.number().min(2000).max(2100),
        month: z.number().min(1).max(12),
        kpis: z.object({
          revenue: z.object({
            current: z.number(),
            previous: z.number(),
            variation: z.number(),
          }),
          costs: z.object({
            current: z.number(),
            previous: z.number(),
            variation: z.number(),
          }),
          margin: z.object({
            current: z.number(),
            previous: z.number(),
            variation: z.number(),
            isNegative: z.boolean(),
          }),
          works: z.object({
            current: z.number(),
            previous: z.number(),
            variation: z.number(),
          }),
        }),
        alerts: z.object({
          loss: z.object({
            exists: z.boolean(),
            amount: z.number(),
            month: z.string(),
          }),
          overdueAccounts: z.object({
            count: z.number(),
            total: z.number(),
          }),
          employeesWithoutPix: z.object({
            count: z.number(),
          }),
          pendingSchedules: z.object({
            count: z.number(),
          }),
        }),
        accountsSummary: z.object({
          payablePending: z.number(),
          payablePaid: z.number(),
          receivablePending: z.number(),
          receivablePaid: z.number(),
          forecastedBalance: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      // Criar documento PDF
      const pdfDoc = await PDFDocument.create();

      // Página 1: Capa
      let page = pdfDoc.addPage([595, 842]); // A4
      const { width, height } = page.getSize();

      page.drawText("ML Serviços", {
        x: 50,
        y: height - 100,
        size: 32,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText("FinHub Inteligente", {
        x: 50,
        y: height - 150,
        size: 24,
        color: rgb(0.4, 0.4, 0.4),
      });

      page.drawText("Relatório Financeiro", {
        x: 50,
        y: height - 200,
        size: 20,
        color: rgb(0.6, 0.6, 0.6),
      });

      const monthName = new Date(input.year, input.month - 1).toLocaleString("pt-BR", {
        month: "long",
        year: "numeric",
      });

      page.drawText(`${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, {
        x: 50,
        y: height - 250,
        size: 18,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.7, 0.7, 0.7),
      });

      // Página 2: KPIs
      page = pdfDoc.addPage([595, 842]);
      drawPageHeader(page, "KPIs do Mês", 1);

      let yPos = height - 150;

      // Faturamento
      page.drawText("Faturamento do Mês", {
        x: 50,
        y: yPos,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      page.drawText(formatCurrency(input.kpis.revenue.current), {
        x: 50,
        y: yPos - 20,
        size: 14,
        color: rgb(0, 0.7, 0),
      });
      page.drawText(`Variação: ${input.kpis.revenue.variation.toFixed(1)}%`, {
        x: 50,
        y: yPos - 40,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      yPos -= 80;

      // Custos
      page.drawText("Custos Operacionais", {
        x: 50,
        y: yPos,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      page.drawText(formatCurrency(input.kpis.costs.current), {
        x: 50,
        y: yPos - 20,
        size: 14,
        color: rgb(0.7, 0, 0),
      });
      page.drawText(`Variação: ${input.kpis.costs.variation.toFixed(1)}%`, {
        x: 50,
        y: yPos - 40,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      yPos -= 80;

      // Margem
      page.drawText("Margem de Lucro", {
        x: 50,
        y: yPos,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      const marginColor = input.kpis.margin.isNegative ? rgb(0.7, 0, 0) : rgb(0, 0.7, 0);
      page.drawText(formatCurrency(input.kpis.margin.current), {
        x: 50,
        y: yPos - 20,
        size: 14,
        color: marginColor,
      });
      page.drawText(`Variação: ${input.kpis.margin.variation.toFixed(1)}%`, {
        x: 50,
        y: yPos - 40,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      yPos -= 80;

      // Total de Trabalhos
      page.drawText("Total de Trabalhos", {
        x: 50,
        y: yPos,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      page.drawText(input.kpis.works.current.toString(), {
        x: 50,
        y: yPos - 20,
        size: 14,
        color: rgb(0, 0.5, 0.7),
      });
      page.drawText(`Variação: ${input.kpis.works.variation.toFixed(1)}%`, {
        x: 50,
        y: yPos - 40,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Página 3: Resumo Financeiro
      page = pdfDoc.addPage([595, 842]);
      drawPageHeader(page, "Resumo Financeiro", 2);

      yPos = height - 150;

      page.drawText("Contas a Pagar", {
        x: 50,
        y: yPos,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      page.drawText(`Pendente: ${formatCurrency(input.accountsSummary.payablePending)}`, {
        x: 50,
        y: yPos - 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText(`Pago: ${formatCurrency(input.accountsSummary.payablePaid)}`, {
        x: 50,
        y: yPos - 40,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      yPos -= 80;

      page.drawText("Contas a Receber", {
        x: 50,
        y: yPos,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      page.drawText(`Pendente: ${formatCurrency(input.accountsSummary.receivablePending)}`, {
        x: 50,
        y: yPos - 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText(`Recebido: ${formatCurrency(input.accountsSummary.receivablePaid)}`, {
        x: 50,
        y: yPos - 40,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      yPos -= 80;

      page.drawText("Saldo Previsto", {
        x: 50,
        y: yPos,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      const balanceColor = input.accountsSummary.forecastedBalance >= 0 ? rgb(0, 0.7, 0) : rgb(0.7, 0, 0);
      page.drawText(formatCurrency(input.accountsSummary.forecastedBalance), {
        x: 50,
        y: yPos - 20,
        size: 14,
        color: balanceColor,
      });

      // Página 4: Alertas
      page = pdfDoc.addPage([595, 842]);
      drawPageHeader(page, "Alertas do Negócio", 3);

      yPos = height - 150;

      if (input.alerts.loss.exists) {
        page.drawText("🔴 Prejuízo Detectado", {
          x: 50,
          y: yPos,
          size: 12,
          color: rgb(0.7, 0, 0),
        });
        page.drawText(`Prejuízo de ${formatCurrency(input.alerts.loss.amount)} em ${input.alerts.loss.month}`, {
          x: 50,
          y: yPos - 20,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPos -= 60;
      }

      if (input.alerts.overdueAccounts.count > 0) {
        page.drawText("🟡 Contas Vencidas", {
          x: 50,
          y: yPos,
          size: 12,
          color: rgb(0.7, 0.5, 0),
        });
        page.drawText(`${input.alerts.overdueAccounts.count} conta(s) vencida(s) - Total: ${formatCurrency(input.alerts.overdueAccounts.total)}`, {
          x: 50,
          y: yPos - 20,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPos -= 60;
      }

      if (input.alerts.employeesWithoutPix.count > 0) {
        page.drawText("🟠 Diaristas sem PIX", {
          x: 50,
          y: yPos,
          size: 12,
          color: rgb(0.7, 0.4, 0),
        });
        page.drawText(`${input.alerts.employeesWithoutPix.count} diarista(s) sem chave PIX`, {
          x: 50,
          y: yPos - 20,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPos -= 60;
      }

      if (input.alerts.pendingSchedules.count > 0) {
        page.drawText("🔵 Planejamentos Pendentes", {
          x: 50,
          y: yPos,
          size: 12,
          color: rgb(0, 0.3, 0.7),
        });
        page.drawText(`${input.alerts.pendingSchedules.count} planejamento(s) aguardando validação`, {
          x: 50,
          y: yPos - 20,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPos -= 60;
      }

      if (
        !input.alerts.loss.exists &&
        input.alerts.overdueAccounts.count === 0 &&
        input.alerts.employeesWithoutPix.count === 0 &&
        input.alerts.pendingSchedules.count === 0
      ) {
        page.drawText("✅ Operação Saudável", {
          x: 50,
          y: yPos,
          size: 12,
          color: rgb(0, 0.7, 0),
        });
        page.drawText("Nenhum alerta no momento", {
          x: 50,
          y: yPos - 20,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      // Adicionar rodapé em todas as páginas
      const pages = pdfDoc.getPages();
      pages.forEach((p: PDFPage, idx: number) => {
        p.drawText(`ML Serviços | FinHub | Página ${idx + 1}/${pages.length}`, {
          x: 50,
          y: 30,
          size: 8,
          color: rgb(0.7, 0.7, 0.7),
        });
      });

      // Salvar PDF em buffer
      const pdfBytes = await pdfDoc.save();

      return {
        success: true,
        filename: `relatorio-financeiro-${input.year}-${String(input.month).padStart(2, "0")}.pdf`,
        data: Buffer.from(pdfBytes).toString("base64"),
      };
    }),
});

// Funções auxiliares
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function drawPageHeader(page: PDFPage, title: string, pageNum: number) {
  const { height } = page.getSize();
  page.drawText(title, {
    x: 50,
    y: height - 50,
    size: 16,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawLine({
    start: { x: 50, y: height - 70 },
    end: { x: 545, y: height - 70 },
    color: rgb(0.8, 0.8, 0.8),
  });
}
