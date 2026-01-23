import type { RunSample } from "@/features/run-pro/engine/types";

function iso(ts: number): string {
  return new Date(ts).toISOString();
}

export function buildGpx(samples: RunSample[], name = "MindsetFit Run"): string {
  const pts = (samples || []).filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));

  const trkseg = pts
    .map((p) => {
      const ele = ""; // opcional (sem altitude por ora)
      const time = iso(p.ts);
      const acc = typeof p.accuracy === "number" ? `<extensions><accuracy>${p.accuracy}</accuracy></extensions>` : "";
      return `<trkpt lat="${p.lat}" lon="${p.lng}">${ele}<time>${time}</time>${acc}</trkpt>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MindsetFit" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(name)}</name>
    <time>${iso(pts[0]?.ts ?? Date.now())}</time>
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>${trkseg}</trkseg>
  </trk>
</gpx>
`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
