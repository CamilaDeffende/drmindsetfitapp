import { useMemo } from "react";
import type { WorkoutRecord } from "@/services/history/HistoryService";
import { summarize } from "@/components/analytics/analytics-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function fmtHMS(totalS: number) {
  const s = Math.max(0, Math.round(totalS));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtKm(totalM: number) {
  const km = totalM / 1000;
  if (!Number.isFinite(km) || km <= 0) return "0.0 km";
  return `${km.toFixed(km < 10 ? 2 : 1)} km`;
}

export default function StatsOverview({
  workouts,
  days = 14,
}: {
  workouts: WorkoutRecord[];
  days?: number;
}) {
  const sum = useMemo(() => summarize(workouts ?? [], days), [workouts, days]);

  const pseLabel =
    sum.avgPSE.count > 0 ? sum.avgPSE.avg.toFixed(1) : "-";
  const hrLabel =
    sum.avgHeartRate.count > 0 ? `${Math.round(sum.avgHeartRate.avg)} bpm` : "-";

  const topTypes = Object.entries(sum.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">Resumo ({sum.days} dias)</CardTitle>
          <Badge variant="secondary" className="border-white/10 bg-black/20">
            {sum.count} sessão(ões)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-muted-foreground">Duração total</div>
            <div className="text-white font-semibold">{fmtHMS(sum.totalDurationS)}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-muted-foreground">Distância</div>
            <div className="text-white font-semibold">{fmtKm(sum.totalDistanceM)}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-muted-foreground">PSE médio</div>
            <div className="text-white font-semibold">{pseLabel}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-muted-foreground">FC média</div>
            <div className="text-white font-semibold">{hrLabel}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="text-xs text-muted-foreground">Top modalidades:</div>
          {topTypes.length ? (
            topTypes.map(([k, v]) => (
              <Badge key={k} variant="secondary" className="border-white/10 bg-black/20">
                {k.toUpperCase()} • {v}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary" className="border-white/10 bg-black/20">—</Badge>
          )}
        </div>

        <div className="mt-3 text-[11px] text-muted-foreground">
          Observação: métricas usam campos compatíveis (legacy wearables) quando existirem.
        </div>
      </CardContent>
    </Card>
  );
}
