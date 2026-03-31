import { useState } from "react";
import { trpc } from "@/lib/trpc";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, FileText, AlertCircle, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

const BRL = (v: string | number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(String(v || "0")));

const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const fmtTime = (d: any) => d ? new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function PortalLiderPage() {

  const utils = trpc.useUtils();

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("meus-planejamentos");
  const [quickVoucherCpf, setQuickVoucherCpf] = useState("");
  const [quickVoucherValue, setQuickVoucherValue] = useState("");
  const [pixChangeOpen, setPixChangeOpen] = useState(false);
  const [newPixKey, setNewPixKey] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");

  // Dados
  const { data: mySchedules, isLoading } = trpc.portalLider.mySchedules.useQuery();
  const { data: schedule, isLoading: scheduleLoading } = trpc.portalLider.getScheduleDetail.useQuery(
    selectedScheduleId || 0,
    { enabled: !!selectedScheduleId }
  );

  // Mutations
  const checkInMut = trpc.portalLider.checkIn.useMutation({
    onSuccess: () => {
      utils.portalLider.getScheduleDetail.invalidate();
      toast.success("Check-in registrado!");
    },
  });

  const checkOutMut = trpc.portalLider.checkOut.useMutation({
    onSuccess: () => {
      utils.portalLider.getScheduleDetail.invalidate();
      toast.success("Check-out registrado!");
    },
  });

  const updatePresenceMut = trpc.portalLider.setAttendance.useMutation({
    onSuccess: () => {
      utils.portalLider.getScheduleDetail.invalidate();
      toast.success("Presença atualizada!");
    },
  });

  const requestPixChangeMut = trpc.portalLider.requestPixChange.useMutation({
    onSuccess: () => {
      utils.portalLider.getScheduleDetail.invalidate();
      toast.success("Solicitação de alteração PIX enviada!");
      setPixChangeOpen(false);
      setNewPixKey("");
    },
  });

  const handleCheckIn = (allocId: number) => {
    if (selectedScheduleId) checkInMut.mutate({ allocationId: allocId, scheduleId: selectedScheduleId });
  };

  const handleCheckOut = (allocId: number) => {
    if (selectedScheduleId) checkOutMut.mutate({ allocationId: allocId, scheduleId: selectedScheduleId });
  };

  const handlePresenceChange = (allocId: number, status: "presente" | "faltou" | "parcial") => {
    if (selectedScheduleId) updatePresenceMut.mutate({ allocationId: allocId, scheduleId: selectedScheduleId, status, notes: "" });
  };

  const handlePixChange = async () => {
    if (!newPixKey) {
      toast.error("Chave PIX é obrigatória");
      return;
    }
    await requestPixChangeMut.mutateAsync({
      employeeId: 1,
      newPixKey,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-1">Portal do Líder</h1>
          <p className="text-slate-400 text-sm">Gerencie suas operações em tempo real</p>

        </div>

        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="meus-planejamentos" className="text-xs md:text-sm">
              <Clock className="h-4 w-4 mr-1" /> Meus
            </TabsTrigger>
            <TabsTrigger value="lancamentos" className="text-xs md:text-sm">
              <Plus className="h-4 w-4 mr-1" /> Lançar
            </TabsTrigger>
            <TabsTrigger value="dados" className="text-xs md:text-sm">
              <FileText className="h-4 w-4 mr-1" /> Dados
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Meus Planejamentos */}
          <TabsContent value="meus-planejamentos" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : !mySchedules || mySchedules.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-12 text-center text-slate-400">
                  Nenhum planejamento atribuído.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {mySchedules.map((sched: any) => (
                  <Card
                    key={sched.id}
                    className={`bg-slate-800 border-slate-700 cursor-pointer transition-all ${
                      selectedScheduleId === sched.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedScheduleId(sched.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-white">{fmtDate(sched.date)}</div>
                          <div className="text-sm text-slate-400">{sched.clientName}</div>
                          <div className="text-xs text-slate-500 mt-1">{sched.shiftName} • {sched.totalPeople} pessoas</div>
                        </div>
                        <Badge variant={sched.status === "validado" ? "default" : "outline"}>
                          {sched.status === "validado" ? "Validado" : "Pendente"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba 2: Lançamentos Rápidos */}
          <TabsContent value="lancamentos" className="space-y-4 mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Lançamento Rápido de Vale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">CPF do Funcionário</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={quickVoucherCpf}
                    onChange={(e) => setQuickVoucherCpf(e.target.value)}
                    className="mt-2 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Valor do Vale</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={quickVoucherValue}
                    onChange={(e) => setQuickVoucherValue(e.target.value)}
                    className="mt-2 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Lançar Vale
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 3: Dados & Presença */}
          <TabsContent value="dados" className="space-y-4 mt-4">
            {!selectedScheduleId ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-8 text-center text-slate-400">
                  Selecione um planejamento para ver detalhes.
                </CardContent>
              </Card>
            ) : scheduleLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : schedule ? (
              <div className="space-y-4">
                {/* Resumo */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Resumo</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700 p-3 rounded">
                      <div className="text-xs text-slate-400">Pessoas</div>
                      <div className="text-xl font-bold text-white">{schedule.totalPeople}</div>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                      <div className="text-xs text-slate-400">Valor Total</div>
                      <div className="text-lg font-bold text-white">{BRL(schedule.totalPayValue)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Presença */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Presença</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {schedule.allocations && schedule.allocations.map((alloc: any) => (
                      <div key={alloc.id} className="bg-slate-700 p-3 rounded space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{alloc.employeeName}</div>
                            <div className="text-xs text-slate-400">{alloc.cpf}</div>
                          </div>
                          <Badge
                            variant={
                              alloc.attendanceStatus === "presente"
                                ? "default"
                                : alloc.attendanceStatus === "faltou"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {alloc.attendanceStatus === "presente" ? "Presente" : alloc.attendanceStatus === "faltou" ? "Faltou" : "Parcial"}
                          </Badge>
                        </div>

                        <div className="flex gap-2 text-xs">
                          <div className="flex-1">
                            <div className="text-slate-400">Check-in</div>
                            <div className="text-white font-mono">{fmtTime(alloc.checkInTime)}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-slate-400">Check-out</div>
                            <div className="text-white font-mono">{fmtTime(alloc.checkOutTime)}</div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          {!alloc.checkInTime && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckIn(alloc.id)}
                              disabled={checkInMut.isPending}
                              className="flex-1 text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" /> Check-in
                            </Button>
                          )}
                          {alloc.checkInTime && !alloc.checkOutTime && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(alloc.id)}
                              disabled={checkOutMut.isPending}
                              className="flex-1 text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" /> Check-out
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPixChangeOpen(true)}
                            className="flex-1 text-xs"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" /> PIX
                          </Button>
                        </div>

                        <div className="flex gap-1 pt-2">
                          {["presente", "faltou", "parcial"].map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={alloc.attendanceStatus === status ? "default" : "outline"}
                              onClick={() => handlePresenceChange(alloc.id, status as any)}
                              disabled={updatePresenceMut.isPending}
                              className="flex-1 text-xs"
                            >
                              {status === "presente" ? "✓" : status === "faltou" ? "✗" : "~"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal PIX */}
      <Dialog open={pixChangeOpen} onOpenChange={setPixChangeOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Solicitar Alteração de Chave PIX</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Nova Chave PIX</Label>
              <Input
                placeholder="Informe a nova chave PIX"
                value={newPixKey}
                onChange={(e) => setNewPixKey(e.target.value)}
                className="mt-2 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="bg-blue-900/30 border border-blue-700 p-3 rounded text-sm text-blue-300">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              A solicitação será enviada para aprovação.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPixChangeOpen(false)} className="text-slate-300">
              Cancelar
            </Button>
            <Button onClick={handlePixChange} disabled={requestPixChangeMut.isPending} className="bg-blue-600">
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
