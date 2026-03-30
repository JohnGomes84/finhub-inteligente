import { TRPCError } from "@trpc/server";

type ScheduleStatus = "pendente" | "validado" | "cancelado";
type PaymentBatchStatus = "pendente" | "pago" | "cancelado";
type AccountPayableStatus = "pendente" | "pago" | "vencido" | "cancelado";
type AccountReceivableStatus =
  | "pendente"
  | "recebido"
  | "vencido"
  | "cancelado";

function assertTransition(
  label: string,
  from: string,
  to: string,
  allowed: Record<string, string[]>
) {
  const allowedTargets = allowed[from] ?? [];
  if (!allowedTargets.includes(to)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Transição inválida em ${label}: ${from} -> ${to}`,
    });
  }
}

export function assertScheduleTransition(
  from: ScheduleStatus,
  to: ScheduleStatus
) {
  assertTransition("planejamento", from, to, {
    pendente: ["validado", "cancelado", "pendente"],
    validado: ["cancelado", "validado"],
    cancelado: ["cancelado"],
  });
}

export function assertPaymentBatchTransition(
  from: PaymentBatchStatus,
  to: PaymentBatchStatus
) {
  assertTransition("lote de pagamento", from, to, {
    pendente: ["pago", "cancelado", "pendente"],
    pago: ["pago"],
    cancelado: ["cancelado"],
  });
}

export function assertPayableTransition(
  from: AccountPayableStatus,
  to: AccountPayableStatus
) {
  assertTransition("conta a pagar", from, to, {
    pendente: ["pago", "vencido", "cancelado", "pendente"],
    vencido: ["pago", "cancelado", "vencido"],
    pago: ["pago"],
    cancelado: ["cancelado"],
  });
}

export function assertReceivableTransition(
  from: AccountReceivableStatus,
  to: AccountReceivableStatus
) {
  assertTransition("conta a receber", from, to, {
    pendente: ["recebido", "vencido", "cancelado", "pendente"],
    vencido: ["recebido", "cancelado", "vencido"],
    recebido: ["recebido"],
    cancelado: ["cancelado"],
  });
}
