/**
 * Módulo de Validadores
 * Regras de validação do sistema legado implementadas
 * Reutilizável em todos os módulos
 */

// ============================================================
// VALIDAÇÃO DE CPF
// ============================================================

/**
 * Valida CPF com dígito verificador
 * Formato aceito: 000.000.000-00 ou 00000000000
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;

  // Remove caracteres especiais
  const cleanCPF = cpf.replace(/\D/g, "");

  // Deve ter exatamente 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Não pode ser sequência repetida
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  digit1 = digit1 > 9 ? 0 : digit1;

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  digit2 = digit2 > 9 ? 0 : digit2;

  // Valida dígitos verificadores
  return (
    digit1 === parseInt(cleanCPF[9]) &&
    digit2 === parseInt(cleanCPF[10])
  );
}

// ============================================================
// VALIDAÇÃO DE CNPJ
// ============================================================

/**
 * Valida CNPJ com dígito verificador
 * Formato aceito: 00.000.000/0000-00 ou 00000000000000
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;

  // Remove caracteres especiais
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  // Deve ter exatamente 14 dígitos
  if (cleanCNPJ.length !== 14) return false;

  // Não pode ser sequência repetida
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  const multiplier1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * multiplier1[i];
  }
  let digit1 = 11 - (sum % 11);
  digit1 = digit1 > 9 ? 0 : digit1;

  // Calcula segundo dígito verificador
  sum = 0;
  const multiplier2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * multiplier2[i];
  }
  let digit2 = 11 - (sum % 11);
  digit2 = digit2 > 9 ? 0 : digit2;

  // Valida dígitos verificadores
  return (
    digit1 === parseInt(cleanCNPJ[12]) &&
    digit2 === parseInt(cleanCNPJ[13])
  );
}

// ============================================================
// VALIDAÇÃO DE CHAVE PIX
// ============================================================

/**
 * Tipos de chave PIX aceitos
 */
export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random";

/**
 * Valida chave PIX de acordo com o tipo
 * Aceita: CPF, CNPJ, Email, Telefone, UUID aleatória
 */
export function validatePixKey(pixKey: string, type?: PixKeyType): boolean {
  if (!pixKey) return false;

  // Se tipo não foi especificado, tenta detectar automaticamente
  if (!type) {
    type = detectPixKeyType(pixKey);
  }

  switch (type) {
    case "cpf":
      return validateCPF(pixKey);
    case "cnpj":
      return validateCNPJ(pixKey);
    case "email":
      return validateEmail(pixKey);
    case "phone":
      return validatePhone(pixKey);
    case "random":
      // UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pixKey);
    default:
      return false;
  }
}

/**
 * Detecta o tipo de chave PIX automaticamente
 */
export function detectPixKeyType(pixKey: string): PixKeyType {
  // Email: contém @
  if (pixKey.includes("@")) return "email";

  // UUID aleatória: formato xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pixKey)) {
    return "random";
  }

  const cleanKey = pixKey.replace(/\D/g, "");

  // CNPJ: 14 dígitos (verificar antes de CPF)
  if (cleanKey.length === 14) return "cnpj";

  // CPF: 11 dígitos
  if (cleanKey.length === 11) return "cpf";

  // Telefone: 10 dígitos com DDD (sem 11, pois 11 é ambíguo com CPF)
  if (cleanKey.length === 10) return "phone";

  // Padrão: assume random
  return "random";
}

// ============================================================
// VALIDAÇÃO DE EMAIL
// ============================================================

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================
// VALIDAÇÃO DE TELEFONE
// ============================================================

/**
 * Valida telefone brasileiro
 * Aceita: (11) 9 8765-4321 ou 11987654321
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, "");
  // Deve ter 10 ou 11 dígitos (com DDD)
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

// ============================================================
// VALIDAÇÃO DE DATA
// ============================================================

/**
 * Valida se data não é futura
 */
export function isNotFutureDate(date: Date): boolean {
  return date <= new Date();
}

/**
 * Valida se data de pagamento é >= data de vencimento
 */
export function isPaymentDateValid(paymentDate: Date, dueDate: Date): boolean {
  return paymentDate >= dueDate;
}

// ============================================================
// VALIDAÇÃO DE VALORES MONETÁRIOS
// ============================================================

/**
 * Valida se valor é positivo
 */
export function isPositiveValue(value: number | string): boolean {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return !isNaN(numValue) && numValue > 0;
}

/**
 * Valida se valor é não-negativo (>= 0)
 */
export function isNonNegativeValue(value: number | string): boolean {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return !isNaN(numValue) && numValue >= 0;
}

// ============================================================
// VALIDAÇÃO DE TURNOS
// ============================================================

/**
 * Valida código de turno (MLT-X)
 */
export function validateShiftCode(code: string): boolean {
  return /^MLT-\d+$/.test(code);
}

/**
 * Detecta se turno é noturno
 * Noturno: início após 22:00 ou fim após 06:00 do dia seguinte
 */
export function isNightShift(startTime: string, endTime: string): boolean {
  const [startHour] = startTime.split(":").map(Number);
  const [endHour] = endTime.split(":").map(Number);

  // Início após 22:00
  if (startHour >= 22) return true;

  // Fim após 06:00 do dia seguinte (endHour < startHour indica virada de meia-noite)
  if (endHour < startHour && endHour >= 6) return true;

  return false;
}

// ============================================================
// VALIDAÇÃO DE FUNÇÕES
// ============================================================

/**
 * Normaliza nome de função para comparação
 * Remove espaços extras e converte para uppercase
 */
export function normalizeFunctionName(name: string): string {
  return name.trim().toUpperCase();
}

/**
 * Verifica se dois nomes de função são iguais (normalizado)
 */
export function isFunctionNameEqual(name1: string, name2: string): boolean {
  return normalizeFunctionName(name1) === normalizeFunctionName(name2);
}

// ============================================================
// VALIDAÇÃO DE HORÁRIOS
// ============================================================

/**
 * Valida se horário fim é maior que horário início
 * Considera virada de meia-noite (ex: 22:00 a 06:00)
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;

  // Se fim é menor que início, assume virada de meia-noite
  // Neste caso, é válido (ex: 22:00 a 06:00)
  if (endTotalMin < startTotalMin) {
    return true;
  }

  // Se fim é maior que início, é válido
  if (endTotalMin > startTotalMin) {
    return true;
  }

  // Se são iguais, é inválido
  return false;
}

// ============================================================
// VALIDAÇÃO DE MARGEM
// ============================================================

/**
 * Calcula margem: ML Recebe - ML Paga
 */
export function calculateMargin(mlReceive: number | string, mlPay: number | string): number {
  const receive = typeof mlReceive === "string" ? parseFloat(mlReceive) : mlReceive;
  const pay = typeof mlPay === "string" ? parseFloat(mlPay) : mlPay;
  return receive - pay;
}

/**
 * Valida se margem é positiva
 */
export function isPositiveMargin(mlReceive: number | string, mlPay: number | string): boolean {
  return calculateMargin(mlReceive, mlPay) > 0;
}

// ============================================================
// VALIDAÇÃO DE FÓRMULA DE PAGAMENTO
// ============================================================

/**
 * Calcula total a pagar
 * Fórmula: (Dias × Valor Diário) - Marmita - Vale + Bônus
 */
export function calculateTotalToPay(
  daysWorked: number,
  dailyValue: number | string,
  marmita: number | string = 0,
  vale: number | string = 0,
  bonus: number | string = 0
): number {
  const daily = typeof dailyValue === "string" ? parseFloat(dailyValue) : dailyValue;
  const marmitaVal = typeof marmita === "string" ? parseFloat(marmita) : marmita;
  const valeVal = typeof vale === "string" ? parseFloat(vale) : vale;
  const bonusVal = typeof bonus === "string" ? parseFloat(bonus) : bonus;

  return daysWorked * daily - marmitaVal - valeVal + bonusVal;
}

/**
 * Valida se componentes de pagamento são válidos
 */
export function isValidPaymentComponents(
  marmita: number | string,
  vale: number | string,
  bonus: number | string
): boolean {
  const m = typeof marmita === "string" ? parseFloat(marmita) : marmita;
  const v = typeof vale === "string" ? parseFloat(vale) : vale;
  const b = typeof bonus === "string" ? parseFloat(bonus) : bonus;

  return (
    isNonNegativeValue(m) &&
    isNonNegativeValue(v) &&
    isNonNegativeValue(b)
  );
}
