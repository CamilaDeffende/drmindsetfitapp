import { MetabolicInputV1, TDEEOutputV1 } from "./types";
import { calcREE } from "./ree";
import { calcPAL } from "./pal";
import { calcWeeklyEATAvgPerDay } from "./eat";

const round = (n: number) => Math.round(n);

export function calcTDEE(input: MetabolicInputV1): {
  ree: ReturnType<typeof calcREE>;
  tdee: TDEEOutputV1;
  eatDetails: ReturnType<typeof calcWeeklyEATAvgPerDay>;
} {
  const ree = calcREE(input);
  const pal = calcPAL(input.trainingFrequencyPerWeek, input.trainingOverallIntensity);

  const tdeeBase = round(ree.reeKcalPerDay * pal);
  const eatDetails = calcWeeklyEATAvgPerDay(input.weightKg, input.weeklySessions);
  const eatAvg = eatDetails.avgKcalPerDay;
  const tdeeFinal = round(tdeeBase + eatAvg);

  return {
    ree,
    tdee: {
      pal,
      tdeeBaseKcalPerDay: tdeeBase,
      eatAvgKcalPerDay: eatAvg,
      tdeeFinalKcalPerDay: tdeeFinal,
    },
    eatDetails,
  };
}
