import { pointsToGpx, type GpxPoint } from "@/features/run-pro/export/gpx";
import { downloadText } from "@/features/run-pro/export/download";
import { computeRunStats } from "@/features/run-pro/stats/compute";

function pad2(n: number) { return String(n).padStart(2,"0"); }
function fmtHMS(ms: number) {
  const s = Math.max(0, Math.floor(ms/1000));
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const r = s%60;
  return h>0 ? `${h}:${pad2(m)}:${pad2(r)}` : `${m}:${pad2(r)}`;
}
function fmtPace(sec: number) {
  if (!Number.isFinite(sec) || sec<=0) return "--:--";
  const m = Math.floor(sec/60);
  const r = Math.round(sec%60);
  return `${m}:${pad2(r)}`;
}

export function ExportGpxCard({ points, title = "Exportar" }: { points: GpxPoint[]; title?: string }) {
  const stats = computeRunStats(points as any);
  const canExport = points.length >= 5;

  const avgPace = stats?.avgPaceSecPerKm ?? null;
  const distKm = (stats?.distanceM ?? 0) / 1000;
  const moving = stats?.movingMs ?? 0;

  const onExport = () => {
    if (!canExport) return;
    const gpx = pointsToGpx(points, "Corrida PRO");
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    downloadText(`corrida-pro-${stamp}.gpx`, gpx, "application/gpx+xml");
  };

  return (
    <div className="mt-6 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            GPX para Strava/Relógio • gera somente quando há dados suficientes
          </div>
        </div>

        <button
          type="button"
          className="rounded-xl border bg-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          onClick={onExport}
          disabled={!canExport}
        >
          Exportar GPX
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Distância</div>
          <div className="mt-1 text-lg font-semibold">{distKm ? distKm.toFixed(2) : "—"} km</div>
        </div>
        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Tempo em movimento</div>
          <div className="mt-1 text-lg font-semibold">{moving ? fmtHMS(moving) : "—"}</div>
        </div>
        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Pace médio</div>
          <div className="mt-1 text-lg font-semibold">{avgPace ? fmtPace(avgPace) : "—"} /km</div>
        </div>
        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] text-muted-foreground">Pontos</div>
          <div className="mt-1 text-lg font-semibold">{points.length}</div>
        </div>
      </div>

      {!canExport ? (
        <div className="mt-3 text-xs text-muted-foreground">
          Comece uma sessão e aguarde alguns segundos para coletar pontos suficientes.
        </div>
      ) : null}
    </div>
  );
}
