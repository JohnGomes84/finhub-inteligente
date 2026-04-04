import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerExportRoutes } from "../routers/exportRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerSSESubscriber } from "../lib/sse-notifications";
import { setupSSE } from "./sse";
import { serveStatic, setupVite } from "./vite";
import {
  createRateLimitMiddleware,
  healthHandler,
  metricsHandler,
  readinessHandler,
  requestLogger,
  withCorrelationId,
} from "./observability";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const rateLimit = createRateLimitMiddleware();
  app.set("trust proxy", 1);
  app.use(withCorrelationId);
  app.use(requestLogger);
  app.get("/health", healthHandler);
  app.get("/ready", readinessHandler);
  app.get("/metrics", metricsHandler);
  app.use("/api", rateLimit);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Export routes (Excel/PDF) under /api/reports/*
  registerExportRoutes(app);
  // SSE notifications under /api/notifications/stream
  setupSSE(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const host = process.env.SERVER_HOST || "0.0.0.0";
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, host, () => {
    const baseUrl =
      process.env.PUBLIC_BASE_URL ||
      (host === "0.0.0.0" || host === "::" ? `http://localhost:${port}` : `http://${host}:${port}`);
    console.log(`Server running on ${baseUrl}/`);
  });
}

startServer().catch(console.error);
