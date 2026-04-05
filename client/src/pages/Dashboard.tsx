import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "wouter";

export default function Dashboard() {
  const router = useRouter();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  // Buscar dados do mês
  const kpis = trpc.dashboard.getMonthlyKPIs.useQuery({ year, month });
  const alerts = trpc.dashboard.getAlerts.useQuery({ year, month });
  const dailyEvolution = trpc.dashboard.getDailyFinancialEvolution.useQuery({ year, month });
  const topClients = trpc.dashboard.getTopClients.useQuery({ year, month });
  const accountsSummary = trpc.dashboard.getAccountsSummary.useQuery({ year, month });

  // Navegação de mês
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Formatador de percentual
  const formatPercent = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Função para navegar com filtro de mês
  const navigateWithMonth = (path: string) => {
    router(`${path}?month=${month}&year=${year}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho com navegação de mês */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            ←
          </Button>
          <span className="text-lg font-semibold min-w-[200px] text-center capitalize">{monthName}</span>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            →
          </Button>
          <Button className="ml-4">
            <FileText className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      {kpis.isLoading ? (
        <div className="text-center text-gray-500">Carregando KPIs...</div>
      ) : kpis.data ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Faturamento */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigateWithMonth("/contas?tab=receivable")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Faturamento do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.data.revenue.current)}</div>
              <p
                className={`text-xs mt-2 flex items-center gap-1 ${
                  kpis.data.revenue.variation >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpis.data.revenue.variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(kpis.data.revenue.variation)} vs mês anterior
              </p>
            </CardContent>
          </Card>

          {/* Custos Operacionais */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigateWithMonth("/contas?tab=payable")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Custos Operacionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.data.costs.current)}</div>
              <p
                className={`text-xs mt-2 flex items-center gap-1 ${
                  kpis.data.costs.variation >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {kpis.data.costs.variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(kpis.data.costs.variation)} vs mês anterior
              </p>
            </CardContent>
          </Card>

          {/* Margem de Lucro */}
          <Card
            className={`cursor-pointer hover:shadow-lg transition-shadow ${kpis.data.margin.isNegative ? "border-red-500" : ""}`}
            onClick={() => navigateWithMonth("/analytics")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Margem de Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.data.margin.isNegative ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(kpis.data.margin.current)}
              </div>
              <p
                className={`text-xs mt-2 flex items-center gap-1 ${
                  kpis.data.margin.variation >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpis.data.margin.variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(kpis.data.margin.variation)} vs mês anterior
              </p>
            </CardContent>
          </Card>

          {/* Total de Trabalhos */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigateWithMonth("/planejamentos")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Trabalhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.data.works.current}</div>
              <p
                className={`text-xs mt-2 flex items-center gap-1 ${
                  kpis.data.works.variation >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpis.data.works.variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(kpis.data.works.variation)} vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Seção de Alertas */}
      {alerts.isLoading ? (
        <div className="text-center text-gray-500">Carregando alertas...</div>
      ) : alerts.data ? (
        <Card className={alerts.data.loss.exists || alerts.data.overdueAccounts.count > 0 || alerts.data.employeesWithoutPix.count > 0 || alerts.data.pendingSchedules.count > 0 ? "border-orange-500" : "border-green-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertas do Negócio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.data.loss.exists ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                <span className="text-red-800">
                  🔴 <strong>Prejuízo:</strong> Operação com prejuízo de {formatCurrency(alerts.data.loss.amount)} em {alerts.data.loss.month}
                </span>
              </div>
            ) : null}

            {alerts.data.overdueAccounts.count > 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex justify-between items-center">
                <span className="text-yellow-800">
                  🟡 <strong>{alerts.data.overdueAccounts.count} conta(s) vencida(s)</strong> totalizando {formatCurrency(alerts.data.overdueAccounts.total)}
                </span>
                <Button size="sm" variant="outline" onClick={() => navigateWithMonth("/contas?tab=payable&status=overdue")}>
                  Ver contas
                </Button>
              </div>
            ) : null}

            {alerts.data.employeesWithoutPix.count > 0 ? (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex justify-between items-center">
                <span className="text-orange-800">
                  🟠 <strong>{alerts.data.employeesWithoutPix.count} diarista(s) sem chave PIX</strong> — não receberão pagamento
                </span>
                <Button size="sm" variant="outline" onClick={() => router("/funcionarios?filter=no-pix")}>
                  Ver diaristas
                </Button>
              </div>
            ) : null}

            {alerts.data.pendingSchedules.count > 0 ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                <span className="text-blue-800">
                  🔵 <strong>{alerts.data.pendingSchedules.count} planejamento(s)</strong> aguardando validação
                </span>
                <Button size="sm" variant="outline" onClick={() => navigateWithMonth("/planejamentos?status=pending")}>
                  Validar
                </Button>
              </div>
            ) : null}

            {!alerts.data.loss.exists && alerts.data.overdueAccounts.count === 0 && alerts.data.employeesWithoutPix.count === 0 && alerts.data.pendingSchedules.count === 0 ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-800">✅ <strong>Operação saudável</strong> — nenhum alerta no momento</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Gráfico de Evolução Financeira Diária */}
      {dailyEvolution.isLoading ? (
        <div className="text-center text-gray-500">Carregando gráfico...</div>
      ) : dailyEvolution.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Financeira Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyEvolution.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Receita" />
                <Line type="monotone" dataKey="costs" stroke="#ef4444" name="Custos" />
                <Line type="monotone" dataKey="margin" stroke="#3b82f6" name="Margem" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}

      {/* Ranking de Clientes e Resumo de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 3 Clientes */}
        {topClients.isLoading ? (
          <div className="text-center text-gray-500">Carregando clientes...</div>
        ) : topClients.data ? (
          <Card>
            <CardHeader>
              <CardTitle>Top 3 Clientes do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topClients.data.map((client, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-semibold">{client.clientName}</p>
                      <p className="text-sm text-gray-600">{client.workCount} diárias</p>
                    </div>
                    <p className="font-bold">{formatCurrency(client.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Resumo de Contas */}
        {accountsSummary.isLoading ? (
          <div className="text-center text-gray-500">Carregando resumo...</div>
        ) : accountsSummary.data ? (
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Contas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">A Pagar Pendente</span>
                <span className="font-semibold">{formatCurrency(accountsSummary.data.payablePending)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pago no Mês</span>
                <span className="font-semibold text-green-600">{formatCurrency(accountsSummary.data.payablePaid)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="text-gray-600">A Receber Pendente</span>
                <span className="font-semibold">{formatCurrency(accountsSummary.data.receivablePending)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recebido no Mês</span>
                <span className="font-semibold text-green-600">{formatCurrency(accountsSummary.data.receivablePaid)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-bold">Saldo Previsto</span>
                <span className={`font-bold ${accountsSummary.data.forecastedBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(accountsSummary.data.forecastedBalance)}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
