export type GPSPoint = {
  lat: number;
  lon: number;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null; // m/s (quando disponível)
  ts: number; // epoch ms
};

export type GPSStats = {
  distanceM: number;
  durationS: number;
  paceSecPerKm?: number | null;
  avgSpeedMps?: number | null;
  maxSpeedMps?: number | null;
};

export class GPSService {
  static haversineMeters(a: GPSPoint, b: GPSPoint): number {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const sin1 = Math.sin(dLat / 2);
    const sin2 = Math.sin(dLon / 2);
    const h =
      sin1 * sin1 +
      Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2;

    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  static distanceMeters(points: GPSPoint[]): number {
    if (!points || points.length < 2) return 0;
    let d = 0;
    for (let i = 1; i < points.length; i++) {
      d += GPSService.haversineMeters(points[i - 1], points[i]);
    }
    return d;
  }

  static stats(points: GPSPoint[], startedAtMs: number | null, nowMs: number): GPSStats {
    const distanceM = GPSService.distanceMeters(points);
    const durationS = startedAtMs ? Math.max(0, Math.round((nowMs - startedAtMs) / 1000)) : 0;

    const speeds = points
      .map((p) => (typeof p.speed === "number" ? p.speed : null))
      .filter((v): v is number => v !== null && Number.isFinite(v) && v >= 0);

    const avgSpeedMps =
      durationS > 0 ? distanceM / durationS : (speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null);

    const maxSpeedMps = speeds.length ? Math.max(...speeds) : (avgSpeedMps ?? null);

    const paceSecPerKm =
      distanceM > 50 ? (durationS / (distanceM / 1000)) : null; // só calcula pace com alguma distância

    return { distanceM, durationS, paceSecPerKm, avgSpeedMps: avgSpeedMps ?? null, maxSpeedMps };
  }

  static toGPX(points: GPSPoint[], name = "MindsetFit Activity"): string {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<gpx version="1.1" creator="MindsetFit" xmlns="http://www.topografix.com/GPX/1/1">');
    lines.push(`  <metadata><name>${esc(name)}</name></metadata>`);
    lines.push("  <trk>");
    lines.push(`    <name>${esc(name)}</name>`);
    lines.push("    <trkseg>");
    for (const p of points) {
      const t = new Date(p.ts).toISOString();
      const ele = typeof p.altitude === "number" ? `\n        <ele>${p.altitude}</ele>` : "";
      lines.push(`      <trkpt lat="${p.lat}" lon="${p.lon}">${ele}\n        <time>${t}</time>\n      </trkpt>`);
    }
    lines.push("    </trkseg>");
    lines.push("  </trk>");
    lines.push("</gpx>");
    return lines.join("\n");
  }
}
