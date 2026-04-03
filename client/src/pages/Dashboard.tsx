import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign, TrendingUp, TrendingDown, Users, Building2,
  CreditCard, Receipt, AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { KpiCard as KpiCardNew, MonthNavigator, FinancialEvolutionChart } from "@/components/dashboard-components";

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = trpc.financeiro.dashboard.kpis.useQuery();
  const { data: payableSummary } = trpc.financeiro.payable.summary.useQuery();
  const { data: receivableSummary } = trpc.financeiro.receivable.summary.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral financeira — ML Serviços</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Receita Total" value={kpis ? formatCurrency(kpis.revenue) : "—"} icon={TrendingUp} loading={kpisLoading} color="text-emerald-400" bgColor="bg-emerald-400/10" />
        <KpiCard title="Custos Totais" value={kpis ? formatCurrency(kpis.costs) : "—"} icon={TrendingDown} loading={kpisLoading} color="text-red-400" bgColor="bg-red-400/10" />
        <KpiCard title="Margem" value={kpis ? formatCurrency(kpis.margin) : "—"} icon={DollarSign} loading={kpisLoading} color="text-blue-400" bgColor="bg-blue-400/10" />
        <KpiCard title="Funcionários" value={kpis?.employeeCount?.toString() || "0"} icon={Users} loading={kpisLoading} color="text-purple-400" bgColor="bg-purple-400/10" />
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-red-400" />
              Contas a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pendente</span>
              <span className="text-sm font-medium text-yellow-400">{payableSummary ? formatCurrency(payableSummary.totalPending) : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pago</span>
              <span className="text-sm font-medium text-emerald-400">{payableSummary ? formatCurrency(payableSummary.totalPaid) : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-400" /> Vencido</span>
              <span className="text-sm font-medium text-red-400">{payableSummary ? formatCurrency(payableSummary.totalOverdue) : "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-400" />
              Contas a Receber
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pendente</span>
              <span className="text-sm font-medium text-yellow-400">{receivableSummary ? formatCurrency(receivableSummary.totalPending) : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recebido</span>
              <span className="text-sm font-medium text-emerald-400">{receivableSummary ? formatCurrency(receivableSummary.totalReceived) : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-400" /> Vencido</span>
              <span className="text-sm font-medium text-red-400">{receivableSummary ? formatCurrency(receivableSummary.totalOverdue) : "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickStat label="Clientes" value={kpis?.clientCount?.toString() || "0"} icon={Building2} />
        <QuickStat label="Total Operações" value={kpis?.totalJobs?.toString() || "0"} icon={Receipt} />
        <QuickStat label="Contas a Pagar" value={payableSummary?.count?.toString() || "0"} icon={CreditCard} />
        <QuickStat label="Contas a Receber" value={receivableSummary?.count?.toString() || "0"} icon={Receipt} />
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, loading, color, bgColor }: {
  title: string; value: string; icon: any; loading: boolean; color: string; bgColor: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            {loading ? <div className="h-7 w-24 bg-muted animate-pulse rounded" /> : <p className="text-xl font-bold tracking-tight">{value}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
