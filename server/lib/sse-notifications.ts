import type { Response } from "express";

interface Subscriber {
  res: Response;
  userId: number;
}

const subscribers: Subscriber[] = [];

/**
 * Registra um subscriber SSE
 */
export function registerSSESubscriber(res: Response, userId: number) {
  const subscriber = { res, userId };
  subscribers.push(subscriber);

  res.on("close", () => {
    const index = subscribers.indexOf(subscriber);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  });
}

/**
 * Notifica criação de solicitação PIX
 */
export function notifyPixRequestCreated(data: {
  requestId: number;
  employeeName: string;
  newPixKey: string;
  createdAt: string;
}) {
  broadcast({
    type: "pix_request_created",
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notifica revisão de solicitação PIX (aprovação/rejeição)
 */
export function notifyPixRequestReviewed(data: {
  requestId: number;
  employeeName: string;
  status: "aprovado" | "rejeitado";
  reviewedByUserId: number;
  reviewNotes?: string;
  reviewedAt: string;
}) {
  broadcast({
    type: "pix_request_reviewed",
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notifica fechamento de presenca pelo lider
 */
export function notifyAttendanceClosed(data: {
  scheduleId: number;
  clientName: string;
  totalPeople: number;
  leaderId: number;
}) {
  broadcast({
    type: "attendance_closed",
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notifica alocacao duplicada detectada
 */
export function notifyDuplicateAllocationDetected(data: {
  employeeId: number;
  employeeName: string;
  date: string;
  conflictingScheduleId: number;
}) {
  broadcast({
    type: "duplicate_allocation_detected",
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Envia mensagem para todos os subscribers
 */
function broadcast(message: any) {
  const sseMessage = `data: ${JSON.stringify(message)}\n\n`;

  subscribers.forEach((subscriber) => {
    try {
      subscriber.res.write(sseMessage);
    } catch (error) {
      console.error("Erro ao enviar SSE:", error);
    }
  });
}

/**
 * Retorna o número de subscribers ativos
 */
export function getSubscriberCount(): number {
  return subscribers.length;
}

/**
 * Limpa todos os subscribers (para testes)
 */
export function clearSubscribers() {
  subscribers.length = 0;
}
