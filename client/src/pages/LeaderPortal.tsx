import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LeaderPortal() {
  const [, navigate] = useLocation();
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");

  // Query para listar meus planejamentos
  const {
    data: schedules,
    isLoading,
    refetch,
  } = trpc.portalLider.mySchedules.useQuery({
    dateStart,
    dateEnd,
  });

  const handleViewDetail = (scheduleId: number) => {
    navigate(`/leader-schedule/${scheduleId}`);
  };

  const handleDateFilter = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pendente: { variant: "outline", label: "Pendente" },
      validado: { variant: "default", label: "Validado" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portal do Líder</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus planejamentos, check-ins e equipe
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={dateStart}
                onChange={e => setDateStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={dateEnd}
                onChange={e => setDateEnd(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleDateFilter} className="w-full">
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Planejamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Planejamentos</CardTitle>
          <CardDescription>
            {schedules?.length || 0} planejamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : schedules && schedules.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Pessoas</TableHead>
                    <TableHead>Valor Paga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule: any) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        {format(new Date(schedule.date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {schedule.clientName}
                      </TableCell>
                      <TableCell>{schedule.shiftName}</TableCell>
                      <TableCell>{schedule.totalPeople}</TableCell>
                      <TableCell>
                        R${" "}
                        {parseFloat(
                          String(schedule.totalPayValue || 0)
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(schedule.id)}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum planejamento encontrado para o período selecionado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
