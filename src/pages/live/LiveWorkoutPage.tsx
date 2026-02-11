import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveMetricsDisplay } from "@/components/live-metrics/LiveMetricsDisplay";
import { useGPS } from "@/hooks/useGPS/useGPS";

const downloadText = (filename: string, content: string, mime = "application/gpx+xml") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export default function LiveWorkoutPage() {
  const gps = useGPS();

  const accuracy = useMemo(() => gps.lastPoint?.accuracy ?? null, [gps.lastPoint]);

  const title = "Treino ao vivo (GPS)";
  const subtitle =
    gps.status === "unsupported"
      ? "Seu navegador não suporta GPS."
      : gps.status === "error"
      ? "Falha ao acessar GPS."
      : gps.status === "requesting"
      ? "Solicitando permissão..."
      : gps.status === "running"
      ? "Rastreando..."
      : "Pronto para iniciar.";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-zinc-400">{subtitle}</p>
        {gps.error ? (
          <p className="text-sm text-red-400">Erro: {gps.error}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LiveMetricsDisplay
            distanceM={gps.stats.distanceM}
            durationS={gps.stats.durationS}
            paceSecPerKm={gps.stats.paceSecPerKm}
            avgSpeedMps={gps.stats.avgSpeedMps}
            maxSpeedMps={gps.stats.maxSpeedMps}
            accuracy={accuracy}
          />

          <Card className="mt-4 bg-zinc-900/70 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Controles</CardTitle>
              <p className="text-xs text-zinc-400">
                Start/Stop do rastreamento. Export GPX para salvar o track.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                onClick={gps.start}
                disabled={gps.status === "running" || gps.status === "requesting" || gps.status === "unsupported"}
              >
                Iniciar GPS
              </Button>
              <Button
                variant="secondary"
                onClick={gps.stop}
                disabled={gps.status !== "running" && gps.status !== "requesting"}
              >
                Parar
              </Button>
              <Button variant="outline" onClick={gps.reset}>
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const gpx = gps.exportGPX("MindsetFit Activity");
                  downloadText(`mindsetfit_${Date.now()}.gpx`, gpx);
                }}
                disabled={!gps.points.length}
              >
                Exportar GPX
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900/70 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Debug</CardTitle>
            <p className="text-xs text-zinc-400">Informações técnicas (dev).</p>
          </CardHeader>
          <CardContent className="text-xs text-zinc-300 space-y-2">
            <div>Status: <span className="text-white">{gps.status}</span></div>
            <div>Pontos: <span className="text-white">{gps.points.length}</span></div>
            {gps.lastPoint ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-2">
                <div>Lat: {gps.lastPoint.lat}</div>
                <div>Lon: {gps.lastPoint.lon}</div>
                <div>Acc: {gps.lastPoint.accuracy ?? "—"}</div>
              </div>
            ) : (
              <div className="text-zinc-500">Sem ponto ainda.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
