import { useAI } from "@/hooks/useAI/useAI";
import { Brain, TrendingUp, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function AIInsights() {
  const { recommendations, metrics, loading, getOvertrainingRisk } = useAI();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      </div>
    );
  }

  const overtrainingRisk = getOvertrainingRisk();

  const iconFor = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-400" />;
    }
  };

  const riskClass = (level: string) => {
    switch (level) {
      case "crítico":
        return "text-red-500 bg-red-500/10 border-red-500";
      case "alto":
        return "text-orange-500 bg-orange-500/10 border-orange-500";
      case "moderado":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500";
      default:
        return "text-green-500 bg-green-500/10 border-green-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500/10 p-3 rounded-xl">
          <Brain className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Insights de IA</h2>
          <p className="text-gray-400 text-sm">Análise inteligente da sua performance</p>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Risco de Overtraining</span>
            <Badge className={riskClass(overtrainingRisk.riskLevel)}>
              {String(overtrainingRisk.riskLevel).toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overtrainingRisk.riskScore} className="mb-4" />
          <div className="text-gray-300 text-sm mb-3">Score: {overtrainingRisk.riskScore}/100</div>

          {overtrainingRisk.factors?.length > 0 && (
            <div>
              <div className="text-gray-400 text-sm mb-2">Fatores detectados:</div>
              <ul className="space-y-1">
                {overtrainingRisk.factors.map((factor: string, idx: number) => (
                  <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {metrics && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Métricas de Performance (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Frequência</div>
                <div className="text-2xl font-bold text-white">{metrics.workoutFrequency} treinos</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">PSE Médio</div>
                <div className="text-2xl font-bold text-white">{metrics.averagePSE}/10</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Recuperação</div>
                <div className="text-2xl font-bold text-green-400">{metrics.recoveryScore}%</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Aderência</div>
                <div className="text-2xl font-bold text-blue-400">{metrics.adherenceRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <Card
            key={idx}
            className={`bg-gray-900 border-gray-800 ${
              rec.type === "warning" ? "border-l-4 border-l-yellow-500" : ""
            } ${rec.type === "success" ? "border-l-4 border-l-green-500" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{iconFor(rec.type)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{rec.title}</div>
                  <div className="text-gray-300 text-sm">{rec.message}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
