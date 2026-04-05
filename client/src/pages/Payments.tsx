import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Plus } from "lucide-react";

export default function Payments() {
  const [activeTab, setActiveTab] = useState("employee");
  const [filterPeriod, setFilterPeriod] = useState("current");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - será substituído por tRPC queries
  const employeePayments = [
    {
      id: 1,
      employeeId: 1,
      employeeName: "João Silva",
      period: "2026-04",
      daysWorked: 5,
      baseValue: 500,
      mealAllowance: 50,
      voucher: 25,
      bonus: 100,
      totalToPay: 525,
      pixKey: "12345678901234",
      pixType: "cnpj",
      status: "pending",
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: "Maria Santos",
      period: "2026-04",
      daysWorked: 4,
      baseValue: 400,
      mealAllowance: 40,
      voucher: 20,
      bonus: 0,
      totalToPay: 340,
      pixKey: undefined,
      pixType: undefined,
      status: "no_pix",
    },
  ];

  const clientReceivables = [
    {
      id: 1,
      description: "OS - Cliente 1 - 05/04/2026",
      value: 1500,
      clientId: 1,
      clientName: "BRASIL WEB",
      type: "order_of_service",
      status: "pending",
      dueDate: "2026-05-05",
      issueDate: "2026-04-05",
      daysUntilDue: 30,
    },
    {
      id: 2,
      description: "OS - Cliente 2 - 06/04/2026",
      value: 2000,
      clientId: 2,
      clientName: "DOMINALOG",
      type: "order_of_service",
      status: "pending",
      dueDate: "2026-05-06",
      issueDate: "2026-04-06",
      daysUntilDue: 31,
    },
  ];

  // Filtrar dados
  const filteredEmployeePayments = employeePayments.filter((p) => {
    const matchesSearch =
      p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pixKey?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredClientReceivables = clientReceivables.filter((r) => {
    const matchesSearch =
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calcular KPIs
  const employeeKPIs = {
    totalToPay: filteredEmployeePayments.reduce((sum, p) => sum + p.totalToPay, 0),
    employees: new Set(filteredEmployeePayments.map((p) => p.employeeId)).size,
    daysWorked: filteredEmployeePayments.reduce((sum, p) => sum + p.daysWorked, 0),
    noPix: filteredEmployeePayments.filter((p) => p.status === "no_pix").length,
  };

  const clientKPIs = {
    totalReceivable: filteredClientReceivables.reduce((sum, r) => sum + r.value, 0),
    clients: new Set(filteredClientReceivables.map((r) => r.clientId)).size,
    pending: filteredClientReceivables.filter((r) => r.status === "pending").length,
    overdue: filteredClientReceivables.filter((r) => r.daysUntilDue < 0).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pagamentos e Recebimentos</h1>
        <p className="text-muted-foreground">Gerencie pagamentos de funcionários e recebimentos de clientes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employee">Pagamento de Funcionários</TabsTrigger>
          <TabsTrigger value="client">Recebimento de Clientes</TabsTrigger>
        </TabsList>

        {/* ABA 1: PAGAMENTO DE FUNCIONÁRIOS */}
        <TabsContent value="employee" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total a Pagar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {employeeKPIs.totalToPay.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Funcionários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employeeKPIs.employees}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dias Trabalhados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employeeKPIs.daysWorked}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sem PIX</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{employeeKPIs.noPix}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Período</label>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Mês Atual</SelectItem>
                      <SelectItem value="last3">Últimos 3 Meses</SelectItem>
                      <SelectItem value="last6">Últimos 6 Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="no_pix">Sem PIX</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Nome, CPF ou PIX..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Pagamentos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registros de Pagamento</CardTitle>
                <CardDescription>{filteredEmployeePayments.length} registros</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Lote
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Funcionário</th>
                      <th className="text-right py-2 px-4">Base</th>
                      <th className="text-right py-2 px-4">Marmita</th>
                      <th className="text-right py-2 px-4">Vale</th>
                      <th className="text-right py-2 px-4">Bônus</th>
                      <th className="text-right py-2 px-4">Total</th>
                      <th className="text-left py-2 px-4">PIX</th>
                      <th className="text-left py-2 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployeePayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{payment.employeeName}</td>
                        <td className="text-right py-2 px-4">R$ {payment.baseValue.toFixed(2)}</td>
                        <td className="text-right py-2 px-4">-R$ {payment.mealAllowance.toFixed(2)}</td>
                        <td className="text-right py-2 px-4">-R$ {payment.voucher.toFixed(2)}</td>
                        <td className="text-right py-2 px-4">+R$ {payment.bonus.toFixed(2)}</td>
                        <td className="text-right py-2 px-4 font-bold">R$ {payment.totalToPay.toFixed(2)}</td>
                        <td className="py-2 px-4">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {payment.pixType || "Sem PIX"}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status === "pending" ? "Pendente" : "Sem PIX"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: RECEBIMENTO DE CLIENTES */}
        <TabsContent value="client" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total a Receber</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {clientKPIs.totalReceivable.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientKPIs.clients}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientKPIs.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vencido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{clientKPIs.overdue}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Período</label>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Mês Atual</SelectItem>
                      <SelectItem value="last3">Últimos 3 Meses</SelectItem>
                      <SelectItem value="last6">Últimos 6 Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Cliente ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Recebimentos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contas a Receber</CardTitle>
                <CardDescription>{filteredClientReceivables.length} registros</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Descrição</th>
                      <th className="text-left py-2 px-4">Cliente</th>
                      <th className="text-right py-2 px-4">Valor</th>
                      <th className="text-left py-2 px-4">Emissão</th>
                      <th className="text-left py-2 px-4">Vencimento</th>
                      <th className="text-right py-2 px-4">Dias</th>
                      <th className="text-left py-2 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientReceivables.map((receivable) => (
                      <tr key={receivable.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4 text-xs">{receivable.description}</td>
                        <td className="py-2 px-4">{receivable.clientName}</td>
                        <td className="text-right py-2 px-4 font-bold">R$ {receivable.value.toFixed(2)}</td>
                        <td className="py-2 px-4 text-xs">{receivable.issueDate}</td>
                        <td className="py-2 px-4 text-xs">{receivable.dueDate}</td>
                        <td className="text-right py-2 px-4">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              receivable.daysUntilDue < 0
                                ? "bg-red-100 text-red-800"
                                : receivable.daysUntilDue < 7
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {receivable.daysUntilDue}d
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {receivable.status === "pending" ? "Pendente" : "Pago"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
