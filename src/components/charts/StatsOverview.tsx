
import { Activity, Flame, TrendingUp, Clock } from "lucide-react";

type Props = {
  totalWorkouts: number;
  totalDistanceKm: number;
  totalCalories: number;
  avgDurationMin: number;
};

export function StatsOverview({ totalWorkouts, totalDistanceKm, totalCalories, avgDurationMin }: Props) {
  const stats = [
    { icon: Activity, label: "Total de Treinos", value: totalWorkouts, color: "text-blue-400", bgColor: "bg-blue-500/10" },
    { icon: TrendingUp, label: "Distância Total", value: `${totalDistanceKm.toFixed(1)} km`, color: "text-green-400", bgColor: "bg-green-500/10" },
    { icon: Flame, label: "Calorias Queimadas", value: `${totalCalories.toLocaleString()} kcal`, color: "text-orange-400", bgColor: "bg-orange-500/10" },
    { icon: Clock, label: "Duração Média", value: `${avgDurationMin} min`, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, idx) => (
        <div key={idx} className={`${s.bgColor} rounded-2xl p-6 border border-gray-800`}>
          <div className="flex items-center gap-3 mb-2">
            <s.icon className={`${s.color} w-6 h-6`} />
            <span className="text-gray-400 text-sm">{s.label}</span>
          </div>
          <div className={`${s.color} text-3xl font-bold`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
