import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql, and, gte, lt, eq } from "drizzle-orm";
import { accountsReceivable, accountsPayable, workSchedules, clients } from "../../drizzle/schema";

export const dashboardRouter = router({
  /**
   * Busca KPIs principais do mês (faturamento, custos, margem, trabalhos)
   */
  getMonthlyKPIs: protectedProcedure
    .input(
      z.object({
        year: z.number().min(2000).max(2100),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);
      const prevStartDate = new Date(input.year, input.month - 2, 1);
      const prevEndDate = new Date(input.year, input.month - 1, 0);

      // Faturamento do mês (contas a receber)
      const currentRevenueResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.amount}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.dueDate, startDate),
            lt(accountsReceivable.dueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsReceivable.status, 'pendente')
          )
        );

      const prevRevenueResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.amount}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.dueDate, prevStartDate),
            lt(accountsReceivable.dueDate, new Date(prevEndDate.getTime() + 86400000)),
            eq(accountsReceivable.status, 'pendente')
          )
        );

      const currentRevenue = currentRevenueResult[0]?.total || 0;
      const prevRevenue = prevRevenueResult[0]?.total || 0;
      const revenueVariation = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      // Custos operacionais (contas a pagar)
      const currentCostsResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}), 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, startDate),
            lt(accountsPayable.dueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsPayable.status, 'pendente')
          )
        );

      const prevCostsResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}), 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, prevStartDate),
            lt(accountsPayable.dueDate, new Date(prevEndDate.getTime() + 86400000)),
            eq(accountsPayable.status, 'pendente')
          )
        );

      const currentCosts = currentCostsResult[0]?.total || 0;
      const prevCosts = prevCostsResult[0]?.total || 0;
      const costsVariation = prevCosts > 0 ? ((currentCosts - prevCosts) / prevCosts) * 100 : 0;

      // Margem de lucro
      const currentMargin = currentRevenue - currentCosts;
      const prevMargin = prevRevenue - prevCosts;
      const marginVariation = prevMargin !== 0 ? ((currentMargin - prevMargin) / Math.abs(prevMargin)) * 100 : 0;

      // Total de trabalhos (planejamentos validados)
      const currentWorksResult = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${workSchedules.id})`,
        })
        .from(workSchedules)
        .where(
          and(
            gte(workSchedules.date, startDate),
            lt(workSchedules.date, new Date(endDate.getTime() + 86400000))
          )
        );

      const prevWorksResult = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${workSchedules.id})`,
        })
        .from(workSchedules)
        .where(
          and(
            gte(workSchedules.date, prevStartDate),
            lt(workSchedules.date, new Date(prevEndDate.getTime() + 86400000))
          )
        );

      const currentWorks = currentWorksResult[0]?.count || 0;
      const prevWorks = prevWorksResult[0]?.count || 0;
      const worksVariation = prevWorks > 0 ? ((currentWorks - prevWorks) / prevWorks) * 100 : 0;

      return {
        revenue: {
          current: currentRevenue,
          previous: prevRevenue,
          variation: revenueVariation,
        },
        costs: {
          current: currentCosts,
          previous: prevCosts,
          variation: costsVariation,
        },
        margin: {
          current: currentMargin,
          previous: prevMargin,
          variation: marginVariation,
        },
        works: {
          current: currentWorks,
          previous: prevWorks,
          variation: worksVariation,
        },
      };
    }),

  /**
   * Busca alertas automáticos
   */
  getAlerts: protectedProcedure
    .input(
      z.object({
        year: z.number().min(2000).max(2100),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);
      const today = new Date();

      const alerts = [];

      // Prejuízo
      const revenueResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.amount}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.dueDate, startDate),
            lt(accountsReceivable.dueDate, new Date(endDate.getTime() + 86400000))
          )
        );

      const costsResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}), 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, startDate),
            lt(accountsPayable.dueDate, new Date(endDate.getTime() + 86400000))
          )
        );

      const revenue = revenueResult[0]?.total || 0;
      const costs = costsResult[0]?.total || 0;

      if (costs > revenue) {
        alerts.push({
          type: 'loss',
          message: `Atenção: operação com prejuízo de R$ ${(costs - revenue).toFixed(2)} em ${new Date(input.year, input.month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
        });
      }

      // Contas vencidas
      const overdueResult = await db
        .select({
          count: sql<number>`COUNT(*)`,
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}), 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            lt(accountsPayable.dueDate, today),
            eq(accountsPayable.status, 'pending')
          )
        );

      if (overdueResult[0]?.count > 0) {
        alerts.push({
          type: 'overdue',
          message: `${overdueResult[0].count} conta(s) vencida(s) totalizando R$ ${(overdueResult[0].total || 0).toFixed(2)}`,
        });
      }

      // Planejamentos pendentes
      const pendingSchedulesResult = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(workSchedules)
        .where(
          and(
            lt(workSchedules.date, new Date(today.getTime() - 2 * 86400000))
          )
        );

      if (pendingSchedulesResult[0]?.count > 0) {
        alerts.push({
          type: 'pending_schedules',
          message: `${pendingSchedulesResult[0].count} planejamento(s) aguardando validação`,
        });
      }

      if (alerts.length === 0) {
        alerts.push({
          type: 'healthy',
          message: '✅ Operação saudável — nenhum alerta no momento',
        });
      }

      return alerts;
    }),

  /**
   * Busca evolução financeira diária
   */
  getDailyFinancialEvolution: protectedProcedure
    .input(
      z.object({
        year: z.number().min(2000).max(2100),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      // Receita por dia
      const dailyRevenueResult = await db
        .select({
          date: sql<string>`DATE(${accountsReceivable.dueDate})`,
          total: sql<number>`COALESCE(SUM(${accountsReceivable.amount}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.dueDate, startDate),
            lt(accountsReceivable.dueDate, new Date(endDate.getTime() + 86400000))
          )
        )
        .groupBy(sql`DATE(${accountsReceivable.dueDate})`);

      // Custos por dia
      const dailyCostsResult = await db
        .select({
          date: sql<string>`DATE(${accountsPayable.dueDate})`,
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}), 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, startDate),
            lt(accountsPayable.dueDate, new Date(endDate.getTime() + 86400000))
          )
        )
        .groupBy(sql`DATE(${accountsPayable.dueDate})`);

      // Consolidar dados
      const daysInMonth = endDate.getDate();
      const data = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${input.year}-${String(input.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const revenue = dailyRevenueResult.find((r) => r.date?.includes(dateStr))?.total || 0;
        const costs = dailyCostsResult.find((c) => c.date?.includes(dateStr))?.total || 0;

        data.push({
          date: dateStr,
          revenue,
          costs,
          margin: revenue - costs,
        });
      }

      return data;
    }),

  /**
   * Busca top 3 clientes do mês
   */
  getTopClients: protectedProcedure
    .input(
      z.object({
        year: z.number().min(2000).max(2100),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      // Buscar receita por cliente
      const topClientsResult = await db
        .select({
          clientId: accountsReceivable.clientId,
          clientName: sql<string>`COALESCE(c.name, 'Desconhecido')`,
          totalRevenue: sql<number>`COALESCE(SUM(${accountsReceivable.amount}), 0)`,
          workCount: sql<number>`COUNT(DISTINCT ${workSchedules.id})`,
        })
        .from(accountsReceivable)
        .leftJoin(
          workSchedules,
          sql`DATE(${accountsReceivable.dueDate}) = DATE(${workSchedules.date})`
        )
        .leftJoin(sql`clients c`, sql`${accountsReceivable.clientId} = c.id`)
        .where(
          and(
            gte(accountsReceivable.dueDate, startDate),
            lt(accountsReceivable.dueDate, new Date(endDate.getTime() + 86400000))
          )
        )
        .groupBy(accountsReceivable.clientId)
        .orderBy(sql`SUM(${accountsReceivable.amount}) DESC`)
        .limit(3);

      return topClientsResult;
    }),

  /**
   * Busca resumo de contas (a pagar e a receber)
   */
  getAccountsSummary: protectedProcedure
    .input(
      z.object({
        year: z.number().min(2000).max(2100),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      // A pagar pendente
      const payablePendingResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}), 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, startDate),
            lt(accountsPayable.dueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsPayable.status, "pendente")
          )
        );

      // A pagar pago
      const payablePaidResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}), 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, startDate),
            lt(accountsPayable.dueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsPayable.status, "pago")
          )
        );

      // A receber pendente
      const receivablePendingResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.amount}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.dueDate, startDate),
            lt(accountsReceivable.dueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsReceivable.status, "pendente")
          )
        );

      // A receber recebido
      const receivablePaidResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.amount}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.dueDate, startDate),
            lt(accountsReceivable.dueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsReceivable.status, "recebido")
          )
        );

      const payablePending = payablePendingResult[0]?.total || 0;
      const payablePaid = payablePaidResult[0]?.total || 0;
      const receivablePending = receivablePendingResult[0]?.total || 0;
      const receivablePaid = receivablePaidResult[0]?.total || 0;

      return {
        payablePending,
        payablePaid,
        receivablePending,
        receivablePaid,
        forecastedBalance: receivablePending - payablePending,
      };
    }),
});
