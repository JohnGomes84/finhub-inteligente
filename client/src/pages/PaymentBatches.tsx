import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const formatCurrency = (val: string | number) => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
};

export default function PaymentBatchesPage() {
  const { canCreate, canEdit } = usePermissions();
  const { data: batches, isLoading } = trpc.financeiro.batches.list.useQuery();
  const markPaid = trpc.financeiro.batches.markPaid.useMutation({
    onSuccess: () => { toast.success("Lote marcado como pago"); },
  });

  const statusStyles: Record<string, string> = {
    rascunho: "badge-info",
    pendente: "badge-warning",
    pago: "badge-success",
    cancelado: "badge-danger",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Lotes de Pagamento
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Pagamentos em lote para funcionários</p>
        </div>
        {canCreate("payment_batches") && (
          <Button size="sm" className="gap-1.5" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
            <Plus className="h-4 w-4" /> Novo Lote
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !batches || batches.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="text-center py-12 text-muted-foreground text-sm">
            Nenhum lote de pagamento criado
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {batches.map(batch => (
            <Card key={batch.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{batch.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{batch.employeeCount || 0} funcionários</span>
                      <span className={`px-2 py-0.5 rounded-full ${statusStyles[batch.status] || ""}`}>
                        {batch.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold">{formatCurrency(batch.totalAmount || "0")}</p>
                    {canEdit("payment_batches") && batch.status !== "pago" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() => markPaid.mutate(batch.id)}
                        disabled={markPaid.isPending}
                      >
                        <CheckCircle className="h-3 w-3" /> Marcar Pago
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
