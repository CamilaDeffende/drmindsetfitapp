import { SafetySeverity } from "../core/enums";
import { SafetyFlag, TrainingPlan } from "../core/types";

export function validateVolumeCaps(plan: TrainingPlan): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  Object.entries(plan.weeklyVolumeByMuscle).forEach(([muscle, volume]) => {
    if (volume > 22) {
      flags.push({
        code: "volume_cap",
        severity: SafetySeverity.WARNING,
        message: `volume semanal de ${muscle} está alto para MVP (${volume}).`,
      });
    }
  });
  return flags;
}
