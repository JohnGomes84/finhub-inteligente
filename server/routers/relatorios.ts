import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  workSchedules,
  scheduleAllocations,
  employees,
  clients,
  shifts,
  costCenters,
  accountsPayable,
  accountsReceivable,
  reportTemplates,
} from "../../drizzle/schema";
import { eq, and, gte, lte, inArray, like } from "drizzle-orm";
import { exportReportToExcel, exportReportToPdf } from "../lib/report-export";

const reportFiltersSchema = z.object({
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  clientIds: z.array(z.number()).optional(),
  shiftIds: z.array(z.number()).optional(),
  employeeSearch: z.string().optional(),
  costCenterIds: z.array(z.number()).optional(),
  type: z.enum(["receitas", "despesas", "ambos"]).optional(),
  status: z.enum(["pago", "pendente", "todos"]).optional(),
});

const reportSectionsSchema = z.object({
  executiveSummary: z.boolean(),
  dailyEvolution: z.boolean(),
  schedulesRealized: z.boolean(),
  employeePayments: z.boolean(),
  accountsPayable: z.boolean(),
  accountsReceivable: z.boolean(),
  expenseComposition: z.boolean(),
  clientRanking: z.boolean(),
});

export const relatoriosRouter = router({
  // ============ GERAR RELATORIO ============
  generate: adminProcedure
    .input(
      z.object({
        filters: reportFiltersSchema,
        sections: reportSectionsSchema,
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const report: Record<string, any> = {};

      // Buscar dados base
      const dateStart = input.filters.dateStart ? new Date(input.filters.dateStart) : new Date(new Date().getFullYear(), 0, 1);
      const dateEnd = input.filters.dateEnd ? new Date(input.filters.dateEnd) : new Date();

      // Resumo Executivo
      if (input.sections.executiveSummary) {
        const schedules = await db
          .select()
          .from(workSchedules)
          .where(
            and(
              gte(workSchedules.date, dateStart),
              lte(workSchedules.date, dateEnd)
            )
          );

        const allocations = await db
          .select()
          .from(scheduleAllocations)
          .where(
            inArray(
              scheduleAllocations.scheduleId,
              schedules.map((s) => s.id)
            )
          );

        const totalReceive = allocations.reduce(
          (sum, a) => sum + parseFloat(String(a.receiveValue || "0")),
          0
        );
        const totalPay = allocations.reduce(
          (sum, a) => sum + parseFloat(String(a.payValue || "0")),
          0
        );
        const margin = totalReceive - totalPay;

        report.executiveSummary = {
          totalReceive: totalReceive.toFixed(2),
          totalPay: totalPay.toFixed(2),
          margin: margin.toFixed(2),
          marginPercent: totalReceive > 0 ? ((margin / totalReceive) * 100).toFixed(2) : "0",
          scheduleCount: schedules.length,
          allocationCount: allocations.length,
        };
      }

      // Planejamentos Realizados
      if (input.sections.schedulesRealized) {
        const schedules = await db
          .select()
          .from(workSchedules)
          .where(
            and(
              gte(workSchedules.date, dateStart),
              lte(workSchedules.date, dateEnd)
            )
          );

        const schedulesWithData = await Promise.all(
          schedules.map(async (s) => {
            const allocs = await db
              .select()
              .from(scheduleAllocations)
              .where(eq(scheduleAllocations.scheduleId, s.id));

            const totalPay = allocs.reduce(
              (sum, a) => sum + parseFloat(String(a.payValue || "0")),
              0
            );
            const totalReceive = allocs.reduce(
              (sum, a) => sum + parseFloat(String(a.receiveValue || "0")),
              0
            );

            return {
              date: s.date,
              clientId: s.clientId,
              shiftId: s.shiftId,
              allocations: allocs.length,
              totalPay: totalPay.toFixed(2),
              totalReceive: totalReceive.toFixed(2),
            };
          })
        );

        report.schedulesRealized = schedulesWithData;
      }

      // Pagamentos de Diaristas
      if (input.sections.employeePayments) {
        const schedules = await db
          .select()
          .from(workSchedules)
          .where(
            and(
              gte(workSchedules.date, dateStart),
              lte(workSchedules.date, dateEnd)
            )
          );

        const allocations = await db
          .select()
          .from(scheduleAllocations)
          .where(
            inArray(
              scheduleAllocations.scheduleId,
              schedules.map((s) => s.id)
            )
          );

        const empMap = Object.fromEntries(
          (await db.select().from(employees)).map((e) => [e.id, e])
        );

        const employeePayments = new Map<
          number,
          { name: string; cpf: string; daysWorked: number; totalReceived: number }
        >();

        allocations.forEach((a) => {
          const emp = empMap[a.employeeId];
          if (!emp) return;

          if (!employeePayments.has(a.employeeId)) {
            employeePayments.set(a.employeeId, {
              name: emp.name,
              cpf: emp.cpf || "",
              daysWorked: 0,
              totalReceived: 0,
            });
          }

          const data = employeePayments.get(a.employeeId)!;
          data.daysWorked += 1;
          data.totalReceived += parseFloat(String(a.receiveValue || "0"));
        });

        report.employeePayments = Array.from(employeePayments.values()).map((p) => ({
          ...p,
          totalReceived: p.totalReceived.toFixed(2),
        }));
      }

      return report;
    }),

  // ============ LISTAR TEMPLATES ============
  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const templates = await db
      .select()
      .from(reportTemplates)
      .where(eq(reportTemplates.userId, ctx.user.id));

    return templates.map((t) => ({
      ...t,
      filters: JSON.parse(t.filters),
      sections: JSON.parse(t.sections),
    }));
  }),

  // ============ SALVAR TEMPLATE ============
  saveTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        filters: reportFiltersSchema,
        sections: reportSectionsSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [result] = await db.insert(reportTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        filters: JSON.stringify(input.filters),
        sections: JSON.stringify(input.sections),
      });

      return { id: result.insertId };
    }),

  // ============ DELETAR TEMPLATE ============
  deleteTemplate: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [template] = await db
        .select()
        .from(reportTemplates)
        .where(eq(reportTemplates.id, input))
        .limit(1);

      if (!template || template.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para deletar este template",
        });
      }

      await db.delete(reportTemplates).where(eq(reportTemplates.id, input));

      return { success: true };
    }),
});
