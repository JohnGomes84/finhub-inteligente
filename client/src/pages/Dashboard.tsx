import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

/**
 * Dashboard - Página principal com visualização de fluxo de caixa
 */

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: bankAccounts, isLoading: accountsLoading } = trpc.bankAccounts.list.useQuery(
    { activeOnly: true },
    { enabled: !!user }
  );
  const { data: summary, isLoading: summaryLoading } = trpc.transactions.getSummary.useQuery(
    {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
    },
    { enabled: !!user }
  );
  const { data: pendingTransactions, isLoading: pendingLoading } = trpc.transactions.getPending.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: overdueTransactions, isLoading: overdueLoading } = trpc.transactions.getOverdue.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const isLoading = accountsLoading || summaryLoading || pendingLoading || overdueLoading;
  const totalBalance = bankAccounts?.reduce((sum, acc) => {
    return sum + parseFloat(acc.currentBalance || "0");
  }, 0) || 0;

  const totalIncome = parseFloat(summary?.totalIncome || "0");
  const totalExpense = parseFloat(summary?.totalExpense || "0");

  // Dados para gráficos
  const categoryData = [
    { name: "Receitas", value: totalIncome, fill: "#10b981" },
    { name: "Despesas", value: totalExpense, fill: "#ef4444" },
  ];

  const monthlyData = [
    { month: "Jan", income: 0, expense: 0 },
    { month: "Fev", income: 0, expense: 0 },
    { month: "Mar", income: totalIncome, expense: totalExpense },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-gray-500 mt-1">Bem-vindo, {user?.name || "Usuário"}!</p>
        </div>
        <Link href="/transactions/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                R$ {totalBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <Wallet className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receitas (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Despesas (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">
                R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <TrendingDown className="w-8 h-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pendências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{pendingTransactions?.length || 0}</div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold">{overdueTransactions?.length || 0}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{overdueTransactions?.length || 0} atrasadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fluxo de Caixa */}
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa (Últimos 3 Meses)</CardTitle>
            <CardDescription>Receitas vs Despesas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Receitas" />
                  <Bar dataKey="expense" fill="#ef4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição (Mês Atual)</CardTitle>
            <CardDescription>Receitas vs Despesas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contas Bancárias */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Bancárias</CardTitle>
          <CardDescription>Suas contas e saldos</CardDescription>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : bankAccounts && bankAccounts.length > 0 ? (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-gray-500">{account.bankName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      R$ {parseFloat(account.currentBalance || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">{account.accountType}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nenhuma conta bancária cadastrada</p>
              <Link href="/bank-accounts/new">
                <Button variant="outline">Adicionar Conta</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transações Pendentes */}
      {pendingTransactions && pendingTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transações Pendentes</CardTitle>
            <CardDescription>{pendingTransactions.length} pendência(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-gray-500">{new Date(tx.transactionDate).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <p className={`font-bold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "income" ? "+" : "-"} R$ {parseFloat(tx.amount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
