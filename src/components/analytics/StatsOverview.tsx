import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  workouts: Array<{
    ts: number;
    durationS?: number;
    distanceM?: number;
    caloriesKcal?: number;
    type?: string;
  }>;
};

function safeNum(n: any): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function formatMinutes(totalS: number) {
  const m = Math.round(totalS / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${String(mm).padStart(2, "0")}m`;
}

export default function StatsOverview({ workouts }: Props) {
  const stats = useMemo(() => {
    const now = Date.now();
    const d7 = now - 7 * 24 * 3600 * 1000;

    const last7 = workouts.filter((w) => safeNum(w.ts) >= d7);

    const sessions7 = last7.length;
    const durationS7 = last7.reduce((acc, w) => acc + safeNum(w.durationS), 0);
    const distanceM7 = last7.reduce((acc, w) => acc + safeNum(w.distanceM), 0);
    const kcal7 = last7.reduce((acc, w) => acc + safeNum(w.caloriesKcal), 0);

    return {
      sessions7,
      durationS7,
      distanceM7,
      kcal7,
    };
  }, [workouts]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-200">Treinos (7d)</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold text-white">{stats.sessions7}</CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-200">Tempo (7d)</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold text-white">
          {formatMinutes(stats.durationS7)}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-200">Distância (7d)</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold text-white">
          {Math.round(stats.distanceM7 / 100) / 10} km
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-200">Calorias (7d)</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold text-white">
          {Math.round(stats.kcal7)} kcal
        </CardContent>
      </Card>
    </div>
  );
}
