import {
  DollarSign, TrendingUp, TrendingDown, Users, Building2,
  CreditCard, Receipt, AlertTriangle, ArrowUpRight, ArrowDownLeft,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { KpiCard as KpiCardNew, MonthNavigator, FinancialEvolutionChart } from "@/components/dashboard-components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = trpc.financeiro.dashboard.kpis.useQuery();
  const { data: payableSummary } = trpc.financeiro.payable.summary.useQuery();
  const { data: receivableSummary } = trpc.financeiro.receivable.summary.useQuery();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Visão geral financeira em tempo real</p>
        </div>
        <MonthNavigator selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      {/* KPI Cards - Premium Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumKpiCard
          title="Receita Total"
          value={kpis ? formatCurrency(kpis.revenue) : "—"}
          icon={TrendingUp}
          loading={kpisLoading}
          trend="up"
          trendValue="+12.5%"
          color="from-emerald-500 to-teal-500"
        />
        <PremiumKpiCard
          title="Custos Totais"
          value={kpis ? formatCurrency(kpis.costs) : "—"}
          icon={TrendingDown}
          loading={kpisLoading}
          trend="down"
          trendValue="-3.2%"
          color="from-red-500 to-orange-500"
        />
        <PremiumKpiCard
          title="Margem Líquida"
          value={kpis ? formatCurrency(kpis.margin) : "—"}
          icon={DollarSign}
          loading={kpisLoading}
          trend="up"
          trendValue="+8.7%"
          color="from-blue-500 to-cyan-500"
        />
        <PremiumKpiCard
          title="Funcionários"
          value={kpis?.employeeCount?.toString() || "0"}
          icon={Users}
          loading={kpisLoading}
          trend="neutral"
          trendValue="0"
          color="from-purple-500 to-pink-500"
        />
      </div>

      {/* Financial Evolution Chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialEvolutionChart month={selectedMonth} />
        </CardContent>
      </Card>

      {/* Financial Summary - Premium Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas a Pagar */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"></div>
          <CardHeader className="pb-4 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <CreditCard className="h-4 w-4 text-red-400" />
                </div>
                Contas a Pagar
              </CardTitle>
              <span className="text-xs font-semibold px-2 py-1 bg-red-500/20 text-red-300 rounded-full">
                {payableSummary?.totalPending ? "Pendente" : "Sem pendências"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <FinancialSummaryItem
              label="Pendente"
              value={payableSummary ? formatCurrency(payableSummary.totalPending) : "—"}
              icon={AlertTriangle}
              color="text-yellow-400"
            />
            <FinancialSummaryItem
              label="Pago"
              value={payableSummary ? formatCurrency(payableSummary.totalPaid) : "—"}
              icon={TrendingDown}
              color="text-emerald-400"
            />
            <FinancialSummaryItem
              label="Vencido"
              value={payableSummary ? formatCurrency(payableSummary.totalOverdue) : "—"}
              icon={AlertTriangle}
              color="text-red-400"
            />
          </CardContent>
        </Card>

        {/* Contas a Receber */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
          <CardHeader className="pb-4 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Receipt className="h-4 w-4 text-emerald-400" />
                </div>
                Contas a Receber
              </CardTitle>
              <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">
                {receivableSummary?.totalPending ? "Pendente" : "Recebido"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <FinancialSummaryItem
              label="Pendente"
              value={receivableSummary ? formatCurrency(receivableSummary.totalPending) : "—"}
              icon={AlertTriangle}
              color="text-yellow-400"
            />
            <FinancialSummaryItem
              label="Recebido"
              value={receivableSummary ? formatCurrency(receivableSummary.totalReceived) : "—"}
              icon={TrendingUp}
              color="text-emerald-400"
            />
            <FinancialSummaryItem
              label="Vencido"
              value={receivableSummary ? formatCurrency(receivableSummary.totalOverdue) : "—"}
              icon={AlertTriangle}
              color="text-red-400"
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStatCard
          label="Clientes"
          value={kpis?.clientCount?.toString() || "0"}
          icon={Building2}
          color="from-blue-500 to-cyan-500"
        />
        <QuickStatCard
          label="Total de Operações"
          value={kpis?.operationCount?.toString() || "0"}
          icon={TrendingUp}
          color="from-purple-500 to-pink-500"
        />
        <QuickStatCard
          label="Contas a Pagar"
          value={payableSummary?.totalCount?.toString() || "0"}
          icon={CreditCard}
          color="from-red-500 to-orange-500"
        />
        <QuickStatCard
          label="Contas a Receber"
          value={receivableSummary?.totalCount?.toString() || "0"}
          icon={Receipt}
          color="from-emerald-500 to-teal-500"
        />
      </div>
    </div>
  );
}

function PremiumKpiCard({
  title,
  value,
  icon: Icon,
  loading,
  trend,
  trendValue,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  loading: boolean;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  color: string;
}) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden group hover:border-primary/50 transition-all">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {trend !== "neutral" && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend === "up" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
            }`}>
              {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{loading ? "—" : value}</p>
      </CardContent>
    </Card>
  );
}

function FinancialSummaryItem({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function QuickStatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`}></div>
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
