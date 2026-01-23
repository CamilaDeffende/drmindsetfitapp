import { useMemo } from "react";
import { useRunSession } from "@/features/run-pro/engine/useRunSession";
import { RunCharts } from "@/features/run-pro/charts/RunCharts";
import { CoachScoreCard } from "@/features/run-pro/coach/CoachScoreCard";
import { ExportRunCard } from "@/features/run-pro/export/ExportRunCard";
import { RunControlsCard } from "@/features/run-pro/ui/RunControlsCard";
import { MapView } from "@/features/run-pro/map/MapView";
import { computeRunStats } from "@/features/run-pro/stats/compute";
import { RunStatsCard } from "@/features/run-pro/ui/RunStatsCard";
import type { RunSample } from "@/features/run-pro/engine/types";

type LatLng = { lat: number; lng: number };
function statusLabel(status: string) {
  switch (status) {
    case "idle":
      return "Idle";
    case "acquiring":
      return "Captando sinal GPS…";
    case "ready":
      return "Pronto para iniciar";case "recording":
      return "Gravando";
    case "paused":
      return "Pausado";
    case "finished":
      return "Finalizado";
    case "error":
      return "Erro";
    default:
      return "Pronto";
  }
}

export default function CorridaPro() {
  const { status, error, samples, metrics, config, actions } = useRunSession();

  const supportsGeo = typeof window !== "undefined" && !!navigator.geolocation;

  const flags = useMemo(
    () =>
      ({
        canStart: status === "idle" || status === "ready",
        canPause: status === "recording",
        canResume: status === "paused",
        canFinish: status === "recording" || status === "paused",
        canExport: status === "finished" && samples.length > 0,
        canReset: status !== "idle",
      }) as const,
    [samples.length, status]
  );

    const derivedSamples: RunSample[] = samples
    .map((pt) => {
      const anyPt = pt as any;
      const lat = anyPt.lat ?? anyPt.latitude ?? anyPt.coords?.latitude;
      const lng = anyPt.lng ?? anyPt.lon ?? anyPt.longitude ?? anyPt.coords?.longitude;
      const ts = anyPt.ts ?? anyPt.t ?? anyPt.timestamp ?? anyPt.time ?? Date.now();
      const accuracy = anyPt.accuracy ?? anyPt.coords?.accuracy;
      return { lat, lng, ts, accuracy } as RunSample;
    })
    .filter(
      (x) =>
        typeof x.lat === "number" &&
        typeof x.lng === "number" &&
        Number.isFinite(x.lat) &&
        Number.isFinite(x.lng)
    );


  const last = derivedSamples.length ? derivedSamples[derivedSamples.length - 1] : null;

  const center = useMemo<LatLng>(
    () => (last ? { lat: last.lat, lng: last.lng } : { lat: -22.9068, lng: -43.1729 }),
    [last]
  );

  const hint = useMemo(() => {
    if (!supportsGeo) return "Seu navegador não suporta GPS (Geolocation).";
    if (status === "acquiring") return `Aguardando melhor precisão… (máx ${config.maxAccuracyM}m)`;
    if (status === "ready") return "Quando estiver pronto, toque em Iniciar.";
    if (status === "recording") return "GPS ao vivo — mantenha boa visada do céu para melhor precisão.";
    if (status === "paused") return "Pausado — você pode retomar quando quiser.";
    if (status === "finished") return "Finalizado — exporte o GPX e salve o resumo.";
    if (status === "error") return typeof error === "string" ? error : "Erro ao capturar GPS.";
    return "";
  }, [config.maxAccuracyM, error, status, supportsGeo]);

  const stats = useMemo(() => computeRunStats(derivedSamples), [derivedSamples]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Corrida PRO</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusLabel(status)} • {hint}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <RunControlsCard
            supportsGeo={supportsGeo}
            gpsAccuracyM={metrics?.lastAccuracyM}
            gpsAccepts={metrics?.gpsAccepts}
            gpsRejects={metrics?.gpsRejects}

            flags={flags}
            actions={actions}
            pointsCount={derivedSamples.length}
          />

      {/* RUNPRO_MAP_PREMIUM */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              GPS LIVE
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
              Precisão: {typeof metrics?.lastAccuracyM === "number" ? Math.round(metrics.lastAccuracyM) + "m" : "—"}
            </span>
          </div>
          <div className="h-[420px] w-full">
            <MapView center={center as any} />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div>
              {status === "acquiring" ? "Captando sinal… melhore a visada do céu." : status === "recording" ? "Ao vivo — pontos filtrados para estabilidade." : "Mapa pronto."}
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-background/60 px-2.5 py-1">Aceitos: {metrics?.gpsAccepts ?? 0}</span>
              <span className="rounded-full border border-border bg-background/60 px-2.5 py-1">Rejeitados: {metrics?.gpsRejects ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="relative">
              <div className="absolute left-3 top-3 z-10 rounded-full border border-border bg-background/80 px-3 py-1 text-xs backdrop-blur">
                GPS Live
              </div>
              <div className="h-[520px] w-full">
                {/* MapView hoje é center-only (ok). */}
                <MapView center={center as unknown as any} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4 shadow-sm">
            <RunStatsCard stats={stats} />
            {!supportsGeo && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                GPS indisponível neste navegador. Use um dispositivo compatível e permita a geolocalização.
              </div>
            )}
            {status === "error" && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                {typeof error === "string" ? error : "Erro ao capturar GPS."}
              </div>
            )}
            <div className="mt-4 rounded-xl border border-border p-3 text-sm text-muted-foreground">
              Qualidade do sinal: <span className="text-foreground">{(typeof last?.accuracy === "number" && Number.isFinite(last.accuracy)) ? Math.max(0, Math.min(100, Math.round(100 - (last.accuracy * 0.9)))) : 0}</span>/100
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-sm font-semibold">Análise do treino</div>
            <div className="text-xs text-muted-foreground">pace • distância • precisão</div>
          </div>
          <RunCharts samples={derivedSamples as unknown as any} />
        </div>

        <div className="mt-6">
          <CoachScoreCard samples={derivedSamples as unknown as any} />
        </div>

        <div className="mt-6">
          <ExportRunCard samples={derivedSamples as unknown as any} sessionName="Corrida PRO" />
        </div>
      </div>
    </div>
  );
}
