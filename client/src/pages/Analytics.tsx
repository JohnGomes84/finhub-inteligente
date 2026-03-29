import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, PieChart } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Relatórios e análises financeiras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-lg bg-emerald-400/10 flex items-center justify-center mx-auto">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <CardTitle className="text-base">Fluxo de Caixa</CardTitle>
            <p className="text-xs text-muted-foreground">Projeção de entradas e saídas por período</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-lg bg-blue-400/10 flex items-center justify-center mx-auto">
              <PieChart className="h-6 w-6 text-blue-400" />
            </div>
            <CardTitle className="text-base">Custos por Cliente</CardTitle>
            <p className="text-xs text-muted-foreground">Distribuição de custos e margem por cliente</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-lg bg-purple-400/10 flex items-center justify-center mx-auto">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <CardTitle className="text-base">Folha de Pagamento</CardTitle>
            <p className="text-xs text-muted-foreground">Evolução mensal da folha de pagamento</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="text-center py-16 text-muted-foreground">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Módulo de relatórios em desenvolvimento</p>
          <p className="text-xs mt-1">Gráficos interativos e exportação em PDF serão adicionados em breve</p>
        </CardContent>
      </Card>
    </div>
  );
}
