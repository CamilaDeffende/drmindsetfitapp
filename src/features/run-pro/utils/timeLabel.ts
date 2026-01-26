import { getActiveTimezoneIana } from "@/utils/timezoneNow";

export function formatTsInActiveTz(ts: number, locale = "pt-BR") {
  const tz = getActiveTimezoneIana();
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleTimeString(locale);
  }
}
