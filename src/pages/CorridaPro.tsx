import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useRunProStore } from "@/features/run-pro/store";
import { fmtPace, fmtTime, toGPX, downloadText } from "@/features/run-pro/utils";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom(), { animate: true }); }, [lat, lng, map]);
  return null;
}

export default function CorridaPro() {
  const { active, history, isRunning, isPaused, start, pause, resume, stop, addPoint, load, clearHistory } = useRunProStore();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 2000 }
    );
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    if (isRunning && !isPaused) {
      watchId.current = navigator.geolocation.watchPosition(
        (p) => {
          const lat = p.coords.latitude;
          const lng = p.coords.longitude;
          setPos({ lat, lng });
          addPoint({ lat, lng, t: Date.now(), acc: p.coords.accuracy, alt: p.coords.altitude ?? null });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );
    }

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [isRunning, isPaused, addPoint]);

  const line = useMemo(() => {
    const pts = active?.points ?? [];
    return pts.map(p => [p.lat, p.lng] as [number, number]);
  }, [active?.points]);

  const stats = active?.stats;

  const center = (pos ? ([pos.lat, pos.lng] as [number, number]) : ([-22.9711, -43.1822] as [number, number])); // fallback RJ
  const canGPX = (active?.points?.length ?? 0) > 5;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Corrida Pro</h1>
          <p className="text-sm text-muted-foreground">GPS ao vivo + mapa + trilha + pace + splits (MVP estilo Strava/NRC).</p>
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <button className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={start}>Iniciar</button>
          ) : (
            <>
              {!isPaused ? (
                <button className="px-4 py-2 rounded bg-secondary" onClick={pause}>Pausar</button>
              ) : (
                <button className="px-4 py-2 rounded bg-secondary" onClick={resume}>Retomar</button>
              )}
              <button className="px-4 py-2 rounded bg-destructive text-destructive-foreground" onClick={stop}>Finalizar</button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="p-3 rounded bg-muted">
          <div className="text-xs text-muted-foreground">Tempo</div>
          <div className="text-xl font-bold">{fmtTime(stats?.durationSec ?? 0)}</div>
        </div>
        <div className="p-3 rounded bg-muted">
          <div className="text-xs text-muted-foreground">Distância</div>
          <div className="text-xl font-bold">{(((stats?.distanceM ?? 0) / 1000)).toFixed(2)} km</div>
        </div>
        <div className="p-3 rounded bg-muted">
          <div className="text-xs text-muted-foreground">Pace médio</div>
          <div className="text-xl font-bold">{fmtPace(stats?.paceSecPerKm)}</div>
        </div>
      </div>

      <div className="rounded overflow-hidden border">
        <MapContainer center={center as any} zoom={15} style={{ height: 420, width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pos && <Marker position={[pos.lat, pos.lng]} />}
          {line.length > 1 && <Polyline positions={line} />}
          {pos && <Recenter lat={pos.lat} lng={pos.lng} />}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 rounded bg-secondary disabled:opacity-50"
          disabled={!canGPX}
          onClick={() => {
            if (!active) return;
            const gpx = toGPX(active.points, `MindsetFit Run ${new Date(active.stats.startedAt).toLocaleString("pt-BR")}`);
            downloadText(`mindsetfit-run-${active.id}.gpx`, gpx, "application/gpx+xml");
          }}
        >
          Exportar GPX
        </button>

        <button className="px-4 py-2 rounded bg-secondary" onClick={clearHistory}>
          Limpar histórico
        </button>
      </div>

      <div className="p-3 rounded bg-muted">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Histórico (últimas 50)</h2>
          <span className="text-xs text-muted-foreground">{history.length} sessões</span>
        </div>

        <div className="mt-3 space-y-2">
          {history.slice(0, 10).map((r) => (
            <div key={r.id} className="p-3 rounded bg-background border">
              <div className="flex justify-between gap-3">
                <div className="text-sm font-medium">{new Date(r.stats.startedAt).toLocaleString("pt-BR")}</div>
                <div className="text-sm text-muted-foreground">
                  {((r.stats.distanceM/1000)).toFixed(2)} km • {fmtTime(r.stats.durationSec)} • {fmtPace(r.stats.paceSecPerKm)}
                </div>
              </div>
            </div>
          ))}
          {history.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma corrida salva ainda.</div>}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Nota: satélite/elevação real entram no BLOCO 11 (opcional). Aqui é MVP robusto: GPS + mapa + trilha + stats + GPX.
      </div>
    </div>
  );
}
