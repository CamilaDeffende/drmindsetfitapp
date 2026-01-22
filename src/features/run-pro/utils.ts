import type { LatLng } from "./types";

// Haversine (metros)
export function distM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI/180;
  const dLng = (b.lng - a.lng) * Math.PI/180;
  const la1 = a.lat * Math.PI/180;
  const la2 = b.lat * Math.PI/180;
  const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const hh = Math.floor(s/3600);
  const mm = Math.floor((s%3600)/60);
  const ss = s%60;
  return hh > 0 ? `${hh}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}` : `${mm}:${String(ss).padStart(2,"0")}`;
}

export function fmtPace(secPerKm?: number): string {
  if (!secPerKm || !Number.isFinite(secPerKm)) return "—";
  const m = Math.floor(secPerKm/60);
  const s = Math.floor(secPerKm%60);
  return `${m}:${String(s).padStart(2,"0")} /km`;
}

export function toGPX(points: LatLng[], name = "MindsetFit Run"): string {
  const esc = (x: string) => x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const trkpts = points.map(p => {
    const dt = new Date(p.t).toISOString();
    const ele = (p.alt ?? null);
    return `    <trkpt lat="${p.lat}" lon="${p.lng}">\n${ele != null ? `      <ele>${ele}</ele>\n` : ""}      <time>${dt}</time>\n    </trkpt>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="MindsetFit" xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>${esc(name)}</name></metadata>\n  <trk>\n    <name>${esc(name)}</name>\n    <trkseg>\n${trkpts}\n    </trkseg>\n  </trk>\n</gpx>\n`;
}

export function downloadText(filename: string, text: string, mime = "application/octet-stream") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
