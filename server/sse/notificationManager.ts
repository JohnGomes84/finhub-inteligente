import { Response } from "express";

export interface NotificationEvent {
  type: "pix_request" | "attendance_closed" | "pix_approved" | "pix_rejected";
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

class NotificationManager {
  private clients: Map<number, Response[]> = new Map();

  subscribe(userId: number, res: Response) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId)!.push(res);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.write("data: {\"type\": \"connected\"}\n\n");

    res.on("close", () => {
      const clients = this.clients.get(userId) || [];
      const index = clients.indexOf(res);
      if (index > -1) {
        clients.splice(index, 1);
      }
      if (clients.length === 0) {
        this.clients.delete(userId);
      }
    });
  }

  broadcast(event: NotificationEvent, targetUserIds?: number[]) {
    const targets = targetUserIds || Array.from(this.clients.keys());

    targets.forEach((userId) => {
      const clients = this.clients.get(userId) || [];
      clients.forEach((res) => {
        try {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        } catch (error) {
          console.error(`Erro ao enviar notificacao para usuario ${userId}:`, error);
        }
      });
    });
  }

  notifyPixRequest(
    requestId: number,
    employeeName: string,
    employeeCpf: string,
    newPixKey: string,
    adminIds: number[]
  ) {
    this.broadcast(
      {
        type: "pix_request",
        title: "Nova Solicitação de PIX",
        message: `${employeeName} (${employeeCpf}) solicitou alteração de chave PIX`,
        data: { requestId, employeeName, employeeCpf, newPixKey },
        timestamp: new Date(),
      },
      adminIds
    );
  }

  notifyAttendanceClosed(
    scheduleId: number,
    clientName: string,
    totalPeople: number,
    adminIds: number[]
  ) {
    this.broadcast(
      {
        type: "attendance_closed",
        title: "Presença Fechada",
        message: `Líder fechou presença de ${totalPeople} diaristas em ${clientName}`,
        data: { scheduleId, clientName, totalPeople },
        timestamp: new Date(),
      },
      adminIds
    );
  }

  notifyPixApproved(
    requestId: number,
    employeeName: string,
    employeeCpf: string,
    leaderIds: number[]
  ) {
    this.broadcast(
      {
        type: "pix_approved",
        title: "PIX Aprovado",
        message: `Alteração de PIX de ${employeeName} foi aprovada`,
        data: { requestId, employeeName, employeeCpf },
        timestamp: new Date(),
      },
      leaderIds
    );
  }

  notifyPixRejected(
    requestId: number,
    employeeName: string,
    employeeCpf: string,
    reason: string,
    leaderIds: number[]
  ) {
    this.broadcast(
      {
        type: "pix_rejected",
        title: "PIX Rejeitado",
        message: `Alteração de PIX de ${employeeName} foi rejeitada: ${reason}`,
        data: { requestId, employeeName, employeeCpf, reason },
        timestamp: new Date(),
      },
      leaderIds
    );
  }
}

export const notificationManager = new NotificationManager();
