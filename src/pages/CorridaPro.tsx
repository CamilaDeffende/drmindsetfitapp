import { useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { useRunSession } from "@/features/run-pro/hooks/useRunSession";
import { downloadTextFile, sessionToGpx } from "@/features/run-pro/gpx";
import { formatDuration, formatPace } from "@/features/run-pro/utils";

function km(m: number) {
  return (m / 1000).toFixed(2);
}

export default function CorridaPro() {
  const { session, supportsGeo, polyline, actions, flags } = useRunSession();

  const last = session.points.length ? session.points[session.points.length - 1] : null;

  const center: LatLngExpression = useMemo(() => {
    if (last) return [last.lat, last.lng];
    return [-22.9068, -43.1729]; // fallback
  }, [last]);

  const statusLabel =
    session.status === "acquiring" ? "Captando sinal GPS…" :
    session.status === "ready" ? "Pronto para iniciar" :
    session.status === "recording" ? "Gravando" :
    session.status === "paused" ? "Pausado" :
    session.status === "finished" ? "Finalizado" :
    session.status === "error" ? "Erro" : "Pronto";

  const statusHint =
    !supportsGeo ? "Seu navegador não suporta GPS (Geolocation)." :
    session.status === "acquiring" ? `Aguardando melhor precisão… (máx ${session.config.maxAccuracyM}m)` :
    session.status === "ready" ? "Quando estiver pronto, toque em Iniciar." :
    session.status === "recording" ? "Mantenha boa visada do céu para melhor precisão." :
    session.status === "paused" ? "Você pode retomar quando quiser." :
    session.status === "finished" ? "Você pode exportar o GPX e salvar o resumo." :
    session.status === "error" ? (session.error ?? "Erro inesperado") :
    "";

  const exportGpx = () => {
    const gpx = sessionToGpx(session);
    const name = `corrida-pro-${new Date(session.startedAt ?? Date.now()).toISOString().slice(0,19).replace(/[:T]/g,"-")}.gpx`;
    downloadTextFile(name, gpx, "application/gpx+xml");
  };

  const exportSummary = () => {
    const lines = [
      "Corrida PRO — Resumo do Treino",
      `Início: ${session.startedAt ? new Date(session.startedAt).toLocaleString("pt-BR") : "-"}`,
      `Fim: ${session.endedAt ? new Date(session.endedAt).toLocaleString("pt-BR") : "-"}`,
      `Distância: ${km(session.distanceM)} km`,
      `Tempo: ${formatDuration(session.elapsedS)}`,
      `Pace médio: ${formatPace(session.avgPaceSecPerKm)}/km`,
      `Pace atual: ${formatPace(session.currentPaceSecPerKm)}/km`,
      "",
      "Splits (1km):",
      ...session.splits.map(s => `#${s.idx} — ${formatPace(s.paceSecPerKm)}/km — ${formatDuration(s.durationS)}`),
      "",
      `Pontos gravados: ${session.points.length}`,
      `Config: accuracy<=${session.config.maxAccuracyM}m, speed<=${session.config.maxSpeedMS}m/s`,
    ].join("\n");
    const name = `corrida-pro-resumo-${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.txt`;
    downloadTextFile(name, lines, "text/plain;charset=utf-8");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Corrida PRO</h1>
            <p className="mt-1 text-sm text-muted-foreground">{statusLabel} • {statusHint}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm border border-border hover:bg-muted" onClick={actions.reset}>
              Reset
            </button>

            <button
              className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              onClick={actions.start}
              disabled={!flags.canStart}
            >
              Iniciar
            </button>

            <button
              className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm border border-border hover:bg-muted disabled:opacity-50"
              onClick={actions.pause}
              disabled={!flags.canPause}
            >
              Pausar
            </button>

            <button
              className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm border border-border hover:bg-muted disabled:opacity-50"
              onClick={actions.resume}
              disabled={!flags.canResume}
            >
              Retomar
            </button>

            <button
              className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm border border-border hover:bg-muted disabled:opacity-50"
              onClick={actions.finish}
              disabled={!flags.canFinish}
            >
              Finalizar
            </button>

            <button
              className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm border border-border hover:bg-muted disabled:opacity-50"
              onClick={exportGpx}
              disabled={!flags.canExport}
            >
              Exportar GPX
            </button>

            <button
              className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm border border-border hover:bg-muted disabled:opacity-50"
              onClick={exportSummary}
              disabled={session.status !== "finished"}
            >
              Resumo
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="h-[520px] w-full">
              <MapContainer center={center} zoom={16} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {polyline.length > 1 && <Polyline positions={polyline} />}
                {last && <CircleMarker center={[last.lat, last.lng]} radius={6} />}
              </MapContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">Tempo</div>
                <div className="mt-1 text-lg font-semibold">{formatDuration(session.elapsedS)}</div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">Distância</div>
                <div className="mt-1 text-lg font-semibold">{km(session.distanceM)} km</div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">Pace atual</div>
                <div className="mt-1 text-lg font-semibold">{formatPace(session.currentPaceSecPerKm)}/km</div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">Pace médio</div>
                <div className="mt-1 text-lg font-semibold">{formatPace(session.avgPaceSecPerKm)}/km</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold">Splits (1 km)</div>
              <div className="mt-2 max-h-[260px] overflow-auto rounded-xl border border-border">
                {session.splits.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">Sem splits ainda. Complete 1 km para gerar o primeiro.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {session.splits.map((s) => (
                      <li key={s.idx} className="p-3 flex items-center justify-between">
                        <span className="text-sm">#{s.idx}</span>
                        <span className="text-sm text-muted-foreground">{formatDuration(s.durationS)}</span>
                        <span className="text-sm font-medium">{formatPace(s.paceSecPerKm)}/km</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {!supportsGeo && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                GPS indisponível neste navegador. Use um dispositivo compatível e permita a geolocalização.
              </div>
            )}
            {session.status === "error" && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                {session.error ?? "Erro ao capturar GPS."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
