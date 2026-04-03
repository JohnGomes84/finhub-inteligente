import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Search, Loader2, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const fmtTime = (d: any) => d ? new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function PixApprovalsPage() {
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState("pendentes");
  const [searchCpf, setSearchCpf] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Dados
  const { data: pendingRequests, isLoading: pendingLoading } = trpc.portalLider.listPixRequests.useQuery({
    status: "pendente",
  });

  const { data: approvedRequests } = trpc.portalLider.listPixRequests.useQuery({
    status: "aprovado",
  });

  const { data: rejectedRequests } = trpc.portalLider.listPixRequests.useQuery({
    status: "rejeitado",
  });

  // Mutations
  const reviewMut = trpc.portalLider.reviewPixRequest.useMutation({
    onSuccess: () => {
      utils.portalLider.listPixRequests.invalidate();
      toast.success("Solicitação processada com sucesso!");
      setApproveModalOpen(false);
      setRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason("");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao processar solicitação");
    },
  });

  // Filtrar por CPF
  const filterRequests = (requests: any[]) => {
    if (!searchCpf) return requests;
    return requests.filter((r) => r.employeeCpf?.includes(searchCpf.replace(/\D/g, "")));
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    await reviewMut.mutateAsync({
      requestId: selectedRequest.id,
      approved: true,
      reviewNotes: "",
    });
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }
    await reviewMut.mutateAsync({
      requestId: selectedRequest.id,
      approved: false,
      reviewNotes: rejectReason,
    });
  };

  const filteredPending = filterRequests(pendingRequests || []);
  const filteredApproved = filterRequests(approvedRequests || []);
  const filteredRejected = filterRequests(rejectedRequests || []);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" /> Aprovação de Chaves PIX
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Revise e aprove solicitações de alteração de chave PIX</p>
      </div>

      {/* Barra de Busca */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por CPF..."
            value={searchCpf}
            onChange={(e) => setSearchCpf(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="pendentes" className="text-xs md:text-sm">
            <Clock className="h-4 w-4 mr-2" /> Pendentes ({filteredPending.length})
          </TabsTrigger>
          <TabsTrigger value="aprovadas" className="text-xs md:text-sm">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Aprovadas ({filteredApproved.length})
          </TabsTrigger>
          <TabsTrigger value="rejeitadas" className="text-xs md:text-sm">
            <XCircle className="h-4 w-4 mr-2" /> Rejeitadas ({filteredRejected.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba: Pendentes */}
        <TabsContent value="pendentes" className="space-y-3 md:space-y-4 mt-4">
          {pendingLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredPending.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="py-8 md:py-12 text-center text-slate-400 text-sm">
                Nenhuma solicitação pendente.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPending.map((req: any) => (
                <Card key={req.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Dados do Funcionário */}
                      <div>
                        <div className="text-sm font-semibold text-white">{req.employeeName}</div>
                        <div className="text-xs text-slate-400 mt-1">CPF: {req.employeeCpf}</div>
                        <div className="text-xs text-slate-500 mt-2">
                          Solicitado em: {fmtDate(req.createdAt)} às {fmtTime(req.createdAt)}
                        </div>
                      </div>

                      {/* Chaves PIX */}
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-slate-400">Chave PIX Atual</div>
                          <div className="text-sm text-white font-mono bg-slate-700 p-2 rounded mt-1 truncate">
                            {req.currentPixKey || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Nova Chave PIX</div>
                          <div className="text-sm text-green-400 font-mono bg-slate-700 p-2 rounded mt-1 truncate">
                            {req.newPixKey}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Tipo: {req.pixKeyType}</div>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          setSelectedRequest(req);
                          setApproveModalOpen(true);
                        }}
                        disabled={reviewMut.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedRequest(req);
                          setRejectModalOpen(true);
                        }}
                        disabled={reviewMut.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Aba: Aprovadas */}
        <TabsContent value="aprovadas" className="space-y-3 md:space-y-4 mt-4">
          {filteredApproved.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="py-8 text-center text-slate-400 text-sm">
                Nenhuma solicitação aprovada.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredApproved.map((req: any) => (
                <Card key={req.id} className="bg-slate-800 border-slate-700 border-l-4 border-l-green-600">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{req.employeeName}</div>
                        <div className="text-xs text-slate-400 mt-1">CPF: {req.employeeCpf}</div>
                        <div className="text-xs text-slate-500 mt-2">
                          Aprovado em: {fmtDate(req.reviewedAt)} às {fmtTime(req.reviewedAt)}
                        </div>
                      </div>
                      <Badge className="bg-green-600">Aprovada</Badge>
                    </div>
                    <div className="mt-3 p-2 bg-slate-700 rounded text-xs text-slate-300">
                      Nova chave: <span className="font-mono text-green-400">{req.newPixKey}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Aba: Rejeitadas */}
        <TabsContent value="rejeitadas" className="space-y-3 md:space-y-4 mt-4">
          {filteredRejected.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="py-8 text-center text-slate-400 text-sm">
                Nenhuma solicitação rejeitada.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRejected.map((req: any) => (
                <Card key={req.id} className="bg-slate-800 border-slate-700 border-l-4 border-l-red-600">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{req.employeeName}</div>
                        <div className="text-xs text-slate-400 mt-1">CPF: {req.employeeCpf}</div>
                        <div className="text-xs text-slate-500 mt-2">
                          Rejeitado em: {fmtDate(req.reviewedAt)} às {fmtTime(req.reviewedAt)}
                        </div>
                      </div>
                      <Badge variant="destructive">Rejeitada</Badge>
                    </div>
                    {req.reviewNotes && (
                      <div className="mt-3 p-2 bg-red-900/20 border border-red-700/30 rounded text-xs text-red-300">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Motivo: {req.reviewNotes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Botões de Exportação */}
      {activeTab === "rejeitadas" && (
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => window.location.href = "/api/export/pix-history/excel"}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" /> Exportar Excel
          </Button>
          <Button
            onClick={() => window.location.href = "/api/export/pix-history/pdf"}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      )}

      {/* Modal: Confirmar Aprovação */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar Aprovação</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-slate-700 p-3 rounded text-sm space-y-2">
                <div>
                  <div className="text-slate-400">Funcionário</div>
                  <div className="text-white font-semibold">{selectedRequest.employeeName}</div>
                </div>
                <div>
                  <div className="text-slate-400">CPF</div>
                  <div className="text-white font-mono">{selectedRequest.employeeCpf}</div>
                </div>
                <div>
                  <div className="text-slate-400">Nova Chave PIX</div>
                  <div className="text-green-400 font-mono">{selectedRequest.newPixKey}</div>
                </div>
              </div>
              <div className="bg-green-900/20 border border-green-700/30 p-3 rounded text-sm text-green-300">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                A chave PIX será atualizada imediatamente após aprovação.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setApproveModalOpen(false)}
              className="text-slate-300"
              disabled={reviewMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={reviewMut.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {reviewMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aprovando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Aprovar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Rejeitar */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Rejeitar Solicitação</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-slate-700 p-3 rounded text-sm space-y-2">
                <div>
                  <div className="text-slate-400">Funcionário</div>
                  <div className="text-white font-semibold">{selectedRequest.employeeName}</div>
                </div>
                <div>
                  <div className="text-slate-400">CPF</div>
                  <div className="text-white font-mono">{selectedRequest.employeeCpf}</div>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Motivo da Rejeição *</Label>
                <textarea
                  placeholder="Explique por que está rejeitando esta solicitação..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-2 w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 min-h-24 resize-none"
                />
              </div>
              <div className="bg-red-900/20 border border-red-700/30 p-3 rounded text-sm text-red-300">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                O funcionário será notificado sobre a rejeição.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectReason("");
              }}
              className="text-slate-300"
              disabled={reviewMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={reviewMut.isPending || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {reviewMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rejeitando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" /> Rejeitar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
