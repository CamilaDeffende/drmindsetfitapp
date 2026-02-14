import { useMemo } from "react";
import type { WorkoutRecord } from "@/services/history/HistoryService";
import { filterByDays, summarizeWorkouts, pickTs } from "@/components/analytics/analytics-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatK(n: number) {
  if (!Number.isFinite(n)) return "-";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(Math.round(n));
}

function consistencyLabel(sessions: number, days: number) {
  const d = Math.max(1, days);
  const perWeek = (sessions / d) * 7;
  if (perWeek >= 5) return { label: "Consistência alta", tone: "bg-green-600" };
  if (perWeek >= 3) return { label: "Consistência média", tone: "bg-yellow-600" };
  return { label: "Consistência baixa", tone: "bg-white/10" };
}

export default function StatsOverview({
  workouts,
  days = 14,
}: {
  workouts: WorkoutRecord[];
  days?: number;
}) {
  const ws = useMemo(() => filterByDays(workouts ?? [], Math.max(1, days)), [workouts, days]);

  const summary = useMemo(() => summarizeWorkouts(ws as any, days), [ws, days]);

  const lastTs = useMemo(() => {
    let t = 0;
    for (const w of (ws as any[])) {
      const x = Number(pickTs(w));
      if (Number.isFinite(x) && x > t) t = x;
    }
    return t || 0;
  }, [ws, days]);

  const badge = consistencyLabel(summary.count, days);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">Resumo ({days} dias)</CardTitle>
          <Badge className={badge.tone + " text-white border-white/10"}>{badge.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[11px] text-muted-foreground">Sessões</div>
            <div className="text-white font-semibold text-lg">{summary.count}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[11px] text-muted-foreground">Duração</div>
            <div className="text-white font-semibold text-lg">{Math.round((summary.totalDurationS / 60))} min</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[11px] text-muted-foreground">Distância</div>
            <div className="text-white font-semibold text-lg">{(summary.totalDistanceM / 1000).toFixed(1)} km</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[11px] text-muted-foreground">Calorias</div>
            <div className="text-white font-semibold text-lg">{formatK(summary.totalCaloriesKcal)} kcal</div>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-muted-foreground">
          Última sessão:{" "}
          <span className="text-white/90">
            {lastTs ? new Date(lastTs).toLocaleString() : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
