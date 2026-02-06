
import { useState, useEffect } from "react";
import { historyService } from "@/services/history/HistoryService";
import { WeightChart } from "@/components/charts/WeightChart";
import { StatsOverview } from "@/components/charts/StatsOverview";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export function ProgressPage() {
  const [weightData, setWeightData] = useState<{ date: string; weight: number }[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalDistanceKm: 0, totalCalories: 0, avgDurationMin: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setWeightData(historyService.getWeightProgress());
    setStats({
      totalWorkouts: historyService.getTotalWorkouts(),
      totalDistanceKm: historyService.getTotalDistanceKm(),
      totalCalories: historyService.getTotalCaloriesBurned(),
      avgDurationMin: historyService.getAverageWorkoutDuration(),
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-blue-400">Seu Progresso</h1>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="mr-2 w-4 h-4" />
            Período
          </Button>
        </div>

        <StatsOverview {...stats} />

        <div className="mt-8">
          {weightData.length > 0 ? (
            <WeightChart data={weightData} />
          ) : (
            <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-800">
              <p className="text-gray-400">Nenhum dado de peso registrado ainda.</p>
              <p className="text-gray-500 text-sm mt-2">Adicione suas primeiras medições para ver gráficos aqui!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
