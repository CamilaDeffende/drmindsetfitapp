import { useEffect, useMemo, useState } from "react";
import WeightChart from "@/components/charts/WeightChart";
import WorkoutFrequencyChart from "@/components/charts/WorkoutFrequencyChart";
import { historyService } from "@/services/history/HistoryService";

export default function ProgressPage() {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    historyService.seedDemo(35);
    setSeeded(true);
  }, []);

  const weight = useMemo(() => historyService.getWeightSeries(60), [seeded]);
  const weekly = useMemo(() => historyService.getWorkoutWeeklyCounts(12), [seeded]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/60">Analytics</div>
          <h1 className="text-2xl font-bold text-white">Progresso</h1>
          <p className="mt-1 text-sm text-white/70">
            Evolução de peso e consistência de treinos com histórico local (SSOT).
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <WeightChart data={weight} />
        <WorkoutFrequencyChart data={weekly} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white">Últimos treinos</div>
        <div className="mt-3 grid gap-2">
          {historyService.getWorkouts(8).map((w) => (
            <div key={w.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-white">{w.title}</div>
                <div className="text-xs text-white/60">{new Date(w.dateIso).toLocaleDateString("pt-BR")}</div>
              </div>
              <div className="mt-1 text-xs text-white/60">
                {w.modality} · {w.durationMin ?? 0} min {w.distanceKm ? `· ${w.distanceKm} km` : ""} {w.caloriesKcal ? `· ${w.caloriesKcal} kcal` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
