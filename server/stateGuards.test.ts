import { describe, expect, it } from "vitest";
import {
  assertPayableTransition,
  assertPaymentBatchTransition,
  assertReceivableTransition,
  assertScheduleTransition,
} from "./_core/stateGuards";

describe("state guards", () => {
  it("permite transições válidas de planejamento", () => {
    expect(() =>
      assertScheduleTransition("pendente", "validado")
    ).not.toThrow();
    expect(() =>
      assertScheduleTransition("validado", "cancelado")
    ).not.toThrow();
  });

  it("bloqueia transição inválida de planejamento", () => {
    expect(() => assertScheduleTransition("cancelado", "pendente")).toThrow(
      /Transição inválida/
    );
  });

  it("bloqueia lote já pago", () => {
    expect(() => assertPaymentBatchTransition("pago", "cancelado")).toThrow(
      /Transição inválida/
    );
  });

  it("permite vencido para pago em contas", () => {
    expect(() => assertPayableTransition("vencido", "pago")).not.toThrow();
    expect(() =>
      assertReceivableTransition("vencido", "recebido")
    ).not.toThrow();
  });
});
