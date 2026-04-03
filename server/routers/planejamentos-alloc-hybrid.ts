import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { workSchedules, scheduleAllocations, employees, auditLog } from "../../drizzle/schema";
import { eq, and, inArray, ne } from "drizzle-orm";

export const allocationHybridRouter = router({
  // ============ VALIDAR DUPLICIDADE COM JUSTIFICATIVA ============
  validateDuplicateAllocation: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        employeeId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [schedule] = await db
        .select()
        .from(workSchedules)
        .where(eq(workSchedules.id, input.scheduleId))
        .limit(1);

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Planejamento não encontrado",
        });
      }

      // Buscar alocações do mesmo funcionário no mesmo dia em outros planejamentos
      const conflictingAllocations = await db
        .select({
          scheduleId: scheduleAllocations.scheduleId,
          clientId: workSchedules.clientId,
          shiftId: workSchedules.shiftId,
          status: workSchedules.status,
        })
        .from(scheduleAllocations)
        .innerJoin(workSchedules, eq(scheduleAllocations.scheduleId, workSchedules.id))
        .where(
          and(
            eq(scheduleAllocations.employeeId, input.employeeId),
            eq(workSchedules.date, schedule.date),
            ne(workSchedules.id, input.scheduleId)
          )
        );

      if (conflictingAllocations.length > 0) {
        return {
          hasDuplicate: true,
          conflicts: conflictingAllocations,
        };
      }

      return { hasDuplicate: false, conflicts: [] };
    }),

  // ============ ALOCAR COM EXCEÇÃO REGISTRADA ============
  allocateWithException: protectedProcedure
    .input(
      z.object({
        scheduleFunctionId: z.number(),
        scheduleId: z.number(),
        employeeId: z.number(),
        justification: z.string().min(10, "Justificativa deve ter no mínimo 10 caracteres"),
        payValue: z.string(),
        receiveValue: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Registrar na auditoria
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "duplicate_allocation_exception",
        module: "schedules",
        details: JSON.stringify({
          scheduleId: input.scheduleId,
          employeeId: input.employeeId,
          justification: input.justification,
        }),
        createdAt: new Date(),
      });

      // Criar alocação
      const [result] = await db.insert(scheduleAllocations).values({
        scheduleFunctionId: input.scheduleFunctionId,
        scheduleId: input.scheduleId,
        employeeId: input.employeeId,
        payValue: input.payValue,
        receiveValue: input.receiveValue,
        mealAllowance: "0",
        voucher: "0",
        bonus: "0",
      });

      return { success: true, allocationId: result.insertId };
    }),
});
