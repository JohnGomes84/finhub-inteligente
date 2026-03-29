import { useState, useEffect } from "react";
import { useParams, useNavigate } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function LeaderScheduleDetail() {
  const navigate = useNavigate();
  const params = useParams();
  const scheduleId = params.scheduleId ? parseInt(params.scheduleId) : 0;

  const [selectedAllocationId, setSelectedAllocationId] = useState<number | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<string>("presente");
  const [attendanceNotes, setAttendanceNotes] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const { data: schedule, isLoading, refetch } = trpc.portalLider.getScheduleDetail.useQuery(scheduleId);

  // Mutations
  const checkInMutation = trpc.portalLider.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Check-in registrado com sucesso!");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao registrar check-in");
    },
  });

  const checkOutMutation = trpc.portalLider.checkOut.useMutation({
    onSuccess: () => {
      toast.success("Check-out registrado com sucesso!");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao registrar check-out");
    },
  });

  const setAttendanceMutation = trpc.portalLider.setAttendance.useMutation({
    onSuccess: () => {
      toast.success("Presença registrada com sucesso!");
      setIsDialogOpen(false);
      setSelectedAllocationId(null);
      setAttendanceStatus("presente");
      setAttendanceNotes("");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao registrar presença");
    },
  });

  const handleCheckIn = (allocationId: number) => {
    checkInMutation.mutate({ allocationId, scheduleId });
  };

  const handleCheckOut = (allocationId: number) => {
    checkOutMutation.mutate({ allocationId, scheduleId });
  };

  const handleOpenAttendanceDialog = (allocationId: number, currentStatus: string) => {
    setSelectedAllocationId(allocationId);
    setAttendanceStatus(currentStatus || "presente");
    setAttendanceNotes("");
    setIsDialogOpen(true);
  };

  const handleSaveAttendance = () => {
    if (selectedAllocationId === null) return;
    setAttendanceMutation.mutate({
      allocationId: selectedAllocationId,
      scheduleId,
      status: attendanceStatus as any,
      notes: attendanceNotes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      presente: { variant: "default", label: "Presente" },
      faltou: { variant: "destructive", label: "Faltou" },
      parcial: { variant: "outline", label: "Parcial" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Planejamento não encontrado</p>
        <Button onClick={() => navigate("/leader-portal")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Planejamento</h1>
          <p className="text-muted-foreground mt-2">
            {format(new Date(schedule.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/leader-portal")}>
          Voltar
        </Button>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{schedule.clientName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{schedule.shiftName || "—"}</p>
            <p className="text-xs text-muted-foreground">{schedule.shiftTime || ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Pessoas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{schedule.totalPeople}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {parseFloat(String(schedule.totalPayValue || 0)).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      {schedule.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{schedule.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Alocações */}
      <Card>
        <CardHeader>
          <CardTitle>Equipe Alocada</CardTitle>
          <CardDescription>
            {schedule.allocations?.length || 0} funcionário(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedule.allocations && schedule.allocations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>PIX</TableHead>
                    <TableHead>Valor Paga</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Presença</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.allocations.map((alloc: any) => (
                    <TableRow key={alloc.id}>
                      <TableCell className="font-medium">{alloc.employeeName}</TableCell>
                      <TableCell className="text-sm">{alloc.employeeCpf}</TableCell>
                      <TableCell className="text-sm">{alloc.employeePixKey || "—"}</TableCell>
                      <TableCell>R$ {parseFloat(String(alloc.payValue || 0)).toFixed(2)}</TableCell>
                      <TableCell>
                        {alloc.checkInTime ? (
                          <span className="text-sm">
                            {format(new Date(alloc.checkInTime), "HH:mm", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não registrado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {alloc.checkOutTime ? (
                          <span className="text-sm">
                            {format(new Date(alloc.checkOutTime), "HH:mm", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não registrado</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(alloc.attendanceStatus || "presente")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckIn(alloc.id)}
                            disabled={!!alloc.checkInTime || checkInMutation.isPending}
                          >
                            {checkInMutation.isPending ? "..." : "Check-in"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(alloc.id)}
                            disabled={!alloc.checkInTime || !!alloc.checkOutTime || checkOutMutation.isPending}
                          >
                            {checkOutMutation.isPending ? "..." : "Check-out"}
                          </Button>
                          <Dialog open={isDialogOpen && selectedAllocationId === alloc.id} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenAttendanceDialog(alloc.id, alloc.attendanceStatus)}
                              >
                                Presença
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Registrar Presença</DialogTitle>
                                <DialogDescription>
                                  {alloc.employeeName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="presente">Presente</SelectItem>
                                      <SelectItem value="faltou">Faltou</SelectItem>
                                      <SelectItem value="parcial">Parcial</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Observações</label>
                                  <Textarea
                                    value={attendanceNotes}
                                    onChange={(e) => setAttendanceNotes(e.target.value)}
                                    placeholder="Ex: Saiu mais cedo, motivo pessoal..."
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleSaveAttendance} disabled={setAttendanceMutation.isPending}>
                                    {setAttendanceMutation.isPending ? "Salvando..." : "Salvar"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum funcionário alocado neste planejamento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
