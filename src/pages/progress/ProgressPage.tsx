import { useMemo } from "react";
import { historyService } from "@/services/history/HistoryService";
import { StatsOverview } from "@/components/progress/StatsOverview";
import { WeightChart } from "@/components/progress/WeightChart";
import { lastDelta, trendSlope, TimePoint } from "@/services/history/analytics/stats";

function toWeightPoints(): TimePoint[] {
  const m = historyService.getMeasurements?.() || [];
  return m
    .filter((x: any) => x && x.date && (x.weightKg ?? x.peso ?? x.weight))
    .map((x: any) => ({
      date: String(x.date).slice(0, 10),
      value: Number(x.weightKg ?? x.peso ?? x.weight) || 0,
    }))
    .filter((p: any) => Number.isFinite(p.value) && p.value > 0);
}

export default function ProgressPage() {
  const points = useMemo(() => toWeightPoints(), []);
  const d = useMemo(() => lastDelta(points), [points]);
  const slope = useMemo(() => trendSlope(points), [points]);

  const items = useMemo(
    () => [
      { label: "Registros de peso", value: String(points.length) },
      { label: "Última variação", value: `${d.delta.toFixed(1)} kg`, hint: `${d.pct.toFixed(1)}%` },
      { label: "Tendência", value: `${slope.toFixed(2)} kg/dia`, hint: slope < 0 ? "queda" : slope > 0 ? "alta" : "estável" },
      { label: "Janela", value: "MM7", hint: "média móvel 7d" },
    ],
    [points.length, d.delta, d.pct, slope]
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Progresso</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Análises do seu histórico (SSOT)</div>
        </div>
      </div>

      <StatsOverview items={items} />
      <WeightChart points={points} />
    </div>
  );
}
