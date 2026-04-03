import { Router, Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { notificationManager } from "./notificationManager";

const router = Router();

router.get("/api/notifications/stream", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    notificationManager.subscribe(user.id, res);
  } catch (error) {
    console.error("Erro ao conectar ao stream de notificacoes:", error);
    res.status(500).json({ error: "Erro ao conectar ao stream" });
  }
});

export default router;
