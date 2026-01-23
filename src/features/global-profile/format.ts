import type { GlobalProfile, UnitSystem } from "./types";
import { formatDistanceValue, paceSecPerKmToSecPerMile, speedMpsToKph, speedMpsToMph } from "./units";

function safeLocale(profile?: Pick<GlobalProfile, "locale">): string {
  return profile?.locale || "pt-BR";
}
function safeTimeZone(profile?: Pick<GlobalProfile, "timeZone">): string {
  return profile?.timeZone || "America/Sao_Paulo";
}
function safeUnits(profile?: Pick<GlobalProfile, "units">): UnitSystem {
  return profile?.units || "metric";
}

export function formatNumber(n: number, profile?: Pick<GlobalProfile, "locale">, opts?: Intl.NumberFormatOptions): string {
  const locale = safeLocale(profile);
  try {
    return new Intl.NumberFormat(locale, opts).format(n);
  } catch {
    return String(n);
  }
}

export function formatDateTime(ts: number | Date, profile?: Pick<GlobalProfile, "locale" | "timeZone">, opts?: Intl.DateTimeFormatOptions): string {
  const locale = safeLocale(profile);
  const timeZone = safeTimeZone(profile);
  const d = typeof ts === "number" ? new Date(ts) : ts;
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      ...opts,
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export function formatDistance(meters: number, profile?: Pick<GlobalProfile, "locale" | "units">, fractionDigits = 2): string {
  const units = safeUnits(profile);
  const { value, unit } = formatDistanceValue(meters, units);
  return `${formatNumber(value, profile, { maximumFractionDigits: fractionDigits, minimumFractionDigits: 0 })} ${unit}`;
}

export function formatSpeed(mps: number, profile?: Pick<GlobalProfile, "locale" | "units">, fractionDigits = 1): string {
  const units = safeUnits(profile);
  const val = units === "imperial" ? speedMpsToMph(mps) : speedMpsToKph(mps);
  const unit = units === "imperial" ? "mph" : "km/h";
  return `${formatNumber(val, profile, { maximumFractionDigits: fractionDigits, minimumFractionDigits: 0 })} ${unit}`;
}

// recebe pace base em sec/km (padrão), e adapta para sec/mi quando imperial
export function formatPace(secPerKm: number, profile?: Pick<GlobalProfile, "units">): string {
  const units = safeUnits(profile);
  const sec = units === "imperial" ? paceSecPerKmToSecPerMile(secPerKm) : secPerKm;

  if (!Number.isFinite(sec) || sec <= 0) return "--:--";

  const total = Math.round(sec);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  const unit = units === "imperial" ? "/mi" : "/km";
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} ${unit}`;
}
