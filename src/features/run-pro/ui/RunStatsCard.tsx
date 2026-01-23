import { formatDuration, formatPace } from "@/features/run-pro/utils";
import type { RunStats } from "@/features/run-pro/stats/compute";

function km(m: number) { return m / 1000; }
function kph(mps: number) { return mps * 3.6; }

export function RunStatsCard({ stats }: { stats: RunStats }) {
  const distKm = km(stats.distanceM);
  const pace = stats.avgPaceSecPerKm ? formatPace(stats.avgPaceSecPerKm) : "--:--";
  const speed = stats.avgSpeedMps ? kph(stats.avgSpeedMps).toFixed(1) : "--.-";
  const acc = typeof stats.avgAccuracyM === "number" ? Math.round(stats.avgAccuracyM) : null;

  return (
    <div className="mt-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Telemetria • Corrida PRO</div>
          <div className="text-xs text-muted-foreground">
            Qualidade do sinal: <span className="font-semibold">{stats.signalGrade}</span>
            <span className="ml-2">• pontos: {stats.points}</span>
            {acc !== null ? <span className="ml-2">• precisão ~{acc}m</span> : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Distância</div>
          <div className="mt-1 text-lg font-semibold">{distKm.toFixed(2)} km</div>
        </div>

        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Tempo total</div>
          <div className="mt-1 text-lg font-semibold">{formatDuration(Math.round(stats.durationMs / 1000))}</div>
        </div>

        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Em movimento</div>
          <div className="mt-1 text-lg font-semibold">{formatDuration(Math.round(stats.movingMs / 1000))}</div>
        </div>

        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Pace médio</div>
          <div className="mt-1 text-lg font-semibold">{pace} /km</div>
        </div>

        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Velocidade</div>
          <div className="mt-1 text-lg font-semibold">{speed} km/h</div>
        </div>

        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Pausas</div>
          <div className="mt-1 text-lg font-semibold">{stats.pausesCount}</div>
        </div>

        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Tempo parado</div>
          <div className="mt-1 text-lg font-semibold">{formatDuration(Math.round(stats.pausedMs / 1000))}</div>
        </div>
      </div>
    </div>
  );
}
