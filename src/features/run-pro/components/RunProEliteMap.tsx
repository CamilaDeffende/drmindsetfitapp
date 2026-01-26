import { useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import { useRunProEliteStore } from "@/features/run-pro/store/useRunProEliteStore";
import type { RunFix } from "@/features/run-pro/types/runTypes";

function AutoCenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  map.setView([lat, lon], map.getZoom(), { animate: true });
  return null;
}

export function RunProEliteMap() {
  const smoothFixes = useRunProEliteStore((s) => s.smoothFixes);

  const { center, path } = useMemo(() => {
    const pts = smoothFixes.slice(-1200); // limite p/ performance
    const path: [number, number][] = pts.map((p: RunFix) => [p.lat, p.lon]);

    const last = pts.length ? pts[pts.length - 1] : null;
    const center: [number, number] = last ? [last.lat, last.lon] : [-22.9068, -43.1729]; // fallback RJ
    return { center, path };
  }, [smoothFixes]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="text-[11px] text-white/55">Mapa ao vivo</div>
      <div className="mt-2 h-[260px] overflow-hidden rounded-2xl border border-white/10">
        <MapContainer
          center={center}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {path.length > 1 ? <Polyline positions={path} /> : null}
          <Marker position={center} />
          <AutoCenter lat={center[0]} lon={center[1]} />
        </MapContainer>
      </div>
      <div className="mt-2 text-[11px] text-white/45">
        MVP: OSM/Leaflet. (Gancho pronto para Google Satellite no BLOCO 6.)
      </div>
    </div>
  );
}
