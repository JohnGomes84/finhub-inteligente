import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Percent } from "lucide-react";

interface FinancialSummaryPanelProps {
  totalPeople: number;
  totalPayValue: string;
  totalReceiveValue: string;
  margin: string;
  marginPercent: string;
}

export function FinancialSummaryPanel({
  totalPeople,
  totalPayValue,
  totalReceiveValue,
  margin,
  marginPercent,
}: FinancialSummaryPanelProps) {
  const payNum = parseFloat(totalPayValue || "0");
  const recvNum = parseFloat(totalReceiveValue || "0");
  const marginNum = parseFloat(margin || "0");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const marginColor = marginNum >= 0 ? "text-green-400" : "text-red-400";
  const marginBg = marginNum >= 0 ? "bg-green-400/10" : "bg-red-400/10";

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Diaristas</p>
                  <p className="text-lg font-bold text-white">{totalPeople}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-400" />
                <div>
                  <p className="text-xs text-muted-foreground">A Pagar</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(payNum)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-xs text-muted-foreground">A Receber</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(recvNum)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${marginBg} border-0`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Percent className={`h-4 w-4 ${marginColor}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Margem %</p>
                  <p className={`text-lg font-bold ${marginColor}`}>{marginPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${marginBg} border-0`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${marginColor}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Margem</p>
                  <p className={`text-sm font-bold ${marginColor}`}>{formatCurrency(marginNum)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
