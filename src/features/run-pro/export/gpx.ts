export type GpxPoint = { lat: number; lng: number; ts: number };

function iso(ts: number) {
  const d = new Date(ts);
  return d.toISOString();
}

export function pointsToGpx(points: GpxPoint[], name = "Run PRO") {
  const pts = [...points].sort((a,b)=>a.ts-b.ts);
  const seg = pts
    .map(p => `<trkpt lat="${p.lat}" lon="${p.lng}"><time>${iso(p.ts)}</time></trkpt>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MindsetFit" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
      ${seg}
    </trkseg>
  </trk>
</gpx>`;
}

// Compat: legado espera buildGpx()
export function buildGpx(points: { lat: number; lng: number; ts: number }[], name = "Run PRO") {
  return pointsToGpx(points as any, name);
}
