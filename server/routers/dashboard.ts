import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { accountsPayable, accountsReceivable, workSchedules, employees } from "../../drizzle/schema";
import { eq, gte, lt, and, sql } from "drizzle-orm";
import { COOKIE_NAME } from "../_core/cookies";

export const dashboardRouter = router({
  /**
   * Busca KPIs do mês selecionado
   * Retorna: faturamento, custos, margem, total de trabalhos
   * com variação em relação ao mês anterior
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
      const currentRevenue = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.value}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.issueDate, startDate),
            lt(accountsReceivable.issueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsReceivable.status, 'pending')
          )
        );

      const prevRevenue = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.value}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.issueDate, prevStartDate),
            lt(accountsReceivable.issueDate, new Date(prevEndDate.getTime() + 86400000)),
            eq(accountsReceivable.status, 'pending')
          )
        );

      // Custos operacionais (contas a pagar)
      const currentCosts = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}, 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, startDate),
            lt(accountsPayable.dueDate, new Date(endDate.getTime() + 86400000))
          )
        );

      const prevCosts = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}, 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, prevStartDate),
            lt(accountsPayable.dueDate, new Date(prevEndDate.getTime() + 86400000))
          )
        );

      // Total de trabalhos validados
      const currentWorks = await db
        .select({
          total: sql<number>`COUNT(*)`,
        })
        .from(workSchedules)
        .where(
          and(
            gte(workSchedules.date, startDate),
            lt(workSchedules.date, new Date(endDate.getTime() + 86400000)),
            eq(workSchedules.status, "validated")
          )
        );

      const prevWorks = await db
        .select({
          total: sql<number>`COUNT(*)`,
        })
        .from(workSchedules)
        .where(
          and(
            gte(workSchedules.date, prevStartDate),
            lt(workSchedules.date, new Date(prevEndDate.getTime() + 86400000)),
            eq(workSchedules.status, "validated")
          )
        );

      const currentRev = currentRevenue[0]?.total || 0;
      const prevRev = prevRevenue[0]?.total || 0;
      const currentCost = currentCosts[0]?.total || 0;
      const prevCost = prevCosts[0]?.total || 0;
      const currentWork = currentWorks[0]?.total || 0;
      const prevWork = prevWorks[0]?.total || 0;

      const revenueVariation = prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : 0;
      const costVariation = prevCost > 0 ? ((currentCost - prevCost) / prevCost) * 100 : 0;
      const margin = currentRev - currentCost;
      const prevMargin = prevRev - prevCost;
      const marginVariation = prevMargin !== 0 ? ((margin - prevMargin) / Math.abs(prevMargin)) * 100 : 0;
      const workVariation = prevWork > 0 ? ((currentWork - prevWork) / prevWork) * 100 : 0;

      return {
        revenue: {
          current: currentRev,
          previous: prevRev,
          variation: revenueVariation,
        },
        costs: {
          current: currentCost,
          previous: prevCost,
          variation: costVariation,
        },
        margin: {
          current: margin,
          previous: prevMargin,
          variation: marginVariation,
          isNegative: margin < 0,
        },
        works: {
          current: currentWork,
          previous: prevWork,
          variation: workVariation,
        },
      };
    }),

  /**
   * Busca alertas do negócio
   * Retorna: prejuízo, contas vencidas, diaristas sem PIX, planejamentos pendentes
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

      // Verificar prejuízo
      const revenue = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.value}, 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.issueDate, startDate),
            lt(accountsReceivable.issueDate, new Date(endDate.getTime() + 86400000))
          )
        );

      const costs = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}, 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, startDate),
            lt(accountsPayable.dueDate, new Date(endDate.getTime() + 86400000))
          )
        );

      const currentRevenue = revenue[0]?.total || 0;
      const currentCosts = costs[0]?.total || 0;
      const hasLoss = currentCosts > currentRevenue;

      // Contas vencidas
      const overdueAccounts = await db
        .select({
          count: sql<number>`COUNT(*)`,
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}, 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            lt(accountsPayable.dueDate, new Date()),
            eq(accountsPayable.status, "pending")
          )
        );

      // Diaristas sem PIX
      const employeesWithoutPix = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(employees)
        .where(
          and(
            eq(employees.status, "active"),
            sql`${employees.pixKey} IS NULL OR ${employees.pixKey} = ''`
          )
        );

      // Planejamentos pendentes há mais de 2 dias
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const pendingSchedules = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(workSchedules)
        .where(
          and(
            eq(workSchedules.status, "pending"),
            lt(workSchedules.createdAt, twoDaysAgo)
          )
        );

      return {
        loss: {
          exists: hasLoss,
          amount: hasLoss ? currentCosts - currentRevenue : 0,
          month: `${input.month}/${input.year}`,
        },
        overdueAccounts: {
          count: overdueAccounts[0]?.count || 0,
          total: overdueAccounts[0]?.total || 0,
        },
        employeesWithoutPix: {
          count: employeesWithoutPix[0]?.count || 0,
        },
        pendingSchedules: {
          count: pendingSchedules[0]?.count || 0,
        },
      };
    }),

  /**
   * Busca dados para gráfico de evolução financeira diária
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
      const dailyRevenue = await db
        .select({
          date: sql<string>`DATE(${accountsReceivable.issueDate})`,
          total: sql<number>`COALESCE(SUM(${accountsReceivable.value}), 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.issueDate, startDate),
            lt(accountsReceivable.issueDate, new Date(endDate.getTime() + 86400000))
          )
        )
        .groupBy(sql`DATE(${accountsReceivable.issueDate})`);

      // Custos por dia
      const dailyCosts = await db
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
        const revenue = dailyRevenue.find((r) => r.date === dateStr)?.total || 0;
        const costs = dailyCosts.find((c) => c.date === dateStr)?.total || 0;

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
      const topClients = await db
        .select({
          clientId: accountsReceivable.clientId,
          clientName: sql<string>`COALESCE(c.name, 'Desconhecido')`,
          totalRevenue: sql<number>`COALESCE(SUM(${accountsReceivable.value}), 0)`,
          workCount: sql<number>`COUNT(DISTINCT ${workSchedules.id})`,
        })
        .from(accountsReceivable)
        .leftJoin(
          workSchedules,
          sql`DATE(${accountsReceivable.issueDate}) = DATE(${workSchedules.date})`
        )
        .leftJoin(sql`clients c`, sql`${accountsReceivable.clientId} = c.id`)
        .where(
          and(
            gte(accountsReceivable.issueDate, startDate),
            lt(accountsReceivable.issueDate, new Date(endDate.getTime() + 86400000))
          )
        )
        .groupBy(accountsReceivable.clientId)
        .orderBy(sql`SUM(${accountsReceivable.value}) DESC`)
        .limit(3);

      return topClients;
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
      const payablePending = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}, 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, startDate),
            lt(accountsPayable.dueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsPayable.status, "pending")
          )
        );

      // A pagar pago
      const payablePaid = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsPayable.amount}, 0)`,
        })
        .from(accountsPayable)
        .where(
          and(
            gte(accountsPayable.dueDate, startDate),
            lt(accountsPayable.dueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsPayable.status, "paid")
          )
        );

      // A receber pendente
      const receivablePending = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.value}, 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.issueDate, startDate),
            lt(accountsReceivable.issueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsReceivable.status, "pending")
          )
        );

      // A receber recebido
      const receivablePaid = await db
        .select({
          total: sql<number>`COALESCE(SUM(${accountsReceivable.value}, 0)`,
        })
        .from(accountsReceivable)
        .where(
          and(
            gte(accountsReceivable.issueDate, startDate),
            lt(accountsReceivable.issueDate, new Date(endDate.getTime() + 86400000)),
            eq(accountsReceivable.status, "paid")
          )
        );

      const payablePend = payablePending[0]?.total || 0;
      const payablePd = payablePaid[0]?.total || 0;
      const receivablePend = receivablePending[0]?.total || 0;
      const receivablePd = receivablePaid[0]?.total || 0;

      return {
        payablePending: payablePend,
        payablePaid: payablePd,
        receivablePending: receivablePend,
        receivablePaid: receivablePd,
        forecastedBalance: receivablePend - payablePend,
      };
    }),
});
