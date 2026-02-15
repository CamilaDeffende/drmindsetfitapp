
export function formatPace(paceMinPerKm: number): string {
  if (!paceMinPerKm || paceMinPerKm === 0) return "--:--";
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km >= 1) return `${km.toFixed(2)} km`;
  return `${meters.toFixed(0)} m`;
}

export function formatElevation(meters: number): string {
  return `${meters.toFixed(0)}m`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}
