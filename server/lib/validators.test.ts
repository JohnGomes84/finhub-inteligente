/**
 * Testes para Validadores
 * Valida regras de validação do sistema legado
 */

import { describe, it, expect } from "vitest";
import {
  validateCPF,
  validateCNPJ,
  validatePixKey,
  detectPixKeyType,
  validateEmail,
  validatePhone,
  isNotFutureDate,
  isPaymentDateValid,
  isPositiveValue,
  isNonNegativeValue,
  validateShiftCode,
  isNightShift,
  normalizeFunctionName,
  isFunctionNameEqual,
  isValidTimeRange,
  calculateMargin,
  isPositiveMargin,
  calculateTotalToPay,
  isValidPaymentComponents,
} from "./validators";

// ============================================================
// TESTES: CPF
// ============================================================
describe("validateCPF", () => {
  it("deve aceitar CPF válido com máscara", () => {
    expect(validateCPF("123.456.789-09")).toBe(true);
  });

  it("deve aceitar CPF válido sem máscara", () => {
    expect(validateCPF("12345678909")).toBe(true);
  });

  it("deve rejeitar CPF inválido", () => {
    expect(validateCPF("000.000.000-00")).toBe(false);
  });

  it("deve rejeitar CPF com comprimento incorreto", () => {
    expect(validateCPF("123.456.789")).toBe(false);
  });

  it("deve rejeitar CPF vazio", () => {
    expect(validateCPF("")).toBe(false);
  });
});

// ============================================================
// TESTES: CNPJ
// ============================================================
describe("validateCNPJ", () => {
  it("deve aceitar CNPJ válido com máscara", () => {
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it("deve aceitar CNPJ válido sem máscara", () => {
    expect(validateCNPJ("11222333000181")).toBe(true);
  });

  it("deve rejeitar CNPJ inválido", () => {
    expect(validateCNPJ("00.000.000/0000-00")).toBe(false);
  });

  it("deve rejeitar CNPJ com comprimento incorreto", () => {
    expect(validateCNPJ("11.222.333")).toBe(false);
  });

  it("deve rejeitar CNPJ vazio", () => {
    expect(validateCNPJ("")).toBe(false);
  });
});

// ============================================================
// TESTES: CHAVE PIX
// ============================================================
describe("validatePixKey", () => {
  it("deve aceitar chave PIX do tipo CPF", () => {
    expect(validatePixKey("123.456.789-09", "cpf")).toBe(true);
  });

  it("deve aceitar chave PIX do tipo CNPJ", () => {
    expect(validatePixKey("11.222.333/0001-81", "cnpj")).toBe(true);
  });

  it("deve aceitar chave PIX do tipo Email", () => {
    expect(validatePixKey("user@example.com", "email")).toBe(true);
  });

  it("deve aceitar chave PIX do tipo Telefone", () => {
    expect(validatePixKey("11987654321", "phone")).toBe(true);
  });

  it("deve rejeitar chave PIX vazia", () => {
    expect(validatePixKey("")).toBe(false);
  });
});

describe("detectPixKeyType", () => {
  it("deve detectar tipo CPF", () => {
    expect(detectPixKeyType("12345678909")).toBe("cpf");
  });

  it("deve detectar tipo CNPJ", () => {
    expect(detectPixKeyType("11222333000181")).toBe("cnpj");
  });

  it("deve detectar tipo Email", () => {
    expect(detectPixKeyType("user@example.com")).toBe("email");
  });

  it("deve detectar tipo Telefone", () => {
    // Telefone com 10 dígitos (sem 9 no meio)
    expect(detectPixKeyType("1133334444")).toBe("phone");
  });
});

// ============================================================
// TESTES: EMAIL
// ============================================================
describe("validateEmail", () => {
  it("deve aceitar email válido", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("deve rejeitar email sem @", () => {
    expect(validateEmail("userexample.com")).toBe(false);
  });

  it("deve rejeitar email vazio", () => {
    expect(validateEmail("")).toBe(false);
  });
});

// ============================================================
// TESTES: TELEFONE
// ============================================================
describe("validatePhone", () => {
  it("deve aceitar telefone com 11 dígitos", () => {
    expect(validatePhone("11987654321")).toBe(true);
  });

  it("deve aceitar telefone com 10 dígitos", () => {
    expect(validatePhone("1133334444")).toBe(true);
  });

  it("deve aceitar telefone com máscara", () => {
    expect(validatePhone("(11) 9 8765-4321")).toBe(true);
  });

  it("deve rejeitar telefone com menos de 10 dígitos", () => {
    expect(validatePhone("119876543")).toBe(false);
  });

  it("deve rejeitar telefone vazio", () => {
    expect(validatePhone("")).toBe(false);
  });
});

// ============================================================
// TESTES: DATA
// ============================================================
describe("isNotFutureDate", () => {
  it("deve aceitar data no passado", () => {
    const pastDate = new Date("2020-01-01");
    expect(isNotFutureDate(pastDate)).toBe(true);
  });

  it("deve aceitar data atual", () => {
    const today = new Date();
    expect(isNotFutureDate(today)).toBe(true);
  });

  it("deve rejeitar data futura", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(isNotFutureDate(futureDate)).toBe(false);
  });
});

describe("isPaymentDateValid", () => {
  it("deve aceitar pagamento na data de vencimento", () => {
    const dueDate = new Date("2026-04-05");
    const paymentDate = new Date("2026-04-05");
    expect(isPaymentDateValid(paymentDate, dueDate)).toBe(true);
  });

  it("deve aceitar pagamento após data de vencimento", () => {
    const dueDate = new Date("2026-04-05");
    const paymentDate = new Date("2026-04-06");
    expect(isPaymentDateValid(paymentDate, dueDate)).toBe(true);
  });

  it("deve rejeitar pagamento antes da data de vencimento", () => {
    const dueDate = new Date("2026-04-05");
    const paymentDate = new Date("2026-04-04");
    expect(isPaymentDateValid(paymentDate, dueDate)).toBe(false);
  });
});

// ============================================================
// TESTES: VALORES MONETÁRIOS
// ============================================================
describe("isPositiveValue", () => {
  it("deve aceitar valor positivo", () => {
    expect(isPositiveValue(100)).toBe(true);
    expect(isPositiveValue("100.50")).toBe(true);
  });

  it("deve rejeitar valor zero", () => {
    expect(isPositiveValue(0)).toBe(false);
  });

  it("deve rejeitar valor negativo", () => {
    expect(isPositiveValue(-100)).toBe(false);
  });
});

describe("isNonNegativeValue", () => {
  it("deve aceitar valor positivo", () => {
    expect(isNonNegativeValue(100)).toBe(true);
  });

  it("deve aceitar valor zero", () => {
    expect(isNonNegativeValue(0)).toBe(true);
  });

  it("deve rejeitar valor negativo", () => {
    expect(isNonNegativeValue(-100)).toBe(false);
  });
});

// ============================================================
// TESTES: TURNOS
// ============================================================
describe("validateShiftCode", () => {
  it("deve aceitar código de turno válido", () => {
    expect(validateShiftCode("MLT-1")).toBe(true);
    expect(validateShiftCode("MLT-13")).toBe(true);
  });

  it("deve rejeitar código de turno inválido", () => {
    expect(validateShiftCode("MLT-A")).toBe(false);
    expect(validateShiftCode("MT-1")).toBe(false);
  });
});

describe("isNightShift", () => {
  it("deve detectar turno noturno com início após 22:00", () => {
    expect(isNightShift("22:00", "07:00")).toBe(true);
    expect(isNightShift("23:00", "08:00")).toBe(true);
  });

  it("deve detectar turno diurno", () => {
    expect(isNightShift("06:00", "15:00")).toBe(false);
    expect(isNightShift("08:00", "17:00")).toBe(false);
  });
});

// ============================================================
// TESTES: FUNÇÕES
// ============================================================
describe("normalizeFunctionName", () => {
  it("deve normalizar nome de função", () => {
    expect(normalizeFunctionName("  Aux. Carga e Descarga  ")).toBe(
      "AUX. CARGA E DESCARGA"
    );
  });
});

describe("isFunctionNameEqual", () => {
  it("deve detectar nomes iguais com capitalização diferente", () => {
    expect(
      isFunctionNameEqual("Aux. Carga e Descarga", "aux. carga e descarga")
    ).toBe(true);
  });

  it("deve detectar nomes diferentes", () => {
    expect(
      isFunctionNameEqual("Aux. Carga e Descarga", "Conferente")
    ).toBe(false);
  });
});

// ============================================================
// TESTES: HORÁRIOS
// ============================================================
describe("isValidTimeRange", () => {
  it("deve aceitar horário fim maior que início", () => {
    expect(isValidTimeRange("06:00", "15:00")).toBe(true);
  });

  it("deve aceitar horário com virada de meia-noite", () => {
    expect(isValidTimeRange("22:00", "07:00")).toBe(true);
  });

  it("deve rejeitar horários iguais", () => {
    expect(isValidTimeRange("06:00", "06:00")).toBe(false);
  });
});

// ============================================================
// TESTES: MARGEM
// ============================================================
describe("calculateMargin", () => {
  it("deve calcular margem corretamente", () => {
    expect(calculateMargin(100, 60)).toBe(40);
    expect(calculateMargin("100.50", "60.25")).toBe(40.25);
  });
});

describe("isPositiveMargin", () => {
  it("deve aceitar margem positiva", () => {
    expect(isPositiveMargin(100, 60)).toBe(true);
  });

  it("deve rejeitar margem negativa", () => {
    expect(isPositiveMargin(50, 100)).toBe(false);
  });

  it("deve rejeitar margem zero", () => {
    expect(isPositiveMargin(100, 100)).toBe(false);
  });
});

// ============================================================
// TESTES: FÓRMULA DE PAGAMENTO
// ============================================================
describe("calculateTotalToPay", () => {
  it("deve calcular total a pagar corretamente", () => {
    // (5 dias × 100) - 20 (marmita) - 10 (vale) + 50 (bônus) = 520
    expect(calculateTotalToPay(5, 100, 20, 10, 50)).toBe(520);
  });

  it("deve calcular total com valores padrão", () => {
    // (5 dias × 100) - 0 - 0 + 0 = 500
    expect(calculateTotalToPay(5, 100)).toBe(500);
  });

  it("deve calcular total com strings", () => {
    // (5 dias × 100.50) - 20.50 - 10 + 50 = 502.5 - 20.5 - 10 + 50 = 522
    expect(calculateTotalToPay(5, "100.50", "20.50", "10", "50")).toBe(522);
  });
});

describe("isValidPaymentComponents", () => {
  it("deve aceitar componentes válidos", () => {
    expect(isValidPaymentComponents(20, 10, 50)).toBe(true);
    expect(isValidPaymentComponents(0, 0, 0)).toBe(true);
  });

  it("deve rejeitar componentes negativos", () => {
    expect(isValidPaymentComponents(-20, 10, 50)).toBe(false);
    expect(isValidPaymentComponents(20, -10, 50)).toBe(false);
  });
});
