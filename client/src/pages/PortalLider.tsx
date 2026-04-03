import { useState, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, FileText, AlertCircle, Loader2, Plus, Save, Camera, X } from "lucide-react";
import { toast } from "sonner";

const BRL = (v: string | number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(String(v || "0")));

const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const fmtTime = (d: any) => d ? new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function PortalLiderPage() {
  const utils = trpc.useUtils();

  // Estado da página
  const [activeTab, setActiveTab] = useState("hoje");
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [partialHours, setPartialHours] = useState<{ [key: number]: string }>({});
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // Cadastro Rápido
  const [quickRegName, setQuickRegName] = useState("");
  const [quickRegCpf, setQuickRegCpf] = useState("");
  const [quickRegRg, setQuickRegRg] = useState("");
  const [quickRegPix, setQuickRegPix] = useState("");
  const [quickRegPixType, setQuickRegPixType] = useState<"cpf" | "email" | "phone" | "random" | "cnpj">("cpf");
  const [docFrontBase64, setDocFrontBase64] = useState<string | null>(null);
  const [docBackBase64, setDocBackBase64] = useState<string | null>(null);
  const [docFrontPreview, setDocFrontPreview] = useState<string | null>(null);
  const [docBackPreview, setDocBackPreview] = useState<string | null>(null);
  const fileInputFrontRef = useRef<HTMLInputElement>(null);
  const fileInputBackRef = useRef<HTMLInputElement>(null);

  // Vale Rápido
  const [quickExpenseCpf, setQuickExpenseCpf] = useState("");
  const [quickExpenseType, setQuickExpenseType] = useState<"vale" | "bonus" | "marmita">("vale");
  const [quickExpenseValue, setQuickExpenseValue] = useState("");

  // PIX
  const [pixChangeCpf, setPixChangeCpf] = useState("");
  const [newPixKey, setNewPixKey] = useState("");
  const [pixChangeOpen, setPixChangeOpen] = useState(false);

  // Dados
  const { data: mySchedules, isLoading: schedulesLoading } = trpc.portalLider.mySchedules.useQuery();
  const { data: schedule, isLoading: scheduleLoading } = trpc.portalLider.getScheduleDetail.useQuery(
    selectedScheduleId || 0,
    { enabled: !!selectedScheduleId }
  );

  const { data: expenses } = trpc.portalLider.listExpensesForSchedule.useQuery(
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

  const checkOutMut = trpc.portalLider.checkOut.useMutation({
    onSuccess: () => {
      utils.portalLider.getScheduleDetail.invalidate();
      toast.success("Check-out registrado!");
      setSelectedScheduleId(null);
      setActiveTab("hoje");
    },
    onError: (err) => toast.error(err.message),
  });

  const setAttendanceMut = trpc.portalLider.setAttendance.useMutation({
    onSuccess: () => {
      utils.portalLider.getScheduleDetail.invalidate();
      toast.success("Presença atualizada!");
    },
    onError: (err) => toast.error(err.message),
  });

  const quickRegisterMut = trpc.portalLider.quickRegisterEmployee.useMutation({
    onSuccess: () => {
      toast.success("Funcionario cadastrado!");
      setQuickRegName("");
      setQuickRegCpf("");
      setQuickRegRg("");
      setQuickRegPix("");
      setDocFrontBase64(null);
      setDocBackBase64(null);
      setDocFrontPreview(null);
      setDocBackPreview(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const allocateNewEmployeeMut = trpc.portalLider.allocateNewEmployee.useMutation({
    onSuccess: () => {
      toast.success("Funcionario alocado!");
      utils.portalLider.getScheduleDetail.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const quickExpenseMut = trpc.portalLider.quickExpense.useMutation({
    onSuccess: () => {
      toast.success("Lançamento salvo!");
      setQuickExpenseCpf("");
      setQuickExpenseValue("");
      utils.portalLider.listExpensesForSchedule.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const closeAttendanceMut = trpc.portalLider.closeAttendance.useMutation({
    onSuccess: () => {
      toast.success("Presença fechada com sucesso!");
      utils.portalLider.getScheduleDetail.invalidate();
      utils.portalLider.mySchedules.invalidate();
      setCloseConfirmOpen(false);
      setSelectedScheduleId(null);
      setActiveTab("hoje");
    },
    onError: (err) => toast.error(err.message),
  });

  const requestPixChangeMut = trpc.portalLider.requestPixChange.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada!");
      setPixChangeCpf("");
      setNewPixKey("");
      setPixChangeOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // Handlers
  const handleCheckIn = () => {
    if (!selectedScheduleId) return;
    checkInMut.mutate({ scheduleId: selectedScheduleId, allocationId: 0 });
  };

  const handleCheckOut = () => {
    if (!selectedScheduleId || !schedule) return;
    const unmarked = schedule.allocations?.filter((a: any) => !a.attendanceStatus) || [];
    if (unmarked.length > 0) {
      toast.error(`Marque presença de todos os ${unmarked.length} diarista(s) antes de fechar`);
      return;
    }
    setCloseConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    if (!selectedScheduleId) return;
    closeAttendanceMut.mutate(selectedScheduleId);
  };

  const handlePresenceChange = (allocId: number, status: "presente" | "faltou" | "parcial", hours?: string) => {
    if (!selectedScheduleId) return;
    setAttendanceMut.mutate({
      allocationId: allocId,
      scheduleId: selectedScheduleId,
      status,
      notes: "",
      partialHours: hours ? parseFloat(hours) : undefined,
    });
  };

  const handleFileSelect = async (file: File, isBack: boolean) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (isBack) {
        setDocBackBase64(base64);
        setDocBackPreview(base64);
      } else {
        setDocFrontBase64(base64);
        setDocFrontPreview(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickRegister = async () => {
    if (!quickRegName || !quickRegCpf || !quickRegPix) {
      toast.error("Preencha nome, CPF e chave PIX");
      return;
    }
    await quickRegisterMut.mutateAsync({
      name: quickRegName,
      cpf: quickRegCpf,
      rg: quickRegRg || undefined,
      pixKey: quickRegPix,
      pixKeyType: quickRegPixType,
      docFrontBase64: docFrontBase64 || undefined,
      docBackBase64: docBackBase64 || undefined,
    });
  };

  const handleQuickExpense = async () => {
    if (!quickExpenseCpf || !quickExpenseValue || !selectedScheduleId) {
      toast.error("Preencha CPF e valor");
      return;
    }
    await quickExpenseMut.mutateAsync({
      scheduleId: selectedScheduleId,
      cpf: quickExpenseCpf,
      type: quickExpenseType,
      value: parseFloat(quickExpenseValue),
    });
  };

  const handlePixChange = async () => {
    if (!pixChangeCpf || !newPixKey) {
      toast.error("Preencha CPF e nova chave PIX");
      return;
    }
    await requestPixChangeMut.mutateAsync({
      cpf: pixChangeCpf,
      newPixKey,
    });
  };

  // Filtros
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

  const markedCount = useMemo(() => {
    if (!schedule?.allocations) return 0;
    return schedule.allocations.filter((a: any) => a.attendanceStatus).length;
  }, [schedule]);

  const isClosed = schedule?.status === "validado";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-3 md:p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Portal do Líder</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie suas operações em tempo real</p>
        </div>

        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 h-auto p-1">
            <TabsTrigger value="hoje" className="text-xs py-3 md:text-sm">
              <Clock className="h-4 w-4 mr-1" /> Hoje
            </TabsTrigger>
            <TabsTrigger value="presenca" className="text-xs py-3 md:text-sm" disabled={!selectedScheduleId}>
              <Users className="h-4 w-4 mr-1" /> Presença
            </TabsTrigger>
            <TabsTrigger value="vale" className="text-xs py-3 md:text-sm">
              <Plus className="h-4 w-4 mr-1" /> Vale
            </TabsTrigger>
            <TabsTrigger value="mais" className="text-xs py-3 md:text-sm">
              <FileText className="h-4 w-4 mr-1" /> Mais
            </TabsTrigger>
          </TabsList>

          {/* ABA HOJE */}
          <TabsContent value="hoje" className="space-y-3 mt-4">
            {schedulesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : !todaySchedules || todaySchedules.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-12 text-center text-slate-400">
                  Nenhum planejamento para hoje.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {todaySchedules.map((sched: any) => (
                  <Card
                    key={sched.id}
                    className={`bg-slate-800 border-slate-700 cursor-pointer transition-all ${
                      selectedScheduleId === sched.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => {
                      setSelectedScheduleId(sched.id);
                      setActiveTab("presenca");
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-white text-lg">{sched.clientName}</div>
                          <div className="text-sm text-slate-400 mt-1">{sched.shiftName}</div>
                          <div className="text-xs text-slate-500 mt-1">{sched.totalPeople} diaristas</div>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${sched.status === "validado" ? "bg-green-600" : "bg-yellow-600"}`}>
                            {sched.status === "validado" ? "Fechado" : "Aberto"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckIn();
                        }}
                        disabled={checkInMut.isPending || sched.status === "validado"}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
                      >
                        {sched.status === "validado" ? "✓ Fechado" : "Iniciar"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ABA PRESENÇA */}
          <TabsContent value="presenca" className="space-y-3 mt-4">
            {!selectedScheduleId ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-8 text-center text-slate-400">
                  Selecione um planejamento.
                </CardContent>
              </Card>
            ) : scheduleLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : schedule ? (
              <div className="space-y-3">
                {isClosed && (
                  <Card className="bg-green-900/30 border-green-700">
                    <CardContent className="p-3 text-sm text-green-300">
                      ✓ Presença fechada. Não é possível fazer alterações.
                    </CardContent>
                  </Card>
                )}

                {/* Contador */}
                <Card className="bg-blue-900/30 border-blue-700">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-300">Presença Marcada</div>
                      <div className="text-2xl font-bold text-white">{markedCount} de {schedule?.allocations?.length || 0}</div>
                    </div>
                    {markedCount < (schedule?.allocations?.length || 0) && (
                      <Badge variant="destructive" className="text-base px-3 py-2">
                        {(schedule?.allocations?.length || 0) - markedCount} pendentes
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Lista de Diaristas */}
                <div className="space-y-2">
                  {schedule.allocations?.map((alloc: any) => {
                    const shiftHours = 8;
                    const partialHour = parseFloat(partialHours[alloc.id] || "0");
                    const partialPayValue = partialHour > 0 ? (parseFloat(alloc.payValue) * partialHour / shiftHours).toFixed(2) : "0";

                    return (
                      <Card key={alloc.id} className="bg-slate-800 border-slate-700">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-semibold text-white text-base">{alloc.employeeName}</div>
                              <div className="text-xs text-slate-400">{alloc.jobFunctionName}</div>
                              <div className="text-sm text-slate-300 mt-1">{BRL(alloc.payValue)}</div>
                            </div>
                            <Badge
                              variant={
                                alloc.attendanceStatus === "presente"
                                  ? "default"
                                  : alloc.attendanceStatus === "faltou"
                                    ? "destructive"
                                    : alloc.attendanceStatus === "parcial"
                                      ? "secondary"
                                      : "outline"
                              }
                              className="text-xs"
                            >
                              {alloc.attendanceStatus === "presente"
                                ? "✓ Presente"
                                : alloc.attendanceStatus === "faltou"
                                  ? "✗ Faltou"
                                  : alloc.attendanceStatus === "parcial"
                                    ? "~ Parcial"
                                    : "○ Pendente"}
                            </Badge>
                          </div>

                          {/* Botões Presença */}
                          {!isClosed && (
                            <>
                              <div className="grid grid-cols-3 gap-2">
                                <Button
                                  onClick={() => handlePresenceChange(alloc.id, "presente")}
                                  variant={alloc.attendanceStatus === "presente" ? "default" : "outline"}
                                  disabled={setAttendanceMut.isPending}
                                  className="h-12 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Presente
                                </Button>
                                <Button
                                  onClick={() => handlePresenceChange(alloc.id, "faltou")}
                                  variant={alloc.attendanceStatus === "faltou" ? "default" : "outline"}
                                  disabled={setAttendanceMut.isPending}
                                  className="h-12 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Faltou
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (alloc.attendanceStatus !== "parcial") {
                                      handlePresenceChange(alloc.id, "parcial", "4");
                                      setPartialHours({ ...partialHours, [alloc.id]: "4" });
                                    }
                                  }}
                                  variant={alloc.attendanceStatus === "parcial" ? "default" : "outline"}
                                  disabled={setAttendanceMut.isPending}
                                  className="h-12 text-sm font-semibold bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                  Parcial
                                </Button>
                              </div>

                              {/* Horas Parciais */}
                              {alloc.attendanceStatus === "parcial" && (
                                <div className="bg-slate-700 p-3 rounded space-y-2">
                                  <Label className="text-xs text-slate-300">Horas trabalhadas (0.5 a {shiftHours})</Label>
                                  <div className="flex gap-2 items-center">
                                    <Input
                                      type="number"
                                      min="0.5"
                                      max={shiftHours}
                                      step="0.5"
                                      value={partialHours[alloc.id] || shiftHours / 2}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setPartialHours({ ...partialHours, [alloc.id]: val });
                                        handlePresenceChange(alloc.id, "parcial", val);
                                      }}
                                      className="flex-1 bg-slate-600 border-slate-500 text-white text-sm h-10"
                                    />
                                    <div className="text-sm font-semibold text-green-400">{BRL(partialPayValue)}</div>
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {partialHour}h de {shiftHours}h = {BRL(partialPayValue)}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Botão Fechar */}
                {!isClosed && (
                  <Button
                    onClick={handleCheckOut}
                    disabled={closeAttendanceMut.isPending || markedCount < (schedule?.allocations?.length || 0)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold"
                  >
                    {closeAttendanceMut.isPending ? "Fechando..." : "Fechar Presença"}
                  </Button>
                )}
              </div>
            ) : null}
          </TabsContent>

          {/* ABA VALE RÁPIDO */}
          <TabsContent value="vale" className="space-y-3 mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Lançamento Rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm">CPF do Funcionário</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={quickExpenseCpf}
                    onChange={(e) => setQuickExpenseCpf(e.target.value)}
                    disabled={!selectedScheduleId}
                    className="mt-2 bg-slate-700 border-slate-600 text-white text-sm h-10"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">Tipo</Label>
                  <select
                    value={quickExpenseType}
                    onChange={(e) => setQuickExpenseType(e.target.value as any)}
                    disabled={!selectedScheduleId}
                    className="w-full mt-2 bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 h-10"
                  >
                    <option value="vale">Vale</option>
                    <option value="bonus">Bônus</option>
                    <option value="marmita">Marmita</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">Valor</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={quickExpenseValue}
                    onChange={(e) => setQuickExpenseValue(e.target.value)}
                    disabled={!selectedScheduleId}
                    className="mt-2 bg-slate-700 border-slate-600 text-white text-sm h-10"
                  />
                </div>
                <Button
                  onClick={handleQuickExpense}
                  disabled={quickExpenseMut.isPending || !selectedScheduleId}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" /> Lançar
                </Button>
              </CardContent>
            </Card>

            {/* Histórico de Lançamentos */}
            {expenses && expenses.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Histórico do Dia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {expenses.map((exp: any) => (
                    <div key={exp.id} className="flex items-center justify-between p-2 bg-slate-700 rounded text-xs">
                      <div>
                        <div className="font-semibold text-white">{exp.employeeName}</div>
                        <div className="text-slate-400">{exp.employeeCpf}</div>
                      </div>
                      <div className="text-right">
                        {exp.voucher > 0 && <div className="text-slate-300">Vale: {BRL(exp.voucher)}</div>}
                        {exp.bonus > 0 && <div className="text-slate-300">Bônus: {BRL(exp.bonus)}</div>}
                        {exp.mealAllowance > 0 && <div className="text-slate-300">Marmita: {BRL(exp.mealAllowance)}</div>}
                        <div className="font-semibold text-green-400 mt-1">Total: {BRL(exp.total)}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ABA MAIS */}
          <TabsContent value="mais" className="space-y-3 mt-4">
            <Tabs defaultValue="cadastro" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="cadastro" className="text-xs md:text-sm">Cadastro Rápido</TabsTrigger>
                <TabsTrigger value="pix" className="text-xs md:text-sm">Alterar PIX</TabsTrigger>
              </TabsList>

              {/* Cadastro Rápido */}
              <TabsContent value="cadastro" className="space-y-3 mt-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4 space-y-3">
                    <Input
                      placeholder="Nome completo"
                      value={quickRegName}
                      onChange={(e) => setQuickRegName(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-sm h-10"
                    />
                    <Input
                      placeholder="CPF"
                      value={quickRegCpf}
                      onChange={(e) => setQuickRegCpf(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-sm h-10"
                    />
                    <Input
                      placeholder="RG"
                      value={quickRegRg}
                      onChange={(e) => setQuickRegRg(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-sm h-10"
                    />
                    <Input
                      placeholder="Chave PIX"
                      value={quickRegPix}
                      onChange={(e) => setQuickRegPix(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-sm h-10"
                    />
                    <select
                      value={quickRegPixType}
                      onChange={(e) => setQuickRegPixType(e.target.value as any)}
                      className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 h-10"
                    >
                      <option value="cpf">CPF</option>
                      <option value="email">Email</option>
                      <option value="phone">Telefone</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="random">Aleatória</option>
                    </select>

                    {/* Upload Documentos */}
                    <div className="border-t border-slate-600 pt-3 space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputFrontRef.current?.click()}
                        className="w-full text-xs h-9"
                      >
                        <Camera className="h-3 w-3 mr-1" /> Frente do Documento
                      </Button>
                      <input
                        ref={fileInputFrontRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], false)}
                        className="hidden"
                      />
                      {docFrontPreview && (
                        <div className="text-xs text-green-400 flex items-center gap-1">
                          ✓ Frente carregada
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputBackRef.current?.click()}
                        className="w-full text-xs h-9"
                      >
                        <Camera className="h-3 w-3 mr-1" /> Verso do Documento
                      </Button>
                      <input
                        ref={fileInputBackRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], true)}
                        className="hidden"
                      />
                      {docBackPreview && (
                        <div className="text-xs text-green-400 flex items-center gap-1">
                          ✓ Verso carregado
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleQuickRegister}
                      disabled={quickRegisterMut.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base font-semibold"
                    >
                      {quickRegisterMut.isPending ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                    {quickRegisterMut.isSuccess && selectedScheduleId && (
                      <Button
                        onClick={() => {
                          const newEmpId = quickRegisterMut.data?.id;
                          if (newEmpId) {
                            allocateNewEmployeeMut.mutate({
                              scheduleId: selectedScheduleId,
                              employeeId: newEmpId,
                              jobFunctionId: 1,
                              payValue: 100,
                              receiveValue: 150,
                            });
                          }
                        }}
                        disabled={allocateNewEmployeeMut.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-semibold"
                      >
                        {allocateNewEmployeeMut.isPending ? "Alocando..." : "Alocar no Planejamento"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Alterar PIX */}
              <TabsContent value="pix" className="space-y-3 mt-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4 space-y-3">
                    <Input
                      placeholder="CPF do funcionário"
                      value={pixChangeCpf}
                      onChange={(e) => setPixChangeCpf(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-sm h-10"
                    />
                    <Input
                      placeholder="Nova chave PIX"
                      value={newPixKey}
                      onChange={(e) => setNewPixKey(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-sm h-10"
                    />
                    <div className="bg-blue-900/30 border border-blue-700 p-3 rounded text-xs text-blue-300">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Solicitação será enviada para aprovação do admin.
                    </div>
                    <Button
                      onClick={handlePixChange}
                      disabled={requestPixChangeMut.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-semibold"
                    >
                      {requestPixChangeMut.isPending ? "Enviando..." : "Solicitar Alteração"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Dialog: Confirmar Fechamento */}
        <Dialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirmar Fechamento de Presença</DialogTitle>
            </DialogHeader>
            {schedule && (
              <div className="space-y-3">
                <div className="bg-slate-700 p-3 rounded text-sm space-y-1">
                  <div className="text-slate-300">
                    Presentes: <span className="font-semibold text-green-400">{schedule.allocations?.filter((a: any) => a.attendanceStatus === "presente").length || 0}</span>
                  </div>
                  <div className="text-slate-300">
                    Faltaram: <span className="font-semibold text-red-400">{schedule.allocations?.filter((a: any) => a.attendanceStatus === "faltou").length || 0}</span>
                  </div>
                  <div className="text-slate-300">
                    Parciais: <span className="font-semibold text-yellow-400">{schedule.allocations?.filter((a: any) => a.attendanceStatus === "parcial").length || 0}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCloseConfirmOpen(false)}
                className="text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmClose}
                disabled={closeAttendanceMut.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {closeAttendanceMut.isPending ? "Fechando..." : "Confirmar Fechamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
