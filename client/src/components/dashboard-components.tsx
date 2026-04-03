import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  previousValue?: string;
  color?: "green" | "red" | "blue" | "purple";
}

export function KpiCard({ title, value, icon, trend, previousValue, color = "blue" }: KpiCardProps) {
  const colorMap = {
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-white mt-2">{value}</p>
            {previousValue && (
              <p className="text-xs text-slate-500 mt-1">Mês anterior: {previousValue}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={trend > 0 ? "text-green-400" : "text-red-400"} style={{ fontSize: "0.75rem" }}>
                  {trend > 0 ? "+" : ""}{trend}%
                </span>
              </div>
            )}
          </div>
          <div className={`${colorMap[color]} opacity-50`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthNavigatorProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function MonthNavigator({ currentMonth, onPreviousMonth, onNextMonth }: MonthNavigatorProps) {
  const monthName = currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <Button variant="outline" size="sm" onClick={onPreviousMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-white min-w-32 text-center capitalize">{monthName}</span>
      <Button variant="outline" size="sm" onClick={onNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface FinancialEvolutionChartProps {
  data: Array<{
    date: string;
    receita: number;
    despesa: number;
  }>;
  onDateClick?: (date: string) => void;
}

export function FinancialEvolutionChart({ data, onDateClick }: FinancialEvolutionChartProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Evolução Financeira Diária</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend />
            <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita" />
            <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2} name="Despesa" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ExpenseCompositionChartProps {
  data: Array<{
    category: string;
    value: number;
    color: string;
  }>;
}

export function ExpenseCompositionChart({ data }: ExpenseCompositionChartProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Composição de Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="category" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Bar dataKey="value" fill="#3b82f6" name="Valor" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
