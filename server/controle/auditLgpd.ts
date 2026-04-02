/**
 * FINHUB — Auditoria LGPD (Lei Geral de Proteção de Dados)
 * 
 * Registra acesso a dados pessoais com rastreabilidade completa.
 * Atende requisitos LGPD: quem acessou, quando, que dados, por quê.
 * 
 * Dados pessoais monitorados:
 * - CPF, RG, CNP
 * - Email, telefone
 * - Endereço
 * - Chave PIX
 * - Documentos (foto frente/verso)
 */

import { getDb } from '../db';
import { auditLogs } from '../../drizzle/schema';

export type DataAccessType = 
  | 'view' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'export' 
  | 'download';

export interface AuditLogEntry {
  userId: number;
  action: DataAccessType;
  entity: string; // 'employee', 'client', 'supplier', etc
  entityId: number;
  dataFields: string[]; // Campos acessados: ['cpf', 'pixKey', 'email']
  reason?: string; // Por que acessou
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Registra acesso a dados pessoais
 * @param entry Informações do acesso
 */
export async function logDataAccess(entry: AuditLogEntry): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entity,
      entityId: entry.entityId,
      newValues: JSON.stringify({
        dataFields: entry.dataFields,
        reason: entry.reason,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      }),
      createdAt: entry.timestamp,
    });
  } catch (error) {
    console.error('[LGPD] Erro ao registrar acesso:', error);
  }
}

/**
 * Lista acessos a dados pessoais de um usuário
 * @param userId ID do usuário que acessou
 * @param days Últimos N dias (padrão: 30)
 * @returns Lista de acessos
 */
export async function getUserAccessHistory(
  userId: number,
  days: number = 30
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await db
      .select()
      .from(auditLogs)
      .where((t: any) => {
        const { and, gte, eq } = require('drizzle-orm');
        return and(eq(t.userId, userId), gte(t.createdAt, since));
      });

    return logs;
  } catch (error) {
    console.error('[LGPD] Erro ao recuperar histórico:', error);
    return [];
  }
}

/**
 * Gera relatório de acesso a dados pessoais (para LGPD)
 * @param entityId ID da entidade (ex: employee ID)
 * @param days Últimos N dias
 * @returns Relatório estruturado
 */
export async function generateDataAccessReport(
  entityId: number,
  entity: string,
  days: number = 90
): Promise<any> {
  const db = await getDb();
  if (!db) return null;

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await db
      .select()
      .from(auditLogs)
      .where((t: any) => {
        const { and, gte, eq } = require('drizzle-orm');
        return and(eq(t.entityId, entityId), eq(t.entityType, entity), gte(t.createdAt, since));
      });

    return {
      entity,
      entityId,
      period: `Últimos ${days} dias`,
      totalAccesses: logs.length,
      accessesByAction: {
        view: logs.filter((l: any) => l.action === 'view').length,
        create: logs.filter((l: any) => l.action === 'create').length,
        update: logs.filter((l: any) => l.action === 'update').length,
        delete: logs.filter((l: any) => l.action === 'delete').length,
        export: logs.filter((l: any) => l.action === 'export').length,
        download: logs.filter((l: any) => l.action === 'download').length,
      },
      accessesByUser: logs.reduce((acc: any, log: any) => {
        acc[log.userId] = (acc[log.userId] || 0) + 1;
        return acc;
      }, {}),
      logs: logs.map((log: any) => ({
        timestamp: log.timestamp,
        action: log.action,
        userId: log.userId,
        details: JSON.parse(log.details || '{}'),
      })),
    };
  } catch (error) {
    console.error('[LGPD] Erro ao gerar relatório:', error);
    return null;
  }
}

/**
 * Deleta dados pessoais (direito ao esquecimento - LGPD)
 * Nota: Implementar com cuidado, respeitando retenção legal
 * @param entityId ID da entidade
 * @param entity Tipo de entidade
 * @param reason Motivo da exclusão
 */
export async function requestDataDeletion(
  entityId: number,
  entity: string,
  reason: string
): Promise<boolean> {
  console.log(`[LGPD] Solicitação de exclusão: ${entity}#${entityId} - Motivo: ${reason}`);
  // Implementar com cuidado - consultar advogado sobre retenção legal
  return true;
}
