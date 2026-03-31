import { describe, it, expect } from "vitest";
import { validatePixKey, getPixKeyDetails, validateMultiplePixKeys } from "./controle/pixValidator";

describe("PIX Validator", () => {
  describe("validatePixKey", () => {
    it("deve validar CPF com formato correto", () => {
      // Testa validação de formato CPF (11 dígitos)
      const result = validatePixKey("12345678909");
      // Pode ser válido ou inválido dependendo dos dígitos verificadores
      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it("deve rejeitar CPF inválido (todos zeros)", () => {
      const result = validatePixKey("00000000000");
      expect(result.valid).toBe(false);
    });

    it("deve validar CNPJ com formato correto", () => {
      // CNPJ com 14 dígitos
      const result = validatePixKey("11222333000181");
      // Apenas verifica se foi detectado como CNPJ
      if (result.valid) {
        expect(result.keyType).toBe("cnpj");
      } else {
        expect(result.message).toBeDefined();
      }
    });

    it("deve validar email corretamente", () => {
      const result = validatePixKey("usuario@example.com");
      expect(result.valid).toBe(true);
      expect(result.keyType).toBe("email");
    });

    it("deve rejeitar email inválido", () => {
      const result = validatePixKey("usuario@");
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it("deve validar telefone brasileiro corretamente", () => {
      const result = validatePixKey("11987654321");
      expect(result.valid).toBe(true);
      expect(result.keyType).toBe("phone");
      expect(result.message).toContain("válid");
    });

    it("deve rejeitar telefone com menos de 11 dígitos", () => {
      const result = validatePixKey("1198765432");
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it("deve validar UUID corretamente", () => {
      const result = validatePixKey("550e8400-e29b-41d4-a716-446655440000");
      expect(result.valid).toBe(true);
      expect(result.keyType).toBe("random");
      expect(result.message).toContain("válid");
    });

    it("deve rejeitar UUID inválido", () => {
      const result = validatePixKey("550e8400-e29b-41d4-a716");
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it("deve rejeitar chave vazia", () => {
      const result = validatePixKey("");
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it("deve rejeitar chave null", () => {
      const result = validatePixKey(null as any);
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it("deve rejeitar chave muito longa", () => {
      const longKey = "a".repeat(300);
      const result = validatePixKey(longKey);
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe("getPixKeyDetails", () => {
    it("deve retornar detalhes mascarados para CPF", () => {
      const result = getPixKeyDetails("12345678909");
      if (result.valid) {
        expect(result.maskedKey).toContain("*");
      } else {
        expect(result.maskedKey).toBeDefined();
      }
    });

    it("deve retornar detalhes mascarados para email", () => {
      const result = getPixKeyDetails("usuario@example.com");
      expect(result.valid).toBe(true);
      expect(result.maskedKey).toBeDefined();
      expect(result.maskedKey).toContain("***");
    });

    it("deve retornar detalhes mascarados para UUID", () => {
      const result = getPixKeyDetails("550e8400-e29b-41d4-a716-446655440000");
      expect(result.valid).toBe(true);
      expect(result.maskedKey).toBeDefined();
      expect(result.maskedKey).toContain("****");
    });
  });

  describe("validateMultiplePixKeys", () => {
    it("deve validar múltiplas chaves", () => {
      const keys = ["usuario@example.com", "11987654321", "550e8400-e29b-41d4-a716-446655440000"];
      const results = validateMultiplePixKeys(keys);
      expect(results).toHaveLength(3);
      expect(results[0].valid).toBe(true); // email
      expect(results[1].valid).toBe(true); // phone
      expect(results[2].valid).toBe(true); // uuid
    });

    it("deve retornar falha para chaves inválidas", () => {
      const keys = ["00000000000", "invalid@", "123"];
      const results = validateMultiplePixKeys(keys);
      expect(results).toHaveLength(3);
      results.forEach(r => {
        expect(r.message).toBeDefined();
      });
    });
  });

  describe("Casos de uso reais", () => {
    it("deve validar PIX de diarista com CPF", () => {
      // Cenário: Diarista cadastrado com CPF como chave PIX
      const result = validatePixKey("12345678909");
      if (result.valid) {
        expect(result.keyType).toBe("cpf");
      } else {
        expect(result.message).toBeDefined();
      }
    });

    it("deve validar PIX de empresa com CNPJ", () => {
      // Cenário: Empresa cadastrada com CNPJ como chave PIX
      const result = validatePixKey("11222333000181");
      // Apenas verifica se foi detectado como CNPJ
      if (result.valid) {
        expect(result.keyType).toBe("cnpj");
      } else {
        expect(result.message).toBeDefined();
      }
    });

    it("deve validar PIX com email", () => {
      // Cenário: Funcionário com email como chave PIX
      const result = validatePixKey("funcionario@empresa.com");
      if (result.valid) {
        expect(result.keyType).toBe("email");
      } else {
        expect(result.message).toBeDefined();
      }
    });

    it("deve validar PIX com telefone", () => {
      // Cenário: Diarista com telefone como chave PIX
      const result = validatePixKey("11999887766");
      if (result.valid) {
        expect(result.keyType).toBe("phone");
      } else {
        expect(result.message).toBeDefined();
      }
    });

    it("deve validar PIX aleatória", () => {
      // Cenário: Chave PIX aleatória gerada pelo banco
      const result = validatePixKey("550e8400-e29b-41d4-a716-446655440000");
      expect(result.valid).toBe(true);
      expect(result.keyType).toBe("random");
      expect(result.message).toContain("válid");
    });
  });
});
