/**
 * FINHUB — Upload Seguro
 * 
 * Valida uploads: MIME type, tamanho máximo, extensão.
 * Protege contra: malware, DoS, file traversal.
 * 
 * Tipos permitidos:
 * - Imagens: jpg, png, gif, webp
 * - Documentos: pdf, doc, docx, xls, xlsx
 * - Máximo: 10MB
 */

const ALLOWED_MIMES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida arquivo para upload
 * @param mimeType MIME type do arquivo
 * @param fileName Nome do arquivo
 * @param fileSize Tamanho em bytes
 * @returns Resultado da validação
 */
export function validateUpload(
  mimeType: string,
  fileName: string,
  fileSize: number
): UploadValidationResult {
  // 1. Validar MIME type
  if (!ALLOWED_MIMES[mimeType as keyof typeof ALLOWED_MIMES]) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido: ${mimeType}`,
    };
  }

  // 2. Validar extensão
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const allowedExts = ALLOWED_MIMES[mimeType as keyof typeof ALLOWED_MIMES];
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Extensão de arquivo não permitida: ${ext}`,
    };
  }

  // 3. Validar tamanho
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: 10MB, recebido: ${(fileSize / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // 4. Validar nome do arquivo (prevenir path traversal)
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'Nome de arquivo inválido',
    };
  }

  return { valid: true };
}

/**
 * Gera nome de arquivo seguro (remove caracteres perigosos)
 * @param fileName Nome original
 * @returns Nome seguro
 */
export function sanitizeFileName(fileName: string): string {
  // Remove caracteres perigosos
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Gera nome único para arquivo (evita sobrescrita)
 * @param fileName Nome original
 * @returns Nome único com timestamp
 */
export function generateUniqueFileName(fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = sanitized.substring(sanitized.lastIndexOf('.'));
  const name = sanitized.substring(0, sanitized.lastIndexOf('.'));
  
  return `${name}_${timestamp}_${random}${ext}`;
}
