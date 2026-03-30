import { TRPCError } from "@trpc/server";

export function calculatePaymentBatchItemTotal(params: {
  daysWorked: number;
  dailyRate: string;
  mealAllowance: string;
  bonus: string;
  voucher: string;
}) {
  const total =
    params.daysWorked * parseFloat(params.dailyRate) +
    parseFloat(params.mealAllowance) +
    parseFloat(params.bonus) -
    parseFloat(params.voucher);
  return total.toFixed(2);
}

export function assertScheduleEditable(
  status: "pendente" | "validado" | "cancelado"
) {
  if (status !== "pendente") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Só é possível editar alocações em planejamento pendente",
    });
  }
}

export function filterNewEmployeesWithoutDuplicate(
  requestedEmployeeIds: number[],
  existingEmployeeIds: number[]
) {
  const existingSet = new Set(existingEmployeeIds);
  return requestedEmployeeIds.filter(id => !existingSet.has(id));
}

export function assertBatchCanBePaid(params: {
  status: "pendente" | "pago" | "cancelado";
  itemsCount: number;
  hasPaidItem: boolean;
}) {
  if (params.status !== "pendente") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Lote não está pendente para pagamento",
    });
  }
  if (params.itemsCount === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Não é permitido pagar lote sem itens",
    });
  }
  if (params.hasPaidItem) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Lote contém item já pago",
    });
  }
}
