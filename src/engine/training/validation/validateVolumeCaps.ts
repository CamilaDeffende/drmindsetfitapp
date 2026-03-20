import { SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateVolumeCaps(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  Object.entries(plan.weeklyVolumeByMuscle ?? {}).forEach(([muscle, volume]) => {
    if (Number(volume) > 22) {
      flags.push({
        severity: SafetySeverity.MODERATE,
        message: `Volume semanal de ${muscle} acima do teto prudente inicial.`,
      });
    }
  });
  return flags;
}
