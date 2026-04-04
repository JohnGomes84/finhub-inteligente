import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, FileText, AlertCircle, CheckCircle2, TrendingUp, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const BRL = (v: string | number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(String(v || "0")));

export default function PortalLiderPage() {
  const utils = trpc.useUtils();

  // Estado
  const [activeTab, setActiveTab] = useState("hoje");
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [timeEntries, setTimeEntries] = useState<Record<number, { arrival?: string; departure?: string }>>({});
  const [newEmployeeCpf, setNewEmployeeCpf] = useState("");
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // Dados
  const { data: mySchedules, isLoading: schedulesLoading } = trpc.portalLider.mySchedules.useQuery();
  const { data: schedule, isLoading: scheduleLoading } = trpc.portalLider.getScheduleDetail.useQuery(
    selectedScheduleId || 0,
    { enabled: !!selectedScheduleId }
  );

  // Mutations
  const checkInMut = trpc.portalLider.checkIn.useMutation({
    onSuccess: () => {
      utils.portalLider.mySchedules.invalidate();
      utils.portalLider.getScheduleDetail.invalidate();
      toast.success("Check-in registrado!");
    },
    onError: (err) => toast.error(err.message),
  });

  const setAttendanceMut = trpc.portalLider.setAttendance.useMutation({
    onSuccess: () => {
      utils.portalLider.getScheduleDetail.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const closeAttendanceMut = trpc.portalLider.closeAttendance.useMutation({
    onSuccess: () => {
      toast.success("Presença fechada com sucesso!");
      utils.portalLider.mySchedules.invalidate();
      setCloseConfirmOpen(false);
      setSelectedScheduleId(null);
      setActiveTab("hoje");
    },
    onError: (err) => toast.error(err.message),
  });

  // Inicializar time entries
  useEffect(() => {
    if (schedule?.allocations) {
      const entries: Record<number, { arrival?: string; departure?: string }> = {};
      schedule.allocations.forEach((alloc: any) => {
        entries[alloc.id] = {};
      });
      setTimeEntries(entries);
    }
  }, [schedule]);

  // Calcular horas
  const calculateHours = (arrival: string, departure: string) => {
    if (!arrival || !departure) return { worked: 0, isLate: false, overtime: 0 };

    const [arrH, arrM] = arrival.split(":").map(Number);
    const [depH, depM] = departure.split(":").map(Number);

    const arrivalMinutes = arrH * 60 + arrM;
    const departureMinutes = depH * 60 + depM;
    const plannedStart = 8 * 60; // 08:00
    const lunchBreak = 60; // 1 hora

    const isLate = arrivalMinutes > plannedStart;
    const totalMinutes = departureMinutes - arrivalMinutes - lunchBreak;
    const workedHours = totalMinutes / 60;
    const expectedHours = 8;
    const overtime = Math.max(0, workedHours - expectedHours);

    return { worked: workedHours, isLate, overtime };
  };

  const handleTimeChange = (allocId: number, field: "arrival" | "departure", value: string) => {
    const entry = timeEntries[allocId] || {};
    const newEntry = { ...entry };

    if (field === "arrival") {
      newEntry.arrival = value;
    } else {
      newEntry.departure = value;
    }

    setTimeEntries({ ...timeEntries, [allocId]: newEntry });
  };

  const handleClosePresence = async () => {
    if (!selectedScheduleId || !schedule) return;

    const unmarked = schedule.allocations?.filter((a: any) => {
      const entry = timeEntries[a.id];
      return !entry?.arrival || !entry?.departure;
    }) || [];

    if (unmarked.length > 0) {
      toast.error(`Marque horários de ${unmarked.length} diarista(s) antes de fechar`);
      return;
    }

    setCloseConfirmOpen(true);
  };

  const handleConfirmClose = async () => {
    if (!selectedScheduleId || !schedule) return;

    const attendanceData = schedule.allocations?.map((alloc: any) => {
      const entry = timeEntries[alloc.id];
      const { isLate, overtime } = calculateHours(entry?.arrival || "", entry?.departure || "");

      return {
        allocationId: alloc.id,
        status: "presente",
        arrivalTime: entry?.arrival,
        departureTime: entry?.departure,
        isLate,
        overtimeHours: overtime,
      };
    }) || [];

    await closeAttendanceMut.mutateAsync({
      scheduleId: selectedScheduleId,
      attendanceData,
    });
  };

  const markedCount = useMemo(() => {
    if (!schedule?.allocations) return 0;
    return schedule.allocations.filter((a: any) => {
      const entry = timeEntries[a.id];
      return entry?.arrival && entry?.departure;
    }).length;
  }, [schedule, timeEntries]);

  const todaySchedules = useMemo(() => {
    if (!mySchedules) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return mySchedules.filter((s: any) => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === today.getTime();
    });
  }, [mySchedules]);

  if (!selectedScheduleId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-3 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Portal do Líder</h1>
            <p className="text-slate-400 text-sm mt-1">Pré-planejamento e validação de presença</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800 h-auto p-1">
              <TabsTrigger value="hoje" className="text-xs py-3 md:text-sm">
                <Clock className="h-4 w-4 mr-1" /> Hoje
              </TabsTrigger>
              <TabsTrigger value="presenca" className="text-xs py-3 md:text-sm">
                <Users className="h-4 w-4 mr-1" /> Presença
              </TabsTrigger>
              <TabsTrigger value="vale" className="text-xs py-3 md:text-sm">
                <Plus className="h-4 w-4 mr-1" /> Vale
              </TabsTrigger>
              <TabsTrigger value="mais" className="text-xs py-3 md:text-sm">
                <FileText className="h-4 w-4 mr-1" /> Mais
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hoje" className="space-y-3 mt-4">
              {schedulesLoading ? (
                <div className="text-center py-8 text-slate-400">Carregando planejamentos...</div>
              ) : todaySchedules.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Nenhum planejamento para hoje</div>
              ) : (
                todaySchedules.map((s: any) => (
                  <Card
                    key={s.id}
                    className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700/50 transition"
                    onClick={() => {
                      setSelectedScheduleId(s.id);
                      setActiveTab("presenca");
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-white text-lg">{s.clientName}</h3>
                          <p className="text-slate-400 text-sm">{s.shiftName}</p>
                          <p className="text-xs text-slate-500 mt-2">{s.allocations?.length || 0} diaristas</p>
                        </div>
                        <Badge className="bg-blue-600">{s.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="presenca" className="text-center py-8 text-slate-400">
              Selecione um planejamento na aba "Hoje"
            </TabsContent>

            <TabsContent value="vale" className="text-center py-8 text-slate-400">
              Selecione um planejamento na aba "Hoje"
            </TabsContent>

            <TabsContent value="mais" className="text-center py-8 text-slate-400">
              Mais opções em breve
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Tela de validação
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-3 md:p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Validar Presença</h1>
            <p className="text-slate-400 text-sm mt-1">
              {schedule?.clientName} - {schedule?.shiftName}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedScheduleId(null);
              setActiveTab("hoje");
            }}
          >
            Voltar
          </Button>
        </div>

        {/* Info Box */}
        <Card className="bg-blue-900/30 border-blue-700">
          <CardContent className="p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-200">Jornada: 8 horas + 1h intervalo</p>
              <p className="text-sm text-blue-300">Horário padrão: 08:00 - 17:00</p>
            </div>
          </CardContent>
        </Card>

        {/* Contador */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Presença marcada:</span>
              <span className="text-2xl font-bold text-white">
                {markedCount} de {schedule?.allocations?.length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Listagem de Diaristas */}
        <div className="space-y-3">
          {scheduleLoading ? (
            <div className="text-center py-8 text-slate-400">Carregando...</div>
          ) : (
            schedule?.allocations?.map((alloc: any) => {
              const entry = timeEntries[alloc.id];
              const hours = entry?.arrival && entry?.departure ? calculateHours(entry.arrival, entry.departure) : null;

              return (
                <Card key={alloc.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-white">{alloc.employeeName}</p>
                        <p className="text-xs text-slate-400">{alloc.employeeCpf}</p>
                        <p className="text-xs text-slate-500 mt-1">PIX: {alloc.pixKey}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-300">Chegada</Label>
                        <Input
                          type="time"
                          value={entry?.arrival || ""}
                          onChange={(e) => handleTimeChange(alloc.id, "arrival", e.target.value)}
                          className="mt-1 bg-slate-700 border-slate-600 text-white"
                        />
                        {hours?.isLate && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Atrasado
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-slate-300">Saída</Label>
                        <Input
                          type="time"
                          value={entry?.departure || ""}
                          onChange={(e) => handleTimeChange(alloc.id, "departure", e.target.value)}
                          className="mt-1 bg-slate-700 border-slate-600 text-white"
                        />
                        {hours?.overtime > 0 && (
                          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> +{hours.overtime.toFixed(2)}h
                          </p>
                        )}
                      </div>
                    </div>

                    {hours && (
                      <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
                        Horas trabalhadas: {hours.worked.toFixed(2)}h
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Botão Fechar Presença */}
        <Button
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          onClick={handleClosePresence}
          disabled={markedCount !== (schedule?.allocations?.length || 0)}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Fechar Presença ({markedCount}/{schedule?.allocations?.length || 0})
        </Button>

        {/* Confirmação */}
        <Dialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirmar Fechamento de Presença</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-slate-300">Tem certeza que deseja fechar a presença?</p>
              <p className="text-sm text-slate-400">Esta ação não pode ser desfeita.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleConfirmClose}
                disabled={closeAttendanceMut.isPending}
              >
                {closeAttendanceMut.isPending ? "Fechando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
