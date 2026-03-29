import { eq, and } from "drizzle-orm";
import { notifications } from "../../drizzle/schema";
import { getDb } from "../db";
import { logAudit } from "./auditControl";
import { notifyOwner } from "../_core/notification";

/**
 * Notification Control Module - Gerenciamento de alertas e notificações
 * Suporta notificações de vencimentos, reconciliação e eventos críticos
 */

export type NotificationType = "payment_due" | "payment_overdue" | "low_balance" | "reconciliation_alert" | "system";

/**
 * Criar notificação
 */
export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  relatedTransactionId?: number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      relatedTransactionId,
      isRead: false,
    });

    const notificationId = result[0]?.insertId;
    if (notificationId) {
      await logAudit(
        userId,
        "CREATE",
        "notifications",
        notificationId as number,
        null,
        { type, title },
        "success",
        ipAddress,
        userAgent
      );
    }

    return notificationId;
  } catch (error) {
    console.error("[NotificationControl] Error creating notification:", error);
    await logAudit(
      userId,
      "CREATE",
      "notifications",
      undefined,
      null,
      null,
      "failure",
      ipAddress,
      userAgent,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

/**
 * Obter notificações do usuário
 */
export async function getUserNotifications(
  userId: number,
  unreadOnly: boolean = false,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions: any[] = [eq(notifications.userId, userId)];

    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(notifications.createdAt)
      .limit(limit)
      .offset(offset);

    return results;
  } catch (error) {
    console.error("[NotificationControl] Error getting notifications:", error);
    return [];
  }
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsRead(
  userId: number,
  notificationId: number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId)));

    await logAudit(
      userId,
      "UPDATE",
      "notifications",
      notificationId,
      { isRead: false },
      { isRead: true },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[NotificationControl] Error marking notification as read:", error);
    return false;
  }
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllNotificationsAsRead(
  userId: number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    await logAudit(
      userId,
      "UPDATE",
      "notifications",
      undefined,
      { isRead: false },
      { isRead: true },
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[NotificationControl] Error marking all notifications as read:", error);
    return false;
  }
}

/**
 * Notificar sobre pagamento vencido
 */
export async function notifyPaymentOverdue(
  userId: number,
  transactionId: number,
  description: string,
  dueDate: Date,
  amount: string,
  ipAddress?: string,
  userAgent?: string
) {
  const title = "Pagamento Vencido";
  const message = `O pagamento "${description}" venceu em ${dueDate.toLocaleDateString("pt-BR")}. Valor: R$ ${amount}`;

  const notificationId = await createNotification(
    userId,
    "payment_overdue",
    title,
    message,
    transactionId,
    ipAddress,
    userAgent
  );

  // Notificar owner também
  await notifyOwner({
    title: `Pagamento Vencido - Usuário ${userId}`,
    content: message,
  });

  return notificationId;
}

/**
 * Notificar sobre pagamento próximo ao vencimento
 */
export async function notifyPaymentDue(
  userId: number,
  transactionId: number,
  description: string,
  dueDate: Date,
  amount: string,
  daysUntilDue: number,
  ipAddress?: string,
  userAgent?: string
) {
  const title = `Pagamento Vence em ${daysUntilDue} dia(s)`;
  const message = `O pagamento "${description}" vence em ${dueDate.toLocaleDateString("pt-BR")}. Valor: R$ ${amount}`;

  return createNotification(
    userId,
    "payment_due",
    title,
    message,
    transactionId,
    ipAddress,
    userAgent
  );
}

/**
 * Notificar sobre conciliação pendente
 */
export async function notifyReconciliationPending(
  userId: number,
  transactionCount: number,
  ipAddress?: string,
  userAgent?: string
) {
  const title = "Conciliação Bancária Pendente";
  const message = `${transactionCount} transação(ões) aguardando conciliação. Revise e aprove as correspondências.`;

  return createNotification(
    userId,
    "reconciliation_alert",
    title,
    message,
    undefined,
    ipAddress,
    userAgent
  );
}

/**
 * Notificar sobre saldo baixo
 */
export async function notifyLowBalance(
  userId: number,
  accountName: string,
  currentBalance: string,
  threshold: string,
  ipAddress?: string,
  userAgent?: string
) {
  const title = "Saldo Baixo";
  const message = `A conta "${accountName}" tem saldo de R$ ${currentBalance}, abaixo do limite de R$ ${threshold}`;

  return createNotification(
    userId,
    "low_balance",
    title,
    message,
    undefined,
    ipAddress,
    userAgent
  );
}

/**
 * Obter contagem de notificações não lidas
 */
export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  try {
    const results = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return results.length;
  } catch (error) {
    console.error("[NotificationControl] Error getting unread notification count:", error);
    return 0;
  }
}

/**
 * Deletar notificação
 */
export async function deleteNotification(
  userId: number,
  notificationId: number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    // Soft delete via isRead
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId)));

    await logAudit(
      userId,
      "DELETE",
      "notifications",
      notificationId,
      null,
      null,
      "success",
      ipAddress,
      userAgent
    );

    return true;
  } catch (error) {
    console.error("[NotificationControl] Error deleting notification:", error);
    return false;
  }
}
