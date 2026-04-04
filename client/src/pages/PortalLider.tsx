import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, DollarSign, FileText, AlertCircle, CheckCircle2, Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function PortalLiderPage() {
  const [activeTab, setActiveTab] = useState("hoje");
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [showNewOperation, setShowNewOperation] = useState(false);
  const [formData, setFormData] = useState({ clientId: "", unitId: "", shiftId: "", date: "" });
  const [newEmployeeCpf, setNewEmployeeCpf] = useState("");
  const [searchingEmployee, setSearchingEmployee] = useState(false);

  // Dados
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: mySchedules } = trpc.portalLider.mySchedules.useQuery();
  const { data: schedule } = trpc.portalLider.getScheduleDetail.useQuery(selectedScheduleId || 0, {
    enabled: !!selectedScheduleId,
  });

  const units = useMemo(() => {
    if (!formData.clientId || !clients) return [];
    const client = clients.find((c: any) => c.id === parseInt(formData.clientId));
    return client?.units || [];
  }, [formData.clientId, clients]);

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
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Portal do Líder</h1>
            <p className="text-slate-400 text-sm mt-1">Gestão de operações e presença</p>
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
                <DollarSign className="h-4 w-4 mr-1" /> Vale
              </TabsTrigger>
              <TabsTrigger value="mais" className="text-xs py-3 md:text-sm">
                <FileText className="h-4 w-4 mr-1" /> Mais
              </TabsTrigger>
            </TabsList>

            {/* ABA HOJE - Criar/Listar Operações */}
            <TabsContent value="hoje" className="space-y-3 mt-4">
              <Button
                onClick={() => setShowNewOperation(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nova Operação
              </Button>

              {todaySchedules.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Nenhuma operação para hoje</div>
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
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg">{s.clientName}</h3>
                          <p className="text-slate-400 text-sm">{s.shiftName} • {s.unitName}</p>
                          <p className="text-xs text-slate-500 mt-2">{s.allocations?.length || 0} diaristas</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={s.status === "aberto" ? "bg-blue-600" : "bg-green-600"}>
                            {s.status}
                          </Badge>
                          <Button size="sm" variant="ghost" className="text-teal-400">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* OUTRAS ABAS */}
            <TabsContent value="presenca" className="text-center py-8 text-slate-400">
              Selecione uma operação em "Hoje"
            </TabsContent>
            <TabsContent value="vale" className="text-center py-8 text-slate-400">
              Selecione uma operação em "Hoje"
            </TabsContent>
            <TabsContent value="mais" className="text-center py-8 text-slate-400">
              Mais opções em breve
            </TabsContent>
          </Tabs>

          {/* DIALOG - Nova Operação */}
          <Dialog open={showNewOperation} onOpenChange={setShowNewOperation}>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Nova Operação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-slate-300">Empresa</Label>
                  <Select value={formData.clientId} onValueChange={(val) => setFormData({ ...formData, clientId: val, unitId: "" })}>
                    <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {clients?.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)} className="text-white">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Local</Label>
                  <Select value={formData.unitId} onValueChange={(val) => setFormData({ ...formData, unitId: val })}>
                    <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {units.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)} className="text-white">
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Turno</Label>
                  <Input
                    type="text"
                    placeholder="Ex: Manhã (08:00-17:00)"
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                    value={formData.shiftId}
                    onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Data</Label>
                  <Input
                    type="date"
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewOperation(false)}>
                  Cancelar
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Tela de Operação Selecionada
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-3 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Operação</h1>
            <p className="text-slate-400 text-sm mt-1">{schedule?.clientName}</p>
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

        <Tabs defaultValue="presenca" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="presenca">Presença</TabsTrigger>
            <TabsTrigger value="vale">Vale</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="presenca" className="space-y-3 mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <p className="text-slate-300">
                  Diaristas: <span className="font-bold text-white">{schedule?.allocations?.length || 0}</span>
                </p>
              </CardContent>
            </Card>

            {schedule?.allocations?.map((alloc: any) => (
              <Card key={alloc.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">{alloc.employeeName}</p>
                      <p className="text-xs text-slate-400">{alloc.employeeCpf}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className="text-green-400 border-green-600">
                      Presente
                    </Button>
                    <Button variant="outline" className="text-red-400 border-red-600">
                      Faltou
                    </Button>
                    <Button variant="outline" className="text-yellow-400 border-yellow-600">
                      Parcial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="vale" className="space-y-3 mt-4">
            <Card className="bg-blue-900/30 border-blue-700">
              <CardContent className="p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-200">Vale e Marmita</p>
                  <p className="text-sm text-blue-300">Lançar valores por diarista</p>
                </div>
              </CardContent>
            </Card>
            {schedule?.allocations?.map((alloc: any) => (
              <Card key={alloc.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-white">{alloc.employeeName}</p>
                    <p className="text-xs text-slate-400">{alloc.employeeCpf}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-300">Vale (R$)</Label>
                      <Input type="number" placeholder="0.00" className="mt-1 bg-slate-700 border-slate-600 text-white" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Marmita (R$)</Label>
                      <Input type="number" placeholder="0.00" className="mt-1 bg-slate-700 border-slate-600 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="info" className="text-center py-8 text-slate-400">
            Informações da operação
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
