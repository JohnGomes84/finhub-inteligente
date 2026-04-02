import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, FileText, AlertCircle, Loader2, Plus, Save, Camera, Upload } from "lucide-react";
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

  const quickRegisterMut = trpc.portalLider.quickRegisterEmployee.useMutation({
    onSuccess: () => {
      toast.success("Funcionário cadastrado com sucesso!");
      // Limpar formulário
      setQuickRegName("");
      setQuickRegCpf("");
      setQuickRegRg("");
      setQuickRegPix("");
      setDocFrontBase64(null);
      setDocBackBase64(null);
      setDocFrontPreview(null);
      setDocBackPreview(null);
      setActiveTab("meus-planejamentos");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao cadastrar funcionário");
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

  // Handlers para upload de fotos
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
      toast.error("Preencha todos os campos obrigatórios");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-3 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Portal do Líder</h1>
          <p className="text-slate-400 text-xs md:text-sm">Gerencie suas operações em tempo real</p>
        </div>

        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 h-auto p-1">
            <TabsTrigger value="meus-planejamentos" className="text-xs py-2">
              <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" /> <span className="hidden sm:inline">Meus</span>
            </TabsTrigger>
            <TabsTrigger value="presenca" className="text-xs py-2">
              <Users className="h-3 w-3 md:h-4 md:w-4 mr-1" /> <span className="hidden sm:inline">Presença</span>
            </TabsTrigger>
            <TabsTrigger value="cadastro" className="text-xs py-2">
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" /> <span className="hidden sm:inline">Cadastro</span>
            </TabsTrigger>
            <TabsTrigger value="lancamentos" className="text-xs py-2">
              <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1" /> <span className="hidden sm:inline">Lançar</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Meus Planejamentos */}
          <TabsContent value="meus-planejamentos" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : !mySchedules || mySchedules.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-8 md:py-12 text-center text-slate-400 text-sm">
                  Nenhum planejamento atribuído.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {mySchedules.map((sched: any) => (
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
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm md:text-base">{fmtDate(sched.date)}</div>
                          <div className="text-xs md:text-sm text-slate-400 truncate">{sched.clientName}</div>
                          <div className="text-xs text-slate-500 mt-1">{sched.shiftName} • {sched.totalPeople} pessoas</div>
                        </div>
                        <Badge variant={sched.status === "validado" ? "default" : "outline"} className="text-xs">
                          {sched.status === "validado" ? "✓" : "◯"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba 2: Presença & Check-in */}
          <TabsContent value="presenca" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            {!selectedScheduleId ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-8 text-center text-slate-400 text-sm">
                  Selecione um planejamento para ver presença.
                </CardContent>
              </Card>
            ) : scheduleLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : schedule ? (
              <div className="space-y-3 md:space-y-4">
                {/* Resumo */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-white text-base md:text-lg">Resumo</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className="bg-slate-700 p-2 md:p-3 rounded">
                      <div className="text-xs text-slate-400">Pessoas</div>
                      <div className="text-lg md:text-xl font-bold text-white">{schedule.totalPeople}</div>
                    </div>
                    <div className="bg-slate-700 p-2 md:p-3 rounded">
                      <div className="text-xs text-slate-400">Valor Total</div>
                      <div className="text-sm md:text-lg font-bold text-white">{BRL(schedule.totalPayValue)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Presença */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-white text-base md:text-lg">Presença</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 md:space-y-3">
                    {schedule.allocations && schedule.allocations.map((alloc: any) => (
                      <div key={alloc.id} className="bg-slate-700 p-2 md:p-3 rounded space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white text-sm md:text-base truncate">{alloc.employeeName}</div>
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
                            className="text-xs flex-shrink-0"
                          >
                            {alloc.attendanceStatus === "presente" ? "✓" : alloc.attendanceStatus === "faltou" ? "✗" : "~"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-slate-400">Check-in</div>
                            <div className="text-white font-mono">{fmtTime(alloc.checkInTime)}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Check-out</div>
                            <div className="text-white font-mono">{fmtTime(alloc.checkOutTime)}</div>
                          </div>
                        </div>

                        <div className="flex gap-1 pt-2">
                          {!alloc.checkInTime && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckIn(alloc.id)}
                              disabled={checkInMut.isPending}
                              className="flex-1 text-xs h-8"
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
                              className="flex-1 text-xs h-8"
                            >
                              <Clock className="h-3 w-3 mr-1" /> Check-out
                            </Button>
                          )}
                        </div>

                        <div className="flex gap-1 pt-1">
                          {["presente", "faltou", "parcial"].map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={alloc.attendanceStatus === status ? "default" : "outline"}
                              onClick={() => handlePresenceChange(alloc.id, status as any)}
                              disabled={updatePresenceMut.isPending}
                              className="flex-1 text-xs h-8"
                            >
                              {status === "presente" ? "Presente" : status === "faltou" ? "Faltou" : "Parcial"}
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

          {/* Aba 3: Cadastro Rápido */}
          <TabsContent value="cadastro" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-white text-base md:text-lg">Cadastro Rápido de Funcionário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {/* Dados Pessoais */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Nome *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={quickRegName}
                    onChange={(e) => setQuickRegName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">CPF *</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={quickRegCpf}
                      onChange={(e) => setQuickRegCpf(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">RG</Label>
                    <Input
                      placeholder="RG"
                      value={quickRegRg}
                      onChange={(e) => setQuickRegRg(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>

                {/* PIX */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Chave PIX *</Label>
                  <Input
                    placeholder="CPF, email, telefone ou UUID"
                    value={quickRegPix}
                    onChange={(e) => setQuickRegPix(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Tipo de Chave PIX *</Label>
                  <select
                    value={quickRegPixType}
                    onChange={(e) => setQuickRegPixType(e.target.value as any)}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2"
                  >
                    <option value="cpf">CPF</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefone</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="random">Aleatória (UUID)</option>
                  </select>
                </div>

                {/* Upload de Documentos */}
                <div className="border-t border-slate-600 pt-3 md:pt-4">
                  <Label className="text-slate-300 text-sm block mb-3">Fotos do Documento</Label>

                  {/* Frente */}
                  <div className="space-y-2 mb-3">
                    <Label className="text-slate-400 text-xs">Frente do Documento</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputFrontRef.current?.click()}
                        className="flex-1 text-xs h-9"
                      >
                        <Camera className="h-3 w-3 mr-1" /> Selecionar
                      </Button>
                      {docFrontPreview && <div className="text-xs text-green-400 flex items-center">✓ Carregada</div>}
                    </div>
                    <input
                      ref={fileInputFrontRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelect(e.target.files[0], false);
                      }}
                      className="hidden"
                    />
                    {docFrontPreview && (
                      <img src={docFrontPreview} alt="Frente" className="w-full h-32 object-cover rounded border border-slate-600" />
                    )}
                  </div>

                  {/* Verso */}
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs">Verso do Documento</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputBackRef.current?.click()}
                        className="flex-1 text-xs h-9"
                      >
                        <Camera className="h-3 w-3 mr-1" /> Selecionar
                      </Button>
                      {docBackPreview && <div className="text-xs text-green-400 flex items-center">✓ Carregada</div>}
                    </div>
                    <input
                      ref={fileInputBackRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelect(e.target.files[0], true);
                      }}
                      className="hidden"
                    />
                    {docBackPreview && (
                      <img src={docBackPreview} alt="Verso" className="w-full h-32 object-cover rounded border border-slate-600" />
                    )}
                  </div>
                </div>

                {/* Botão Cadastrar */}
                <Button
                  onClick={handleQuickRegister}
                  disabled={quickRegisterMut.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-10"
                >
                  {quickRegisterMut.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cadastrando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Cadastrar Funcionário
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 4: Lançamentos Rápidos */}
          <TabsContent value="lancamentos" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-white text-base md:text-lg">Lançamento Rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm">CPF do Funcionário</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={quickVoucherCpf}
                    onChange={(e) => setQuickVoucherCpf(e.target.value)}
                    className="mt-2 bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">Valor</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={quickVoucherValue}
                    onChange={(e) => setQuickVoucherValue(e.target.value)}
                    className="mt-2 bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-10">
                  <Plus className="h-4 w-4 mr-2" /> Lançar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal PIX */}
      <Dialog open={pixChangeOpen} onOpenChange={setPixChangeOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Solicitar Alteração de Chave PIX</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label className="text-slate-300 text-sm">Nova Chave PIX</Label>
              <Input
                placeholder="Informe a nova chave PIX"
                value={newPixKey}
                onChange={(e) => setNewPixKey(e.target.value)}
                className="mt-2 bg-slate-700 border-slate-600 text-white text-sm"
              />
            </div>
            <div className="bg-blue-900/30 border border-blue-700 p-3 rounded text-xs md:text-sm text-blue-300">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              A solicitação será enviada para aprovação.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPixChangeOpen(false)} className="text-slate-300 text-sm h-9">
              Cancelar
            </Button>
            <Button onClick={handlePixChange} disabled={requestPixChangeMut.isPending} className="bg-blue-600 text-sm h-9">
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
