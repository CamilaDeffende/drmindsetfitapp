import type { WeekdayKey } from "./strengthWeekStorage";

export function toWeekdayKey(d: string): WeekdayKey | null {
  const v = String(d || "").toLowerCase().trim();
  if (v === "segunda" || v === "seg" || v === "monday") return "seg";
  if (v === "terca" || v === "terça" || v === "ter" || v === "tuesday") return "ter";
  if (v === "quarta" || v === "qua" || v === "wednesday") return "qua";
  if (v === "quinta" || v === "qui" || v === "thursday") return "qui";
  if (v === "sexta" || v === "sex" || v === "friday") return "sex";
  if (v === "sabado" || v === "sábado" || v === "sab" || v === "saturday") return "sab";
  if (v === "domingo" || v === "dom" || v === "sunday") return "dom";
  return null;
}
