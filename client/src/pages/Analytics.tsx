import { useState, useMemo } from "react";
import { BarChart3, TrendingUp, PieChart, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/lib/trpc";

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// Cores para gráficos
const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function AnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Buscar dados de contas a pagar e receber
  const { data: payable } = trpc.financeiro.payable.list.useQuery({
    status: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const { data: receivable } = trpc.financeiro.receivable.list.useQuery({
    status: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  // Processar dados para gráficos
  const chartData = useMemo(() => {
    if (!payable || !receivable) return { monthly: [], byCategory: [], byClient: [] };

    const allTransactions = [
      ...(payable || []).map((p: any) => ({
        date: new Date(p.dueDate).toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
        value: -parseFloat(p.amount || "0"),
        type: "Despesa",
        category: p.description || "Sem categoria",
        client: p.supplier || "Fornecedor",
      })),
      ...(receivable || []).map((r: any) => ({
        date: new Date(r.dueDate).toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
        value: parseFloat(r.amount || "0"),
        type: "Receita",
        category: r.description || "Sem categoria",
        client: r.client || "Cliente",
      })),
    ];

    // Agrupar por data para gráfico de linha
    const monthlyMap = new Map<string, { receita: number; despesa: number }>();
    allTransactions.forEach((t: any) => {
      const key = t.date;
      if (!monthlyMap.has(key)) monthlyMap.set(key, { receita: 0, despesa: 0 });
      const entry = monthlyMap.get(key)!;
      if (t.value > 0) entry.receita += t.value;
      else entry.despesa += Math.abs(t.value);
    });

    const monthly = Array.from(monthlyMap.entries())
      .map(([date, values]) => ({
        date,
        Receita: values.receita,
        Despesa: values.despesa,
      }))
      .slice(-30); // Últimos 30 dias

    // Agrupar por categoria para gráfico de pizza
    const categoryMap = new Map<string, number>();
    allTransactions.forEach((t: any) => {
      if (t.value < 0) {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Math.abs(t.value));
      }
    });

    const byCategory = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Agrupar por cliente
    const clientMap = new Map<string, number>();
    allTransactions.forEach((t: any) => {
      if (t.value < 0) {
        const current = clientMap.get(t.client) || 0;
        clientMap.set(t.client, current + Math.abs(t.value));
      }
    });

    const byClient = Array.from(clientMap.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { monthly, byCategory, byClient };
  }, [payable, receivable]);

  // Calcular totais
  const totals = useMemo(() => {
    if (!payable || !receivable) return { receita: 0, despesa: 0, saldo: 0, margem: 0 };

    const receita = (receivable || []).reduce((sum: number, r: any) => sum + parseFloat(r.amount || "0"), 0);
    const despesa = (payable || []).reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0);
    const saldo = receita - despesa;
    const margem = receita > 0 ? (saldo / receita) * 100 : 0;

    return { receita, despesa, saldo, margem };
  }, [payable, receivable]);

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 2);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month));
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Relatórios e análises financeiras</p>
      </div>

      {/* Seletor de Mês */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
          ← Anterior
        </Button>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4" />
          {new Date(`${selectedMonth}-01`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </div>
        <Button variant="outline" size="sm" onClick={handleNextMonth}>
          Próximo →
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="text-xs text-muted-foreground">Receita Total</div>
            <div className="text-lg md:text-2xl font-bold text-green-600 mt-1">{BRL(totals.receita)}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="text-xs text-muted-foreground">Despesa Total</div>
            <div className="text-lg md:text-2xl font-bold text-red-600 mt-1">{BRL(totals.despesa)}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="text-xs text-muted-foreground">Saldo</div>
            <div className={`text-lg md:text-2xl font-bold mt-1 ${totals.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
              {BRL(totals.saldo)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="text-xs text-muted-foreground">Margem</div>
            <div className={`text-lg md:text-2xl font-bold mt-1 ${totals.margem >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {totals.margem.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Evolução Financeira */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Evolução Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip
                    formatter={(value: number) => BRL(value)}
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Despesa" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Sem dados</div>
            )}
          </CardContent>
        </Card>

        {/* Composição de Despesas */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" /> Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie data={chartData.byCategory} cx="50%" cy="50%" outerRadius={80}>
                  {chartData.byCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Sem dados</div>
            )}
          </CardContent>
        </Card>

        {/* Despesas por Cliente */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Despesas por Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.byClient.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.byClient}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "12px" }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip formatter={(value: number) => BRL(value)} contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Sem dados</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
