/**
 * Script de Seed - Dados de Configuração Padrão
 * Popula centros de custo, funções e turnos se as tabelas estiverem vazias
 * Executado automaticamente ao iniciar o servidor
 */

import { getDb } from "../db";
import { costCenters, jobFunctions, shifts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ============================================================
// SEED DE CENTROS DE CUSTO (26 categorias)
// ============================================================
export const COST_CENTERS_SEED = [
  "ALIMENTAÇÃO",
  "ALUGUEL",
  "BANCO",
  "BRINDES",
  "CAIXA OPERACIONAL",
  "COMBUSTÍVEL GESTÃO",
  "COMBUSTÍVEL OPERACIONAL",
  "COMISSÃO",
  "CONTABILIDADE",
  "CONTENCIOSO TRABALHISTA",
  "DESPESAS ADMINISTRATIVAS",
  "ENERGIA",
  "IMOBILIZADO",
  "INFORMÁTICA",
  "JURÍDICO",
  "LOTE DE PAGAMENTO",
  "MARKETING",
  "MATERIAL DE ESCRITÓRIO",
  "PRO LABORE",
  "REEMBOLSO",
  "RH",
  "SEGURO",
  "SERVIÇOS GERAIS",
  "TRANSPORTE",
  "UNIFORME",
  "OUTROS",
];

// ============================================================
// SEED DE FUNÇÕES (11 funções padrão)
// ============================================================
export const JOB_FUNCTIONS_SEED = [
  { name: "Aux. Administrativo", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Aux. Carga e Descarga", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Aux. Carga e Descarga ESPECIAL", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Aux. Carga e Descarga NOTURNO", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Aux. Logístico", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Aux. Serviços Gerais", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Conferente", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Líder", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Operador de Empilhadeira", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Supervisor de Operações", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
  { name: "Auxiliar de Limpeza", defaultPayValue: "0.00", defaultReceiveValue: "0.00" },
];

// ============================================================
// SEED DE TURNOS (13 turnos padrão)
// ============================================================
export const SHIFTS_SEED = [
  { name: "MLT-1", startTime: "06:00", endTime: "15:00" },
  { name: "MLT-2", startTime: "07:00", endTime: "16:00" },
  { name: "MLT-3", startTime: "08:00", endTime: "17:00" },
  { name: "MLT-4", startTime: "09:00", endTime: "18:00" },
  { name: "MLT-5", startTime: "10:00", endTime: "19:00" },
  { name: "MLT-6", startTime: "12:00", endTime: "21:00" },
  { name: "MLT-7", startTime: "13:00", endTime: "22:00" },
  { name: "MLT-8", startTime: "14:00", endTime: "23:00" },
  { name: "MLT-9", startTime: "15:00", endTime: "00:00" }, // Noturno
  { name: "MLT-10", startTime: "17:00", endTime: "02:00" }, // Noturno
  { name: "MLT-11", startTime: "18:00", endTime: "03:00" }, // Noturno
  { name: "MLT-12", startTime: "22:00", endTime: "07:00" }, // Noturno
  { name: "MLT-13", startTime: "00:00", endTime: "09:00" }, // Noturno
];

/**
 * Executar seeds de configuração
 * Popula tabelas vazias com dados padrão
 */
export async function runSeeds() {
  const db = await getDb();
  if (!db) {
    console.warn("[SEED] Database not available, skipping seeds");
    return;
  }

  try {
    // ============================================================
    // SEED: Centros de Custo
    // ============================================================
    const existingCostCenters = await db.select().from(costCenters).limit(1);
    if (existingCostCenters.length === 0) {
      console.log("[SEED] Inserindo 26 centros de custo padrão...");
      
      for (const name of COST_CENTERS_SEED) {
        await db.insert(costCenters).values({
          name,
          isActive: true,
        });
      }
      
      console.log("[SEED] ✅ Centros de custo inseridos com sucesso");
    } else {
      console.log("[SEED] ℹ️  Centros de custo já existem, pulando seed");
    }

    // ============================================================
    // SEED: Funções
    // ============================================================
    const existingFunctions = await db.select().from(jobFunctions).limit(1);
    if (existingFunctions.length === 0) {
      console.log("[SEED] Inserindo 11 funções padrão...");
      
      for (const func of JOB_FUNCTIONS_SEED) {
        await db.insert(jobFunctions).values({
          name: func.name,
          defaultPayValue: func.defaultPayValue,
          defaultReceiveValue: func.defaultReceiveValue,
          isActive: true,
        });
      }
      
      console.log("[SEED] ✅ Funções inseridas com sucesso");
    } else {
      console.log("[SEED] ℹ️  Funções já existem, pulando seed");
    }

    // ============================================================
    // SEED: Turnos
    // ============================================================
    const existingShifts = await db.select().from(shifts).limit(1);
    if (existingShifts.length === 0) {
      console.log("[SEED] Inserindo 13 turnos padrão...");
      
      for (const shift of SHIFTS_SEED) {
        await db.insert(shifts).values({
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          isActive: true,
        });
      }
      
      console.log("[SEED] ✅ Turnos inseridos com sucesso");
    } else {
      console.log("[SEED] ℹ️  Turnos já existem, pulando seed");
    }

    console.log("[SEED] ✅ Todos os seeds foram executados com sucesso!");
  } catch (error) {
    console.error("[SEED] ❌ Erro ao executar seeds:", error);
    throw error;
  }
}
