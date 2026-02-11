import { differenceInCalendarDays, parseISO } from "date-fns";

export type TimePoint = { date: string; value: number };

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function sortByDateAsc<T extends { date: string }>(arr: T[]) {
  return [...arr].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export function movingAverage(points: TimePoint[], window = 7): TimePoint[] {
  const p = sortByDateAsc(points);
  const out: TimePoint[] = [];
  for (let i = 0; i < p.length; i++) {
    const start = Math.max(0, i - (window - 1));
    const slice = p.slice(start, i + 1);
    const avg = slice.reduce((s, x) => s + (Number(x.value) || 0), 0) / Math.max(1, slice.length);
    out.push({ date: p[i].date, value: avg });
  }
  return out;
}

export function lastDelta(points: TimePoint[]) {
  const p = sortByDateAsc(points);
  if (p.length < 2) return { delta: 0, pct: 0 };
  const a = Number(p[p.length - 2].value) || 0;
  const b = Number(p[p.length - 1].value) || 0;
  const d = b - a;
  const pct = a === 0 ? 0 : (d / a) * 100;
  return { delta: d, pct };
}

export function trendSlope(points: TimePoint[]) {
  const p = sortByDateAsc(points).map((x) => ({ x: parseISO(x.date).getTime(), y: Number(x.value) || 0 }));
  if (p.length < 2) return 0;
  const n = p.length;
  const sumX = p.reduce((s, t) => s + t.x, 0);
  const sumY = p.reduce((s, t) => s + t.y, 0);
  const sumXY = p.reduce((s, t) => s + t.x * t.y, 0);
  const sumXX = p.reduce((s, t) => s + t.x * t.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  const m = (n * sumXY - sumX * sumY) / denom; // units: value/ms
  const msPerDay = 1000 * 60 * 60 * 24;
  return m * msPerDay; // value/day
}

export function daysBetween(aISO: string, bISO: string) {
  return Math.abs(differenceInCalendarDays(parseISO(aISO), parseISO(bISO)));
}
