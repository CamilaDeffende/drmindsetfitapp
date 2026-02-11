export const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
};

export const fmtDistance = (meters: number) => {
  const m = Math.max(0, meters);
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
};

export const fmtPace = (paceSecPerKm: number | null | undefined) => {
  if (!paceSecPerKm || !Number.isFinite(paceSecPerKm)) return "—";
  const total = Math.max(0, Math.round(paceSecPerKm));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${String(ss).padStart(2, "0")} /km`;
};

export const fmtSpeed = (mps: number | null | undefined) => {
  if (mps === null || mps === undefined || !Number.isFinite(mps)) return "—";
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
};
