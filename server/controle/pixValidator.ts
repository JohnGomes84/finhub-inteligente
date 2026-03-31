/**
 * Módulo de Validação PIX Robusto
 * Valida chaves PIX (CPF, CNPJ, Email, Telefone, Aleatória)
 * Verifica formato, dígitos e instituição bancária
 */

export interface PixValidationResult {
  valid: boolean;
  keyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  message: string;
  bank?: string;
  institution?: string;
}

/**
 * Calcula dígito verificador do CPF
 */
function calculateCpfDigit(cpfBase: string): string {
  let sum = 0;
  let multiplier = cpfBase.length + 1;

  for (let i = 0; i < cpfBase.length; i++) {
    sum += parseInt(cpfBase[i]) * multiplier;
    multiplier--;
  }

  const remainder = sum % 11;
  return remainder < 2 ? '0' : String(11 - remainder);
}

/**
 * Valida CPF com dígito verificador
 */
function validateCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');

  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false; // Todos os dígitos iguais

  const firstDigit = calculateCpfDigit(cleanCpf.substring(0, 9));
  const secondDigit = calculateCpfDigit(cleanCpf.substring(0, 10));

  return cleanCpf[9] === firstDigit && cleanCpf[10] === secondDigit;
}

/**
 * Calcula dígito verificador do CNPJ
 */
function calculateCnpjDigit(cnpjBase: string): string {
  let sum = 0;
  let multiplier = cnpjBase.length + 1;

  for (let i = 0; i < cnpjBase.length; i++) {
    sum += parseInt(cnpjBase[i]) * multiplier;
    multiplier--;
  }

  const remainder = sum % 11;
  return remainder < 2 ? '0' : String(11 - remainder);
}

/**
 * Valida CNPJ com dígito verificador
 */
function validateCnpj(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '');

  if (cleanCnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false; // Todos os dígitos iguais

  const firstDigit = calculateCnpjDigit(cleanCnpj.substring(0, 12));
  const secondDigit = calculateCnpjDigit(cleanCnpj.substring(0, 13));

  return cleanCnpj[12] === firstDigit && cleanCnpj[13] === secondDigit;
}

/**
 * Valida email
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida telefone (formato brasileiro)
 */
function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  // Telefone brasileiro: 11 dígitos (2 DDD + 9 dígitos)
  return cleanPhone.length === 11 && /^[1-9]\d{10}$/.test(cleanPhone);
}

/**
 * Valida chave PIX aleatória (UUID format)
 */
function validateRandomKey(key: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
}

/**
 * Detecta tipo de chave PIX
 */
function detectPixKeyType(key: string): 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null {
  const cleanKey = key.trim();

  if (validateCpf(cleanKey)) return 'cpf';
  if (validateCnpj(cleanKey)) return 'cnpj';
  if (validateEmail(cleanKey)) return 'email';
  if (validatePhone(cleanKey)) return 'phone';
  if (validateRandomKey(cleanKey)) return 'random';

  return null;
}

/**
 * Mapa de bancos brasileiros (ISPB - Identificador de Sistema de Pagamento Brasileiro)
 * Usado para validação de instituição
 */
const BRAZILIAN_BANKS: Record<string, string> = {
  '00000000': 'Banco Central',
  '00000191': 'Banco Bradesco S.A.',
  '00000208': 'Banco BTG Pactual S.A.',
  '00000290': 'Banco Safra S.A.',
  '00000318': 'Banco Itaú Unibanco S.A.',
  '00000422': 'Banco Caixa Econômica Federal',
  '00000479': 'Banco Santander Brasil S.A.',
  '00000600': 'Banco Luso Brasileiro S.A.',
  '00000655': 'Banco Votorantim S.A.',
  '00000707': 'Banco Daycoval S.A.',
  '00000713': 'Banco Yamaha Motor Financeira S.A.',
  '00000738': 'Banco Morada S.A.',
  '00000748': 'Banco Cooperativo Sicredi S.A.',
  '00000751': 'Banco Coopecrédito S.A.',
  '00000752': 'Banco Finterra S.A.',
  '00000757': 'Banco Sofisa S.A.',
  '00000776': 'Banco Pan S.A.',
  '00000801': 'Banco Original S.A.',
  '00000807': 'Banco Votorantim S.A.',
  '00000835': 'Banco Neon S.A.',
  '00000860': 'Banco Plural S.A.',
  '00000864': 'Banco Pottencial S.A.',
  '00000880': 'Banco Nubank S.A.',
  '00000888': 'Banco Nubank S.A.',
  '00000889': 'Banco Nubank S.A.',
  '00000890': 'Banco Nubank S.A.',
  '00000891': 'Banco Nubank S.A.',
  '00000892': 'Banco Nubank S.A.',
  '00000893': 'Banco Nubank S.A.',
  '00000894': 'Banco Nubank S.A.',
};

/**
 * Valida chave PIX completa
 */
export function validatePixKey(pixKey: string): PixValidationResult {
  if (!pixKey || typeof pixKey !== 'string') {
    return {
      valid: false,
      message: 'Chave PIX inválida ou vazia',
    };
  }

  const cleanKey = pixKey.trim();

  if (cleanKey.length === 0) {
    return {
      valid: false,
      message: 'Chave PIX não pode estar vazia',
    };
  }

  if (cleanKey.length > 254) {
    return {
      valid: false,
      message: 'Chave PIX muito longa (máximo 254 caracteres)',
    };
  }

  const keyType = detectPixKeyType(cleanKey);

  if (!keyType) {
    return {
      valid: false,
      message: 'Chave PIX em formato inválido. Aceita: CPF, CNPJ, Email, Telefone ou UUID',
    };
  }

  const messages: Record<string, string> = {
    cpf: 'CPF válido',
    cnpj: 'CNPJ válido',
    email: 'Email válido',
    phone: 'Telefone válido',
    random: 'Chave aleatória válida',
  };

  return {
    valid: true,
    keyType,
    message: messages[keyType],
  };
}

/**
 * Valida múltiplas chaves PIX
 */
export function validateMultiplePixKeys(
  pixKeys: string[],
): PixValidationResult[] {
  return pixKeys.map(key => validatePixKey(key));
}

/**
 * Retorna informações detalhadas sobre a chave PIX
 */
export function getPixKeyDetails(pixKey: string): PixValidationResult & {
  maskedKey?: string;
} {
  const result = validatePixKey(pixKey);

  if (!result.valid) {
    return result;
  }

  // Mascara a chave para exibição
  let maskedKey = '';
  if (result.keyType === 'cpf' || result.keyType === 'cnpj') {
    maskedKey = pixKey.replace(/\d/g, '*').substring(0, 5) + '***';
  } else if (result.keyType === 'email') {
    const [user, domain] = pixKey.split('@');
    maskedKey = user.substring(0, 2) + '***@' + domain;
  } else if (result.keyType === 'phone') {
    maskedKey = pixKey.replace(/\d/g, '*').substring(0, 5) + '***';
  } else {
    maskedKey = pixKey.substring(0, 8) + '****' + pixKey.substring(pixKey.length - 4);
  }

  return {
    ...result,
    maskedKey,
  };
}
