import { useGlobalLocationStore } from "@/stores/globalLocationStore";

export function getActiveTimezoneIana() {
  const tz = useGlobalLocationStore.getState().tzIana;
  if (tz) return tz;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function formatNowInActiveTz(locale = "pt-BR") {
  const tz = getActiveTimezoneIana();
  const now = new Date();
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(now);
  } catch {
    return now.toLocaleString(locale);
  }
}
