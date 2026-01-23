import type { Session, TrackPoint } from "./types";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function iso(t: number): string {
  return new Date(t).toISOString();
}
function pt(p: TrackPoint): string {
  const ele = typeof p.altitude === "number" && Number.isFinite(p.altitude) ? `<ele>${p.altitude}</ele>` : "";
  return `<trkpt lat="${p.lat}" lon="${p.lng}">${ele}<time>${iso(p.t)}</time></trkpt>`;
}

export function sessionToGpx(session: Session): string {
  const name = `Corrida PRO - ${new Date(session.startedAt ?? Date.now()).toLocaleString("pt-BR")}`;
  const trkseg = session.points.map(pt).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${esc("DrMindsetfitapp RunPro")}" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${esc(name)}</name>
    <time>${iso(session.startedAt ?? Date.now())}</time>
  </metadata>
  <trk>
    <name>${esc(name)}</name>
    <trkseg>${trkseg}</trkseg>
  </trk>
</gpx>`;
}

export function downloadTextFile(filename: string, content: string, mime = "application/octet-stream") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Compat legado: downloadText */
export const downloadText = downloadTextFile;
