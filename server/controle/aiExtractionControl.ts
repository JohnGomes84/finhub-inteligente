import { invokeLLM } from "../_core/llm";
import { logAudit } from "./auditControl";
import { updateDocumentStatus } from "./documentControl";

/**
 * AI Extraction Control Module - Extração inteligente de dados de documentos
 * Usa LLM para processar OFX, XML, PDF e imagens
 */

export interface ExtractedInvoiceData {
  documentNumber?: string;
  issuerName?: string;
  issuerCNPJ?: string;
  issueDate?: string;
  dueDate?: string;
  amount?: string;
  description?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
  confidence: number;
}

export interface ExtractedBankStatementData {
  bankName?: string;
  accountNumber?: string;
  statementDate?: string;
  openingBalance?: string;
  closingBalance?: string;
  transactions: Array<{
    date: string;
    description: string;
    amount: string;
    type: "debit" | "credit";
  }>;
  confidence: number;
}

/**
 * Extrair dados de nota fiscal (PDF/Imagem)
 */
export async function extractInvoiceData(
  fileUrl: string,
  mimeType: string,
  userId: number,
  documentId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<ExtractedInvoiceData | null> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um especialista em extração de dados de documentos fiscais brasileiros. 
          Analise a imagem/PDF fornecida e extraia as seguintes informações em formato JSON:
          - documentNumber: número da nota fiscal
          - issuerName: nome da empresa emissora
          - issuerCNPJ: CNPJ da empresa
          - issueDate: data de emissão (YYYY-MM-DD)
          - dueDate: data de vencimento (YYYY-MM-DD)
          - amount: valor total (com ponto como separador decimal)
          - description: descrição do serviço/produto
          - items: array de itens com description, quantity, unitPrice, total
          - confidence: confiança da extração (0-100)
          
          Retorne APENAS o JSON válido, sem explicações adicionais.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extraia os dados desta nota fiscal:",
            },
            {
              type: "file_url",
              file_url: {
                url: fileUrl,
                mime_type: (mimeType === "application/pdf" ? "application/pdf" : undefined) as any,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "invoice_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              documentNumber: { type: "string" },
              issuerName: { type: "string" },
              issuerCNPJ: { type: "string" },
              issueDate: { type: "string" },
              dueDate: { type: "string" },
              amount: { type: "string" },
              description: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    quantity: { type: "number" },
                    unitPrice: { type: "string" },
                    total: { type: "string" },
                  },
                },
              },
              confidence: { type: "number" },
            },
            required: ["confidence"],
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== 'string') return null;

    const extractedData = JSON.parse(content) as ExtractedInvoiceData;

    if (documentId && userId) {
      await updateDocumentStatus(
        userId,
        documentId,
        extractedData.confidence >= 80 ? "processed" : "pending",
        extractedData as unknown as Record<string, unknown>,
        ipAddress,
        userAgent
      );

      await logAudit(
        userId,
        "EXTRACT",
        "fiscal_documents",
        documentId,
        null,
        { confidence: extractedData.confidence },
        "success",
        ipAddress,
        userAgent
      );
    }

    return extractedData;
  } catch (error) {
    console.error("[AIExtractionControl] Error extracting invoice data:", error);

    if (documentId && userId) {
      await logAudit(
        userId,
        "EXTRACT",
        "fiscal_documents",
        documentId,
        null,
        null,
        "failure",
        ipAddress,
        userAgent,
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return null;
  }
}

/**
 * Extrair dados de extrato bancário (OFX/XML)
 */
export async function extractBankStatementData(
  fileUrl: string,
  mimeType: string,
  userId: number,
  statementId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<ExtractedBankStatementData | null> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um especialista em análise de extratos bancários. 
          Analise o arquivo OFX/XML fornecido e extraia as seguintes informações em formato JSON:
          - bankName: nome do banco
          - accountNumber: número da conta
          - statementDate: data do extrato (YYYY-MM-DD)
          - openingBalance: saldo inicial (com ponto como separador decimal)
          - closingBalance: saldo final (com ponto como separador decimal)
          - transactions: array de transações com date (YYYY-MM-DD), description, amount, type (debit/credit)
          - confidence: confiança da extração (0-100)
          
          Retorne APENAS o JSON válido, sem explicações adicionais.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extraia os dados deste extrato bancário:",
            },
            {
              type: "file_url",
              file_url: {
                url: fileUrl,
                mime_type: (mimeType === "application/pdf" ? "application/pdf" : undefined) as any,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bank_statement_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              bankName: { type: "string" },
              accountNumber: { type: "string" },
              statementDate: { type: "string" },
              openingBalance: { type: "string" },
              closingBalance: { type: "string" },
              transactions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    description: { type: "string" },
                    amount: { type: "string" },
                    type: { type: "string", enum: ["debit", "credit"] },
                  },
                },
              },
              confidence: { type: "number" },
            },
            required: ["transactions", "confidence"],
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== 'string') return null;

    const extractedData = JSON.parse(content) as ExtractedBankStatementData;

    if (statementId && userId) {
      await logAudit(
        userId,
        "EXTRACT",
        "bank_statements",
        statementId,
        null,
        { confidence: extractedData.confidence, transactionCount: extractedData.transactions.length },
        "success",
        ipAddress,
        userAgent
      );
    }

    return extractedData;
  } catch (error) {
    console.error("[AIExtractionControl] Error extracting bank statement data:", error);

    if (statementId && userId) {
      await logAudit(
        userId,
        "EXTRACT",
        "bank_statements",
        statementId,
        null,
        null,
        "failure",
        ipAddress,
        userAgent,
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return null;
  }
}

/**
 * Categorizar transação automaticamente baseado em descrição
 */
export async function categorizeTransaction(
  description: string,
  amount: string,
  type: "income" | "expense"
): Promise<{ category: string; confidence: number }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um especialista em categorização de transações financeiras. 
          Baseado na descrição e tipo de transação, sugira uma categoria apropriada.
          
          Categorias de DESPESA: Alimentação, Transporte, Utilities, Aluguel, Salários, Impostos, Saúde, Educação, Entretenimento, Outros
          Categorias de RECEITA: Salário, Vendas, Investimentos, Aluguel Recebido, Freelance, Outros
          
          Retorne um JSON com a categoria sugerida e confiança (0-100).`,
        },
        {
          role: "user",
          content: `Categorize esta transação:
          Tipo: ${type}
          Descrição: ${description}
          Valor: ${amount}
          
          Retorne APENAS: {"category": "nome_categoria", "confidence": número}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "transaction_category",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["category", "confidence"],
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== 'string') return { category: "Outros", confidence: 0 };

    return JSON.parse(content);
  } catch (error) {
    console.error("[AIExtractionControl] Error categorizing transaction:", error);
    return { category: "Outros", confidence: 0 };
  }
}
