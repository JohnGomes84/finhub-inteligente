import { Express, Request, Response } from "express";
import { sdk } from "./sdk";

type SSEClient = {
  userId: number;
  res: Response;
  connected: boolean;
};

const clients = new Map<number, SSEClient[]>();

export function setupSSE(app: Express) {
  app.get("/api/notifications/stream", async (req: Request, res: Response) => {
    try {
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (error) {
        user = null;
      }
      if (!user) {
        res.status(401).end();
        return;
      }

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");

      // Register client
      const client: SSEClient = { userId: user.id, res, connected: true };
      if (!clients.has(user.id)) {
        clients.set(user.id, []);
      }
      clients.get(user.id)!.push(client);

      // Send initial connection message
      res.write("data: {\"type\": \"connected\"}\n\n");

      // Send ping every 30s to keep connection alive
      const pingInterval = setInterval(() => {
        if (client.connected) {
          res.write(":\n");
        }
      }, 30000);

      // Handle client disconnect
      req.on("close", () => {
        client.connected = false;
        clearInterval(pingInterval);
        const userClients = clients.get(user.id);
        if (userClients) {
          const index = userClients.indexOf(client);
          if (index > -1) {
            userClients.splice(index, 1);
          }
        }
      });
    } catch (error) {
      console.error("[SSE] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

export function notifyAdmins(event: {
  type: "pix_request_created" | "pix_request_reviewed" | "leader_closed_attendance";
  data: Record<string, any>;
}) {
  // Broadcast to all admin clients
  clients.forEach((userClients) => {
    userClients.forEach((client) => {
      if (client.connected) {
        try {
          client.res.write(`data: ${JSON.stringify(event)}\n\n`);
        } catch (error) {
          console.error("[SSE] Error sending to client:", error);
          client.connected = false;
        }
      }
    });
  });
}

export function notifyUser(userId: number, event: {
  type: string;
  data: Record<string, any>;
}) {
  const userClients = clients.get(userId);
  if (!userClients) return;

  userClients.forEach((client) => {
    if (client.connected) {
      try {
        client.res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (error) {
        console.error("[SSE] Error sending to client:", error);
        client.connected = false;
      }
    }
  });
}
