import { SessionInputV1 } from "./types";
import { getMET } from "./met";

const round = (n: number) => Math.round(n);

export function calcSessionKcal(weightKg: number, session: SessionInputV1): { met: number; kcal: number } {
  const met = getMET(session.modality, session.intensity);
  const minutes = Math.max(0, session.minutes);
  const kcal = met * 3.5 * weightKg / 200 * minutes;
  return { met, kcal: round(kcal) };
}

export function calcWeeklyEATAvgPerDay(
  weightKg: number,
  weeklySessions: SessionInputV1[] | undefined
): {
  weeklyKcal: number;
  avgKcalPerDay: number;
  sessionDetails: Array<SessionInputV1 & { met: number; kcal: number }>;
} {
  const sessions = Array.isArray(weeklySessions) ? weeklySessions : [];
  const sessionDetails = sessions.map((s) => {
    const { met, kcal } = calcSessionKcal(weightKg, s);
    return { ...s, met, kcal };
  });

  const weeklyKcal = sessionDetails.reduce((acc, s) => acc + s.kcal, 0);
  const avgKcalPerDay = round(weeklyKcal / 7);

  return { weeklyKcal, avgKcalPerDay, sessionDetails };
}
