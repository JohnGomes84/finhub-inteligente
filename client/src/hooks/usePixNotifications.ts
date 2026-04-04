import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type SSEEvent = {
  type: "pix_request_created" | "pix_request_reviewed" | "leader_closed_attendance" | "connected";
  data?: Record<string, any>;
};

export function usePixNotifications() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Buscar contagem inicial de PIX pendentes
  const { data: pixRequests } = trpc.portalLider.listPixRequests.useQuery({
    status: "pendente",
  });

  useEffect(() => {
    if (pixRequests) {
      setPendingCount(pixRequests.length);
    }
  }, [pixRequests]);

  // Conectar ao SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource("/api/notifications/stream");

        eventSource.onopen = () => {
          setIsConnected(true);
          console.log("[SSE] Conectado ao stream de notificações");
        };

        eventSource.onmessage = (event) => {
          try {
            const message: SSEEvent = JSON.parse(event.data);

            if (message.type === "connected") {
              console.log("[SSE] Conexão confirmada");
              return;
            }

            if (message.type === "pix_request_created") {
              setPendingCount((prev) => prev + 1);
              toast.info(
                `Nova solicitação PIX: ${message.data?.employeeName} (${message.data?.employeeCpf})`
              );
            }

            if (message.type === "pix_request_reviewed") {
              if (message.data?.status === "aprovado") {
                setPendingCount((prev) => Math.max(0, prev - 1));
                toast.success(
                  `PIX aprovado: ${message.data?.employeeName} por ${message.data?.reviewedByName}`
                );
              } else {
                setPendingCount((prev) => Math.max(0, prev - 1));
                toast.warning(
                  `PIX rejeitado: ${message.data?.employeeName} por ${message.data?.reviewedByName}`
                );
              }
            }

            if (message.type === "leader_closed_attendance") {
              toast.info(
                `${message.data?.leaderName} fechou presença: ${message.data?.clientName} - ${message.data?.shiftName}`
              );
            }
          } catch (error) {
            console.error("[SSE] Erro ao processar mensagem:", error);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          console.error("[SSE] Erro na conexão");
          eventSource?.close();

          // Reconectar após 5s
          reconnectTimeout = setTimeout(() => {
            console.log("[SSE] Tentando reconectar...");
            connect();
          }, 5000);
        };
      } catch (error) {
        console.error("[SSE] Erro ao conectar:", error);
        setIsConnected(false);

        reconnectTimeout = setTimeout(() => {
          connect();
        }, 5000);
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return {
    pendingCount,
    isConnected,
  };
}
