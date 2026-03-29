import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  workSchedules, scheduleAllocations, employees, pixChangeRequests, users,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

// Helper: verificar se usuário é líder de um planejamento
async function isLeaderOfSchedule(userId: number, scheduleId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Buscar o planejamento
  const [schedule] = await db.select().from(workSchedules).where(eq(workSchedules.id, scheduleId)).limit(1);
  if (!schedule || !schedule.leaderId) return false;

  // Buscar o funcionário do líder
  const [leaderEmp] = await db.select().from(employees).where(eq(employees.id, schedule.leaderId)).limit(1);
  if (!leaderEmp) return false;

  // Verificar se o usuário logado é o funcionário líder (por email ou ID)
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user?.email === leaderEmp.email || false;
}

export const portalLiderRouter = router({
  // ============ MEUS PLANEJAMENTOS (filtrado por líder) ============
  mySchedules: protectedProcedure
    .input(z.object({ dateStart: z.string().optional(), dateEnd: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar funcionário do usuário logado
      const emps = await db.select().from(employees);
      const myEmp = emps.find(e => e.email === ctx.user.email);
      if (!myEmp) return [];

      // Buscar planejamentos onde sou líder
      let schedules = await db.select().from(workSchedules).where(eq(workSchedules.leaderId, myEmp.id));

      // Filtros por data
      if (input?.dateStart) {
        const ds = new Date(input.dateStart);
        schedules = schedules.filter(s => new Date(s.date) >= ds);
      }
      if (input?.dateEnd) {
        const de = new Date(input.dateEnd);
        de.setHours(23, 59, 59);
        schedules = schedules.filter(s => new Date(s.date) <= de);
      }

      return schedules;
    }),

  // ============ DETALHES DE UM PLANEJAMENTO (com alocações) ============
  getScheduleDetail: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
    const isLeader = await isLeaderOfSchedule(ctx.user.id, input);
    if (!isLeader) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Você não é o líder deste planejamento" });
    }

    const db = await getDb();
    if (!db) return null;

    const [schedule] = await db.select().from(workSchedules).where(eq(workSchedules.id, input)).limit(1);
    if (!schedule) return null;

    // Buscar alocações
    const allocs = await db.select().from(scheduleAllocations).where(eq(scheduleAllocations.scheduleId, input));

    // Buscar dados dos funcionários
    const empMap = Object.fromEntries((await db.select().from(employees)).map(e => [e.id, e]));

    return {
      ...schedule,
      allocations: allocs.map(a => ({
        ...a,
        employeeName: empMap[a.employeeId]?.name || "—",
        employeeCpf: empMap[a.employeeId]?.cpf || "",
        employeePixKey: empMap[a.employeeId]?.pixKey || "",
      })),
    };
  }),

  // ============ CHECK-IN ============
  checkIn: protectedProcedure
    .input(z.object({ allocationId: z.number(), scheduleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isLeader = await isLeaderOfSchedule(ctx.user.id, input.scheduleId);
      if (!isLeader) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não é o líder deste planejamento" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(scheduleAllocations).set({
        checkInTime: new Date(),
      }).where(eq(scheduleAllocations.id, input.allocationId));

      return { success: true };
    }),

  // ============ CHECK-OUT ============
  checkOut: protectedProcedure
    .input(z.object({ allocationId: z.number(), scheduleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isLeader = await isLeaderOfSchedule(ctx.user.id, input.scheduleId);
      if (!isLeader) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não é o líder deste planejamento" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(scheduleAllocations).set({
        checkOutTime: new Date(),
      }).where(eq(scheduleAllocations.id, input.allocationId));

      return { success: true };
    }),

  // ============ REGISTRAR PRESENÇA (Presente/Faltou/Parcial) ============
  setAttendance: protectedProcedure
    .input(z.object({
      allocationId: z.number(),
      scheduleId: z.number(),
      status: z.enum(["presente", "faltou", "parcial"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const isLeader = await isLeaderOfSchedule(ctx.user.id, input.scheduleId);
      if (!isLeader) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não é o líder deste planejamento" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(scheduleAllocations).set({
        attendanceStatus: input.status,
        allocNotes: input.notes || null,
      }).where(eq(scheduleAllocations.id, input.allocationId));

      return { success: true };
    }),

  // ============ CADASTRO RÁPIDO DE FUNCIONÁRIO ============
  quickRegisterEmployee: protectedProcedure
    .input(z.object({
      name: z.string().min(2),
      cpf: z.string(),
      rg: z.string().optional(),
      pixKey: z.string(),
      pixKeyType: z.enum(["cpf", "email", "phone", "random", "cnpj"]),
      docFrontBase64: z.string().optional(), // Base64 da foto frente
      docBackBase64: z.string().optional(), // Base64 da foto verso
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar se CPF já existe
      const existing = await db.select().from(employees).where(eq(employees.cpf, input.cpf)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CPF já cadastrado no sistema" });
      }

      // Upload de documentos (se fornecidos)
      let docFrontUrl: string | null = null;
      let docBackUrl: string | null = null;

      if (input.docFrontBase64) {
        try {
          const buffer = Buffer.from(input.docFrontBase64, "base64");
          const result = await storagePut(`employees/${input.cpf}/doc-front.jpg`, buffer, "image/jpeg");
          docFrontUrl = result.url;
        } catch (err) {
          console.error("Erro ao upload documento frente:", err);
        }
      }

      if (input.docBackBase64) {
        try {
          const buffer = Buffer.from(input.docBackBase64, "base64");
          const result = await storagePut(`employees/${input.cpf}/doc-back.jpg`, buffer, "image/jpeg");
          docBackUrl = result.url;
        } catch (err) {
          console.error("Erro ao upload documento verso:", err);
        }
      }

      // Inserir funcionário
      const result = await db.insert(employees).values({
        name: input.name,
        cpf: input.cpf,
        rg: input.rg || null,
        pixKey: input.pixKey,
        pixKeyType: input.pixKeyType,
        docFrontUrl: docFrontUrl || null,
        docBackUrl: docBackUrl || null,
        status: "diarista",
        registrationDate: new Date(),
      });

      return { id: Number(result[0].insertId), name: input.name };
    }),

  // ============ SOLICITAR ALTERAÇÃO DE PIX ============
  requestPixChange: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      newPixKey: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar funcionário
      const [emp] = await db.select().from(employees).where(eq(employees.id, input.employeeId)).limit(1);
      if (!emp) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Criar solicitação
      await db.insert(pixChangeRequests).values({
        employeeId: input.employeeId,
        requestedByUserId: ctx.user.id,
        oldPixKey: emp.pixKey || null,
        newPixKey: input.newPixKey,
        status: "pendente",
      });

      return { success: true, message: "Solicitação de alteração PIX enviada para aprovação" };
    }),

  // ============ LISTAR SOLICITAÇÕES PIX PENDENTES (admin only) ============
  listPixRequests: protectedProcedure
    .input(z.object({ status: z.enum(["pendente", "aprovado", "rejeitado"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      let requests = await db.select().from(pixChangeRequests);

      if (input?.status) {
        requests = requests.filter(r => r.status === input.status);
      }

      // Enriquecer com dados do funcionário
      const empMap = Object.fromEntries((await db.select().from(employees)).map(e => [e.id, e]));

      return requests.map(r => ({
        ...r,
        employeeName: empMap[r.employeeId]?.name || "—",
        employeeCpf: empMap[r.employeeId]?.cpf || "",
      }));
    }),

  // ============ APROVAR/REJEITAR ALTERAÇÃO PIX (admin only) ============
  reviewPixRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      approved: z.boolean(),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [request] = await db.select().from(pixChangeRequests).where(eq(pixChangeRequests.id, input.requestId)).limit(1);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada" });
      }

      if (input.approved) {
        // Atualizar chave PIX do funcionário
        await db.update(employees).set({
          pixKey: request.newPixKey,
        }).where(eq(employees.id, request.employeeId));

        // Marcar solicitação como aprovada
        await db.update(pixChangeRequests).set({
          status: "aprovado",
          reviewedByUserId: ctx.user.id,
          reviewNotes: input.reviewNotes || null,
        }).where(eq(pixChangeRequests.id, input.requestId));
      } else {
        // Rejeitar
        await db.update(pixChangeRequests).set({
          status: "rejeitado",
          reviewedByUserId: ctx.user.id,
          reviewNotes: input.reviewNotes || null,
        }).where(eq(pixChangeRequests.id, input.requestId));
      }

      return { success: true };
    }),
});
