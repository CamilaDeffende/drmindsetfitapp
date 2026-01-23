import { useMemo } from "react";
import type { RunMetrics, RunSample } from "@/features/run-pro/engine/types";
import { buildGpx } from "./gpx";
import { downloadTextFile } from "./download";
import { buildSummary } from "./summary";
import { useGlobalProfile } from "@/features/global-profile/useGlobalProfile";
import { formatDateTime, formatNumber } from "@/features/global-profile/format";

type Props = {
  samples: RunSample[];
  metrics?: RunMetrics | null;
  sessionName?: string;
};

function mmss(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function ExportRunCard({ samples, metrics, sessionName = "Corrida" }: Props) {
  const profile = useGlobalProfile();

  const summary = useMemo(() => buildSummary(samples, metrics), [samples, metrics]);

  const startedAt = samples[0]?.ts ?? null;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Exportar & Resumo</div>
          <div className="text-xs text-muted-foreground">GPX + insights do treino</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {startedAt ? formatDateTime(startedAt, profile) : "—"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-background p-3">
          <div className="text-xs text-muted-foreground">Distância</div>
          <div className="text-xl font-semibold">{formatNumber(summary.distKm, profile, { maximumFractionDigits: 2 })} km</div>
        </div>
        <div className="rounded-xl border bg-background p-3">
          <div className="text-xs text-muted-foreground">Pace médio</div>
          <div className="text-xl font-semibold">{summary.avgPaceSecPerKm == null ? "—" : `${mmss(summary.avgPaceSecPerKm)} /km`}</div>
        </div>
        <div className="rounded-xl border bg-background p-3">
          <div className="text-xs text-muted-foreground">Best km</div>
          <div className="text-xl font-semibold">{summary.bestKmPaceSec == null ? "—" : `${mmss(summary.bestKmPaceSec)} /km`}</div>
        </div>
        <div className="rounded-xl border bg-background p-3">
          <div className="text-xs text-muted-foreground">Worst km</div>
          <div className="text-xl font-semibold">{summary.worstKmPaceSec == null ? "—" : `${mmss(summary.worstKmPaceSec)} /km`}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl border bg-background px-4 py-2 text-sm font-semibold hover:opacity-90"
          onClick={() => {
            if (!samples.length) return;
            const gpx = buildGpx(samples, `MindsetFit • ${sessionName}`);
            downloadTextFile(`mindsetfit-${Date.now()}.gpx`, gpx, "application/gpx+xml");
          }}
          disabled={!samples.length}
          aria-disabled={!samples.length}
          title={!samples.length ? "Sem dados para exportar" : "Exportar GPX"}
        >
          Exportar GPX
        </button>

        <button
          type="button"
          className="rounded-xl border bg-background px-4 py-2 text-sm font-semibold hover:opacity-90"
          onClick={() => {
            const payload = {
              sessionName,
              startedAt,
              summary,
            };
            downloadTextFile(`mindsetfit-run-${Date.now()}.json`, JSON.stringify(payload, null, 2), "application/json");
          }}
        >
          Baixar resumo (JSON)
        </button>

        {!samples.length && (
          <div className="self-center text-xs text-muted-foreground">
            Grave uma sessão para habilitar export.
          </div>
        )}
      </div>
    </div>
  );
}
