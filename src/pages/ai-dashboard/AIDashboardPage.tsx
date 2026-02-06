import { useState } from "react";
import { useAI } from "@/hooks/useAI/useAI";
import { AIInsights } from "@/components/ai-insights/AIInsights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Brain, TrendingUp } from "lucide-react";

export function AIDashboardPage() {
  const { predictWeight, getOptimalWorkoutTime } = useAI();

  const [daysForWeight, setDaysForWeight] = useState(30);
  const [weightPrediction, setWeightPrediction] = useState<ReturnType<typeof predictWeight> | null>(
    null
  );
  const [optimalTime, setOptimalTime] = useState<ReturnType<typeof getOptimalWorkoutTime> | null>(
    null
  );

  const handlePredictWeight = () => {
    const prediction = predictWeight(daysForWeight);
    setWeightPrediction(prediction);
  };

  const handleFindOptimalTime = () => {
    const time = getOptimalWorkoutTime();
    setOptimalTime(time);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-500/10 p-3 rounded-xl">
            <Brain className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-blue-400">IA & Predições</h1>
            <p className="text-gray-400">Análise inteligente e machine learning</p>
          </div>
        </div>

        <AIInsights />

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Predição de Peso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="days" className="text-gray-300">
                    Dias no futuro
                  </Label>
                  <Input
                    id="days"
                    type="number"
                    value={daysForWeight}
                    onChange={(e) => setDaysForWeight(parseInt(e.target.value || "30", 10))}
                    className="mt-1 bg-gray-800 border-gray-700 text-white"
                    min={1}
                    max={365}
                  />
                </div>

                <Button onClick={handlePredictWeight} className="w-full bg-blue-600 hover:bg-blue-700">
                  Prever Peso
                </Button>

                {weightPrediction && (
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      {weightPrediction.predictedWeightKg} kg
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      Em {weightPrediction.daysInFuture} dias
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">
                        Tendência:{" "}
                        <span
                          className={
                            weightPrediction.trend === "descendo"
                              ? "text-green-400"
                              : weightPrediction.trend === "subindo"
                              ? "text-red-400"
                              : "text-gray-400"
                          }
                        >
                          {weightPrediction.trend === "descendo"
                            ? "📉 Descendo"
                            : weightPrediction.trend === "subindo"
                            ? "📈 Subindo"
                            : "➡️ Estável"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Confiança: {weightPrediction.confidence}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Melhor Horário para Treinar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleFindOptimalTime} className="w-full bg-green-600 hover:bg-green-700">
                  Encontrar Horário Ideal
                </Button>

                {optimalTime && (
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      {optimalTime.hour}:00
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      Taxa de sucesso: {optimalTime.successRate}%
                    </div>
                    <div className="text-sm text-gray-300">{optimalTime.reason}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
